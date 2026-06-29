import { lazy, Suspense, useEffect, useState } from "react";

const Agentation = lazy(() => import("agentation").then((m) => ({ default: m.Agentation ?? m.default })));

const STAGING_OVERRIDE = (import.meta.env.VITE_REVIEW_HOSTS as string | undefined)
  ?.split(",")
  .map((h) => h.trim())
  .filter(Boolean) ?? [];

function isStaging(hostname: string): boolean {
  if (STAGING_OVERRIDE.length > 0) {
    return STAGING_OVERRIDE.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  }
  return (
    hostname === "madebydone.be" ||
    hostname.endsWith(".madebydone.be") ||
    hostname.startsWith("dev.") ||
    hostname.endsWith(".replit.dev") ||
    hostname.endsWith(".replit.app")
  );
}

export function ReviewTool() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStaging(window.location.hostname)) setShow(true);
  }, []);

  if (!show) return null;

  const webhookUrl = `${window.location.origin}/api/agentation-webhook`;

  return (
    <Suspense fallback={null}>
      <Agentation webhookUrl={webhookUrl} />
    </Suspense>
  );
}
