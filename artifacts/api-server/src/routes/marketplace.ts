import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  marketplaceVendorsTable,
  marketplaceVenuesTable,
  realisationsTable,
  clientVendorsTable,
  couplesTable,
  vendorAvailabilityTable,
  vendorLeadsTable,
  vendorRequestsTable,
  vendorAccountsTable,
  vendorReviewsTable,
  vendorSubscriptionsTable,
  vendorViewsTable,
} from "@workspace/db";
import crypto from "node:crypto";
import { eq, and, asc, desc, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { notifyAdminNewLead, notifyVendorNewLead } from "../lib/email";

const router = Router();

// ---------- Helpers : filtres marketplace ----------

function parseList(q: unknown): string[] {
  if (typeof q !== "string" || !q.trim()) return [];
  return q.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseIntList(q: unknown): number[] {
  return parseList(q)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));
}

function buildVendorFilters(req: Request) {
  const conds = [eq(marketplaceVendorsTable.active, true)];
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length >= 1) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    conds.push(
      or(
        ilike(marketplaceVendorsTable.name, like),
        ilike(marketplaceVendorsTable.tagline, like),
        ilike(marketplaceVendorsTable.city, like),
      )!,
    );
  }
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  if (category) conds.push(eq(marketplaceVendorsTable.category, category));
  const regions = parseList(req.query.region);
  if (regions.length > 0) conds.push(inArray(marketplaceVendorsTable.region, regions));
  const tiers = parseIntList(req.query.priceTier);
  if (tiers.length > 0) conds.push(inArray(marketplaceVendorsTable.priceTier, tiers));
  const styles = parseList(req.query.culturalStyle);
  for (const s of styles) {
    conds.push(sql`${marketplaceVendorsTable.culturalStyles} @> ${JSON.stringify([s])}::jsonb`);
  }
  const langs = parseList(req.query.spokenLanguage);
  for (const l of langs) {
    conds.push(sql`${marketplaceVendorsTable.spokenLanguages} @> ${JSON.stringify([l])}::jsonb`);
  }
  if (req.query.hasGeo === "1" || req.query.hasGeo === "true") {
    conds.push(sql`${marketplaceVendorsTable.latitude} IS NOT NULL AND ${marketplaceVendorsTable.longitude} IS NOT NULL`);
  }
  return conds;
}

function buildVenueFilters(req: Request) {
  const conds = [eq(marketplaceVenuesTable.active, true)];
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length >= 1) {
    const like = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    conds.push(
      or(
        ilike(marketplaceVenuesTable.name, like),
        ilike(marketplaceVenuesTable.city, like),
        ilike(marketplaceVenuesTable.style, like),
      )!,
    );
  }
  const regions = parseList(req.query.region);
  if (regions.length > 0) conds.push(inArray(marketplaceVenuesTable.region, regions));
  const tiers = parseIntList(req.query.priceTier);
  if (tiers.length > 0) conds.push(inArray(marketplaceVenuesTable.priceTier, tiers));
  const styles = parseList(req.query.culturalStyle);
  for (const s of styles) {
    conds.push(sql`${marketplaceVenuesTable.culturalStyles} @> ${JSON.stringify([s])}::jsonb`);
  }
  const langs = parseList(req.query.spokenLanguage);
  for (const l of langs) {
    conds.push(sql`${marketplaceVenuesTable.spokenLanguages} @> ${JSON.stringify([l])}::jsonb`);
  }
  const capacityMin = Number(req.query.capacityMin);
  if (Number.isFinite(capacityMin) && capacityMin > 0) {
    conds.push(
      or(
        gte(marketplaceVenuesTable.capacityMax, capacityMin),
        // fallback : si capacityMax pas renseignée, on garde aussi (NULL)
        sql`${marketplaceVenuesTable.capacityMax} IS NULL`,
      )!,
    );
  }
  if (req.query.hasGeo === "1" || req.query.hasGeo === "true") {
    conds.push(sql`${marketplaceVenuesTable.latitude} IS NOT NULL AND ${marketplaceVenuesTable.longitude} IS NOT NULL`);
  }
  return conds;
}

