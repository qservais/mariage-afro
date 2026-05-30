const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  if (path.startsWith("/objects/")) return `${BASE}/api/storage${path}`;
  return path;
}

export function storageUrlOrEmpty(path: string | null | undefined): string {
  return storageUrl(path) ?? "";
}
