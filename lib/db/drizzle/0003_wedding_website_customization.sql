ALTER TABLE "wedding_websites" ADD COLUMN IF NOT EXISTS "template" text NOT NULL DEFAULT 'royal-afro';
ALTER TABLE "wedding_websites" ADD COLUMN IF NOT EXISTS "color_primary" text;
ALTER TABLE "wedding_websites" ADD COLUMN IF NOT EXISTS "color_background" text;
ALTER TABLE "wedding_websites" ADD COLUMN IF NOT EXISTS "font_heading" text;
UPDATE "wedding_websites" SET "template" = 'royal-afro' WHERE "template" IS NULL;