async function aggregateForVendors(vendorIds: number[]): Promise<Map<number, { count: number; average: number }>> {
  const map = new Map<number, { count: number; average: number }>();
  if (vendorIds.length === 0) return map;
  const rows = await db
    .select({
      vendorId: vendorReviewsTable.vendorId,
      count: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(${vendorReviewsTable.rating}), 0)::float`,
    })
    .from(vendorReviewsTable)
    .where(and(eq(vendorReviewsTable.status, "published"), inArray(vendorReviewsTable.vendorId, vendorIds)))
    .groupBy(vendorReviewsTable.vendorId);
  for (const r of rows) {
    map.set(r.vendorId, { count: r.count, average: Math.round(r.avg * 10) / 10 });
  }
  return map;
}

// ---------- Marketplace : vendors ----------

function tierWeight(tier?: string | null): number {
  if (tier === "featured") return 3;
  if (tier === "premium") return 2;
  return 1;
}

async function tierByVendorId(vendorIds: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (vendorIds.length === 0) return map;
  const rows = await db
    .select({ vendorId: vendorSubscriptionsTable.vendorId, tier: vendorSubscriptionsTable.tier, status: vendorSubscriptionsTable.status })
    .from(vendorSubscriptionsTable)
    .where(and(inArray(vendorSubscriptionsTable.vendorId, vendorIds), eq(vendorSubscriptionsTable.status, "active")));
  for (const r of rows) if (r.vendorId != null) map.set(r.vendorId, r.tier);
  return map;
}

router.get("/marketplace/vendors", async (req: Request, res: Response) => {
  const conds = buildVendorFilters(req);
  const vendors = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(and(...conds))
    .orderBy(asc(marketplaceVendorsTable.name));
  const aggregates = await aggregateForVendors(vendors.map((v) => v.id));
  const tiers = await tierByVendorId(vendors.map((v) => v.id));
  const sorted = [...vendors].sort((a, b) => {
    const wa = tierWeight(tiers.get(a.id));
    const wb = tierWeight(tiers.get(b.id));
    if (wa !== wb) return wb - wa;
    return a.name.localeCompare(b.name);
  });
  res.json(
    sorted.map((v) => ({
      ...v,
      tier: tiers.get(v.id) ?? "basic",
      reviewCount: aggregates.get(v.id)?.count ?? 0,
      averageRating: aggregates.get(v.id)?.average ?? 0,
    })),
  );
});

const VIEW_SOURCES = ["detail", "listing", "comparator"] as const;
const trackViewSchema = z.object({
  source: z.enum(VIEW_SOURCES).optional(),
  referrer: z.string().max(500).optional().nullable(),
});

router.post("/marketplace/vendors/:id/track-view", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = trackViewSchema.safeParse(req.body ?? {});
  const source = parsed.success ? (parsed.data.source ?? "detail") : "detail";
  const referrer = parsed.success ? (parsed.data.referrer ?? null) : null;

  // Best-effort vendor existence check (avoid orphan rows)
  const [vendor] = await db
    .select({ id: marketplaceVendorsTable.id })
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, id));
  if (!vendor) { res.status(204).end(); return; }

  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "0.0.0.0";
  const ua = req.headers["user-agent"] || "";
  const day = new Date().toISOString().slice(0, 10);
  const sessionHash = crypto.createHash("sha256").update(`${ip}|${ua}|${day}`).digest("hex").slice(0, 32);

  // Dedupe per session+vendor+day to avoid inflating with refreshes
  const todayStart = new Date(); todayStart.setUTCHours(0, 0, 0, 0);
  const [existing] = await db
    .select({ id: vendorViewsTable.id })
    .from(vendorViewsTable)
    .where(and(
      eq(vendorViewsTable.vendorId, id),
      eq(vendorViewsTable.sessionHash, sessionHash),
      gte(vendorViewsTable.viewedAt, todayStart),
    ))
    .limit(1);
  if (!existing) {
    await db.insert(vendorViewsTable).values({ vendorId: id, source, sessionHash, referrer });
  }
  res.status(204).end();
});

router.get("/marketplace/vendors-by-tags", async (req: Request, res: Response) => {
  const tagsParam = String(req.query.tags ?? "").trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 3, 1), 10);
  if (!tagsParam) { res.json([]); return; }
  const tags = tagsParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tags.length === 0) { res.json([]); return; }
  const all = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.active, true));
  const scored = all
    .map((v) => {
      const haystack = [
        v.category,
        ...(v.services ?? []),
        ...(v.culturalStyles ?? []),
        v.tagline,
        v.description,
        v.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      let score = 0;
      for (const t of tags) if (t && haystack.includes(t)) score += 1;
      return { v, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ v }) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      city: v.city,
      tagline: v.tagline,
      coverImage: v.coverImage,
    }));
  res.json(scored);
});

router.get("/marketplace/vendors/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(and(eq(marketplaceVendorsTable.id, id), eq(marketplaceVendorsTable.active, true)));
  if (!vendor) { res.status(404).json({ error: "Not found" }); return; }
  const aggregates = await aggregateForVendors([id]);
  const recent = await db
    .select({
      id: vendorReviewsTable.id,
      rating: vendorReviewsTable.rating,
      title: vendorReviewsTable.title,
      comment: vendorReviewsTable.comment,
      createdAt: vendorReviewsTable.createdAt,
      authorName: sql<string>`COALESCE(NULLIF(${couplesTable.partner1Name}, ''), 'Couple anonyme')`,
    })
    .from(vendorReviewsTable)
    .leftJoin(couplesTable, eq(vendorReviewsTable.coupleId, couplesTable.id))
    .where(and(eq(vendorReviewsTable.vendorId, id), eq(vendorReviewsTable.status, "published")))
    .orderBy(desc(vendorReviewsTable.createdAt))
    .limit(10);
  res.json({
    ...vendor,
    reviewCount: aggregates.get(id)?.count ?? 0,
    averageRating: aggregates.get(id)?.average ?? 0,
    reviews: recent,
  });
});

router.get("/marketplace/vendors/:id/reviews", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
    .select({
      id: vendorReviewsTable.id,
      rating: vendorReviewsTable.rating,
      title: vendorReviewsTable.title,
      comment: vendorReviewsTable.comment,
      createdAt: vendorReviewsTable.createdAt,
      authorName: sql<string>`COALESCE(NULLIF(${couplesTable.partner1Name}, ''), 'Couple anonyme')`,
    })
    .from(vendorReviewsTable)
    .leftJoin(couplesTable, eq(vendorReviewsTable.coupleId, couplesTable.id))
    .where(and(eq(vendorReviewsTable.vendorId, id), eq(vendorReviewsTable.status, "published")))
    .orderBy(desc(vendorReviewsTable.createdAt));
  res.json(rows);
});

router.post("/marketplace/vendors/:id/add-to-project", async (req: Request, res: Response) => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const vendorId = Number(req.params.id);
  if (isNaN(vendorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(and(eq(marketplaceVendorsTable.id, vendorId), eq(marketplaceVendorsTable.active, true)));
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }

  const [couple] = await db
    .select()
    .from(couplesTable)
    .where(eq(couplesTable.userId, auth.userId));
  if (!couple) { res.status(404).json({ error: "Couple profile not found" }); return; }

  const [row] = await db
    .insert(clientVendorsTable)
    .values({
      coupleId: couple.id,
      category: vendor.category,
      name: vendor.name,
      contactEmail: vendor.email ?? undefined,
      contactPhone: vendor.phone ?? undefined,
      status: "contacted",
    })
    .returning();
  res.status(201).json(row);
});

// ---------- Marketplace : venues ----------

router.get("/marketplace/venues", async (req: Request, res: Response) => {
  const conds = buildVenueFilters(req);
  const venues = await db
    .select()
    .from(marketplaceVenuesTable)
    .where(and(...conds))
    .orderBy(asc(marketplaceVenuesTable.name));
  res.json(venues);
});

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

router.get("/marketplace/vendors/:id/availability", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(and(eq(marketplaceVendorsTable.id, id), eq(marketplaceVendorsTable.active, true)));
  if (!vendor) { res.status(404).json({ error: "Not found" }); return; }

  const from = typeof req.query.from === "string" && dateRegex.test(req.query.from)
    ? req.query.from : null;
  const to = typeof req.query.to === "string" && dateRegex.test(req.query.to)
    ? req.query.to : null;

  const conditions = [eq(vendorAvailabilityTable.vendorId, id)];
  if (from) conditions.push(gte(vendorAvailabilityTable.date, from));
  if (to) conditions.push(lte(vendorAvailabilityTable.date, to));

  const rows = await db
    .select({
      date: vendorAvailabilityTable.date,
      status: vendorAvailabilityTable.status,
    })
    .from(vendorAvailabilityTable)
    .where(and(...conditions));
  res.json(rows);
});

router.get("/marketplace/realisations", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(realisationsTable)
    .where(eq(realisationsTable.active, true))
    .orderBy(asc(realisationsTable.createdAt));
  res.json(rows);
});

const leadSchema = z.object({
  requestType: z.enum(["quote", "availability", "booking", "zoom", "rdv"]),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  weddingDate: z.string().max(40).optional().nullable(),
  message: z.string().max(4000).optional().nullable(),
});

async function createVendorLead(
  vendorId: number,
  data: z.infer<typeof leadSchema>,
  log: Request["log"],
) {
  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, vendorId));
  if (!vendor) return null;

  const [vendorAccount] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.vendorId, vendorId))
    .limit(1);

  const result = await db.transaction(async (tx) => {
    const [vendorLead] = await tx
      .insert(vendorLeadsTable)
      .values({
        vendorId,
        vendorAccountId: vendorAccount?.id ?? null,
        requestType: data.requestType,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        weddingDate: data.weddingDate ?? null,
        message: data.message ?? null,
      })
      .returning();

    const [vendorRequest] = await tx
      .insert(vendorRequestsTable)
      .values({
        vendorId: String(vendorId),
        vendorName: vendor.name,
        requestType: data.requestType,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        weddingDate: data.weddingDate ?? null,
        message: data.message ?? null,
      })
      .returning();

    return { vendorLead, vendorRequest, vendor, vendorAccount };
  });

  void notifyAdminNewLead({
    source: "vendor-request",
    name: data.name,
    email: data.email,
    phone: data.phone,
    weddingDate: data.weddingDate,
    message: data.message ? `[${data.requestType}] ${data.message}` : `[${data.requestType}]`,
    vendorName: result.vendor.name,
  }, log).catch((err) => log?.error?.({ err }, "Failed to notify admin of vendor lead"));

  if (result.vendorAccount?.email) {
    void notifyVendorNewLead({
      to: result.vendorAccount.email,
      locale: result.vendorAccount.locale,
      vendorName: result.vendor.name,
      contactName: data.name,
      contactEmail: data.email,
      contactPhone: data.phone,
      requestType: data.requestType,
      weddingDate: data.weddingDate,
      message: data.message,
    }, log).catch((err) => log?.error?.({ err }, "Failed to notify vendor of new lead"));
  }

  return result;
}

router.post("/marketplace/vendors/:id/lead", async (req: Request, res: Response) => {
  const vendorId = Number(req.params.id);
  if (isNaN(vendorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  try {
    const result = await createVendorLead(vendorId, parsed.data, req.log);
    if (!result) { res.status(404).json({ error: "Vendor not found" }); return; }
    res.status(201).json({
      success: true,
      vendorLeadId: result.vendorLead.id,
      vendorRequestId: result.vendorRequest.id,
      routedToVendor: !!result.vendorAccount,
    });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to create vendor lead");
    res.status(500).json({ error: "Internal error" });
  }
});

// ---------- Comparator : 1-3 leads en une fois ----------
const comparatorSchema = z.object({
  vendorIds: z.array(z.number().int().positive()).min(1).max(3),
  contact: leadSchema,
});

router.post("/marketplace/comparator/leads", async (req: Request, res: Response) => {
  const parsed = comparatorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const { vendorIds, contact } = parsed.data;
  const created: Array<{ vendorId: number; vendorLeadId: number }> = [];
  const failed: Array<{ vendorId: number; reason: string }> = [];
  for (const vendorId of vendorIds) {
    try {
      const result = await createVendorLead(vendorId, contact, req.log);
      if (!result) {
        failed.push({ vendorId, reason: "not_found" });
        continue;
      }
      created.push({ vendorId, vendorLeadId: result.vendorLead.id });
    } catch (err) {
      req.log?.error?.({ err, vendorId }, "Failed to create comparator lead");
      failed.push({ vendorId, reason: "error" });
    }
  }
  res.status(created.length > 0 ? 201 : 500).json({ created, failed });
});

export default router;
