/**
 * Clerk auth helper for E2E specs — sign_in_tokens approach.
 *
 * Uses Clerk's Backend API (CLERK_SECRET_KEY) to:
 *   1. Find or create a test user
 *   2. Create a sign-in token (magic link URL on accounts.dev)
 *   3. Navigate to the URL in Playwright → Clerk creates session + redirects
 *   4. Extract the __session JWT from cookies
 *
 * The JWT can then be used as Authorization: Bearer in API calls.
 * The browser context keeps the cookie for subsequent page navigations.
 */
import { chromium } from "playwright";

export const BASE = process.env.FORMS_BASE_URL ?? "http://localhost:80";
export const API = process.env.API_BASE_URL ?? "http://localhost:8080";
export const DESKTOP = { width: 1280, height: 720 };

/**
 * Find or create a Clerk test user and return their user ID.
 * Handles both array and {data:[]} response formats from Clerk API.
 */
async function ensureClerkUser(email, clerkHeaders) {
  // Search existing — Clerk v1 may return array directly or { data: [...] }
  const searchResp = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=10`,
    { headers: clerkHeaders }
  );
  const searchJson = await searchResp.json().catch(() => []);
  const users = Array.isArray(searchJson) ? searchJson : (searchJson.data ?? []);
  if (users[0]?.id) return users[0].id;

  // Create
  const createResp = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: clerkHeaders,
    body: JSON.stringify({
      email_address: [email],
      skip_password_requirement: true,
      first_name: "Test",
      last_name: "E2E",
    }),
  });
  const user = await createResp.json().catch(() => ({}));
  if (user.id) return user.id;

  // If creation failed with "email taken", search more broadly
  const errCode = user.errors?.[0]?.code ?? "";
  if (errCode === "form_identifier_exists") {
    // Retry search with different approach
    const retryResp = await fetch(
      `https://api.clerk.com/v1/users?limit=100`,
      { headers: clerkHeaders }
    );
    const retryJson = await retryResp.json().catch(() => []);
    const allUsers = Array.isArray(retryJson) ? retryJson : (retryJson.data ?? []);
    const found = allUsers.find((u) =>
      u.email_addresses?.some((e) => e.email_address === email)
    );
    if (found?.id) return found.id;
  }

  console.error("  Clerk user find/create failed:", JSON.stringify(user).substring(0, 300));
  return null;
}

/**
 * Sign in a test user via Clerk's sign_in_tokens API.
 *
 * @param {import('playwright').Page} page - existing Playwright page in a browser context
 * @param {object} opts
 * @param {string} opts.email    - test user email (plain, no +clerk_test needed)
 * @param {string} [opts.loginPath] - unused but kept for API compat
 * @returns {Promise<string|null>} - JWT from __session cookie/SDK, or null on failure
 */
