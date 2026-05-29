// Clerk has been replaced by a custom JWT auth system.
// This file is kept as an empty shim so any stale imports don't break the build.

export const clerkAppearance = {};
export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
export function MariageAfroClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
