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

export const vendorApi = {
  get: <T>(p: string) => vendorFetch<T>(p),
  post: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    vendorFetch<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(p: string) => vendorFetch<T>(p, { method: "DELETE" }),
};
