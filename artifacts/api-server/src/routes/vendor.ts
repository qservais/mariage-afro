import { Router, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import {
  db,
  vendorAccountsTable,
  marketplaceVendorsTable,
  vendorAvailabilityTable,
  vendorLeadsTable,
  vendorSubscriptionsTable,
  vendorViewsTable,
  vendorQuotesTable,
  conversationsTable,
  messagesTable,
  couplesTable,
} from "@workspace/db";
import { gte, lte } from "drizzle-orm";
import { ObjectStorageService } from "../lib/objectStorage";
import { consumeUploadIntent } from "../lib/uploadIntents";
import { notifyConversationMessage, notifyAdminSubscriptionRequest, notifyVendorLeadFollowup, notifyQuoteReceived, notifyQuoteResponded } from "../lib/email";
import { logger } from "../lib/logger";

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
    // Use ON CONFLICT DO NOTHING to handle concurrent first-login requests gracefully
    const inserted = await db
      .insert(vendorAccountsTable)
      .values({ userId })
      .onConflictDoNothing()
      .returning();
    if (inserted.length > 0) {
      account = inserted[0];
    } else {
      // Race condition: another request inserted first — re-fetch
      [account] = await db
        .select()
        .from(vendorAccountsTable)
        .where(eq(vendorAccountsTable.userId, userId))
        .limit(1);
    }
  }
  if (!account) {
    res.status(500).json({ error: "Failed to create vendor account" });
    return;
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

  // Verify the marketplace vendor still exists (may have been deleted externally)
  if (vendorId) {
    const [existingVendor] = await db
      .select({ id: marketplaceVendorsTable.id })
      .from(marketplaceVendorsTable)
      .where(eq(marketplaceVendorsTable.id, vendorId))
      .limit(1);
    if (!existingVendor) vendorId = null;
  }

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
  logoUrl: z.string().max(2000).optional().nullable(),
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

  const data = { ...parsed.data };
  if (typeof data.logoUrl === "string" && data.logoUrl.startsWith("/objects/")) {
    if (!await consumeUploadIntent(data.logoUrl, r.userId)) {
      res.status(403).json({ error: "Upload intent expired or unauthorized" });
      return;
    }
    try {
      data.logoUrl = await storageService.trySetObjectEntityAclPolicy(data.logoUrl, {
        owner: r.userId,
        visibility: "public",
      });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to set logo ACL");
      res.status(400).json({ error: "Invalid uploaded object path" });
      return;
    }
  } else if (typeof data.logoUrl === "string" && data.logoUrl.includes("/.private/")) {
    res.status(400).json({ error: "Invalid url" });
    return;
  }

  const [updated] = await db
    .update(marketplaceVendorsTable)
    .set(data)
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
      if (!await consumeUploadIntent(url, r.userId)) {
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
const LEAD_STATUSES = ["new", "seen", "contacted", "devis_envoye", "won", "lost"] as const;

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
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
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
  if (parsed.data.tags !== undefined) {
    update.tags = parsed.data.tags;
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
      .where(inArray(messagesTable.conversationId, ids))
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

// ---------- LOT 8 — Stats, onboarding checklist, subscriptions ----------

router.get("/vendor/stats", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) {
    res.json({
      views7: 0, views30: 0, views90: 0, leads30: 0, leadsByStatus: {}, conversionRate: 0,
      responseRate: 0, unreadMessages: 0, ranking: null, series: [], leadsSeries: [],
      sources: [], topPages: [],
    });
    return;
  }

  const vendorId = account.vendorId;
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now - 90 * 24 * 60 * 60 * 1000);

  let views7 = 0, views30 = 0, views90 = 0;
  let series: { date: string; views: number }[] = [];
  let sources: { source: string; count: number }[] = [];
  let ranking: { rank: number; total: number; category: string } | null = null;

  if (vendorId) {
    const [v7] = await db.select({ c: sql<number>`count(*)::int` })
      .from(vendorViewsTable)
      .where(and(eq(vendorViewsTable.vendorId, vendorId), gte(vendorViewsTable.viewedAt, d7)));
    views7 = v7?.c ?? 0;
    const [v30] = await db.select({ c: sql<number>`count(*)::int` })
      .from(vendorViewsTable)
      .where(and(eq(vendorViewsTable.vendorId, vendorId), gte(vendorViewsTable.viewedAt, d30)));
    views30 = v30?.c ?? 0;
    const [v90] = await db.select({ c: sql<number>`count(*)::int` })
      .from(vendorViewsTable)
      .where(and(eq(vendorViewsTable.vendorId, vendorId), gte(vendorViewsTable.viewedAt, d90)));
    views90 = v90?.c ?? 0;

    const seriesRows = await db
      .select({
        d: sql<string>`to_char(date_trunc('day', ${vendorViewsTable.viewedAt}), 'YYYY-MM-DD')`,
        c: sql<number>`count(*)::int`,
      })
      .from(vendorViewsTable)
      .where(and(eq(vendorViewsTable.vendorId, vendorId), gte(vendorViewsTable.viewedAt, d90)))
      .groupBy(sql`date_trunc('day', ${vendorViewsTable.viewedAt})`)
      .orderBy(sql`date_trunc('day', ${vendorViewsTable.viewedAt})`);
    const map = new Map(seriesRows.map((row) => [row.d, row.c]));
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, views: map.get(key) ?? 0 });
    }

    const sourceRows = await db
      .select({ source: vendorViewsTable.source, c: sql<number>`count(*)::int` })
      .from(vendorViewsTable)
      .where(and(eq(vendorViewsTable.vendorId, vendorId), gte(vendorViewsTable.viewedAt, d30)))
      .groupBy(vendorViewsTable.source)
      .orderBy(desc(sql`count(*)`));
    sources = sourceRows.map((row) => ({ source: row.source, count: row.c }));

    const [vendorRow] = await db
      .select({ category: marketplaceVendorsTable.category })
      .from(marketplaceVendorsTable)
      .where(eq(marketplaceVendorsTable.id, vendorId))
      .limit(1);
    if (vendorRow?.category) {
      const rankRows = await db
        .select({
          vendorId: marketplaceVendorsTable.id,
          views: sql<number>`coalesce(count(${vendorViewsTable.id})::int, 0)`,
        })
        .from(marketplaceVendorsTable)
        .leftJoin(
          vendorViewsTable,
          and(
            eq(vendorViewsTable.vendorId, marketplaceVendorsTable.id),
            gte(vendorViewsTable.viewedAt, d30),
          ),
        )
        .where(and(
          eq(marketplaceVendorsTable.category, vendorRow.category),
          eq(marketplaceVendorsTable.active, true),
        ))
        .groupBy(marketplaceVendorsTable.id)
        .orderBy(desc(sql`coalesce(count(${vendorViewsTable.id})::int, 0)`));
      const idx = rankRows.findIndex((r) => r.vendorId === vendorId);
      ranking = {
        rank: idx >= 0 ? idx + 1 : rankRows.length + 1,
        total: rankRows.length,
        category: vendorRow.category,
      };
    }
  }

  const accessCond = leadAccessFilter(account.id, vendorId);
  const leadsRows = await db
    .select({ status: vendorLeadsTable.status, c: sql<number>`count(*)::int` })
    .from(vendorLeadsTable)
    .where(and(accessCond, gte(vendorLeadsTable.createdAt, d30)))
    .groupBy(vendorLeadsTable.status);
  const leadsByStatus: Record<string, number> = {
    new: 0, seen: 0, contacted: 0, devis_envoye: 0, won: 0, lost: 0,
  };
  let leads30 = 0;
  for (const row of leadsRows) {
    leadsByStatus[row.status] = (leadsByStatus[row.status] ?? 0) + row.c;
    leads30 += row.c;
  }
  const conversionRate = leads30 > 0 ? Math.round((leadsByStatus.won / leads30) * 1000) / 10 : 0;
  // Response rate = % of leads that have been "seen" (vendor took action) within 30d
  const respondedCount = leads30 - (leadsByStatus.new ?? 0);
  const responseRate = leads30 > 0 ? Math.round((respondedCount / leads30) * 1000) / 10 : 0;

  // Leads daily series over 90 days
  const leadsSeriesRows = await db
    .select({
      d: sql<string>`to_char(date_trunc('day', ${vendorLeadsTable.createdAt}), 'YYYY-MM-DD')`,
      c: sql<number>`count(*)::int`,
    })
    .from(vendorLeadsTable)
    .where(and(accessCond, gte(vendorLeadsTable.createdAt, d90)))
    .groupBy(sql`date_trunc('day', ${vendorLeadsTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${vendorLeadsTable.createdAt})`);
  const leadsMap = new Map(leadsSeriesRows.map((row) => [row.d, row.c]));
  const leadsSeries: { date: string; leads: number }[] = [];
  const dayMs2 = 24 * 60 * 60 * 1000;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now - i * dayMs2);
    const key = d.toISOString().slice(0, 10);
    leadsSeries.push({ date: key, leads: leadsMap.get(key) ?? 0 });
  }

  let unreadMessages = 0;
  if (vendorId) {
    const [m] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(messagesTable)
      .leftJoin(conversationsTable, eq(conversationsTable.id, messagesTable.conversationId))
      .where(and(
        eq(conversationsTable.vendorId, vendorId),
        eq(messagesTable.authorRole, "couple"),
        isNull(messagesTable.readAt),
      ));
    unreadMessages = m?.c ?? 0;
  }

  res.json({
    views7, views30, views90, leads30, leadsByStatus, conversionRate, responseRate,
    unreadMessages, ranking, series, leadsSeries, sources, topPages: sources,
  });
});

