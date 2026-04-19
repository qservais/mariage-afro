const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function clientFetch<T = unknown>(
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

export const clientApi = {
  get: <T>(p: string) => clientFetch<T>(p),
  post: <T>(p: string, body: unknown) =>
    clientFetch<T>(p, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    clientFetch<T>(p, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(p: string) => clientFetch<T>(p, { method: "DELETE" }),
};
