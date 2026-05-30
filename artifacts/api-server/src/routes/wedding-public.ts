import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  weddingWebsitesTable,
  weddingRsvpsTable,
  rsvpQuestionsTable,
  rsvpResponsesTable,
  cagnottesTable,
  couplesTable,
  moodBoardsTable,
  moodBoardImagesTable,
  moodBoardCollaboratorsTable,
  weddingJourJTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { notifyCoupleNewRsvp } from "../lib/email";
import { ObjectStorageService } from "../lib/objectStorage";
import { consumeUploadIntent, recordUploadIntent } from "../lib/uploadIntents";

const storageService = new ObjectStorageService();

const router = Router();

const rsvpSchema = z.object({
  name: z.string().max(100).optional().default(""),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().default(""),
  email: z.string().email(),
  attending: z.preprocess((v) => v === "true" || v === true || v === "1" || v === 1, z.boolean()),
  companionFirstName: z.string().max(100).optional().nullable(),
  companionLastName: z.string().max(100).optional().nullable(),
  message: z.string().max(1000).optional(),
  answers: z.array(z.object({
    questionId: z.coerce.number().int().positive(),
    answer: z.string().max(1000),
  })).optional().default([]),
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

router.get("/api/wedding/:slug/rsvp-questions", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select({ id: weddingWebsitesTable.id })
    .from(weddingWebsitesTable)
    .where(and(eq(weddingWebsitesTable.slug, slug), eq(weddingWebsitesTable.active, true)));
  if (!site) { res.json([]); return; }
  const rows = await db.select().from(rsvpQuestionsTable)
    .where(eq(rsvpQuestionsTable.weddingWebsiteId, site.id))
    .orderBy(asc(rsvpQuestionsTable.position), asc(rsvpQuestionsTable.id));
  res.json(rows);
});


router.get("/api/wedding/:slug/cagnottes", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select({ id: weddingWebsitesTable.id, coupleId: weddingWebsitesTable.coupleId })
    .from(weddingWebsitesTable)
    .where(and(eq(weddingWebsitesTable.slug, slug), eq(weddingWebsitesTable.active, true)));
  if (!site) { res.status(404).json({ error: "Site non trouvé" }); return; }
  const rows = await db.select().from(cagnottesTable)
    .where(and(eq(cagnottesTable.coupleId, site.coupleId), eq(cagnottesTable.active, true)))
    .orderBy(asc(cagnottesTable.position), asc(cagnottesTable.id));
  res.json(rows);
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

  // Server-side enforcement of required questions (BEFORE insert)
  const allQuestions = await db.select().from(rsvpQuestionsTable)
    .where(eq(rsvpQuestionsTable.weddingWebsiteId, site.id));
  const validIds = new Set(allQuestions.map((q) => q.id));
  const answerByQ = new Map(parsed.data.answers.map((a) => [a.questionId, a.answer.trim()]));
  const missing = allQuestions.filter((q) => q.required && !(answerByQ.get(q.id) || "").length);
  if (missing.length > 0) {
    res.status(400).json({ error: "Required questions missing", missing: missing.map((q) => q.id) });
    return;
  }

  const hasCompanion = !!(parsed.data.companionFirstName?.trim());
  const fullName = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ") || parsed.data.name || parsed.data.firstName;

  const [row] = await db.insert(weddingRsvpsTable).values({
    weddingWebsiteId: site.id,
    name: fullName,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName || "",
    email: parsed.data.email,
    attending: parsed.data.attending,
    guestCount: hasCompanion ? 2 : 1,
    companionFirstName: parsed.data.companionFirstName || null,
    companionLastName: parsed.data.companionLastName || null,
    message: parsed.data.message || null,
  }).returning();

  // Save custom answers (filter to questions that belong to this site)
  if (parsed.data.answers.length > 0) {
    const toInsert = parsed.data.answers
      .filter((a) => validIds.has(a.questionId) && a.answer !== "")
      .map((a) => ({ rsvpId: row.id, questionId: a.questionId, answer: a.answer }));
    if (toInsert.length > 0) await db.insert(rsvpResponsesTable).values(toInsert);
  }

  // Notify couple (fire-and-forget)
  (async () => {
    const [couple] = await db
      .select({ email: couplesTable.email, locale: couplesTable.locale })
      .from(couplesTable)
      .where(eq(couplesTable.id, site.coupleId))
      .limit(1);
    if (couple?.email) {
      const hasCompanion = !!(parsed.data.companionFirstName?.trim());
      const fullName = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ") || parsed.data.name || parsed.data.firstName;
      await notifyCoupleNewRsvp({
        to: couple.email,
        locale: couple.locale,
        guestName: fullName,
        guestEmail: parsed.data.email,
        attending: parsed.data.attending,
        guestCount: hasCompanion ? 2 : 1,
        message: parsed.data.message || null,
        weddingSlug: slug,
      }, req.log);
    }
  })().catch((err) => {
    req.log.error({ err }, "Failed to notify couple of new RSVP");
  });

  res.status(201).json(row);
});

