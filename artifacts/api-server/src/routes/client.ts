import QRCode from "qrcode";
import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { z } from "zod";
import { and, eq, asc, desc, sql, isNull, ne, inArray, or } from "drizzle-orm";
import {
  db,
  couplesTable,
  vendorAccountsTable,
  budgetItemsTable,
  guestsTable,
  guestTablesTable,
  planningTasksTable,
  clientVendorsTable,
  clientDocumentsTable,
  jourJEventsTable,
  messagesTable,
  conversationsTable,
  marketplaceVendorsTable,
  weddingWebsitesTable,
  weddingRsvpsTable,
  vendorReviewsTable,
  rsvpResponsesTable,
  moodBoardsTable,
  moodBoardImagesTable,
  moodBoardCollaboratorsTable,
  rsvpQuestionsTable,
  cagnottesTable,
  vendorQuotesTable,
  weddingJourJTable,
} from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";
import { consumeUploadIntent } from "../lib/uploadIntents";
import { notifyConversationMessage, notifyMoodBoardInvite, notifyQuoteResponded, notifyQuoteAccepted, appUrl } from "../lib/email";
import { nanoid } from "nanoid";

const router = Router();
const storageService = new ObjectStorageService();

interface AuthedRequest extends Request {
  userId: string;
  coupleId: number;
}

function pickClerkLocale(raw: string | undefined | null): "fr" | "nl" | "en" {
  const s = (raw || "").toLowerCase();
  if (s.startsWith("nl")) return "nl";
  if (s.startsWith("en")) return "en";
  return "fr";
}

async function fetchClerkContact(userId: string, log: Request["log"]): Promise<{ email: string | null; locale: "fr" | "nl" | "en" }> {
  try {
    const u = await clerkClient.users.getUser(userId);
    const primaryId = u.primaryEmailAddressId;
    const primary = u.emailAddresses?.find((e) => e.id === primaryId) ?? u.emailAddresses?.[0];
    const email = primary?.emailAddress ?? null;
    const localeRaw = (u.publicMetadata as Record<string, unknown>)?.locale as string | undefined;
    return { email, locale: pickClerkLocale(localeRaw) };
  } catch (err) {
    log.warn({ err, userId }, "Failed to fetch Clerk user for couple sync");
    return { email: null, locale: "fr" };
  }
}

async function requireCouple(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  let [couple] = await db.select().from(couplesTable).where(eq(couplesTable.userId, userId)).limit(1);
  if (!couple) {
    const contact = await fetchClerkContact(userId, req.log);
    // Use ON CONFLICT DO NOTHING to handle concurrent first-login requests gracefully
    const inserted = await db.insert(couplesTable).values({
      userId,
      email: contact.email ?? "",
      locale: contact.locale,
    }).onConflictDoNothing().returning();
    if (inserted.length > 0) {
      couple = inserted[0];
    } else {
      // Race condition: another request inserted first — re-fetch
      [couple] = await db.select().from(couplesTable).where(eq(couplesTable.userId, userId)).limit(1);
    }
  }
  if (!couple) {
    res.status(500).json({ error: "Failed to create couple profile" });
    return;
  }
  if (!couple.email) {
    // Backfill email/locale once for existing couples (Clerk is the source of truth)
    const contact = await fetchClerkContact(userId, req.log);
    if (contact.email) {
      const [updated] = await db.update(couplesTable)
        .set({ email: contact.email, locale: couple.locale || contact.locale, updatedAt: new Date() })
        .where(eq(couplesTable.id, couple.id))
        .returning();
      if (updated) couple = updated;
    }
  }
  (req as unknown as AuthedRequest).userId = userId;
  (req as unknown as AuthedRequest).coupleId = couple.id;
  next();
}

router.use(requireCouple);

// ---------- Couple profile ----------
router.get("/client/me", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
  res.json(couple);
});

const coupleUpdateSchema = z.object({
  partner1Name: z.string().optional(),
  partner2Name: z.string().optional(),
  weddingDate: z.string().optional().nullable(),
  ceremonyCity: z.string().optional().nullable(),
  ceremonyVenue: z.string().optional().nullable(),
  guestEstimate: z.coerce.number().int().nonnegative().optional().nullable(),
  budget: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum(["planning", "completed"]).optional(),
  onboarded: z.boolean().optional(),
});

router.patch("/client/me", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = coupleUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const { onboarded, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (onboarded) patch.onboardedAt = new Date();
  const [couple] = await db.update(couplesTable)
    .set(patch)
    .where(eq(couplesTable.id, r.coupleId)).returning();
  res.json(couple);
});

