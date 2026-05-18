const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function vendorFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Upload a file to the server-side proxy endpoint.
 * Bypasses browser→GCS CORS restrictions by having the API server
 * perform the actual PUT to Google Cloud Storage.
 */
export async function proxyUpload(file: File): Promise<{ objectPath: string }> {
  const res = await fetch(`${BASE}/api/storage/uploads/proxy-upload`, {
    method: "POST",
    credentials: "include",
    headers: { "x-content-type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<{ objectPath: string }>;
}

export const vendorApi = {
  get: <T>(p: string) => vendorFetch<T>(p),
  post: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(p: string) => vendorFetch<T>(p, { method: "DELETE" }),
};