// ---------- LOT 8 — Settings (auto follow-up + custom lead tags) ----------
const settingsSchema = z.object({
  autoFollowupEnabled: z.boolean().optional(),
  customLeadTags: z.array(z.string().min(1).max(40)).max(50).optional(),
});

router.get("/vendor/settings", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, r.vendorAccountId)).limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  res.json({
    autoFollowupEnabled: account.autoFollowupEnabled,
    customLeadTags: account.customLeadTags ?? [],
  });
});

router.patch("/vendor/settings", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.autoFollowupEnabled !== undefined) update["autoFollowupEnabled"] = parsed.data.autoFollowupEnabled;
  if (parsed.data.customLeadTags !== undefined) {
    const seen = new Set<string>();
    update["customLeadTags"] = parsed.data.customLeadTags.filter((t) => { const k = t.trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }
  const [updated] = await db.update(vendorAccountsTable).set(update).where(eq(vendorAccountsTable.id, r.vendorAccountId)).returning();
  res.json({
    autoFollowupEnabled: updated.autoFollowupEnabled,
    customLeadTags: updated.customLeadTags ?? [],
  });
});

// ---------- LOT 8 — Lead follow-up cron (exported, called by index.ts) ----------
// Runs daily: for vendors with autoFollowupEnabled, sends a reminder email when
// they have leads stuck in "new" >3 days or "contacted" >5 days, throttled to
// at most once per vendor per 7 days.
export async function runVendorFollowupCron(): Promise<void> {
  const now = new Date();
  const newThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const contactedThreshold = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const throttleAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const accounts = await db
    .select()
    .from(vendorAccountsTable)
    .where(and(
      eq(vendorAccountsTable.autoFollowupEnabled, true),
      or(isNull(vendorAccountsTable.lastFollowupRunAt), lte(vendorAccountsTable.lastFollowupRunAt, throttleAfter)),
    ));

  for (const acc of accounts) {
    if (!acc.email) continue;
    const newRows = await db.select({ c: sql<number>`count(*)::int` }).from(vendorLeadsTable)
      .where(and(eq(vendorLeadsTable.vendorAccountId, acc.id), eq(vendorLeadsTable.status, "new"), lte(vendorLeadsTable.createdAt, newThreshold)));
    const contactedRows = await db.select({ c: sql<number>`count(*)::int` }).from(vendorLeadsTable)
      .where(and(eq(vendorLeadsTable.vendorAccountId, acc.id), eq(vendorLeadsTable.status, "contacted"), lte(vendorLeadsTable.updatedAt, contactedThreshold)));
    const newCount = newRows[0]?.c ?? 0;
    const contactedCount = contactedRows[0]?.c ?? 0;
    if (newCount + contactedCount === 0) continue;
    try {
      await notifyVendorLeadFollowup({
        to: acc.email,
        vendorName: acc.businessName || acc.contactName || "Prestataire",
        newCount, contactedCount,
        locale: acc.locale,
      });
      await db.update(vendorAccountsTable).set({ lastFollowupRunAt: new Date() }).where(eq(vendorAccountsTable.id, acc.id));
    } catch (err) {
      logger.warn({ err, accountId: acc.id }, "Vendor follow-up email failed");
    }
  }
}

