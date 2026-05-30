import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import authRouter from "./routes/auth";
import router from "./routes";
import adminRouter from "./routes/admin";
import adminContentRouter from "./routes/admin-content";
import marketplaceRouter from "./routes/marketplace";
import weddingPublicRouter from "./routes/wedding-public";
import { logger } from "./lib/logger";

const app: Express = express();

const cookieSecret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "mariage-afro-dev-secret-change-me";

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Security headers (Task #57). Applied globally before auth/business middleware.
// CSP is intentionally strict for the API: it serves JSON only — no HTML, no
// inline scripts, no third-party assets. The web app sets its own CSP via
// <meta http-equiv> tag in index.html for SPA-specific allowlists (Clerk,
// Google Fonts, object storage). HSTS is enabled in production only — Replit's
// edge already enforces TLS, so this is a defense-in-depth header for clients.
const isProd = process.env.NODE_ENV === "production";
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "connect-src": ["'self'"],
        "img-src": ["'self'", "data:"],
      },
      reportOnly: !isProd,
    },
    strictTransportSecurity: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: false,
  }),
);
app.use((_req, res, next) => {
  // Helmet exposes only a subset of Permissions-Policy via permittedCrossDomainPolicies.
  // Set the modern Permissions-Policy header explicitly: deny camera/microphone,
  // allow geolocation only for our own origin (used by the vendor map).
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
  );
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    // Allow all Replit domains (dev previews and production deployments)
    if (hostname.endsWith(".replit.dev")) return true;
    if (hostname.endsWith(".replit.app")) return true;
    if (hostname.endsWith(".kirk.replit.dev")) return true;
    if (hostname === "localhost") return true;
    // Allow all mariage-afro.com subdomains (staging, dev, preview environments)
    if (hostname === "mariage-afro.com" || hostname.endsWith(".mariage-afro.com")) return true;
    // Allow madebydone.be and all its subdomains (production custom domain)
    if (hostname === "madebydone.be" || hostname.endsWith(".madebydone.be")) return true;
    // Allow REPLIT_DEV_DOMAIN and REPLIT_DEPLOYMENT_DOMAIN if set
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    const deployDomain = process.env.REPLIT_DEPLOYMENT_DOMAIN;
    if (devDomain && hostname === devDomain) return true;
    if (deployDomain && hostname === deployDomain) return true;
  } catch {
    return false;
  }
  return false;
}

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (isAllowedOrigin(origin)) return cb(null, true);
      // Return false (no CORS headers) instead of throwing — throwing causes
      // Express to emit a 500 HTML response, which is confusing and incorrect.
      // With false, the browser correctly blocks the cross-origin response.
      logger.warn({ origin }, "CORS: origin not allowed");
      return cb(null, false);
    },
  }),
);
app.use(cookieParser(cookieSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes first — before auth-protected routers
app.use("/api", authRouter);
app.use("/", weddingPublicRouter);
app.use("/api", marketplaceRouter);

// Auth-protected routes
app.use("/api", router);
app.use("/admin", adminRouter);
app.use("/admin", adminContentRouter);

// Global error handler — must have 4 parameters so Express recognises it as
// an error handler. Returns JSON for /api routes and HTML for /admin routes.
// Without this, Express 5 falls back to its default HTML "Internal Server Error"
// response, which surfaces raw stack traces to the client.
// In production, internal error details are never sent to the client.
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = typeof (err as { status?: number }).status === "number"
    ? (err as { status: number }).status
    : 500;

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");

  // Never leak internal error details to clients in production.
  const clientMessage = isProd
    ? status === 500 ? "Internal server error" : (err instanceof Error ? err.message : "Error")
    : (err instanceof Error ? err.message : "Internal server error");

  if (req.path.startsWith("/admin")) {
    res.status(status).type("html").send(
      `<!doctype html><html><head><title>Erreur</title></head><body><h1>Erreur ${status}</h1><p>${isProd ? "Une erreur est survenue." : clientMessage}</p></body></html>`,
    );
    return;
  }

  res.status(status).json({ error: clientMessage });
});

export default app;