// ---------- Budget ----------
const budgetSchema = z.object({
  category: z.string().min(1),
  vendor: z.string().optional().nullable(),
  planned: z.coerce.number().int().nonnegative().default(0),
  actual: z.coerce.number().int().nonnegative().default(0),
  paid: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

router.get("/client/budget", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(budgetItemsTable)
    .where(eq(budgetItemsTable.coupleId, r.coupleId))
    .orderBy(asc(budgetItemsTable.id));
  res.json(rows);
});
router.post("/client/budget", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(budgetItemsTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.json(row);
});
router.patch("/client/budget/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = budgetSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.update(budgetItemsTable).set(parsed.data)
    .where(and(eq(budgetItemsTable.id, id), eq(budgetItemsTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});
router.delete("/client/budget/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(budgetItemsTable)
    .where(and(eq(budgetItemsTable.id, id), eq(budgetItemsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Guests ----------
const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().default(""),
  side: z.enum(["partner1", "partner2", "shared"]).optional().default("partner1"),
  table: z.string().optional().nullable(),
  tableId: z.coerce.number().int().positive().optional().nullable(),
  rsvp: z.enum(["pending", "confirmed", "declined"]).optional().default("pending"),
  diet: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get("/client/guests", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(guestsTable)
    .where(eq(guestsTable.coupleId, r.coupleId))
    .orderBy(asc(guestsTable.id));
  res.json(rows);
});
router.post("/client/guests", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const body = Array.isArray(req.body) ? req.body : [req.body];
  const parsed = z.array(guestSchema).safeParse(body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }

  // If any incoming guest references a tableId, validate ownership and capacity
  // (mirroring the rules enforced on PATCH).
  const requestedTableIds = Array.from(
    new Set(parsed.data.map((g) => g.tableId).filter((v): v is number => v != null))
  );
  const tableMap = new Map<number, { name: string; capacity: number }>();
  if (requestedTableIds.length > 0) {
    const tables = await db.select().from(guestTablesTable)
      .where(eq(guestTablesTable.coupleId, r.coupleId));
    for (const t of tables) tableMap.set(t.id, { name: t.name, capacity: t.capacity });
    for (const id of requestedTableIds) {
      if (!tableMap.has(id)) {
        res.status(404).json({ error: `Table ${id} not found` });
        return;
      }
    }
    const seated = await db.select({ tableId: guestsTable.tableId }).from(guestsTable)
      .where(eq(guestsTable.coupleId, r.coupleId));
    const occupancy = new Map<number, number>();
    for (const g of seated) {
      if (g.tableId != null) occupancy.set(g.tableId, (occupancy.get(g.tableId) ?? 0) + 1);
    }
    for (const id of requestedTableIds) {
      const incoming = parsed.data.filter((g) => g.tableId === id).length;
      const current = occupancy.get(id) ?? 0;
      const cap = tableMap.get(id)!.capacity;
      if (current + incoming > cap) {
        res.status(409).json({ error: `Table ${tableMap.get(id)!.name} is full` });
        return;
      }
    }
  }

  const values = parsed.data.map((g) => ({
    coupleId: r.coupleId,
    ...g,
    // Auto-sync legacy table text when assigning to a known table
    table: g.tableId != null ? tableMap.get(g.tableId)!.name : g.table,
  }));
  const rows = await db.insert(guestsTable).values(values).returning();
  res.json(Array.isArray(req.body) ? rows : rows[0]);
});
router.patch("/client/guests/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = guestSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const patch: Record<string, unknown> = { ...parsed.data };
  if (Object.prototype.hasOwnProperty.call(parsed.data, "tableId")) {
    const newTableId = parsed.data.tableId;
    if (newTableId == null) {
      patch.tableId = null;
      patch.table = null;
    } else {
      const [target] = await db.select().from(guestTablesTable)
        .where(and(eq(guestTablesTable.id, newTableId), eq(guestTablesTable.coupleId, r.coupleId)))
        .limit(1);
      if (!target) { res.status(404).json({ error: "Table not found" }); return; }
      const seated = await db.select({ id: guestsTable.id }).from(guestsTable)
        .where(and(eq(guestsTable.tableId, newTableId), eq(guestsTable.coupleId, r.coupleId)));
      const occupied = seated.filter((g) => g.id !== id).length;
      if (occupied >= target.capacity) {
        res.status(409).json({ error: "Table is full" });
        return;
      }
      patch.tableId = newTableId;
      patch.table = target.name;
    }
  }
  const [row] = await db.update(guestsTable).set(patch)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});
router.delete("/client/guests/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(guestsTable)
    .where(and(eq(guestsTable.id, id), eq(guestsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Guest Tables (seating) ----------
const guestTableSchema = z.object({
  name: z.string().min(1).max(80),
  shape: z.enum(["round", "rect", "square"]).optional().default("round"),
  capacity: z.coerce.number().int().min(1).max(40).optional().default(8),
  positionX: z.coerce.number().int().optional().default(0),
  positionY: z.coerce.number().int().optional().default(0),
});

router.get("/client/tables", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(guestTablesTable)
    .where(eq(guestTablesTable.coupleId, r.coupleId))
    .orderBy(asc(guestTablesTable.id));
  res.json(rows);
});

router.post("/client/tables", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = guestTableSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(guestTablesTable)
    .values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.status(201).json(row);
});

router.patch("/client/tables/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = guestTableSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  if (parsed.data.capacity != null) {
    const seated = await db.select({ id: guestsTable.id }).from(guestsTable)
      .where(and(eq(guestsTable.tableId, id), eq(guestsTable.coupleId, r.coupleId)));
    if (seated.length > parsed.data.capacity) {
      res.status(409).json({ error: "Capacity below current occupants" });
      return;
    }
  }
  const [row] = await db.update(guestTablesTable).set(parsed.data)
    .where(and(eq(guestTablesTable.id, id), eq(guestTablesTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (parsed.data.name) {
    await db.update(guestsTable)
      .set({ table: parsed.data.name })
      .where(and(eq(guestsTable.tableId, id), eq(guestsTable.coupleId, r.coupleId)));
  }
  res.json(row);
});

router.delete("/client/tables/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.update(guestsTable)
    .set({ tableId: null, table: null })
    .where(and(eq(guestsTable.tableId, id), eq(guestsTable.coupleId, r.coupleId)));
  await db.delete(guestTablesTable)
    .where(and(eq(guestTablesTable.id, id), eq(guestTablesTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Planning ----------
const planningSchema = z.object({
  title: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  assignee: z.string().optional().nullable(),
  done: z.boolean().optional().default(false),
  category: z.string().optional().default("preparation"),
  notes: z.string().optional().nullable(),
});

router.get("/client/planning", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(planningTasksTable)
    .where(eq(planningTasksTable.coupleId, r.coupleId))
    .orderBy(asc(planningTasksTable.id));
  res.json(rows);
});
router.post("/client/planning", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = planningSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(planningTasksTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.json(row);
});
router.patch("/client/planning/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = planningSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.update(planningTasksTable).set(parsed.data)
    .where(and(eq(planningTasksTable.id, id), eq(planningTasksTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});
router.delete("/client/planning/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(planningTasksTable)
    .where(and(eq(planningTasksTable.id, id), eq(planningTasksTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Vendors ----------
const vendorSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  amount: z.coerce.number().int().nonnegative().optional().default(0),
  status: z.enum(["contacted", "negotiating", "booked", "paid"]).optional().default("contacted"),
  notes: z.string().optional().nullable(),
});

router.get("/client/vendors", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(clientVendorsTable)
    .where(eq(clientVendorsTable.coupleId, r.coupleId))
    .orderBy(asc(clientVendorsTable.id));
  res.json(rows);
});
router.post("/client/vendors", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(clientVendorsTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.json(row);
});
router.patch("/client/vendors/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = vendorSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.update(clientVendorsTable).set(parsed.data)
    .where(and(eq(clientVendorsTable.id, id), eq(clientVendorsTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});
router.delete("/client/vendors/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(clientVendorsTable)
    .where(and(eq(clientVendorsTable.id, id), eq(clientVendorsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Documents (URL-based — file upload via object storage is a follow-up) ----------
const documentSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1).refine(
    (v) => v.startsWith("/objects/") || /^https?:\/\//i.test(v),
    "url must be an http(s) URL or an internal /objects/* path"
  ),
  fileType: z.string().optional().nullable(),
  size: z.coerce.number().int().nonnegative().optional().default(0),
  category: z.string().optional().default("misc"),
});

router.get("/client/documents", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(clientDocumentsTable)
    .where(eq(clientDocumentsTable.coupleId, r.coupleId))
    .orderBy(asc(clientDocumentsTable.id));
  res.json(rows);
});
router.post("/client/documents", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = documentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  let { url } = parsed.data;
  if (url.startsWith("/objects/")) {
    if (!await consumeUploadIntent(url, r.userId)) {
      res.status(403).json({
        error: "Upload intent not found, expired, or not owned by you",
      });
      return;
    }
    try {
      url = await storageService.trySetObjectEntityAclPolicy(url, {
        owner: r.userId,
        visibility: "private",
      });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set object ACL policy");
      res.status(400).json({ error: "Invalid uploaded object path" });
      return;
    }
  } else if (url.includes("/.private/")) {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  const [row] = await db.insert(clientDocumentsTable).values({ coupleId: r.coupleId, ...parsed.data, url }).returning();
  res.json(row);
});
router.delete("/client/documents/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(clientDocumentsTable)
    .where(and(eq(clientDocumentsTable.id, id), eq(clientDocumentsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Jour J ----------
const jourJSchema = z.object({
  time: z.string().min(1),
  title: z.string().min(1),
  responsible: z.string().optional().nullable(),
  done: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

router.get("/client/jour-j", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(jourJEventsTable)
    .where(eq(jourJEventsTable.coupleId, r.coupleId))
    .orderBy(asc(jourJEventsTable.time));
  res.json(rows);
});
router.post("/client/jour-j", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = jourJSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(jourJEventsTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.json(row);
});
router.patch("/client/jour-j/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = jourJSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.update(jourJEventsTable).set(parsed.data)
    .where(and(eq(jourJEventsTable.id, id), eq(jourJEventsTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});
router.delete("/client/jour-j/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(jourJEventsTable)
    .where(and(eq(jourJEventsTable.id, id), eq(jourJEventsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ---------- Jour-J Public Page ----------
const jourJPublicSchema = z.object({
  enabled: z.boolean().optional(),
  menuText: z.string().max(10000).optional(),
  timeline: z.array(z.object({ time: z.string().max(20), label: z.string().max(300) })).max(100).optional(),
  bioPartner1: z.string().max(5000).optional(),
  bioPartner2: z.string().max(5000).optional(),
  driveUrl: z.string().nullable().optional(),
});

router.get("/client/wedding-jour-j", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const [site] = await db.select().from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, r.coupleId)).limit(1);
  if (!site) { res.json(null); return; }
  const [config] = await db.select().from(weddingJourJTable)
    .where(eq(weddingJourJTable.weddingWebsiteId, site.id)).limit(1);

  const publicUrl = `${process.env.PUBLIC_APP_URL || ""}/mariage/${site.slug}/jour-j`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    width: 200,
    color: { dark: "#68191e", light: "#fff4e4" },
    margin: 2,
  });

  res.json(config
    ? { ...config, slug: site.slug, qrDataUrl }
    : { weddingWebsiteId: site.id, slug: site.slug, enabled: false, menuText: "", timeline: [], bioPartner1: "", bioPartner2: "", driveUrl: null, qrDataUrl });
});

router.patch("/client/wedding-jour-j", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = jourJPublicSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [site] = await db.select().from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, r.coupleId)).limit(1);
  if (!site) { res.status(404).json({ error: "No wedding website" }); return; }
  const [existing] = await db.select().from(weddingJourJTable)
    .where(eq(weddingJourJTable.weddingWebsiteId, site.id)).limit(1);
  const patch = { ...parsed.data, driveUrl: parsed.data.driveUrl || null, updatedAt: new Date() };
  let config;
  if (existing) {
    [config] = await db.update(weddingJourJTable)
      .set(patch)
      .where(eq(weddingJourJTable.id, existing.id)).returning();
  } else {
    [config] = await db.insert(weddingJourJTable)
      .values({ weddingWebsiteId: site.id, ...patch }).returning();
  }
  res.json({ ...config, slug: site.slug });
});

// ---------- Conversations ----------
const messageSchema = z.object({ content: z.string().min(1).max(5000) });

async function getOrCreateAdminConversation(coupleId: number): Promise<number> {
  const [existing] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.coupleId, coupleId), isNull(conversationsTable.vendorId)))
    .limit(1);
  if (existing) {
    // Backfill any orphan messages on first access
    await db.update(messagesTable)
      .set({ conversationId: existing.id })
      .where(and(eq(messagesTable.coupleId, coupleId), isNull(messagesTable.conversationId)));
    return existing.id;
  }
  const [created] = await db.insert(conversationsTable)
    .values({ coupleId, vendorId: null, lastMessageAt: new Date() })
    .returning();
  await db.update(messagesTable)
    .set({ conversationId: created.id })
    .where(and(eq(messagesTable.coupleId, coupleId), isNull(messagesTable.conversationId)));
  return created.id;
}

async function getOrCreateVendorConversation(coupleId: number, vendorId: number): Promise<number> {
  const [existing] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.coupleId, coupleId), eq(conversationsTable.vendorId, vendorId)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(conversationsTable)
    .values({ coupleId, vendorId, lastMessageAt: new Date() })
    .returning();
  return created.id;
}

// Legacy admin-thread endpoints (kept for backwards compat with existing UI calls)
router.get("/client/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const convId = await getOrCreateAdminConversation(r.coupleId);
  const rows = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(asc(messagesTable.createdAt));
  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(messagesTable.conversationId, convId),
      ne(messagesTable.authorRole, "couple"),
      isNull(messagesTable.readAt),
    ));
  res.json(rows);
});

router.post("/client/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const convId = await getOrCreateAdminConversation(r.coupleId);
  const now = new Date();
  const [row] = await db.insert(messagesTable).values({
    coupleId: r.coupleId,
    conversationId: convId,
    authorRole: "couple",
    content: parsed.data.content,
  }).returning();
  await db.update(conversationsTable).set({ lastMessageAt: now }).where(eq(conversationsTable.id, convId));

  // Notify admin (throttled per conversation)
  (async () => {
    const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
    const adminTo = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFY_EMAIL;
    if (adminTo) {
      const senderLabel = [couple?.partner1Name, couple?.partner2Name].filter(Boolean).join(" & ") || `Couple #${r.coupleId}`;
      await notifyConversationMessage({
        to: adminTo,
        locale: "fr",
        senderLabel,
        preview: parsed.data.content,
        conversationKey: `couple-admin:${r.coupleId}`,
        ctaUrl: `${process.env.PUBLIC_APP_URL || ""}/admin/content/messages/${r.coupleId}`,
      }, req.log);
    }
  })().catch((err) => req.log.error({ err }, "Failed to notify admin of couple message"));

  res.status(201).json(row);
});

// ---------- Conversations API ----------
router.get("/client/conversations", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  // Make sure admin thread exists
  await getOrCreateAdminConversation(r.coupleId);

  const convs = await db
    .select({
      id: conversationsTable.id,
      vendorId: conversationsTable.vendorId,
      lastMessageAt: conversationsTable.lastMessageAt,
      createdAt: conversationsTable.createdAt,
      vendorName: marketplaceVendorsTable.name,
      vendorCategory: marketplaceVendorsTable.category,
      vendorCity: marketplaceVendorsTable.city,
      vendorCoverImage: marketplaceVendorsTable.coverImage,
    })
    .from(conversationsTable)
    .leftJoin(marketplaceVendorsTable, eq(marketplaceVendorsTable.id, conversationsTable.vendorId))
    .where(eq(conversationsTable.coupleId, r.coupleId))
    .orderBy(desc(conversationsTable.lastMessageAt));

  // unread + last message snippet
  const ids = convs.map((c) => c.id);
  const unreadMap = new Map<number, { unread: number; lastContent: string | null; lastAt: Date | null; lastAuthor: string | null }>();
  if (ids.length > 0) {
    const stats = await db
      .select({
        conversationId: messagesTable.conversationId,
        unread: sql<number>`count(case when ${messagesTable.authorRole} <> 'couple' and ${messagesTable.readAt} is null then 1 end)`.as("unread"),
      })
      .from(messagesTable)
      .where(sql`${messagesTable.conversationId} = ANY(${ids})`)
      .groupBy(messagesTable.conversationId);
    for (const s of stats) {
      if (s.conversationId != null) {
        unreadMap.set(s.conversationId, { unread: Number(s.unread) || 0, lastContent: null, lastAt: null, lastAuthor: null });
      }
    }
    // last message per conversation
    for (const id of ids) {
      const [last] = await db.select().from(messagesTable)
        .where(eq(messagesTable.conversationId, id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      const cur = unreadMap.get(id) ?? { unread: 0, lastContent: null, lastAt: null, lastAuthor: null };
      if (last) {
        cur.lastContent = last.content;
        cur.lastAt = last.createdAt;
        cur.lastAuthor = last.authorRole;
      }
      unreadMap.set(id, cur);
    }
  }

  const out = convs.map((c) => {
    const stats = unreadMap.get(c.id) ?? { unread: 0, lastContent: null, lastAt: null, lastAuthor: null };
    return {
      id: c.id,
      vendorId: c.vendorId,
      kind: c.vendorId == null ? "admin" : "vendor",
      vendor: c.vendorId == null ? null : {
        id: c.vendorId,
        name: c.vendorName,
        category: c.vendorCategory,
        city: c.vendorCity,
        coverImage: c.vendorCoverImage,
      },
      lastMessageAt: c.lastMessageAt,
      lastMessage: stats.lastContent,
      lastMessageAuthor: stats.lastAuthor,
      unread: stats.unread,
    };
  });
  res.json(out);
});

const startConversationSchema = z.object({ vendorId: z.coerce.number().int().positive() });

router.post("/client/conversations", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = startConversationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [coupleValidation] = await db
    .select({ validatedAt: couplesTable.validatedAt })
    .from(couplesTable)
    .where(eq(couplesTable.id, r.coupleId))
    .limit(1);
  if (!coupleValidation?.validatedAt) {
    res.status(403).json({ error: "Votre compte doit être validé par l'administrateur avant de contacter un prestataire." });
    return;
  }
  const [vendor] = await db.select().from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, parsed.data.vendorId))
    .limit(1);
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }
  const convId = await getOrCreateVendorConversation(r.coupleId, parsed.data.vendorId);
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId)).limit(1);
  res.status(201).json({
    id: conv.id,
    vendorId: conv.vendorId,
    kind: "vendor",
    vendor: { id: vendor.id, name: vendor.name, category: vendor.category, city: vendor.city, coverImage: vendor.coverImage },
    lastMessageAt: conv.lastMessageAt,
  });
});

router.get("/client/conversations/:id/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.coupleId, r.coupleId)))
    .limit(1);
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));
  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(messagesTable.conversationId, id),
      ne(messagesTable.authorRole, "couple"),
      isNull(messagesTable.readAt),
    ));
  res.json(rows);
});

