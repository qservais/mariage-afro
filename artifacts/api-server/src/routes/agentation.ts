import { Router } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { reviewCommentsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router = Router();

const annotationSchema = z.object({
  id: z.string().optional(),
  comment: z.string().optional(),
  element: z.string().optional(),
  elementPath: z.string().optional(),
});

const webhookBodySchema = z.object({
  event: z.string(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  url: z.string().optional(),
  annotation: annotationSchema.optional(),
  annotations: z.array(annotationSchema).optional(),
  output: z.unknown().optional(),
});

router.post("/agentation-webhook", async (req, res) => {
  const parsed = webhookBodySchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues }, "agentation-webhook: invalid payload");
    res.status(400).json({ ok: false, error: "Invalid payload" });
    return;
  }

  const body = parsed.data;
  const pageUrl = body.url ?? null;

  try {
    if (body.event === "annotation.add" && body.annotation) {
      const a = body.annotation;
      await db.insert(reviewCommentsTable).values({
        pageUrl,
        comment: a.comment ?? null,
        element: a.element ?? null,
        elementPath: a.elementPath ?? null,
        event: body.event,
        raw: req.body as Record<string, unknown>,
      });
      logger.info({ event: body.event, pageUrl }, "agentation-webhook: annotation inserted");
    } else if (body.event === "submit" && Array.isArray(body.annotations) && body.annotations.length > 0) {
      const rows = body.annotations.map((a) => ({
        pageUrl,
        comment: a.comment ?? null,
        element: a.element ?? null,
        elementPath: a.elementPath ?? null,
        event: body.event,
        raw: req.body as Record<string, unknown>,
      }));
      await db.insert(reviewCommentsTable).values(rows);
      logger.info({ event: body.event, count: rows.length, pageUrl }, "agentation-webhook: batch annotations inserted");
    } else {
      logger.info({ event: body.event }, "agentation-webhook: event ignored (no action)");
    }
  } catch (err) {
    logger.error({ err, event: body.event }, "agentation-webhook: db insert failed");
    res.status(500).json({ ok: false, error: "Internal error" });
    return;
  }

  res.json({ ok: true });
});

export default router;
