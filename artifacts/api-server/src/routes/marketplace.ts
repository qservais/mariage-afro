import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  marketplaceVendorsTable,
  marketplaceVenuesTable,
  realisationsTable,
  clientVendorsTable,
  couplesTable,
} from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";

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

router.get("/marketplace/realisations", async (_req: Request, res: Response) => {
  const rows = await db
    .select()
    .from(realisationsTable)
    .where(eq(realisationsTable.active, true))
    .orderBy(asc(realisationsTable.createdAt));
  res.json(rows);
});

export default router;
