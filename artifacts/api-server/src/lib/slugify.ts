/**
 * Convert a business name to a URL-safe slug.
 * - Lowercases, removes accents, replaces non-alphanumeric runs with '-'
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug by appending the vendor ID when needed.
 * Pass the candidate base slug and the vendor's numeric ID.
 */
export function uniqueSlug(baseSlug: string, id: number): string {
  return baseSlug ? `${baseSlug}-${id}` : String(id);
}
