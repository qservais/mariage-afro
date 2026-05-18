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
  payload: jsonb("payload").$type<Record<string, unknown>>(),
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
  email: text("email").notNull().default(""),
  locale: text("locale").notNull().default("fr"),
  weddingDate: text("wedding_date"),
  ceremonyCity: text("ceremony_city"),
  ceremonyVenue: text("ceremony_venue"),
  guestEstimate: integer("guest_estimate"),
  budget: integer("budget"),
  status: text("status").notNull().default("planning"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  validatedBy: text("validated_by"),
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
  tableId: integer("table_id"),
  rsvp: text("rsvp").notNull().default("pending"),
  diet: text("diet"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guestTablesTable = pgTable("guest_tables", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  name: text("name").notNull(),
  shape: text("shape").notNull().default("round"),
  capacity: integer("capacity").notNull().default(8),
  positionX: integer("position_x").notNull().default(0),
  positionY: integer("position_y").notNull().default(0),
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

export const marketplaceVendorsTable = pgTable("marketplace_vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  services: jsonb("services").$type<string[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  coverImage: text("cover_image"),
  verified: boolean("verified").notNull().default(false),
  active: boolean("active").notNull().default(true),
  rating: integer("rating").notNull().default(5),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  // LOT 5 — geo, filtres, comparateur
  latitude: text("latitude"),
  longitude: text("longitude"),
  region: text("region"),
  priceTier: integer("price_tier"),
  culturalStyles: jsonb("cultural_styles").$type<string[]>().notNull().default([]),
  spokenLanguages: jsonb("spoken_languages").$type<string[]>().notNull().default([]),
  capacityMin: integer("capacity_min"),
  capacityMax: integer("capacity_max"),
  // LOT 8 — Espace Pro pivot business: multilingual descriptions + media + first post
  logoUrl: text("logo_url"),
  coverPhotoUrl: text("cover_photo_url"),
  videoUrl: text("video_url"),
  descriptionFr: text("description_fr").notNull().default(""),
  descriptionNl: text("description_nl").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  indicativePrice: text("indicative_price"),
  hasFirstPost: boolean("has_first_post").notNull().default(false),
  // Invitation admin : email pré-enregistré pour auto-lier un prestataire à sa fiche
  invitedEmail: text("invited_email"),
  // LOT 128 — URL slug for SEO-friendly vendor detail pages
  slug: text("slug").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketplaceVenuesTable = pgTable("marketplace_venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  capacity: text("capacity").notNull().default(""),
  style: text("style").notNull().default(""),
  description: text("description").notNull().default(""),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  coverImage: text("cover_image"),
  active: boolean("active").notNull().default(true),
  // LOT 5 — geo, filtres
  latitude: text("latitude"),
  longitude: text("longitude"),
  region: text("region"),
  priceTier: integer("price_tier"),
  culturalStyles: jsonb("cultural_styles").$type<string[]>().notNull().default([]),
  spokenLanguages: jsonb("spoken_languages").$type<string[]>().notNull().default([]),
  capacityMin: integer("capacity_min"),
  capacityMax: integer("capacity_max"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vendorReviewsTable = pgTable("vendor_reviews", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull().default(""),
  comment: text("comment").notNull().default(""),
  status: text("status").notNull().default("pending"),
  internalNote: text("internal_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vendorCoupleIdx: uniqueIndex("vendor_reviews_vendor_couple_idx").on(t.vendorId, t.coupleId),
}));

export const realisationsTable = pgTable("realisations", {
  id: serial("id").primaryKey(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  weddingType: text("wedding_type").notNull().default(""),
  venueName: text("venue_name").notNull().default(""),
  city: text("city").notNull().default(""),
  weddingDate: text("wedding_date"),
  description: text("description").notNull().default(""),
  coverImage: text("cover_image"),
  gallery: jsonb("gallery").$type<string[]>().notNull().default([]),
  // LOT 129 — double vidéo par réalisation (portrait couple + teaser mariage)
  videoCouple: text("video_couple"),
  videoTeaser: text("video_teaser"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  vendorId: integer("vendor_id"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleVendorIdx: uniqueIndex("conversations_couple_vendor_idx").on(t.coupleId, t.vendorId),
}));

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  conversationId: integer("conversation_id"),
  authorRole: text("author_role").notNull().default("couple"),
  vendorAuthorId: integer("vendor_author_id"),
  content: text("content").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weddingWebsitesTable = pgTable("wedding_websites", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull().default("Notre Mariage"),
  welcomeMessage: text("welcome_message").notNull().default(""),
  weddingDate: text("wedding_date"),
  venue: text("venue"),
  city: text("city"),
  programme: jsonb("programme").$type<{time: string; event: string}[]>().notNull().default([]),
  coverImage: text("cover_image"),
  template: text("template").notNull().default("royal-afro"),
  colorPrimary: text("color_primary"),
  colorBackground: text("color_background"),
  fontHeading: text("font_heading"),
  active: boolean("active").notNull().default(false),
  rsvpEnabled: boolean("rsvp_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  coupleIdIdx: uniqueIndex("wedding_websites_couple_id_idx").on(t.coupleId),
  slugIdx: uniqueIndex("wedding_websites_slug_idx").on(t.slug),
}));

export const vendorAccountsTable = pgTable("vendor_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  vendorId: integer("vendor_id"),
  businessName: text("business_name").notNull().default(""),
  contactName: text("contact_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone"),
  category: text("category").notNull().default(""),
  city: text("city").notNull().default(""),
  website: text("website"),
  description: text("description").notNull().default(""),
  locale: text("locale").notNull().default("fr"),
  status: text("status").notNull().default("pending"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  validatedBy: text("validated_by"),
  // LOT 8 — Espace Pro pivot business
  customLeadTags: jsonb("custom_lead_tags").$type<string[]>().notNull().default([]),
  autoFollowupEnabled: boolean("auto_followup_enabled").notNull().default(true),
  lastFollowupRunAt: timestamp("last_followup_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdIdx: uniqueIndex("vendor_accounts_user_id_idx").on(t.userId),
}));

export const vendorAvailabilityTable = pgTable("vendor_availability", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull().default("blocked"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vendorDateIdx: uniqueIndex("vendor_availability_vendor_date_idx").on(t.vendorId, t.date),
}));

export const vendorLeadsTable = pgTable("vendor_leads", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  vendorAccountId: integer("vendor_account_id"),
  requestType: text("request_type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  weddingDate: text("wedding_date"),
  message: text("message"),
  status: text("status").notNull().default("new"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  internalNote: text("internal_note"),
  seenAt: timestamp("seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// LOT 10 — Devis formels (vendor → couple)
export const vendorQuotesTable = pgTable("vendor_quotes", {
  id: serial("id").primaryKey(),
  vendorAccountId: integer("vendor_account_id").notNull(),
  vendorId: integer("vendor_id"),
  coupleId: integer("couple_id"),
  leadId: integer("lead_id"),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull().default(""),
  services: jsonb("services").$type<Array<{ label: string; qty: number; unitPrice: number }>>().notNull().default([]),
  amountHt: integer("amount_ht").notNull().default(0),
  amountTtc: integer("amount_ttc").notNull().default(0),
  vatRate: integer("vat_rate").notNull().default(21),
  validityDays: integer("validity_days").notNull().default(30),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  respondMessage: text("respond_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// LOT 8 — Espace Pro pivot business
export const vendorSubscriptionsTable = pgTable("vendor_subscriptions", {
  id: serial("id").primaryKey(),
  vendorAccountId: integer("vendor_account_id").notNull(),
  vendorId: integer("vendor_id"),
  tier: text("tier").notNull().default("basic"), // basic | premium | featured
  status: text("status").notNull().default("requested"), // requested | active | cancelled | expired
  startedAt: timestamp("started_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  vendorAccountIdx: uniqueIndex("vendor_subscriptions_vendor_account_idx").on(t.vendorAccountId),
}));

export const vendorViewsTable = pgTable("vendor_views", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  source: text("source").notNull().default("detail"), // detail | listing | comparator
  sessionHash: text("session_hash"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weddingRsvpsTable = pgTable("wedding_rsvps", {
  id: serial("id").primaryKey(),
  weddingWebsiteId: integer("wedding_website_id").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email"),
  attending: boolean("attending").notNull().default(true),
  guestCount: integer("guest_count").notNull().default(1),
  companionFirstName: text("companion_first_name"),
  companionLastName: text("companion_last_name"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const uploadIntentsTable = pgTable("upload_intents", {
  id: serial("id").primaryKey(),
  objectPath: text("object_path").notNull(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  objectPathIdx: uniqueIndex("upload_intents_object_path_idx").on(t.objectPath),
}));

// LOT 9 — Mood board (collaborative inspiration)
export const moodBoardsTable = pgTable("mood_boards", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  title: text("title").notNull().default("Inspiration"),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moodBoardImagesTable = pgTable("mood_board_images", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull(),
  coupleId: integer("couple_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moodBoardCollaboratorsTable = pgTable("mood_board_collaborators", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("viewer"), // viewer | editor
  token: text("token").notNull(),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  tokenIdx: uniqueIndex("mood_board_collaborators_token_idx").on(t.token),
}));

// LOT 9 — RSVP customizable questions + responses
export const rsvpQuestionsTable = pgTable("rsvp_questions", {
  id: serial("id").primaryKey(),
  weddingWebsiteId: integer("wedding_website_id").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull().default("text"), // text | yesno | choice
  options: jsonb("options").$type<string[]>().notNull().default([]),
  required: boolean("required").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvpResponsesTable = pgTable("rsvp_responses", {
  id: serial("id").primaryKey(),
  rsvpId: integer("rsvp_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull().default(""),
});

// LOT 9 — Cagnottes (gift list)
export const cagnottesTable = pgTable("cagnottes", {
  id: serial("id").primaryKey(),
  coupleId: integer("couple_id").notNull(),
  weddingWebsiteId: integer("wedding_website_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  photo: text("photo"),
  iban: text("iban"),
  externalUrl: text("external_url"),
  position: integer("position").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// LOT 10 — Jour-J Public Page config
export const weddingJourJTable = pgTable("wedding_jour_j", {
  id: serial("id").primaryKey(),
  weddingWebsiteId: integer("wedding_website_id").notNull(),
  menuText: text("menu_text").notNull().default(""),
  timeline: jsonb("timeline").$type<{ time: string; label: string }[]>().notNull().default([]),
  bioPartner1: text("bio_partner1").notNull().default(""),
  bioPartner2: text("bio_partner2").notNull().default(""),
  driveUrl: text("drive_url"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  websiteIdIdx: uniqueIndex("wedding_jour_j_website_id_idx").on(t.weddingWebsiteId),
}));

export type VendorQuote = typeof vendorQuotesTable.$inferSelect;

export type MoodBoard = typeof moodBoardsTable.$inferSelect;
export type MoodBoardImage = typeof moodBoardImagesTable.$inferSelect;
export type MoodBoardCollaborator = typeof moodBoardCollaboratorsTable.$inferSelect;
export type RsvpQuestion = typeof rsvpQuestionsTable.$inferSelect;
export type RsvpResponse = typeof rsvpResponsesTable.$inferSelect;
export type Cagnotte = typeof cagnottesTable.$inferSelect;

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
export type GuestTable = typeof guestTablesTable.$inferSelect;
export type PlanningTask = typeof planningTasksTable.$inferSelect;
export type ClientVendor = typeof clientVendorsTable.$inferSelect;
export type ClientDocument = typeof clientDocumentsTable.$inferSelect;
export type JourJEvent = typeof jourJEventsTable.$inferSelect;
export type MarketplaceVendor = typeof marketplaceVendorsTable.$inferSelect;
export type MarketplaceVenue = typeof marketplaceVenuesTable.$inferSelect;
export type Realisation = typeof realisationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
export type Conversation = typeof conversationsTable.$inferSelect;
export type WeddingWebsite = typeof weddingWebsitesTable.$inferSelect;
export type WeddingRsvp = typeof weddingRsvpsTable.$inferSelect;
export type VendorAccount = typeof vendorAccountsTable.$inferSelect;
export type VendorAvailability = typeof vendorAvailabilityTable.$inferSelect;
export type VendorLead = typeof vendorLeadsTable.$inferSelect;
export type VendorReview = typeof vendorReviewsTable.$inferSelect;
export type VendorSubscription = typeof vendorSubscriptionsTable.$inferSelect;
export type VendorView = typeof vendorViewsTable.$inferSelect;
export type UploadIntent = typeof uploadIntentsTable.$inferSelect;
export type WeddingJourJ = typeof weddingJourJTable.$inferSelect;