router.post("/client/conversations/:id/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.coupleId, r.coupleId)))
    .limit(1);
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const now = new Date();
  const [row] = await db.insert(messagesTable).values({
    coupleId: r.coupleId,
    conversationId: id,
    authorRole: "couple",
    content: parsed.data.content,
  }).returning();
  await db.update(conversationsTable).set({ lastMessageAt: now }).where(eq(conversationsTable.id, id));

  // Notify the other party of the conversation (throttled per conversation)
  if (conv.vendorId == null) {
    // Couple → admin
    (async () => {
      const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
      const adminTo = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFY_EMAIL;
      if (adminTo) {
        const senderLabel = [couple?.partner1Name, couple?.partner2Name].filter(Boolean).join(" & ") || `Couple #${r.coupleId}`;
        await notifyConversationMessage({
          to: adminTo,
          locale: "fr",
          senderLabel,
          preview: parsed.data.content,
          conversationKey: `couple-admin:${r.coupleId}`,
          ctaUrl: `${process.env.PUBLIC_APP_URL || ""}/admin/content/messages/${r.coupleId}`,
        }, req.log);
      }
    })().catch((err) => req.log.error({ err }, "Failed to notify admin of couple message"));
  } else {
    // Couple → vendor : notify the vendor account that owns this marketplace vendor
    const vendorIdLocal = conv.vendorId;
    (async () => {
      const [account] = await db
        .select({ email: vendorAccountsTable.email, locale: vendorAccountsTable.locale })
        .from(vendorAccountsTable)
        .where(eq(vendorAccountsTable.vendorId, vendorIdLocal))
        .limit(1);
      if (!account?.email) return;
      const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
      const senderLabel = [couple?.partner1Name, couple?.partner2Name].filter(Boolean).join(" & ") || `Couple #${r.coupleId}`;
      await notifyConversationMessage({
        to: account.email,
        locale: account.locale,
        senderLabel,
        preview: parsed.data.content,
        conversationKey: `couple-vendor:${r.coupleId}:${vendorIdLocal}`,
        ctaUrl: `${process.env.PUBLIC_APP_URL || ""}/espace-pro/messages`,
      }, req.log);
    })().catch((err) => req.log.error({ err }, "Failed to notify vendor of couple message"));
  }

  res.status(201).json(row);
});

