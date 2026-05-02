CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"category" text NOT NULL,
	"vendor" text,
	"planned_cents" integer DEFAULT 0 NOT NULL,
	"actual_cents" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"file_type" text,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'misc' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'contacted' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"vendor_id" integer,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "couples" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"partner1_name" text DEFAULT '' NOT NULL,
	"partner2_name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"wedding_date" text,
	"ceremony_city" text,
	"ceremony_venue" text,
	"guest_estimate" integer,
	"budget" integer,
	"status" text DEFAULT 'planning' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_tables" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"name" text NOT NULL,
	"shape" text DEFAULT 'round' NOT NULL,
	"capacity" integer DEFAULT 8 NOT NULL,
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"side" text DEFAULT 'partner1' NOT NULL,
	"table_name" text,
	"table_id" integer,
	"rsvp" text DEFAULT 'pending' NOT NULL,
	"diet" text,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jour_j_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"time" text NOT NULL,
	"title" text NOT NULL,
	"responsible" text,
	"done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"wedding_date" text,
	"guest_count" integer,
	"budget" text,
	"wedding_type" text,
	"services" jsonb DEFAULT '[]'::jsonb,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"city" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"services" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"website" text,
	"phone" text,
	"email" text,
	"latitude" text,
	"longitude" text,
	"region" text,
	"price_tier" integer,
	"cultural_styles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spoken_languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity_min" integer,
	"capacity_max" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"capacity" text DEFAULT '' NOT NULL,
	"style" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image" text,
	"active" boolean DEFAULT true NOT NULL,
	"latitude" text,
	"longitude" text,
	"region" text,
	"price_tier" integer,
	"cultural_styles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spoken_languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity_min" integer,
	"capacity_max" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"conversation_id" integer,
	"author_role" text DEFAULT 'couple' NOT NULL,
	"vendor_author_id" integer,
	"content" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"category" text NOT NULL,
	"website" text,
	"description" text,
	"status" text DEFAULT 'new' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planning_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"title" text NOT NULL,
	"due_date" text,
	"assignee" text,
	"done" boolean DEFAULT false NOT NULL,
	"category" text DEFAULT 'preparation' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "realisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"bride_name" text NOT NULL,
	"groom_name" text NOT NULL,
	"wedding_type" text DEFAULT '' NOT NULL,
	"venue_name" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"wedding_date" text,
	"description" text DEFAULT '' NOT NULL,
	"cover_image" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"vendor_id" integer,
	"business_name" text DEFAULT '' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text,
	"category" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"website" text,
	"description" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" text DEFAULT 'blocked' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"vendor_account_id" integer,
	"request_type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"wedding_date" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"internal_note" text,
	"seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" text,
	"vendor_name" text NOT NULL,
	"request_type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"wedding_date" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"couple_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_name" text NOT NULL,
	"request_type" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"wedding_date" text,
	"guest_count" integer,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"wedding_website_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"attending" boolean DEFAULT true NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wedding_websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"couple_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text DEFAULT 'Notre Mariage' NOT NULL,
	"welcome_message" text DEFAULT '' NOT NULL,
	"wedding_date" text,
	"venue" text,
	"city" text,
	"programme" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_image" text,
	"active" boolean DEFAULT false NOT NULL,
	"rsvp_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_couple_vendor_idx" ON "conversations" USING btree ("couple_id","vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "couples_user_id_idx" ON "couples" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_accounts_user_id_idx" ON "vendor_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_availability_vendor_date_idx" ON "vendor_availability" USING btree ("vendor_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_reviews_vendor_couple_idx" ON "vendor_reviews" USING btree ("vendor_id","couple_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_websites_couple_id_idx" ON "wedding_websites" USING btree ("couple_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wedding_websites_slug_idx" ON "wedding_websites" USING btree ("slug");