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
} from "@workspace/db";
import { eq, and, asc, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/marketplace/vendors", async (_req: Request, res: Response) => {
  const vendors = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.active, true))
    .orderBy(asc(marketplaceVendorsTable.name));
  res.json(vendors);
});

router.get("/marketplace/vendors/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(and(eq(marketplaceVendorsTable.id, id), eq(marketplaceVendorsTable.active, true)));
  if (!vendor) { res.status(404).json({ error: "Not found" }); return; }
  res.json(vendor);
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

router.get("/marketplace/venues", async (_req: Request, res: Response) => {
  const venues = await db
    .select()
    .from(marketplaceVenuesTable)
    .where(eq(marketplaceVenuesTable.active, true))
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

router.post("/marketplace/vendors/:id/lead", async (req: Request, res: Response) => {
  const vendorId = Number(req.params.id);
  if (isNaN(vendorId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    return;
  }
  const data = parsed.data;

  const [vendor] = await db
    .select()
    .from(marketplaceVendorsTable)
    .where(eq(marketplaceVendorsTable.id, vendorId));
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }

  const [vendorAccount] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.vendorId, vendorId))
    .limit(1);

  try {
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

      return { vendorLead, vendorRequest };
    });

    res.status(201).json({
      success: true,
      vendorLeadId: result.vendorLead.id,
      vendorRequestId: result.vendorRequest.id,
      routedToVendor: !!vendorAccount,
    });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to create vendor lead");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
