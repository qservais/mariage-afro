import { Router } from "express";
import { z } from "zod";
import { db, leadsTable, vendorRequestsTable, venueRequestsTable, partnerApplicationsTable } from "@workspace/db";
import {
  sendLeadEmails,
  sendVendorRequestEmails,
  sendVenueRequestEmails,
  sendPartnerApplicationEmails,
} from "../lib/email";

const router = Router();

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  weddingDate: z.string().optional().nullable(),
  guestCount: z.coerce.number().int().nonnegative().optional().nullable(),
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
  guestCount: z.coerce.number().int().nonnegative().optional().nullable(),
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
    await sendLeadEmails({ category: "general", ...data }, req.log).catch((err) => {
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
    await sendLeadEmails({ category: "service-request", ...data }, req.log).catch((err) => {
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
    await sendVendorRequestEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Vendor request saved but email failed");
    });
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
    await sendVenueRequestEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Venue request saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert venue request");
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
    await sendPartnerApplicationEmails(data, req.log).catch((err) => {
      req.log.error({ err }, "Partner application saved but email failed");
    });
    res.json({ success: true, id: row.id });
  } catch (err) {
    req.log.error({ err }, "Failed to insert partner application");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
