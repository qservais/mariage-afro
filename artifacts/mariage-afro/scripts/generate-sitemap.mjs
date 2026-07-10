// Regenerates public/sitemap.xml before every build (see package.json "build" script).
// Combines the static page list with live vendor (/partenaires/:slug) and venue
// (/lieux/:slug) URLs pulled from the database, so newly onboarded partners and
// venues are indexable without a manual sitemap edit.
//
// If DATABASE_URL is unavailable or the query fails, we log a warning and fall
// back to the static-only sitemap rather than failing the build.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "..", "public", "sitemap.xml");
const SITE_URL = "https://www.mariage-afro.com";
const LANGS = [
  { hreflang: "fr-BE", suffix: "?lang=fr" },
  { hreflang: "nl-BE", suffix: "?lang=nl" },
  { hreflang: "en-GB", suffix: "?lang=en" },
  { hreflang: "x-default", suffix: "" },
];

// Static, indexable pages only — redirect-only routes (/prestations, /about)
// are intentionally excluded per SEO best practice (a sitemap should list
// canonical URLs, not ones that 301/302 elsewhere).
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/plateforme", changefreq: "monthly", priority: "0.9" },
  { path: "/services", changefreq: "monthly", priority: "0.9" },
  { path: "/partenaires", changefreq: "weekly", priority: "0.9" },
  { path: "/lieux", changefreq: "weekly", priority: "0.8" },
  { path: "/realisations", changefreq: "weekly", priority: "0.8" },
  { path: "/comparateur", changefreq: "monthly", priority: "0.7" },
  { path: "/shop", changefreq: "monthly", priority: "0.7" },
  { path: "/guide", changefreq: "monthly", priority: "0.7" },
  { path: "/outils/budget", changefreq: "monthly", priority: "0.7" },
  { path: "/outils/quiz", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/a-propos", changefreq: "monthly", priority: "0.6" },
  { path: "/mentions-legales", changefreq: "yearly", priority: "0.3" },
  { path: "/confidentialite", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

async function fetchDynamicPaths() {
  if (!process.env.DATABASE_URL) {
    console.warn(
      "[generate-sitemap] DATABASE_URL not set — skipping dynamic vendor/venue URLs.",
    );
    return [];
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const [vendors, venues] = await Promise.all([
      client.query(
        "SELECT slug FROM marketplace_vendors WHERE active = true AND slug IS NOT NULL ORDER BY id",
      ),
      client.query(
        "SELECT slug FROM marketplace_venues WHERE active = true AND slug IS NOT NULL ORDER BY id",
      ),
    ]);
    return [
      ...vendors.rows.map((r) => ({
        path: `/partenaires/${r.slug}`,
        changefreq: "weekly",
        priority: "0.6",
      })),
      ...venues.rows.map((r) => ({
        path: `/lieux/${r.slug}`,
        changefreq: "weekly",
        priority: "0.6",
      })),
    ];
  } catch (err) {
    console.warn(
      "[generate-sitemap] Failed to fetch vendor/venue slugs, falling back to static-only sitemap:",
      err.message,
    );
    return [];
  } finally {
    await client.end().catch(() => {});
  }
}

function renderUrl({ path, changefreq, priority }) {
  const loc = `${SITE_URL}${path}`;
  const alternates = LANGS.map(
    ({ hreflang, suffix }) =>
      `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${loc}${suffix}" />`,
  ).join("\n");
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    alternates,
    "  </url>",
  ].join("\n");
}

async function main() {
  const dynamicPages = await fetchDynamicPaths();
  const allPages = [...STATIC_PAGES, ...dynamicPages];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...allPages.map(renderUrl),
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log(
    `[generate-sitemap] Wrote ${allPages.length} URL(s) (${STATIC_PAGES.length} static + ${dynamicPages.length} dynamic) to ${OUTPUT_PATH}`,
  );
}

main();
