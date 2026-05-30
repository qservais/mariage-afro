import { getAuthToken } from "@/lib/tokenStore";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function extractErrorMessage(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text);
    if (typeof json?.error === "string" && json.error.trim()) return json.error;
    if (typeof json?.message === "string" && json.message.trim()) return json.message;
  } catch {
    if (text.trim()) return text.trim();
  }
  return fallback;
}

export async function vendorFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = extractErrorMessage(text, "Une erreur est survenue.");
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Upload a file to the server-side proxy endpoint.
 * Bypasses browser→GCS CORS restrictions by having the API server
 * perform the actual PUT to Google Cloud Storage.
 */
export async function proxyUpload(file: File): Promise<{ objectPath: string }> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE}/api/storage/uploads/proxy-upload`, {
    method: "POST",
    credentials: "include",
    headers: {
      "x-content-type": file.type || "application/octet-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(extractErrorMessage(text, "Échec de l'envoi du fichier."));
  }
  return res.json() as Promise<{ objectPath: string }>;
}

export const vendorApi = {
  get: <T>(p: string) => vendorFetch<T>(p),
  post: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(p: string) => vendorFetch<T>(p, { method: "DELETE" }),
};
