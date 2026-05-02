import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { and, asc, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import {
  db,
  vendorAccountsTable,
  marketplaceVendorsTable,
  vendorAvailabilityTable,
  vendorLeadsTable,
  conversationsTable,
  messagesTable,
  couplesTable,
} from "@workspace/db";
import { gte, lte } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import { consumeUploadIntent } from "../lib/uploadIntents";
import { notifyConversationMessage } from "../lib/email";

const router = Router();
const storageService = new ObjectStorageService();

interface AuthedVendorRequest extends Request {
  userId: string;
  vendorAccountId: number;
}

async function requireVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  let [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.userId, userId))
    .limit(1);
  if (!account) {
    [account] = await db
      .insert(vendorAccountsTable)
      .values({ userId })
      .returning();
  }
  (req as unknown as AuthedVendorRequest).userId = userId;
  (req as unknown as AuthedVendorRequest).vendorAccountId = account.id;
  next();
}

router.use(requireVendor);

// ---------- Vendor account ----------
router.get("/vendor/me", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  let vendor = null;
  if (account?.vendorId) {
    [vendor] = await db
      .select()
      .from(marketplaceVendorsTable)
      .where(eq(marketplaceVendorsTable.id, account.vendorId))
      .limit(1);
  }
  res.json({ account, vendor });
});

const onboardingSchema = z.object({
  businessName: z.string().min(1).max(120),
  contactName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  category: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  website: z.string().optional().nullable(),
  description: z.string().max(2000).optional().default(""),
  locale: z.enum(["fr", "nl", "en"]).optional().default("fr"),
});

router.post("/vendor/onboarding", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);

  let vendorId = existing?.vendorId ?? null;
  if (vendorId) {
    await db
      .update(marketplaceVendorsTable)
      .set({
        name: data.businessName,
        category: data.category,
        city: data.city,
        tagline: "",
        description: data.description ?? "",
        website: data.website ?? null,
        phone: data.phone ?? null,
        email: data.email,
      })
      .where(eq(marketplaceVendorsTable.id, vendorId));
  } else {
    const [vendor] = await db
      .insert(marketplaceVendorsTable)
      .values({
        name: data.businessName,
        category: data.category,
        city: data.city,
        tagline: "",
        description: data.description ?? "",
        services: [],
        images: [],
        website: data.website ?? null,
        phone: data.phone ?? null,
        email: data.email,
        verified: false,
        active: false,
        rating: 5,
      })
      .returning();
    vendorId = vendor.id;
  }

  const [account] = await db
    .update(vendorAccountsTable)
    .set({
      vendorId,
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone ?? null,
      category: data.category,
      city: data.city,
      website: data.website ?? null,
      description: data.description ?? "",
      locale: data.locale,
      status: "pending",
      onboardedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .returning();

  res.json({ account });
});

// ---------- Marketplace profile ----------
async function getMyVendor(accountId: number) {
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, accountId))
    .limit(1);
  if (!account?.vendorId) return null;
  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, account.vendorId))
    .limit(1);
  return vendor ?? null;
}

router.get("/vendor/profile", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const vendor = await getMyVendor(r.vendorAccountId);
  res.json(vendor);
});

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(80).optional(),
  city: z.string().min(1).max(80).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(4000).optional(),
  services: z.array(z.string().max(120)).optional(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional(),
});

router.patch("/vendor/profile", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }
  const vendor = await getMyVendor(r.vendorAccountId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found — complete onboarding first" });
    return;
  }
  const [updated] = await db
    .update(marketplaceVendorsTable)
    .set(parsed.data)
    .where(eq(marketplaceVendorsTable.id, vendor.id))
    .returning();
  res.json(updated);
});

// ---------- Gallery ----------
const imagesSchema = z.object({
  images: z.array(z.string().min(1)).max(40),
  coverImage: z.string().optional().nullable(),
});