// ====================================================================
// LOT 9 — Shared mood board (token-based access for collaborators)
// ====================================================================
async function resolveCollaborator(token: string) {
  const [collab] = await db.select().from(moodBoardCollaboratorsTable)
    .where(eq(moodBoardCollaboratorsTable.token, token))
    .limit(1);
  return collab ?? null;
}

router.get("/api/mood-board/shared/:token", async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const collab = await resolveCollaborator(token);
  if (!collab) { res.status(404).json({ error: "Lien invalide" }); return; }

  const [couple] = await db.select({ partner1Name: couplesTable.partner1Name, partner2Name: couplesTable.partner2Name })
    .from(couplesTable).where(eq(couplesTable.id, collab.coupleId)).limit(1);
  const boards = await db.select().from(moodBoardsTable)
    .where(eq(moodBoardsTable.coupleId, collab.coupleId))
    .orderBy(asc(moodBoardsTable.position), asc(moodBoardsTable.id));
  const images = await db.select().from(moodBoardImagesTable)
    .where(eq(moodBoardImagesTable.coupleId, collab.coupleId))
    .orderBy(asc(moodBoardImagesTable.position), asc(moodBoardImagesTable.id));

  res.json({
    role: collab.role,
    name: collab.name,
    couple: { name: [couple?.partner1Name, couple?.partner2Name].filter(Boolean).join(" & ") || "Le couple" },
    boards: boards.map((b) => ({ ...b, images: images.filter((im) => im.boardId === b.id) })),
  });
});

router.post("/api/mood-board/shared/:token/images", async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const collab = await resolveCollaborator(token);
  if (!collab) { res.status(404).json({ error: "Lien invalide" }); return; }
  if (collab.role !== "editor") { res.status(403).json({ error: "Lecture seule" }); return; }

  const parsed = z.object({
    boardId: z.coerce.number().int().positive(),
    url: z.string().min(1),
    caption: z.string().max(500).optional().default(""),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }

  const [board] = await db.select().from(moodBoardsTable)
    .where(and(eq(moodBoardsTable.id, parsed.data.boardId), eq(moodBoardsTable.coupleId, collab.coupleId))).limit(1);
  if (!board) { res.status(404).json({ error: "Board not found" }); return; }

  let { url } = parsed.data;
  if (url.startsWith("/objects/")) {
    // For collaborators, intent is keyed by token (collaborator id) instead of userId
    if (!await consumeUploadIntent(url, `collab:${collab.id}`)) { res.status(403).json({ error: "Upload intent invalid" }); return; }
    try {
      url = await storageService.trySetObjectEntityAclPolicy(url, { owner: `collab:${collab.id}`, visibility: "public" });
    } catch (err) {
      req.log?.error?.({ err }, "Failed ACL"); res.status(400).json({ error: "Invalid object path" }); return;
    }
  }
  const [row] = await db.insert(moodBoardImagesTable).values({
    coupleId: collab.coupleId,
    boardId: parsed.data.boardId,
    url,
    caption: parsed.data.caption,
    position: 0,
  }).returning();
  res.status(201).json(row);
});

// Token-scoped upload intent endpoint for editors
router.post("/api/mood-board/shared/:token/upload-url", async (req: Request, res: Response) => {
  const token = String(req.params.token);
  const collab = await resolveCollaborator(token);
  if (!collab) { res.status(404).json({ error: "Lien invalide" }); return; }
  if (collab.role !== "editor") { res.status(403).json({ error: "Lecture seule" }); return; }

  const parsed = z.object({
    name: z.string().min(1),
    size: z.number().int().min(1).max(10 * 1024 * 1024),
    contentType: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }

  const uploadURL = await storageService.getObjectEntityUploadURL();
  const objectPath = storageService.normalizeObjectEntityPath(uploadURL);
  await recordUploadIntent(objectPath, `collab:${collab.id}`);
  res.json({ uploadURL, objectPath });
});

// ====================================================================
// LOT 10 — Jour-J Public Page
// ====================================================================
router.get("/api/wedding/:slug/jour-j", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select()
    .from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.slug, slug));
  if (!site) { res.status(404).json({ error: "Not found" }); return; }

  const [config] = await db.select().from(weddingJourJTable)
    .where(eq(weddingJourJTable.weddingWebsiteId, site.id)).limit(1);
  if (!config || !config.enabled) { res.status(404).json({ error: "Page not available" }); return; }

  const [couple] = await db
    .select({ partner1Name: couplesTable.partner1Name, partner2Name: couplesTable.partner2Name, weddingDate: couplesTable.weddingDate })
    .from(couplesTable)
    .where(eq(couplesTable.id, site.coupleId))
    .limit(1);

  res.json({
    ...config,
    slug,
    title: site.title,
    weddingDate: couple?.weddingDate ?? null,
    partner1Name: couple?.partner1Name || "",
    partner2Name: couple?.partner2Name || "",
  });
});

export default router;
