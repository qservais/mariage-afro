import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
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

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

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
      return cb(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(cookieParser(cookieSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

// Public routes first — before auth-protected routers
app.use("/", weddingPublicRouter);
app.use("/api", marketplaceRouter);

// Auth-protected routes
app.use("/api", router);
app.use("/admin", adminRouter);
app.use("/admin", adminContentRouter);

export default app;