router.patch("/vendor/profile/images", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const parsed = imagesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }
  const vendor = await getMyVendor(r.vendorAccountId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found — complete onboarding first" });
    return;
  }

  const normalizedImages: string[] = [];
  for (const url of parsed.data.images) {
    if (url.startsWith("/objects/")) {
      if (!consumeUploadIntent(url, r.userId)) {
        res.status(403).json({ error: "Upload intent expired or unauthorized" });
        return;
      }
      try {
        const finalUrl = await storageService.trySetObjectEntityAclPolicy(url, {
          owner: r.userId,
          visibility: "public",
        });
        normalizedImages.push(finalUrl);
      } catch (err) {
        req.log?.error?.({ err }, "Failed to set object ACL policy");
        res.status(400).json({ error: "Invalid uploaded object path" });
        return;
      }
    } else if (url.includes("/.private/")) {
      res.status(400).json({ error: "Invalid url" });
      return;
    } else {
      normalizedImages.push(url);
    }
  }

  let cover = parsed.data.coverImage ?? vendor.coverImage ?? null;
  if (cover && !normalizedImages.includes(cover) && !cover.startsWith("http")) {
    cover = normalizedImages[0] ?? null;
  }

  const [updated] = await db
    .update(marketplaceVendorsTable)
    .set({ images: normalizedImages, coverImage: cover })
    .where(eq(marketplaceVendorsTable.id, vendor.id))
    .returning();
  res.json(updated);
});

// ---------- Availability ----------
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const availabilityQuerySchema = z.object({
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
});

const availabilityUpsertSchema = z.object({
  date: z.string().regex(dateRegex),
  status: z.literal("blocked").default("blocked"),
  note: z.string().max(280).optional().nullable(),
});

router.get("/vendor/availability", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const vendor = await getMyVendor(r.vendorAccountId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found — complete onboarding first" });
    return;
  }
  const parsed = availabilityQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", issues: parsed.error.issues });
    return;
  }
  const { from, to } = parsed.data;
  const conditions = [eq(vendorAvailabilityTable.vendorId, vendor.id)];
  if (from) conditions.push(gte(vendorAvailabilityTable.date, from));
  if (to) conditions.push(lte(vendorAvailabilityTable.date, to));
  const rows = await db
    .select()
    .from(vendorAvailabilityTable)
    .where(and(...conditions));
  res.json(rows);
});

router.post("/vendor/availability", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const vendor = await getMyVendor(r.vendorAccountId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found — complete onboarding first" });
    return;
  }
  const parsed = availabilityUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }
  const { date, status, note } = parsed.data;
  const [existing] = await db
    .select()
    .from(vendorAvailabilityTable)
    .where(and(
      eq(vendorAvailabilityTable.vendorId, vendor.id),
      eq(vendorAvailabilityTable.date, date),
    ))
    .limit(1);
  if (existing) {
    if (existing.status === "booked") {
      res.status(409).json({ error: "Date is booked and cannot be modified manually" });
      return;
    }
    const [updated] = await db
      .update(vendorAvailabilityTable)
      .set({ status, note: note ?? null })
      .where(eq(vendorAvailabilityTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }
  const [created] = await db
    .insert(vendorAvailabilityTable)
    .values({ vendorId: vendor.id, date, status, note: note ?? null })
    .returning();
  res.status(201).json(created);
});

router.delete("/vendor/availability/:date", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const vendor = await getMyVendor(r.vendorAccountId);
  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found — complete onboarding first" });
    return;
  }
  const date = req.params.date;
  if (!dateRegex.test(date)) {
    res.status(400).json({ error: "Invalid date format" });
    return;
  }
  const [existing] = await db
    .select()
    .from(vendorAvailabilityTable)
    .where(and(
      eq(vendorAvailabilityTable.vendorId, vendor.id),
      eq(vendorAvailabilityTable.date, date),
    ))
    .limit(1);
  if (existing && existing.status === "booked") {
    res.status(409).json({ error: "Date is booked and cannot be modified manually" });
    return;
  }
  await db
    .delete(vendorAvailabilityTable)
    .where(and(
      eq(vendorAvailabilityTable.vendorId, vendor.id),
      eq(vendorAvailabilityTable.date, date),
    ));
  res.status(204).end();
});

