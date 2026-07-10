-- Lieux — galerie photos par salle: add slug column to marketplace_venues for SEO-friendly URLs
ALTER TABLE marketplace_venues ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs for existing rows using transliteration + slugify
UPDATE marketplace_venues
SET slug = lower(trim(both '-' from
  regexp_replace(
    translate(name,
      'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿ',
      'aaaaaaeceeeeiiiidnoooooouuuuyy'
    ),
    '[^a-zA-Z0-9]+', '-', 'g'
  )
))
WHERE slug IS NULL OR slug = '';

-- Make slugs unique by appending id if collision exists
-- (safe because IDs are unique and slugs derive from names)
UPDATE marketplace_venues v
SET slug = v.slug || '-' || v.id
WHERE EXISTS (
  SELECT 1 FROM marketplace_venues v2
  WHERE v2.slug = v.slug AND v2.id < v.id
);

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_venues_slug_unique ON marketplace_venues (slug);
