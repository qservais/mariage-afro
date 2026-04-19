import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("general"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  weddingDate: text("wedding_date"),
  guestCount: integer("guest_count"),
  budget: text("budget"),
  weddingType: text("wedding_type"),
  services: jsonb("services").$type<string[]>().default([]),
  message: text("message"),
  status: text("status").notNull().default("new"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vendorRequestsTable = pgTable("vendor_requests", {
  id: serial("id").primaryKey(),
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name").notNull(),
  requestType: text("request_type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  weddingDate: text("wedding_date"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const venueRequestsTable = pgTable("venue_requests", {
  id: serial("id").primaryKey(),
  venueName: text("venue_name").notNull(),
  requestType: text("request_type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  weddingDate: text("wedding_date"),
  guestCount: integer("guest_count"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerApplicationsTable = pgTable("partner_applications", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  category: text("category").notNull(),
  website: text("website"),
  description: text("description"),
  status: text("status").notNull().default("new"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true, createdAt: true, status: true, internalNote: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;

export const insertVendorRequestSchema = createInsertSchema(vendorRequestsTable).omit({
  id: true, createdAt: true, status: true, internalNote: true,
});
export type InsertVendorRequest = z.infer<typeof insertVendorRequestSchema>;
export type VendorRequest = typeof vendorRequestsTable.$inferSelect;

export const insertVenueRequestSchema = createInsertSchema(venueRequestsTable).omit({
  id: true, createdAt: true, status: true, internalNote: true,
});
export type InsertVenueRequest = z.infer<typeof insertVenueRequestSchema>;
export type VenueRequest = typeof venueRequestsTable.$inferSelect;

export const insertPartnerApplicationSchema = createInsertSchema(partnerApplicationsTable).omit({
  id: true, createdAt: true, status: true, internalNote: true,
});
export type InsertPartnerApplication = z.infer<typeof insertPartnerApplicationSchema>;
export type PartnerApplication = typeof partnerApplicationsTable.$inferSelect;
