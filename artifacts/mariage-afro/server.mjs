// Production HTTP server for the Mariage Afro SPA (Task #57).
// Replaces Replit's static serve so we can attach real HTTP security headers
// (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
// Permissions-Policy, CSP) instead of relying on <meta> tags which only cover
// a subset of directives.
//
// Dev mode keeps using `vite` (see package.json dev script). This file is
// only invoked in production via artifact.toml services.production.run.
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist", "public");
const PORT = Number(process.env.PORT) || 21974;

const app = express();

const isProd = process.env.NODE_ENV === "production";

// CSP allowlist — Clerk, Google Fonts, object storage, OSM tiles, Cloudflare
// Turnstile, YouTube/Vimeo embeds. 'unsafe-inline' kept for Tailwind v4 +
// Radix popovers + JSON-LD blocks (no inline-script-hash automation in build).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://*.googleusercontent.com",
          "https://storage.googleapis.com",
          "https://*.tile.openstreetmap.org",
          "https://images.clerk.dev",
          "https://img.clerk.com",
          "https://clerk.mariage-afro.com",
        ],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://*.clerk.accounts.dev",
          "https://*.clerk.com",
          "https://clerk.mariage-afro.com",
          "https://challenges.cloudflare.com",
        ],
        "connect-src": [
          "'self'",
          "https://*.clerk.accounts.dev",
          "https://*.clerk.com",
          "https://clerk.mariage-afro.com",
          "https://clerk-telemetry.com",
          "https://*.tile.openstreetmap.org",
          "https://nominatim.openstreetmap.org",
        ],
        "frame-src": [
          "'self'",
          "https://*.clerk.accounts.dev",
          "https://clerk.mariage-afro.com",
          "https://challenges.cloudflare.com",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
          "https://player.vimeo.com",
        ],
        "worker-src": ["'self'", "blob:"],
        "manifest-src": ["'self'"],
        "upgrade-insecure-requests": [],
      },
    },
    strictTransportSecurity: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false,
    xssFilter: false,
  }),
);
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  );
  next();
});

app.use(compression());

// Static assets with long cache (hashed filenames). index.html and other
// non-hashed files default to no-cache to ensure SPA refreshes pick up
// updates immediately after deploy.
app.use(
  express.static(DIST, {
    maxAge: "1y",
    immutable: true,
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html") || filePath.endsWith("site.webmanifest")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// SPA fallback — serve index.html for any unmatched GET (client-side routing).
app.get(/.*/, (_req, res) => {
  res.set("Cache-Control", "no-cache");
  res.sendFile(join(DIST, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[mariage-afro] Serving ${DIST} on port ${PORT}`);
});