router.get("/vendor/onboarding-checklist", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }

  const vendor = account.vendorId
    ? (await db.select().from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, account.vendorId)).limit(1))[0]
    : null;

  const logo = !!vendor?.logoUrl;
  const cover = !!(vendor?.coverPhotoUrl || vendor?.coverImage);
  const descriptionFr = !!(vendor?.descriptionFr && vendor.descriptionFr.length >= 200);
  const descriptionNl = !!(vendor?.descriptionNl && vendor.descriptionNl.length >= 200);
  const descriptionEn = !!(vendor?.descriptionEn && vendor.descriptionEn.length >= 200);
  const photos5 = (vendor?.images?.length ?? 0) >= 5;
  const indicativePrice = !!(vendor?.indicativePrice && vendor.indicativePrice.length > 0);
  const video = !!vendor?.videoUrl;
  const firstPost = !!vendor?.hasFirstPost;
  const availabilityCount = vendor?.id
    ? Number((await db.select({ c: sql<number>`count(*)::int` }).from(vendorAvailabilityTable).where(eq(vendorAvailabilityTable.vendorId, vendor.id)))[0]?.c ?? 0)
    : 0;
  const availabilitySet = availabilityCount > 0;

  const [sub] = await db
    .select()
    .from(vendorSubscriptionsTable)
    .where(eq(vendorSubscriptionsTable.vendorAccountId, account.id))
    .limit(1);
  const tierChosen = !!sub;

  // LOT 8 spec items: onboarding + logo + cover + FR/NL/EN descriptions + indicative price + photos + video + first post + availability + tier
  const items = [
    { key: "onboarding", done: !!account.onboardedAt },
    { key: "logo", done: logo },
    { key: "cover_photo", done: cover },
    { key: "description_fr", done: descriptionFr, count: vendor?.descriptionFr?.length ?? 0 },
    { key: "description_nl", done: descriptionNl, count: vendor?.descriptionNl?.length ?? 0 },
    { key: "description_en", done: descriptionEn, count: vendor?.descriptionEn?.length ?? 0 },
    { key: "indicative_price", done: indicativePrice },
    { key: "photos_5", done: photos5, count: vendor?.images?.length ?? 0 },
    { key: "video", done: video },
    { key: "first_post", done: firstPost },
    { key: "availability", done: availabilitySet },
    { key: "tier", done: tierChosen },
  ];
  const completed = items.filter((i) => i.done).length;
  res.json({ items, completed, total: items.length, hide: completed === items.length });
});

