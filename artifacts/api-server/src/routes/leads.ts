import { Router } from "express";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db, leadsTable, vendorRequestsTable, venueRequestsTable, partnerApplicationsTable, vendorAccountsTable, marketplaceVendorsTable } from "@workspace/db";
import {
  sendLeadEmails,
  sendVendorRequestEmails,
  sendVenueRequestEmails,
  sendPartnerApplicationEmails,
  notifyVendorNewLead,
  notifyBudgetResult,
  notifyQuizResult,
  notifyLeadMagnet,
  notifyMultiDevisConfirmation,
  appUrl,
} from "../lib/email";

const router = Router();

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  guestCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int().nonnegative().nullable(),
  ),
  budget: z.string().optional().nullable(),
  weddingType: z.string().optional().nullable(),
  services: z.array(z.string()).optional().default([]),
  message: z.string().optional().nullable(),
});

const serviceRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  services: z.array(z.string()).min(1),
  message: z.string().optional().nullable(),
});

const vendorRequestSchema = z.object({
  vendorId: z.string().optional().nullable(),
  vendorName: z.string().min(1),
  requestType: z.enum(["quote", "availability", "booking", "zoom", "rdv"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

const venueRequestSchema = z.object({
  venueName: z.string().min(1),
  requestType: z.enum(["visit", "quote"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  guestCount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().int().nonnegative().nullable(),
  ),
  message: z.string().optional().nullable(),
});

const partnerApplicationSchema = z.object({
  businessName: z.string().min(1),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  category: z.string().min(1),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

router.post("/lead", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(leadsTable).values({
      category: "general",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      guestCount: data.guestCount ?? null,
      budget: data.budget ?? null,
      weddingType: data.weddingType ?? null,
      services: data.services ?? [],
      message: data.message ?? null,
    }).returning();
    void sendLeadEmails({ category: "general", ...data }, req.log).catch((err) => {
      req.log.error({ err }, "Lead saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert lead");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/service-request", async (req, res) => {
  const parsed = serviceRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(leadsTable).values({
      category: "service-request",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      services: data.services,
      message: data.message ?? null,
    }).returning();
    void sendLeadEmails({ category: "service-request", ...data }, req.log).catch((err) => {
      req.log.error({ err }, "Service request saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert service request");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/vendor-request", async (req, res) => {
  const parsed = vendorRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(vendorRequestsTable).values({
      vendorId: data.vendorId ?? null,
      vendorName: data.vendorName,
      requestType: data.requestType,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      message: data.message ?? null,
    }).returning();
    void sendVendorRequestEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Vendor request saved but email failed");
    });
    // Notify the vendor directly if they have a vendor_account linked to this marketplace vendor
    if (data.vendorId) {
      const vendorIdNum = Number(data.vendorId);
      if (Number.isFinite(vendorIdNum)) {
        (async () => {
          const [account] = await db
            .select({ email: vendorAccountsTable.email, locale: vendorAccountsTable.locale })
            .from(vendorAccountsTable)
            .where(eq(vendorAccountsTable.vendorId, vendorIdNum))
            .limit(1);
          if (account?.email) {
            await notifyVendorNewLead({
              to: account.email,
              locale: account.locale,
              vendorName: data.vendorName,
              contactName: data.name,
              contactEmail: data.email,
              contactPhone: data.phone,
              requestType: data.requestType,
              weddingDate: data.weddingDate,
              message: data.message,
            }, req.log);
          }
        })().catch((err) => {
          req.log.error({ err }, "Failed to notify vendor of new lead");
        });
      }
    }
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert vendor request");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/venue-request", async (req, res) => {
  const parsed = venueRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(venueRequestsTable).values({
      venueName: data.venueName,
      requestType: data.requestType,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      guestCount: data.guestCount ?? null,
      message: data.message ?? null,
    }).returning();
    void sendVenueRequestEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Venue request saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert venue request");
    res.status(500).json({ error: "Internal error" });
  }
});

// =====================================================================
// LOT 6 — Conversion tools & lead magnets
// =====================================================================

const budgetCalcSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  inputs: z.object({
    guestCount: z.number().int().positive(),
    region: z.string(),
    standing: z.enum(["essentiel", "premium", "luxe"]),
    services: z.array(z.string()).default([]),
    weddingMonth: z.string().optional().nullable(),
  }),
  result: z.object({
    totalMin: z.number().nonnegative(),
    totalMax: z.number().nonnegative(),
    breakdown: z.array(z.object({
      label: z.string(),
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    })),
  }),
});

router.post("/leads/budget-calculator", async (req, res) => {
  const parsed = budgetCalcSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(leadsTable).values({
      category: "budget_calc",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      guestCount: data.inputs.guestCount,
      services: data.inputs.services,
      payload: { inputs: data.inputs, result: data.result, locale: data.locale ?? "fr" },
    }).returning();
    void notifyBudgetResult({
      to: data.email,
      locale: data.locale,
      name: data.name,
      totalMin: data.result.totalMin,
      totalMax: data.result.totalMax,
      breakdown: data.result.breakdown,
      guestCount: data.inputs.guestCount,
      region: data.inputs.region,
      standing: data.inputs.standing,
    }, req.log).catch((err) => req.log.error({ err }, "Budget result email failed"));
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert budget calc lead");
    res.status(500).json({ error: "Internal error" });
  }
});

const quizSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  answers: z.record(z.string(), z.string()),
  profile: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    recommendedTags: z.array(z.string()).optional().default([]),
  }),
});

router.post("/leads/quiz", async (req, res) => {
  const parsed = quizSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    // Fetch up to 3 recommended vendors based on profile tags (lightweight scoring).
    let recommendedVendors: Array<{ id: number; name: string; category: string }> = [];
    const tags = data.profile.recommendedTags ?? [];
    if (tags.length > 0) {
      const all = await db
        .select({
          id: marketplaceVendorsTable.id,
          name: marketplaceVendorsTable.name,
          category: marketplaceVendorsTable.category,
          services: marketplaceVendorsTable.services,
          culturalStyles: marketplaceVendorsTable.culturalStyles,
          tagline: marketplaceVendorsTable.tagline,
          description: marketplaceVendorsTable.description,
          active: marketplaceVendorsTable.active,
        })
        .from(marketplaceVendorsTable)
        .where(eq(marketplaceVendorsTable.active, true));
      const lc = tags.map((t) => t.toLowerCase());
      recommendedVendors = all
        .map((v) => {
          const hay = [v.category, v.tagline, v.description, ...(v.services ?? []), ...(v.culturalStyles ?? [])]
            .filter(Boolean).join(" ").toLowerCase();
          const score = lc.reduce((s, t) => (t && hay.includes(t) ? s + 1 : s), 0);
          return { v, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ v }) => ({ id: v.id, name: v.name, category: v.category }));
    }

    const [row] = await db.insert(leadsTable).values({
      category: "quiz_result",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      payload: {
        answers: data.answers,
        profile: data.profile,
        recommendedVendors,
        locale: data.locale ?? "fr",
      },
    }).returning();
    void notifyQuizResult({
      to: data.email,
      locale: data.locale,
      name: data.name,
      profileName: data.profile.name,
      profileDescription: data.profile.description ?? null,
      recommendedVendors: recommendedVendors.map((v) => ({
        name: v.name,
        category: v.category,
        url: `${appUrl()}/partenaires/${v.id}`,
      })),
    }, req.log).catch((err) => req.log.error({ err }, "Quiz result email failed"));
    res.json({ success: true, id: row.id, recommendedVendors });
  } catch (err) {
    req.log.error({ err }, "Failed to insert quiz lead");
    res.status(500).json({ error: "Internal error" });
  }
});

const magnetSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  magnetId: z.string().default("guide-12-etapes"),
  magnetTitle: z.string().optional().nullable(),
  consent: z.boolean().refine((v) => v === true, { message: "RGPD consent required" }),
});

router.post("/leads/magnet", async (req, res) => {
  const parsed = magnetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(leadsTable).values({
      category: "lead_magnet",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      payload: { magnetId: data.magnetId, magnetTitle: data.magnetTitle ?? null, consent: true, locale: data.locale ?? "fr" },
    }).returning();
    void notifyLeadMagnet({
      to: data.email,
      locale: data.locale,
      name: data.name,
      magnetTitle: data.magnetTitle ?? null,
    }, req.log).catch((err) => req.log.error({ err }, "Lead magnet email failed"));
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert lead magnet");
    res.status(500).json({ error: "Internal error" });
  }
});

const multiDevisSchema = z.object({
  vendorIds: z.array(z.coerce.number().int().positive()).min(1).max(5),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
});

router.post("/leads/multi-devis", async (req, res) => {
  const parsed = multiDevisSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  // Dedupe & cap at 5
  const ids = Array.from(new Set(data.vendorIds)).slice(0, 5);
  try {
    // Resolve vendor names
    const vendors = await db
      .select({ id: marketplaceVendorsTable.id, name: marketplaceVendorsTable.name })
      .from(marketplaceVendorsTable)
      .where(inArray(marketplaceVendorsTable.id, ids));
    if (vendors.length === 0) {
      res.status(400).json({ error: "No valid vendors" });
      return;
    }
    // Insert one vendor_request per vendor (vendor-side tracking)
    const vendorReqRows = vendors.map((v) => ({
      vendorId: String(v.id),
      vendorName: v.name,
      requestType: "quote",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      message: data.message ?? null,
    }));
    const insertedVendorReqs = await db.insert(vendorRequestsTable).values(vendorReqRows).returning();

    // Per task spec: 1 lead créé par prestataire sélectionné.
    const leadRows = vendors.map((v) => ({
      category: "multi_devis",
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      weddingDate: data.weddingDate ?? null,
      message: data.message ?? null,
      payload: {
        vendorId: v.id,
        vendorName: v.name,
        allVendorIds: ids,
        allVendorNames: vendors.map((x) => x.name),
        locale: data.locale ?? "fr",
      },
    }));
    const insertedLeads = await db.insert(leadsTable).values(leadRows).returning();

    // Fire-and-forget vendor notifications
    void Promise.all(vendors.map(async (v: { id: number; name: string }) => {
      try {
        const [account] = await db
          .select({ email: vendorAccountsTable.email, locale: vendorAccountsTable.locale })
          .from(vendorAccountsTable)
          .where(eq(vendorAccountsTable.vendorId, v.id))
          .limit(1);
        if (account?.email) {
          await notifyVendorNewLead({
            to: account.email,
            locale: account.locale,
            vendorName: v.name,
            contactName: data.name,
            contactEmail: data.email,
            contactPhone: data.phone,
            requestType: "quote",
            weddingDate: data.weddingDate,
            message: data.message,
          }, req.log);
        }
      } catch (err) {
        req.log.error({ err, vendorId: v.id }, "Failed to notify vendor of multi-devis lead");
      }
    })).catch((err) => req.log.error({ err }, "Multi-devis vendor notifications failed"));

    // Confirmation to couple
    void notifyMultiDevisConfirmation({
      to: data.email,
      locale: data.locale,
      name: data.name,
      vendorNames: vendors.map((v) => v.name),
    }, req.log).catch((err) => req.log.error({ err }, "Multi-devis confirmation email failed"));

    res.json({
      success: true,
      count: insertedLeads.length,
      vendorRequestsCount: insertedVendorReqs.length,
      vendorNames: vendors.map((v) => v.name),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to process multi-devis");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/become-partner", async (req, res) => {
  const parsed = partnerApplicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;
  try {
    const [row] = await db.insert(partnerApplicationsTable).values({
      businessName: data.businessName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone ?? null,
      category: data.category,
      website: data.website ?? null,
      description: data.description ?? null,
    }).returning();
    void sendPartnerApplicationEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Partner application saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert partner application");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
