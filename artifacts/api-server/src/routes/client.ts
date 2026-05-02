import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import {
  db,
  couplesTable,
  budgetItemsTable,
  guestsTable,
  guestTablesTable,
  planningTasksTable,
  clientVendorsTable,
  clientDocumentsTable,
  jourJEventsTable,
  messagesTable,
  weddingWebsitesTable,
  weddingRsvpsTable,
} from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";
import { consumeUploadIntent } from "../lib/uploadIntents";
import { notifyConversationMessage } from "../lib/email";

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
    [couple] = await db.insert(couplesTable).values({
      userId,
      email: contact.email,
      locale: contact.locale,
    }).returning();
  } else if (!couple.email) {
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
    if (!consumeUploadIntent(url, r.userId)) {
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

// ---------- Messages ----------
const messageSchema = z.object({ content: z.string().min(1).max(5000) });

router.get("/client/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const rows = await db.select().from(messagesTable)
    .where(eq(messagesTable.coupleId, r.coupleId))
    .orderBy(asc(messagesTable.createdAt));
  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(eq(messagesTable.coupleId, r.coupleId), eq(messagesTable.authorRole, "admin")));
  res.json(rows);
});

router.post("/client/messages", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const [row] = await db.insert(messagesTable).values({
    coupleId: r.coupleId,
    authorRole: "couple",
    content: parsed.data.content,
  }).returning();

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

// ---------- Wedding Website ----------
const websiteSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().max(100).optional(),
  welcomeMessage: z.string().max(2000).optional(),
  weddingDate: z.string().optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  programme: z.array(z.object({ time: z.string(), event: z.string() })).optional(),
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

  const [current] = await db.select().from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.coupleId, r.coupleId));

  if (!current) {
    const slug = parsed.data.slug ?? `mariage-${r.coupleId}`;
    const [row] = await db.insert(weddingWebsitesTable).values({
      coupleId: r.coupleId,
      slug,
      ...parsed.data,
    }).returning();
    res.status(201).json(row);
  } else {
    const [row] = await db.update(weddingWebsitesTable)
      .set(parsed.data)
      .where(eq(weddingWebsitesTable.coupleId, r.coupleId))
      .returning();
    res.json(row);
  }
});

// ---------- RSVP public-facing (no auth needed, outside requireCouple middleware) ----------
export const rsvpSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  attending: z.boolean(),
  guestCount: z.number().int().min(1).max(20).default(1),
  message: z.string().max(1000).optional(),
});

export default router;
