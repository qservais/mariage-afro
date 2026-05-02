import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  weddingWebsitesTable,
  weddingRsvpsTable,
  couplesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { notifyCoupleNewRsvp } from "../lib/email";

const router = Router();

const rsvpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  attending: z.preprocess((v) => v === "true" || v === true || v === "1" || v === 1, z.boolean()),
  guestCount: z.preprocess((v) => Number(v) || 1, z.number().int().min(1).max(20)),
  message: z.string().max(1000).optional(),
});

router.get("/api/wedding/:slug", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select()
    .from(weddingWebsitesTable)
    .where(and(eq(weddingWebsitesTable.slug, slug), eq(weddingWebsitesTable.active, true)));
  if (!site) { res.status(404).json({ error: "Site non trouvé" }); return; }
  res.json(site);
});

router.get("/api/wedding/:slug/rsvps", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select({ id: weddingWebsitesTable.id, coupleId: weddingWebsitesTable.coupleId })
    .from(weddingWebsitesTable)
    .where(and(eq(weddingWebsitesTable.slug, slug), eq(weddingWebsitesTable.active, true)));
  if (!site) { res.status(404).json({ error: "Site non trouvé" }); return; }
  const rsvps = await db.select().from(weddingRsvpsTable).where(eq(weddingRsvpsTable.weddingWebsiteId, site.id));
  res.json(rsvps);
});

router.post("/api/wedding/:slug/rsvp", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select()
    .from(weddingWebsitesTable)
    .where(and(eq(weddingWebsitesTable.slug, slug), eq(weddingWebsitesTable.active, true)));
  if (!site) { res.status(404).json({ error: "Site non trouvé" }); return; }
  if (!site.rsvpEnabled) { res.status(403).json({ error: "RSVP désactivé" }); return; }

  const parsed = rsvpSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Données invalides", issues: parsed.error.issues }); return; }

  const [row] = await db.insert(weddingRsvpsTable).values({
    weddingWebsiteId: site.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    attending: parsed.data.attending,
    guestCount: parsed.data.guestCount,
    message: parsed.data.message || null,
  }).returning();

  // Notify couple (fire-and-forget)
  (async () => {
    const [couple] = await db
      .select({ email: couplesTable.email, locale: couplesTable.locale })
      .from(couplesTable)
      .where(eq(couplesTable.id, site.coupleId))
      .limit(1);
    if (couple?.email) {
      await notifyCoupleNewRsvp({
        to: couple.email,
        locale: couple.locale,
        guestName: parsed.data.name,
        guestEmail: parsed.data.email || null,
        attending: parsed.data.attending,
        guestCount: parsed.data.guestCount,
        message: parsed.data.message || null,
        weddingSlug: slug,
      }, req.log);
    }
  })().catch((err) => {
    req.log.error({ err }, "Failed to notify couple of new RSVP");
  });

  res.status(201).json(row);
});

export default router;
