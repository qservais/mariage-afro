const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function storageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:/i.test(path)) return path;
  if (path.startsWith("/objects/")) return `${BASE}/api/storage${path}`;
  if (path.startsWith("/images/") || path.startsWith("/videos/")) return `${BASE}${path}`;
  return path;
}

export function storageUrlOrEmpty(path: string | null | undefined): string {
  return storageUrl(path) ?? "";
}
