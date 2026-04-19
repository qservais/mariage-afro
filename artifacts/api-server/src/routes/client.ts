import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { and, eq, asc } from "drizzle-orm";
import {
  db,
  couplesTable,
  budgetItemsTable,
  guestsTable,
  planningTasksTable,
  clientVendorsTable,
  clientDocumentsTable,
  jourJEventsTable,
} from "@workspace/db";

const router = Router();

interface AuthedRequest extends Request {
  userId: string;
  coupleId: number;
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
    [couple] = await db.insert(couplesTable).values({ userId }).returning();
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
});

router.patch("/client/me", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const parsed = coupleUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [couple] = await db.update(couplesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
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
  const rows = await db.insert(guestsTable)
    .values(parsed.data.map((g) => ({ coupleId: r.coupleId, ...g }))).returning();
  res.json(Array.isArray(req.body) ? rows : rows[0]);
});
router.patch("/client/guests/:id", async (req, res) => {
  const r = req as unknown as AuthedRequest;
  const id = Number(req.params.id);
  const parsed = guestSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const [row] = await db.update(guestsTable).set(parsed.data)
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
  const [row] = await db.insert(clientDocumentsTable).values({ coupleId: r.coupleId, ...parsed.data }).returning();
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

export default router;