const TIERS = ["basic", "premium", "featured"] as const;
const subscriptionSchema = z.object({
  tier: z.enum(TIERS),
  notes: z.string().max(2000).optional().nullable(),
});

router.get("/vendor/subscription", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [sub] = await db
    .select()
    .from(vendorSubscriptionsTable)
    .where(eq(vendorSubscriptionsTable.vendorAccountId, r.vendorAccountId))
    .limit(1);
  res.json(sub ?? null);
});

router.post("/vendor/subscription", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }

  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, r.vendorAccountId))
    .limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }

  const [existing] = await db
    .select()
    .from(vendorSubscriptionsTable)
    .where(eq(vendorSubscriptionsTable.vendorAccountId, account.id))
    .limit(1);

  let row;
  if (existing) {
    [row] = await db
      .update(vendorSubscriptionsTable)
      .set({
        tier: parsed.data.tier,
        notes: parsed.data.notes ?? null,
        status: parsed.data.tier === "basic" ? "active" : "requested",
        startedAt: parsed.data.tier === "basic" ? new Date() : existing.startedAt,
        requestedAt: new Date(),
        vendorId: account.vendorId,
        updatedAt: new Date(),
      })
      .where(eq(vendorSubscriptionsTable.id, existing.id))
      .returning();
  } else {
    [row] = await db
      .insert(vendorSubscriptionsTable)
      .values({
        vendorAccountId: account.id,
        vendorId: account.vendorId,
        tier: parsed.data.tier,
        notes: parsed.data.notes ?? null,
        status: parsed.data.tier === "basic" ? "active" : "requested",
        startedAt: parsed.data.tier === "basic" ? new Date() : null,
      })
      .returning();
  }

  if (parsed.data.tier !== "basic") {
    void notifyAdminSubscriptionRequest({
      vendorName: account.businessName || `Vendor #${account.id}`,
      contactEmail: account.email,
      contactName: account.contactName,
      tier: parsed.data.tier,
      notes: parsed.data.notes ?? null,
    }, req.log).catch((err) => req.log?.error?.({ err }, "Failed to notify admin of subscription request"));
  }

  res.status(201).json(row);
});

// ---------- Vendor Quotes (Devis formels) ----------
const quoteServiceSchema = z.object({
  label: z.string().min(1),
  qty: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().int().nonnegative().default(0),
});

const quoteCreateSchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().optional().default(""),
  leadId: z.coerce.number().int().positive().optional().nullable(),
  coupleId: z.coerce.number().int().positive().optional().nullable(),
  subject: z.string().optional().default(""),
  message: z.string().optional().default(""),
  services: z.array(quoteServiceSchema).optional().default([]),
  vatRate: z.coerce.number().int().min(0).max(100).optional().default(21),
  validityDays: z.coerce.number().int().min(1).max(365).optional().default(30),
});

function computeAmounts(services: Array<{ qty: number; unitPrice: number }>, vatRate: number) {
  const ht = services.reduce((s, item) => s + item.qty * item.unitPrice, 0);
  const ttc = Math.round(ht * (1 + vatRate / 100));
  return { amountHt: ht, amountTtc: ttc };
}

router.get("/vendor/quotes", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, r.vendorAccountId)).limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  const rows = await db.select().from(vendorQuotesTable)
    .where(eq(vendorQuotesTable.vendorAccountId, r.vendorAccountId))
    .orderBy(desc(vendorQuotesTable.createdAt));
  res.json(rows);
});

router.post("/vendor/quotes", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, r.vendorAccountId)).limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  const parsed = quoteCreateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const { services, vatRate } = parsed.data;
  const { amountHt, amountTtc } = computeAmounts(services, vatRate ?? 21);
  const [row] = await db.insert(vendorQuotesTable).values({
    vendorAccountId: r.vendorAccountId,
    vendorId: account.vendorId ?? undefined,
    coupleId: parsed.data.coupleId ?? undefined,
    leadId: parsed.data.leadId ?? undefined,
    recipientEmail: parsed.data.recipientEmail,
    recipientName: parsed.data.recipientName ?? "",
    subject: parsed.data.subject ?? "",
    message: parsed.data.message ?? "",
    services,
    vatRate: vatRate ?? 21,
    validityDays: parsed.data.validityDays ?? 30,
    amountHt,
    amountTtc,
    status: "draft",
  }).returning();
  res.status(201).json(row);
});

router.patch("/vendor/quotes/:id", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  const [quote] = await db.select().from(vendorQuotesTable)
    .where(and(eq(vendorQuotesTable.id, id), eq(vendorQuotesTable.vendorAccountId, r.vendorAccountId)))
    .limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  if (quote.status !== "draft") { res.status(409).json({ error: "Only draft quotes can be edited" }); return; }
  const parsed = quoteCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid", issues: parsed.error.issues }); return; }
  const services = parsed.data.services ?? quote.services;
  const vatRate = parsed.data.vatRate ?? quote.vatRate;
  const { amountHt, amountTtc } = computeAmounts(services, vatRate);
  const [updated] = await db.update(vendorQuotesTable).set({
    ...parsed.data,
    services,
    vatRate,
    amountHt,
    amountTtc,
    updatedAt: new Date(),
  }).where(eq(vendorQuotesTable.id, id)).returning();
  res.json(updated);
});

router.post("/vendor/quotes/:id/send", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, r.vendorAccountId)).limit(1);
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  const [quote] = await db.select().from(vendorQuotesTable)
    .where(and(eq(vendorQuotesTable.id, id), eq(vendorQuotesTable.vendorAccountId, r.vendorAccountId)))
    .limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  if (quote.status !== "draft") { res.status(409).json({ error: "Quote already sent" }); return; }
  const [updated] = await db.update(vendorQuotesTable).set({
    status: "sent",
    sentAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(vendorQuotesTable.id, id)).returning();
  void notifyQuoteReceived({
    to: quote.recipientEmail,
    recipientName: quote.recipientName,
    vendorName: account.businessName || "Mariage Afro",
    subject: quote.subject,
    message: quote.message,
    amountTtc: quote.amountTtc,
    validityDays: quote.validityDays,
    quoteId: id,
  }, req.log).catch((err) => req.log?.error?.({ err }, "Failed to send quote email"));
  res.json(updated);
});

router.delete("/vendor/quotes/:id", async (req, res) => {
  const r = req as unknown as AuthedVendorRequest;
  const id = Number(req.params.id);
  const [quote] = await db.select().from(vendorQuotesTable)
    .where(and(eq(vendorQuotesTable.id, id), eq(vendorQuotesTable.vendorAccountId, r.vendorAccountId)))
    .limit(1);
  if (!quote) { res.status(404).json({ error: "Quote not found" }); return; }
  if (quote.status === "sent") { res.status(409).json({ error: "Cannot delete a sent quote" }); return; }
  await db.delete(vendorQuotesTable).where(eq(vendorQuotesTable.id, id));
  res.json({ success: true });
});

export default router;
