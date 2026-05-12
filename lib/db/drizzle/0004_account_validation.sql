ALTER TABLE "couples" ADD COLUMN IF NOT EXISTS "validated_at" timestamp with time zone;
ALTER TABLE "couples" ADD COLUMN IF NOT EXISTS "validated_by" text;
ALTER TABLE "vendor_accounts" ADD COLUMN IF NOT EXISTS "validated_at" timestamp with time zone;
ALTER TABLE "vendor_accounts" ADD COLUMN IF NOT EXISTS "validated_by" text;