// ---------- Wedding Website ----------
const websiteSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().max(100).optional(),
  welcomeMessage: z.string().max(2000).optional(),
  weddingDate: z.string().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  programme: z.array(z.object({ time: z.string(), event: z.string() })).optional(),
  coverImage: z.string().max(2000).nullable().optional(),
  template: z.enum(["royal-afro", "boheme", "moderne", "tropical"]).optional(),
  colorPrimary: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  colorBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  fontHeading: z.enum(["serif", "sans", "display"]).nullable().optional(),
  active: z.boolean().optional(),
  rsvpEnabled: z.boolean().optional(),
});

router.get("/client/wedding-website", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const [site] = await db.select().from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, r.coupleId));
  res.json(site ?? null);
});

router.patch("/client/wedding-website", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = websiteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }

  if (parsed.data.slug) {
    const [existing] = await db.select({ id: weddingWebsitesTable.id })
      .from(weddingWebsitesTable)
      .where(eq(weddingWebsitesTable.slug, parsed.data.slug));
    const [mine] = await db.select({ id: weddingWebsitesTable.id })
      .from(weddingWebsitesTable)
      .where(eq(weddingWebsitesTable.coupleId, r.coupleId));
    if (existing && existing.id !== mine?.id) {
      res.status(409).json({ error: "Ce slug est déjà pris" });
      return;
    }
  }

  if (parsed.data.active === true) {
    const [coupleRow] = await db
      .select({ validatedAt: couplesTable.validatedAt })
      .from(couplesTable)
      .where(eq(couplesTable.id, r.coupleId))
      .limit(1);
    if (!coupleRow?.validatedAt) {
      res.status(403).json({ error: "Votre compte doit être validé par l'administrateur avant de publier votre mini-site." });
      return;
    }
  }

  const [current] = await db.select().from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, r.coupleId));

  const data = { ...parsed.data };
  if (typeof data.coverImage === "string" && data.coverImage.startsWith("/objects/")) {
    if (!await consumeUploadIntent(data.coverImage, r.userId)) {
      res.status(403).json({ error: "Upload intent expired or unauthorized" });
      return;
    }
    try {
      data.coverImage = await storageService.trySetObjectEntityAclPolicy(data.coverImage, {
        owner: r.userId,
        visibility: "public",
      });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set cover image ACL");
      res.status(400).json({ error: "Invalid uploaded object path" });
      return;
    }
  } else if (typeof data.coverImage === "string" && data.coverImage.includes("/.private/")) {
    res.status(400).json({ error: "Invalid url" });
    return;
  }

  if (!current) {
    const slug = data.slug ?? `mariage-${r.coupleId}`;
    const [row] = await db.insert(weddingWebsitesTable).values({
      coupleId: r.coupleId,
      slug,
      ...data,
    }).returning();
    res.status(201).json(row);
  } else {
    const [row] = await db.update(weddingWebsitesTable)
      .set(data)
      .where(eq(weddingWebsitesTable.coupleId, r.coupleId))
      .returning();
    res.json(row);
  }
});

