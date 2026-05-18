ALTER TABLE venue_requests ADD COLUMN IF NOT EXISTS visit_slots jsonb;
--> statement-breakpoint
ALTER TABLE wedding_jour_j ADD COLUMN IF NOT EXISTS photo_album_url text;