export async function clerkSignIn(page, { email, loginPath } = {}) {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  if (!CLERK_SECRET_KEY) {
    console.warn("  ⚠ CLERK_SECRET_KEY non disponible");
    return null;
  }

  const clerkHeaders = {
    Authorization: `Bearer ${CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const userId = await ensureClerkUser(email, clerkHeaders);
  if (!userId) return null;

  // Create sign-in token
  const tokenResp = await fetch("https://api.clerk.com/v1/sign_in_tokens", {
    method: "POST",
    headers: clerkHeaders,
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  });
  const tokenData = await tokenResp.json().catch(() => ({}));
  const signInUrl = tokenData.url;
  if (!signInUrl) {
    console.error("  Clerk sign-in token failed:", JSON.stringify(tokenData).substring(0, 300));
    return null;
  }

  // Strategy: navigate to the app's own <SignIn routing="path"> page with the
  // __clerk_ticket parameter. The embedded Clerk component handles the ticket
  // in the same domain context as the React app, establishing the session
  // properly in both the browser (for protected routes) and the JWT (for APIs).

  // Extract __clerk_ticket from the accounts.dev sign-in URL
  let ticket;
  try {
    ticket = new URL(signInUrl).searchParams.get("__clerk_ticket");
  } catch {}

  if (!ticket) {
    console.error("  Could not extract __clerk_ticket from:", signInUrl.substring(0, 80));
    return null;
  }

  // Determine the correct app sign-in path from loginPath or default
  const loginPageUrl = `${BASE}${loginPath ?? "/espace-client/login"}?__clerk_ticket=${encodeURIComponent(ticket)}`;
  console.log(`  → Navigating to app sign-in with ticket...`);

  // Intercept Clerk API responses to capture JWT
  const ctx = page.context();
  const interceptedTokens = [];
  const onResponse = async (response) => {
    try {
      const url = response.url();
      if (!url.includes("clerk.") && !url.includes(".accounts.dev")) return;
      if (response.status() !== 200) return;
      const body = await response.json().catch(() => null);
      if (!body) return;
      const sessions =
        body?.response?.sessions ?? body?.sessions ?? body?.client?.sessions ?? [];
      for (const sess of sessions) {
        const t = sess?.last_active_token?.jwt ?? sess?.token ?? sess?.jwt;
        if (t?.startsWith("eyJ")) interceptedTokens.push(t);
      }
      if (body?.jwt?.startsWith("eyJ")) interceptedTokens.push(body.jwt);
    } catch {}
  };
  page.on("response", onResponse);

  await page.goto(loginPageUrl, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});

  // Wait for Clerk to process the ticket and redirect away from login
  await page.waitForFunction(
    () => !window.location.pathname.includes("/login"),
    { timeout: 20000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);

  const landedUrl = page.url();
  console.log(`  → Landed on: ${landedUrl.substring(0, 80)}`);

  // Now wait for Clerk session to be populated in the React context
  await page.waitForFunction(
    () => window.Clerk != null && (window.Clerk.session != null || window.Clerk.loaded),
    { timeout: 12000 }
  ).catch(() => {});
  await page.waitForTimeout(500);

  page.off("response", onResponse);

  let jwt = null;

  // 1. Try window.Clerk SDK (most reliable after redirect)
  jwt = await page.evaluate(async () => {
    try {
      if (window.Clerk?.session) return await window.Clerk.session.getToken();
      if (window.Clerk?.client?.activeSessions?.[0])
        return await window.Clerk.client.activeSessions[0].getToken();
    } catch {}
    return null;
  }).catch(() => null);
  if (jwt) { console.log("  → JWT via window.Clerk.session.getToken()"); return jwt; }

  // 2. Intercepted Clerk API response
  if (interceptedTokens.length > 0) {
    jwt = interceptedTokens[interceptedTokens.length - 1];
    console.log("  → JWT via Clerk /v1/client response interception");
    return jwt;
  }

  // 3. __session cookie
  const cookies = await ctx.cookies([BASE, "http://localhost:80", "http://localhost:21974"]);
  const sessionCookie = cookies.find((c) => c.name === "__session");
  if (sessionCookie?.value) {
    console.log("  → JWT via __session cookie");
    return sessionCookie.value;
  }

  // 4. localStorage / sessionStorage
  jwt = await page.evaluate(() => {
    for (const store of [localStorage, sessionStorage]) {
      try {
        for (const key of Object.keys(store)) {
          const v = store.getItem(key);
          if (v?.startsWith("eyJ")) return v;
        }
      } catch {}
    }
    return null;
  }).catch(() => null);
  if (jwt) { console.log("  → JWT via storage"); return jwt; }

  console.warn("  ⚠ Could not extract Clerk JWT from any source");
  console.warn(`  Current URL: ${page.url()}`);
  console.warn(`  Cookies: ${cookies.map((c) => c.name).join(", ")}`);
  return null;
}

/**
 * Helper: perform an authenticated API call with a Clerk JWT.
 */
export async function authFetch(path, jwt, opts = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...opts.headers,
    },
    body:
      opts.body
        ? typeof opts.body === "string"
          ? opts.body
          : JSON.stringify(opts.body)
        : undefined,
  });
}

/**
 * Shared check/fail recorder.
 */
export function makeChecker() {
  const results = [];
  const check = (label, cond) => {
    if (cond) console.log(`  ✓ ${label}`);
    else {
      console.error(`  ✗ ${label}`);
      results.push(label);
    }
  };
  return { results, check };
}
