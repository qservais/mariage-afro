import express, { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { Readable } from "stream";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middlewares/jwtAuth";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectAclPolicy } from "../lib/objectAcl";
import { recordUploadIntent } from "../lib/uploadIntents";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function extractJwtUserId(req: Request): string | null {
  const cookie = req.cookies?.ma_token;
  const raw = cookie ?? (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!raw) return null;
  try {
    const p = jwt.verify(raw, JWT_SECRET) as { sub: string };
    return p.sub;
  } catch {
    return null;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!extractJwtUserId(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;
    const userId = extractJwtUserId(req) as string;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    await recordUploadIntent(objectPath, userId);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * POST /storage/uploads/proxy-upload
 *
 * Server-side proxy for browser file uploads to GCS.
 * Solves CORS issues when the Replit domain is not whitelisted on the GCS bucket.
 *
 * Body:    raw binary (the file bytes)
 * Header:  x-content-type — MIME type (e.g. "image/jpeg")
 *
 * Returns: { objectPath: string }
 */
router.post(
  "/storage/uploads/proxy-upload",
  requireAuth,
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req: Request, res: Response) => {
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "Empty or invalid request body" });
      return;
    }

    const contentType =
      (req.headers["x-content-type"] as string) ||
      (req.headers["content-type"] as string) ||
      "application/octet-stream";

    const userId = extractJwtUserId(req) as string;

    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      await recordUploadIntent(objectPath, userId);

      const gcsRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      });

      if (!gcsRes.ok) {
        req.log.error({ status: gcsRes.status }, "GCS proxy upload failed");
        res.status(502).json({ error: "Storage upload failed" });
        return;
      }

      // Set ACL immediately so the object is accessible right after upload.
      // The save handler will also set it (as a safety net), but doing it here
      // avoids broken previews when the user hasn't saved yet.
      try {
        await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
          owner: userId,
          visibility: "public",
        } as ObjectAclPolicy);
      } catch (aclErr) {
        req.log.warn({ err: aclErr }, "Could not set ACL on proxy upload (non-fatal)");
      }

      res.json({ objectPath });
    } catch (error) {
      req.log.error({ err: error }, "Error in proxy upload");
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const userId = extractJwtUserId(req) ?? undefined;

    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // canAccessObjectEntity returns true for public objects even without auth.
    // For private objects it requires a valid userId.
    const canAccess = await objectStorageService.canAccessObjectEntity({
      userId,
      objectFile,
      requestedPermission: ObjectPermission.READ,
    });
    if (!canAccess) {
      // 401 when unauthenticated (private object, no session), 403 when
      // authenticated but not the owner / not in an allowed access group.
      res.status(userId ? 403 : 401).json({ error: userId ? "Forbidden" : "Unauthorized" });
      return;
    }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
