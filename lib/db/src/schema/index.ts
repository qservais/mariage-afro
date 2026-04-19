import { pgTable, text, serial, timestamp, integer, jsonb, uniqueIndex, boolean } from "drizzle-orm/pg-core";
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

export const couplesTable = pgTable("couples", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  partner1Name: text("partner1_name").notNull().default(""),
  partner2Name: text("partner2_name").notNull().default(""),
  weddingDate: text("wedding_date"),
  ceremonyCity: text("ceremony_city"),
  ceremonyVenue: text("ceremony_venue"),
  guestEstimate: integer("guest_estimate"),
  budget: integer("budget"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdIdx: uniqueIndex("couples_user_id_idx").on(t.userId),
}));

export const budgetItemsTable = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  category: text("category").notNull(),
  vendor: text("vendor"),
  planned: integer("planned_cents").notNull().default(0),
  actual: integer("actual_cents").notNull().default(0),
  paid: boolean("paid").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  side: text("side").notNull().default("partner1"),
  table: text("table_name"),
  rsvp: text("rsvp").notNull().default("pending"),
  diet: text("diet"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const planningTasksTable = pgTable("planning_tasks", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date"),
  assignee: text("assignee"),
  done: boolean("done").notNull().default(false),
  category: text("category").notNull().default("preparation"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientVendorsTable = pgTable("client_vendors", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  amount: integer("amount_cents").notNull().default(0),
  status: text("status").notNull().default("contacted"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clientDocumentsTable = pgTable("client_documents", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  fileType: text("file_type"),
  size: integer("size_bytes").notNull().default(0),
  category: text("category").notNull().default("misc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jourJEventsTable = pgTable("jour_j_events", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  time: text("time").notNull(),
  title: text("title").notNull(),
  responsible: text("responsible"),
  done: boolean("done").notNull().default(false),
  notes: text("notes"),
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

export type Couple = typeof couplesTable.$inferSelect;
export type BudgetItem = typeof budgetItemsTable.$inferSelect;
export type Guest = typeof guestsTable.$inferSelect;
export type PlanningTask = typeof planningTasksTable.$inferSelect;
export type ClientVendor = typeof clientVendorsTable.$inferSelect;
export type ClientDocument = typeof clientDocumentsTable.$inferSelect;
export type JourJEvent = typeof jourJEventsTable.$inferSelect;