// ---------- Leads ----------
const LEAD_STATUSES = ["new", "seen", "contacted", "won", "lost"] as const;

function leadAccessFilter(accountId: number, vendorId: number | null) {
  if (vendorId == null) {
    return eq(vendorLeadsTable.vendorAccountId, accountId);
  }
  return or(
    eq(vendorLeadsTable.vendorAccountId, accountId),
    eq(vendorLeadsTable.vendorId, vendorId),
  );
}

router.get("/vendor/leads", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) { res.json([]); return; }

  const rows = await db
    .select()
    .from(vendorLeadsTable)
    .where(leadAccessFilter(account.id, account.vendorId))
    .orderBy(desc(vendorLeadsTable.createdAt));

  // Backfill vendorAccountId for older rows that were created before vendor signed up
  if (account.vendorId) {
    await db
      .update(vendorLeadsTable)
      .set({ vendorAccountId: account.id })
      .where(and(
        eq(vendorLeadsTable.vendorId, account.vendorId),
        isNull(vendorLeadsTable.vendorAccountId),
      ));
  }

  res.json(rows);
});

router.get("/vendor/leads/unseen-count", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) { res.json({ count: 0 }); return; }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(vendorLeadsTable)
    .where(and(
      leadAccessFilter(account.id, account.vendorId),
      eq(vendorLeadsTable.status, "new"),
    ));
  res.json({ count: row?.count ?? 0 });
});

const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  internalNote: z.string().max(4000).optional().nullable(),
  markSeen: z.boolean().optional(),
});

router.patch("/vendor/leads/:id", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid", issues: parsed.error.issues });
    return;
  }

  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }

  const [lead] = await db
    .select()
    .from(vendorLeadsTable)
    .where(and(
      eq(vendorLeadsTable.id, id),
      leadAccessFilter(account.id, account.vendorId),
    ))
    .limit(1);
  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

  const update: Partial<typeof vendorLeadsTable.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) {
    update.status = parsed.data.status;
    if (parsed.data.status !== "new" && !lead.seenAt) {
      update.seenAt = new Date();
    }
  }
  if (parsed.data.internalNote !== undefined) {
    update.internalNote = parsed.data.internalNote;
  }
  if (parsed.data.markSeen) {
    if (!lead.seenAt) update.seenAt = new Date();
    if (lead.status === "new") update.status = "seen";
  }
  // Ensure ownership claim
  if (lead.vendorAccountId == null) {
    update.vendorAccountId = account.id;
  }

  const [updated] = await db
    .update(vendorLeadsTable)
    .set(update)
    .where(eq(vendorLeadsTable.id, id))
    .returning();
  res.json(updated);
});

// ---------- Conversations (vendor side) ----------
const messageSchema = z.object({ content: z.string().min(1).max(5000) });

async function getMyVendorId(accountId: number): Promise<number | null> {
  const [account] = await db.select().from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, accountId)).limit(1);
  return account?.vendorId ?? null;
}

