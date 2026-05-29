// With httpOnly cookie auth, the token is sent automatically via credentials:"include".
// This module is kept as a no-op shim so existing clientApi/vendorApi callers compile.

export function setTokenGetter(_fn: () => Promise<string | null>): void {
  // no-op — token is in httpOnly cookie
}

export async function getAuthToken(): Promise<string | null> {
  return null;
}