// ---------- Reviews (couple → vendor) ----------
const reviewSchema = z.object({
  vendorId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(160).optional().default(""),
  comment: z.string().min(10).max(4000),
});

router.get("/client/reviews", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db
    .select({
      id: vendorReviewsTable.id,
      vendorId: vendorReviewsTable.vendorId,
      rating: vendorReviewsTable.rating,
      title: vendorReviewsTable.title,
      comment: vendorReviewsTable.comment,
      status: vendorReviewsTable.status,
      createdAt: vendorReviewsTable.createdAt,
      vendorName: marketplaceVendorsTable.name,
    })
    .from(vendorReviewsTable)
    .leftJoin(marketplaceVendorsTable, eq(vendorReviewsTable.vendorId, marketplaceVendorsTable.id))
    .where(eq(vendorReviewsTable.coupleId, r.coupleId))
    .orderBy(desc(vendorReviewsTable.createdAt));
  res.json(rows);
});

router.post("/client/reviews", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }
  const { vendorId, rating, title, comment } = parsed.data;

  // Vérifier que le mariage est marqué "completed"
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
  if (!couple) { res.status(404).json({ error: "Couple not found" }); return; }
  if (couple.status !== "completed") {
    res.status(403).json({ error: "Vous pourrez laisser un avis une fois votre mariage marqué comme terminé." });
    return;
  }
  // Vérifier que le vendor existe
  const [vendor] = await db
    .select({ id: marketplaceVendorsTable.id })
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, vendorId))
    .limit(1);
  if (!vendor) { res.status(404).json({ error: "Prestataire introuvable" }); return; }

  // Empêcher doublon (vendor + couple)
  const [existing] = await db
    .select()
    .from(vendorReviewsTable)
    .where(and(eq(vendorReviewsTable.vendorId, vendorId), eq(vendorReviewsTable.coupleId, r.coupleId)))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Vous avez déjà laissé un avis pour ce prestataire." });
    return;
  }

  const [row] = await db
    .insert(vendorReviewsTable)
    .values({
      vendorId,
      coupleId: r.coupleId,
      rating,
      title: title ?? "",
      comment,
      status: "pending",
    })
    .returning();
  res.status(201).json(row);
});