router.get("/vendor/conversations", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const vendorId = await getMyVendorId(r.vendorAccountId);
  if (!vendorId) { res.json([]); return; }

  const convs = await db
    .select({
      id: conversationsTable.id,
      coupleId: conversationsTable.coupleId,
      lastMessageAt: conversationsTable.lastMessageAt,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
    })
    .from(conversationsTable)
    .leftJoin(couplesTable, eq(couplesTable.id, conversationsTable.coupleId))
    .where(eq(conversationsTable.vendorId, vendorId))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const ids = convs.map((c) => c.id);
  const stats = new Map<number, { unread: number; lastContent: string | null; lastAuthor: string | null }>();
  if (ids.length > 0) {
    const unreadRows = await db
      .select({
        conversationId: messagesTable.conversationId,
        unread: sql<number>`count(case when ${messagesTable.authorRole} = 'couple' and ${messagesTable.readAt} is null then 1 end)`.as("unread"),
      })
      .from(messagesTable)
      .where(sql`${messagesTable.conversationId} = ANY(${ids})`)
      .groupBy(messagesTable.conversationId);
    for (const u of unreadRows) {
      if (u.conversationId != null) stats.set(u.conversationId, { unread: Number(u.unread) || 0, lastContent: null, lastAuthor: null });
    }
    for (const id of ids) {
      const [last] = await db.select().from(messagesTable)
        .where(eq(messagesTable.conversationId, id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      const cur = stats.get(id) ?? { unread: 0, lastContent: null, lastAuthor: null };
      if (last) {
        cur.lastContent = last.content;
        cur.lastAuthor = last.authorRole;
      }
      stats.set(id, cur);
    }
  }

  const out = convs.map((c) => {
    const s = stats.get(c.id) ?? { unread: 0, lastContent: null, lastAuthor: null };
    return {
      id: c.id,
      coupleId: c.coupleId,
      couple: { partner1Name: c.partner1Name, partner2Name: c.partner2Name },
      lastMessageAt: c.lastMessageAt,
      lastMessage: s.lastContent,
      lastMessageAuthor: s.lastAuthor,
      unread: s.unread,
    };
  });
  res.json(out);
});

async function loadVendorConversation(accountId: number, conversationId: number) {
  const vendorId = await getMyVendorId(accountId);
  if (!vendorId) return null;
  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, conversationId), eq(conversationsTable.vendorId, vendorId)))
    .limit(1);
  return conv ?? null;
}

router.get("/vendor/conversations/:id/messages", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const conv = await loadVendorConversation(r.vendorAccountId, id);
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const rows = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));
  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(messagesTable.conversationId, id),
      eq(messagesTable.authorRole, "couple"),
      isNull(messagesTable.readAt),
    ));
  res.json(rows);
});

router.post("/vendor/conversations/:id/messages", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid" }); return; }
  const conv = await loadVendorConversation(r.vendorAccountId, id);
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const now = new Date();
  const [row] = await db.insert(messagesTable).values({
    coupleId: conv.coupleId,
    conversationId: id,
    authorRole: "vendor",
    vendorAuthorId: r.vendorAccountId,
    content: parsed.data.content,
  }).returning();
  await db.update(conversationsTable).set({ lastMessageAt: now }).where(eq(conversationsTable.id, id));

  // Vendor → couple : notify the couple (throttled per conversation)
  const vendorIdLocal = conv.vendorId;
  (async () => {
    const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, conv.coupleId)).limit(1);
    if (!couple?.email) return;
    const [account] = await db.select({ businessName: vendorAccountsTable.businessName })
      .from(vendorAccountsTable)
      .where(eq(vendorAccountsTable.id, r.vendorAccountId))
      .limit(1);
    const [vendor] = vendorIdLocal != null
      ? await db.select({ name: marketplaceVendorsTable.name })
          .from(marketplaceVendorsTable)
          .where(eq(marketplaceVendorsTable.id, vendorIdLocal))
          .limit(1)
      : [];
    const senderLabel = account?.businessName || vendor?.name || "Mariage Afro";
    await notifyConversationMessage({
      to: couple.email,
      locale: (couple.locale as "fr" | "nl" | "en") || "fr",
      senderLabel,
      preview: parsed.data.content,
      conversationKey: `couple-vendor:${conv.coupleId}:${vendorIdLocal ?? "null"}`,
      ctaUrl: `${process.env.PUBLIC_APP_URL || ""}/espace-client/communication`,
    }, req.log);
  })().catch((err) => req.log.error({ err }, "Failed to notify couple of vendor message"));

  res.status(201).json(row);
});

export default router;
