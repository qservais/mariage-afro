import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";

interface CheckinGuest {
  id: number;
  firstName: string;
  lastName: string;
  side: string;
  table: string | null;
  rsvp: string;
  arrived: boolean;
}

function sessionKey(token: string): string {
  return `mariage-afro:checkin-session:${token}`;
}

export default function InvitesCheckin() {
  const { t } = useTranslation();
  const { token = "" } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(sessionKey(token)); } catch { return null; }
  });
  const [coupleName, setCoupleName] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const verify = useMutation({
    mutationFn: async (enteredPin: string) => {
      const res = await fetch(`/api/checkin/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Erreur");
      return body as { sessionToken: string; coupleName: string };
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setCoupleName(data.coupleName);
      setPinError(null);
      try { sessionStorage.setItem(sessionKey(token), data.sessionToken); } catch { /* noop */ }
    },
    onError: (e: Error) => setPinError(e.message),
  });

  const { data: guests = [], isLoading } = useQuery<CheckinGuest[]>({
    queryKey: ["checkin-guests", token, search],
    enabled: !!sessionToken,
    queryFn: async () => {
      const res = await fetch(`/api/checkin/${token}/guests?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (res.status === 401) {
        setSessionToken(null);
        try { sessionStorage.removeItem(sessionKey(token)); } catch { /* noop */ }
        throw new Error("session_expired");
      }
      if (!res.ok) throw new Error("error");
      return res.json();
    },
    retry: false,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, arrived }: { id: number; arrived: boolean }) => {
      const res = await fetch(`/api/checkin/${token}/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ arrived }),
      });
      if (!res.ok) throw new Error("error");
      return res.json();
    },
    onMutate: async ({ id, arrived }) => {
      await qc.cancelQueries({ queryKey: ["checkin-guests", token, search] });
      const prev = qc.getQueryData<CheckinGuest[]>(["checkin-guests", token, search]);
      qc.setQueryData<CheckinGuest[]>(["checkin-guests", token, search], (old) =>
        (old ?? []).map((g) => (g.id === id ? { ...g, arrived } : g)),
      );
      return { prev };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["checkin-guests", token, search], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["checkin-guests", token, search] }),
  });

  const presentCount = useMemo(() => guests.filter((g) => g.arrived).length, [guests]);

  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <SEO title={t("checkin.title", { defaultValue: "Check-in invités" })} description="" />
        <div className="w-full max-w-sm bg-white border border-wine-deep/10 p-8 space-y-5">
          <h1 className="font-display text-2xl text-wine-deep text-center">
            {t("checkin.gate_title", { defaultValue: "Check-in invités" })}
          </h1>
          <p className="text-sm text-wine-deep/60 text-center">
            {t("checkin.gate_desc", { defaultValue: "Entrez le code PIN fourni par les mariés." })}
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (pin.trim()) verify.mutate(pin.trim()); }}
            className="space-y-3"
          >
            <Input
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="text-center text-2xl tracking-[0.3em] h-14"
              maxLength={8}
              data-testid="input-checkin-pin"
            />
            {pinError && <p className="text-sm text-red-600 text-center">{pinError}</p>}
            <Button type="submit" className="w-full" disabled={verify.isPending} data-testid="button-checkin-submit">
              {verify.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("checkin.unlock", { defaultValue: "Déverrouiller" })}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <SEO title={t("checkin.title", { defaultValue: "Check-in invités" })} description="" />
      <div className="max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="font-display text-2xl text-wine-deep">
            {coupleName ?? t("checkin.title", { defaultValue: "Check-in invités" })}
          </h1>
          <p className="text-sm text-wine-deep/60">
            {t("checkin.summary", { present: presentCount, total: guests.length, defaultValue: `${presentCount} présent(s) / ${guests.length} invité(s)` })}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wine-deep/30" aria-hidden="true" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("checkin.search_placeholder", { defaultValue: "Rechercher un nom..." })}
            className="pl-9 h-12 text-base"
            data-testid="input-checkin-search"
          />
        </div>

        <div className="bg-white border border-wine-deep/10 divide-y divide-wine-deep/5">
          {isLoading ? (
            <p className="text-sm text-wine-deep/40 text-center py-10">{t("checkin.loading", { defaultValue: "Chargement..." })}</p>
          ) : guests.length === 0 ? (
            <p className="text-sm text-wine-deep/40 text-center py-10">{t("checkin.empty", { defaultValue: "Aucun invité trouvé." })}</p>
          ) : (
            guests.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle.mutate({ id: g.id, arrived: !g.arrived })}
                className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left active:bg-wine-deep/5 transition-colors"
                data-testid={`checkin-public-guest-${g.id}`}
              >
                <div className="min-w-0">
                  <p className="text-base font-medium truncate">{g.firstName} {g.lastName}</p>
                  {g.table && <p className="text-xs text-wine-deep/50">{g.table}</p>}
                </div>
                {g.arrived ? (
                  <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gold-deep shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </span>
                ) : (
                  <Circle className="w-6 h-6 text-wine-deep/25 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
