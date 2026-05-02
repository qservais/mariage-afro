import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { X, Download, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const SESSION_KEY = "mariage-afro:exit-intent-shown";
const MAGNET_ID = "guide-12-etapes";
const SUPPRESSED_PATHS = ["/sign-in", "/sign-up", "/espace-client", "/espace-pro", "/admin", "/mariage/", "/outils/", "/contact"];

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer:coarse)").matches || window.innerWidth < 768;
}

function shouldSuppress(pathname: string): boolean {
  return SUPPRESSED_PATHS.some((p) => pathname.startsWith(p));
}

export default function ExitIntentPopup() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const triggeredRef = useRef(false);
  const lastScrollRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldSuppress(pathname)) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") {
        triggeredRef.current = true;
        return;
      }
    } catch {
      // sessionStorage unavailable — still allow trigger
    }

    let scrollTimer: number | null = null;
    let onFirstScroll: (() => void) | null = null;

    const trigger = () => {
      if (triggeredRef.current) return;
      // Re-check suppression at trigger time in case the route changed
      // between effect setup and the trigger firing.
      if (shouldSuppress(window.location.pathname)) return;
      triggeredRef.current = true;
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* noop */ }
      setOpen(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      // Only trigger when cursor exits the top of the viewport
      if (e.clientY <= 0 && !isMobile()) trigger();
    };

    const onScroll = () => {
      lastScrollRef.current = Date.now();
    };

    if (isMobile()) {
      // Mobile: 30s of scroll inactivity AFTER first scroll
      let firstScrollSeen = false;
      onFirstScroll = () => {
        firstScrollSeen = true;
        lastScrollRef.current = Date.now();
        window.addEventListener("scroll", onScroll, { passive: true });
        if (onFirstScroll) window.removeEventListener("scroll", onFirstScroll);
      };
      window.addEventListener("scroll", onFirstScroll, { passive: true });
      scrollTimer = window.setInterval(() => {
        if (!firstScrollSeen) return;
        if (Date.now() - lastScrollRef.current > 30_000) trigger();
      }, 2000);
    } else {
      document.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      if (onFirstScroll) window.removeEventListener("scroll", onFirstScroll);
      if (scrollTimer != null) window.clearInterval(scrollTimer);
    };
  }, [pathname]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !consent) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          locale: i18n.language,
          magnetId: MAGNET_ID,
          magnetTitle: t("popup.title"),
          consent: true,
        }),
      });
      if (!res.ok) throw new Error("Bad status");
      setSubmitted(true);
    } catch {
      // silent failure — keep modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-wine-deep/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-popup-title"
    >
      <div className="relative w-full max-w-lg bg-cream border border-gold/40 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-wine-deep/60 hover:text-wine-deep p-1"
          aria-label="Close"
          data-testid="popup-close"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border border-gold/60 flex items-center justify-center text-gold">
                <Download className="w-5 h-5" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-wine-deep/60 font-medium">
                {t("popup.eyebrow")}
              </span>
            </div>
            <h2 id="exit-popup-title" className="font-display text-2xl md:text-3xl text-wine-deep mb-3 leading-tight">
              {t("popup.title")}
            </h2>
            <p className="text-sm text-wine-deep/70 mb-6">
              {t("popup.desc")}
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  required minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("tools.budget.form_name")}
                  className="bg-white border-wine-deep/15 rounded-none"
                  data-testid="popup-input-name"
                />
                <Input
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("tools.budget.form_email")}
                  className="bg-white border-wine-deep/15 rounded-none"
                  data-testid="popup-input-email"
                />
              </div>
              <label className="flex items-start gap-3 text-xs text-wine-deep/70 cursor-pointer">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(c) => setConsent(c === true)}
                  className="rounded-none border-wine-deep/30 data-[state=checked]:bg-wine-deep data-[state=checked]:border-wine-deep mt-0.5"
                  data-testid="popup-consent"
                />
                <span>{t("popup.consent")}</span>
              </label>
              <Button
                type="submit"
                disabled={submitting || !consent}
                className="w-full btn-editorial-solid !h-12"
                data-testid="popup-submit"
              >
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("tools.budget.email_submitting")}</> : t("popup.cta")}
              </Button>
            </form>
            <p className="text-[11px] text-wine-deep/50 mt-4 text-center">
              {t("popup.privacy_note")}
            </p>
          </div>
        ) : (
          <div className="p-10 text-center" data-testid="popup-success">
            <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" />
            <h3 className="font-display text-2xl text-wine-deep mb-2">{t("popup.success_title")}</h3>
            <p className="text-sm text-wine-deep/70 mb-6">{t("popup.success_desc")}</p>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="bg-wine-deep text-cream hover:bg-wine-deep/90 rounded-none"
            >
              {t("popup.close")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