// ====================================================================
// LOT 9 — Mood boards (collaborative inspiration)
// ====================================================================
const moodBoardSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  position: z.coerce.number().int().optional().default(0),
});

router.get("/client/mood-boards", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const boards = await db.select().from(moodBoardsTable)
    .where(eq(moodBoardsTable.coupleId, r.coupleId))
    .orderBy(asc(moodBoardsTable.position), asc(moodBoardsTable.id));
  const images = await db.select().from(moodBoardImagesTable)
    .where(eq(moodBoardImagesTable.coupleId, r.coupleId))
    .orderBy(asc(moodBoardImagesTable.position), asc(moodBoardImagesTable.id));
  res.json(boards.map((b) => ({ ...b, images: images.filter((im) => im.boardId === b.id) })));
});

router.post("/client/mood-boards", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = moodBoardSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.insert(moodBoardsTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
  res.status(201).json(row);
});

router.patch("/client/mood-boards/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = moodBoardSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [row] = await db.update(moodBoardsTable).set(parsed.data)
    .where(and(eq(moodBoardsTable.id, id), eq(moodBoardsTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/client/mood-boards/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(moodBoardImagesTable).where(and(eq(moodBoardImagesTable.boardId, id), eq(moodBoardImagesTable.coupleId, r.coupleId)));
  await db.delete(moodBoardsTable).where(and(eq(moodBoardsTable.id, id), eq(moodBoardsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

const moodImageSchema = z.object({
  boardId: z.coerce.number().int().positive(),
  url: z.string().min(1),
  caption: z.string().max(500).optional().default(""),
  position: z.coerce.number().int().optional().default(0),
});

router.post("/client/mood-board-images", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = moodImageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  // Validate the board belongs to this couple
  const [board] = await db.select().from(moodBoardsTable)
    .where(and(eq(moodBoardsTable.id, parsed.data.boardId), eq(moodBoardsTable.coupleId, r.coupleId))).limit(1);
  if (!board) { res.status(404).json({ error: "Board not found" }); return; }

  let { url } = parsed.data;
  if (url.startsWith("/objects/")) {
    if (!await consumeUploadIntent(url, r.userId)) { res.status(403).json({ error: "Upload intent invalid" }); return; }
    try {
      url = await storageService.trySetObjectEntityAclPolicy(url, { owner: r.userId, visibility: "public" });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set ACL"); res.status(400).json({ error: "Invalid object path" }); return;
    }
  }
  const [row] = await db.insert(moodBoardImagesTable).values({
    coupleId: r.coupleId, boardId: parsed.data.boardId, url, caption: parsed.data.caption, position: parsed.data.position,
  }).returning();
  res.status(201).json(row);
});

router.patch("/client/mood-board-images/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = z.object({ caption: z.string().max(500).optional(), position: z.coerce.number().int().optional(), boardId: z.coerce.number().int().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [row] = await db.update(moodBoardImagesTable).set(parsed.data)
    .where(and(eq(moodBoardImagesTable.id, id), eq(moodBoardImagesTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/client/mood-board-images/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(moodBoardImagesTable)
    .where(and(eq(moodBoardImagesTable.id, id), eq(moodBoardImagesTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// Mood board collaborators
const collaboratorSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().default(""),
  role: z.enum(["viewer", "editor"]).optional().default("viewer"),
  boardTitle: z.string().max(120).optional().default("Inspiration"),
});

router.get("/client/mood-board-collaborators", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(moodBoardCollaboratorsTable)
    .where(eq(moodBoardCollaboratorsTable.coupleId, r.coupleId))
    .orderBy(desc(moodBoardCollaboratorsTable.invitedAt));
  res.json(rows);
});

router.post("/client/mood-board-collaborators", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = collaboratorSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const token = nanoid(24);
  const [row] = await db.insert(moodBoardCollaboratorsTable).values({
    coupleId: r.coupleId,
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    token,
  }).returning();

  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
  const inviterName = [couple?.partner1Name, couple?.partner2Name].filter(Boolean).join(" & ") || "Le couple";
  notifyMoodBoardInvite({
    to: parsed.data.email,
    locale: couple?.locale || "fr",
    inviterName,
    boardTitle: parsed.data.boardTitle,
    acceptUrl: `${appUrl()}/mood-board/shared/${token}`,
  }, req.log).catch((err) => req.log.error({ err }, "Failed mood board invite email"));

  res.status(201).json(row);
});

router.delete("/client/mood-board-collaborators/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(moodBoardCollaboratorsTable)
    .where(and(eq(moodBoardCollaboratorsTable.id, id), eq(moodBoardCollaboratorsTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// ====================================================================
// LOT 9 — RSVP customizable questions
// ====================================================================
const rsvpQuestionSchema = z.object({
  label: z.string().min(1).max(200),
  type: z.enum(["text", "yesno", "choice"]).default("text"),
  options: z.array(z.string()).optional().default([]),
  required: z.boolean().optional().default(false),
  position: z.coerce.number().int().optional().default(0),
});

async function getOwnedWeddingSiteId(coupleId: number): Promise<number | null> {
  const [site] = await db.select({ id: weddingWebsitesTable.id }).from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, coupleId)).limit(1);
  return site?.id ?? null;
}

router.get("/client/rsvp-questions", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  if (!siteId) { res.json([]); return; }
  const rows = await db.select().from(rsvpQuestionsTable)
    .where(eq(rsvpQuestionsTable.weddingWebsiteId, siteId))
    .orderBy(asc(rsvpQuestionsTable.position), asc(rsvpQuestionsTable.id));
  res.json(rows);
});

router.post("/client/rsvp-questions", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = rsvpQuestionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  if (!siteId) { res.status(400).json({ error: "Crée d'abord ton site mariage" }); return; }
  const [row] = await db.insert(rsvpQuestionsTable).values({ weddingWebsiteId: siteId, ...parsed.data }).returning();
  res.status(201).json(row);
});

router.patch("/client/rsvp-questions/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = rsvpQuestionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  if (!siteId) { res.status(404).json({ error: "Not found" }); return; }
  const [row] = await db.update(rsvpQuestionsTable).set(parsed.data)
    .where(and(eq(rsvpQuestionsTable.id, id), eq(rsvpQuestionsTable.weddingWebsiteId, siteId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/client/rsvp-questions/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  if (!siteId) { res.json({ success: true }); return; }
  await db.delete(rsvpQuestionsTable)
    .where(and(eq(rsvpQuestionsTable.id, id), eq(rsvpQuestionsTable.weddingWebsiteId, siteId)));
  res.json({ success: true });
});

// ====================================================================
// LOT 9 — Cagnottes
// ====================================================================
const cagnotteSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  photo: z.string().optional().nullable(),
  iban: z.string().max(50).optional().nullable(),
  externalUrl: z.string().url().optional().nullable().or(z.literal("")),
  position: z.coerce.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

router.get("/client/cagnottes", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(cagnottesTable)
    .where(eq(cagnottesTable.coupleId, r.coupleId))
    .orderBy(asc(cagnottesTable.position), asc(cagnottesTable.id));
  res.json(rows);
});

router.post("/client/cagnottes", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = cagnotteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  let photo = parsed.data.photo ?? null;
  if (photo && photo.startsWith("/objects/")) {
    if (!await consumeUploadIntent(photo, r.userId)) { res.status(403).json({ error: "Upload intent invalid" }); return; }
    try {
      photo = await storageService.trySetObjectEntityAclPolicy(photo, { owner: r.userId, visibility: "public" });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set ACL"); res.status(400).json({ error: "Invalid object path" }); return;
    }
  }
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  const [row] = await db.insert(cagnottesTable).values({
    coupleId: r.coupleId,
    weddingWebsiteId: siteId,
    title: parsed.data.title,
    description: parsed.data.description,
    photo,
    iban: parsed.data.iban || null,
    externalUrl: parsed.data.externalUrl || null,
    position: parsed.data.position,
    active: parsed.data.active,
  }).returning();
  res.status(201).json(row);
});

router.patch("/client/cagnottes/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = cagnotteSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const patch: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.photo === "string" && parsed.data.photo.startsWith("/objects/")) {
    if (!await consumeUploadIntent(parsed.data.photo, r.userId)) { res.status(403).json({ error: "Upload intent invalid" }); return; }
    try {
      patch.photo = await storageService.trySetObjectEntityAclPolicy(parsed.data.photo, { owner: r.userId, visibility: "public" });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set ACL"); res.status(400).json({ error: "Invalid object path" }); return;
    }
  }
  if (parsed.data.externalUrl === "") patch.externalUrl = null;
  const [row] = await db.update(cagnottesTable).set(patch)
    .where(and(eq(cagnottesTable.id, id), eq(cagnottesTable.coupleId, r.coupleId))).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/client/cagnottes/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  await db.delete(cagnottesTable)
    .where(and(eq(cagnottesTable.id, id), eq(cagnottesTable.coupleId, r.coupleId)));
  res.json({ success: true });
});

// LOT 9 — couple's RSVPs view (with answers grouped)
router.get("/client/rsvps", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const siteId = await getOwnedWeddingSiteId(r.coupleId);
  if (!siteId) { res.json({ rsvps: [], answers: {} }); return; }
  const rsvps = await db.select().from(weddingRsvpsTable)
    .where(eq(weddingRsvpsTable.weddingWebsiteId, siteId))
    .orderBy(desc(weddingRsvpsTable.createdAt));
  const ids = rsvps.map((r) => r.id);
  const answers: Record<number, { questionId: number; answer: string }[]> = {};
  if (ids.length > 0) {
    const scoped = await db.select().from(rsvpResponsesTable)
      .where(inArray(rsvpResponsesTable.rsvpId, ids));
    for (const a of scoped) {
      (answers[a.rsvpId] ||= []).push({ questionId: a.questionId, answer: a.answer });
    }
  }
  res.json({ rsvps, answers });
});

// ---------- Client Quotes (Devis reçus) ----------

/** Build the visibility condition: a couple can see a quote if:
 *  1. quote.coupleId matches their coupleId (explicit link), OR
 *  2. quote.coupleId is NULL and quote.recipientEmail matches their email (email fallback)
 */
function quoteVisibilityCondition(coupleId: number, coupleEmail: string | null) {
  if (!coupleEmail) return eq(vendorQuotesTable.coupleId, coupleId);
  return or(
    eq(vendorQuotesTable.coupleId, coupleId),
    and(isNull(vendorQuotesTable.coupleId), sql`lower(${vendorQuotesTable.recipientEmail}) = lower(${coupleEmail})`),
  )!;
}

router.get("/client/quotes", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const [couple] = await db.select({ email: couplesTable.email }).from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
  const rows = await db.select().from(vendorQuotesTable)
    .where(and(ne(vendorQuotesTable.status, "draft"), quoteVisibilityCondition(r.coupleId, couple?.email ?? null)))
    .orderBy(desc(vendorQuotesTable.createdAt));
  res.json(rows);
});

router.post("/client/quotes/:id/respond", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = z.object({
    action: z.enum(["accept", "refuse"]),
    message: z.string().optional().nullable(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }

  const [couple] = await db.select({ email: couplesTable.email }).from(couplesTable).where(eq(couplesTable.id, r.coupleId)).limit(1);
  const [quote] = await db.select().from(vendorQuotesTable)
    .where(and(eq(vendorQuotesTable.id, id), quoteVisibilityCondition(r.coupleId, couple?.email ?? null)))
    .limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  if (quote.status !== "sent") { res.status(409).json({ error: "Quote cannot be responded to in its current state" }); return; }

  const newStatus = parsed.data.action === "accept" ? "accepted" : "refused";
  const [updated] = await db.update(vendorQuotesTable).set({
    status: newStatus,
    respondedAt: new Date(),
    respondMessage: parsed.data.message ?? null,
    updatedAt: new Date(),
  }).where(eq(vendorQuotesTable.id, id)).returning();

  const [account] = await db.select().from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, quote.vendorAccountId)).limit(1);
  // Notify vendor of couple's response
  if (account?.email) {
    void notifyQuoteResponded({
      to: account.email,
      vendorName: account.businessName || "Prestataire",
      recipientName: quote.recipientName,
      action: parsed.data.action,
      message: parsed.data.message ?? null,
      quoteId: id,
    }, req.log).catch((err) => req.log?.error?.({ err }, "Failed to send quote responded email to vendor"));
  }
  // On acceptance: confirm to the couple that their acceptance was recorded
  if (parsed.data.action === "accept") {
    void notifyQuoteAccepted({
      to: quote.recipientEmail,
      recipientName: quote.recipientName,
      vendorName: account?.businessName || "Mariage Afro",
      subject: quote.subject,
      amountTtc: quote.amountTtc,
      quoteId: id,
    }, req.log).catch((err) => req.log?.error?.({ err }, "Failed to send quote acceptance confirmation to couple"));
  }

  res.json(updated);
});

// ---------- RSVP public-facing (no auth needed, outside requireCouple middleware) ----------
export const rsvpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  attending: z.boolean(),
  guestCount: z.number().int().min(1).max(20).default(1),
  message: z.string().max(1000).optional(),
});

export default router;
