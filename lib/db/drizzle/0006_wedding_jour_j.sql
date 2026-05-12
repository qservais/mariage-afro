CREATE TABLE IF NOT EXISTS "wedding_jour_j" (
  "id" serial PRIMARY KEY NOT NULL,
  "wedding_website_id" integer NOT NULL,
  "menu_text" text NOT NULL DEFAULT '',
  "timeline" jsonb NOT NULL DEFAULT '[]',
  "bio_partner1" text NOT NULL DEFAULT '',
  "bio_partner2" text NOT NULL DEFAULT '',
  "drive_url" text,
  "enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wedding_jour_j_website_id_idx" ON "wedding_jour_j" USING btree ("wedding_website_id");
