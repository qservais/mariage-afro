-- LOT 128: Add slug column to marketplace_vendors for SEO-friendly URLs
ALTER TABLE marketplace_vendors ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slugs for existing rows using transliteration + slugify
UPDATE marketplace_vendors
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
UPDATE marketplace_vendors v
SET slug = v.slug || '-' || v.id
WHERE EXISTS (
  SELECT 1 FROM marketplace_vendors v2
  WHERE v2.slug = v.slug AND v2.id < v.id
);

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_vendors_slug_unique ON marketplace_vendors (slug);
