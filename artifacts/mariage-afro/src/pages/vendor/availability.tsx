import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { vendorApi } from "@/lib/vendorApi";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityRow {
  id: number;
  vendorId: number;
  date: string;
  status: "blocked" | "booked";
  note: string | null;
  createdAt: string;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildMonthGrid(month: Date) {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first
  const cells: { date: Date | null; inMonth: boolean }[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push({ date: null, inMonth: false });
  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push({ date: new Date(month.getFullYear(), month.getMonth(), day), inMonth: true });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, inMonth: false });
  return cells;
}

export default function VendorAvailabilityPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date();
  const [month, setMonth] = useState(() => startOfMonth(today));

  const from = ymd(startOfMonth(month));
  const to = ymd(endOfMonth(month));

  const { data: rows = [], isLoading } = useQuery<AvailabilityRow[]>({
    queryKey: ["vendor", "availability", from, to],
    queryFn: () =>
      vendorApi.get<AvailabilityRow[]>(
        `/api/vendor/availability?from=${from}&to=${to}`,
      ),
  });

  const byDate = useMemo(() => {
    const m = new Map<string, AvailabilityRow>();
    rows.forEach((r) => m.set(r.date, r));
    return m;
  }, [rows]);

  const blockMutation = useMutation({
    mutationFn: (date: string) =>
      vendorApi.post("/api/vendor/availability", { date, status: "blocked" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor", "availability"] }),
    onError: () => toast({ title: t("vendor.availability.error_save"), variant: "destructive" }),
  });

  const unblockMutation = useMutation({
    mutationFn: (date: string) => vendorApi.del(`/api/vendor/availability/${date}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor", "availability"] }),
    onError: () => toast({ title: t("vendor.availability.error_save"), variant: "destructive" }),
  });

  const monthLabel = month.toLocaleDateString(i18n.language || "fr", {
    month: "long",
    year: "numeric",
  });

  const cells = buildMonthGrid(month);
  const todayStr = ymd(today);

  const blockedDays = rows
    .filter((r) => r.status === "blocked" && r.date >= from && r.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date));

  const weekdayLabels = (t("vendor.availability.weekdays_short", { returnObjects: true }) as string[])
    || ["L", "M", "M", "J", "V", "S", "D"];

  function handleClick(dateStr: string) {
    if (dateStr < todayStr) return;
    const existing = byDate.get(dateStr);
    if (!existing) {
      blockMutation.mutate(dateStr);
      return;
    }
    if (existing.status === "booked") {
      toast({ title: t("vendor.availability.cannot_change_booked") });
      return;
    }
    unblockMutation.mutate(dateStr);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-bold text-2xl text-wine-deep" data-testid="text-availability-title">
            {t("vendor.availability.title")}
          </h2>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            {t("vendor.availability.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-cream border border-neutral-200 px-3 py-2">
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="p-1.5 hover:bg-neutral-100"
            aria-label={t("vendor.availability.prev_month")}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-sm font-medium uppercase tracking-wider text-wine-deep w-44 text-center capitalize">
            {monthLabel}
          </div>
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="p-1.5 hover:bg-neutral-100"
            aria-label={t("vendor.availability.next_month")}
            data-testid="button-next-month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-700" role="list" aria-label={t("vendor.availability.legend_label", { defaultValue: "Légende" })}>
        <span className="inline-flex items-center gap-2" role="listitem">
          <span className="w-3 h-3 bg-gold/20 border border-gold/40" aria-hidden="true" />
          {t("vendor.availability.legend_free")}
        </span>
        <span className="inline-flex items-center gap-2" role="listitem">
          <span className="w-3 h-3 bg-wine-deep/10 border border-wine-deep/30" aria-hidden="true" />
          {t("vendor.availability.legend_blocked")}
        </span>
        <span className="inline-flex items-center gap-2" role="listitem">
          <span className="w-3 h-3 bg-primary/20 border border-primary/40" aria-hidden="true" />
          {t("vendor.availability.legend_booked")}
        </span>
      </div>

      {/* Desktop calendar */}
      <section className="hidden md:block bg-cream border border-neutral-200 p-4">
        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
          {weekdayLabels.map((d, i) => (
            <div key={`${d}-${i}`} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin inline" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell.date) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }
              const dateStr = ymd(cell.date);
              const row = byDate.get(dateStr);
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              let cls = "bg-gold/10 border-gold/30 text-wine-deep hover:bg-gold/20";
              if (row?.status === "blocked") {
                cls = "bg-wine-deep/10 border-wine-deep/30 text-wine-deep hover:bg-wine-deep/15";
              } else if (row?.status === "booked") {
                cls = "bg-primary/15 border-primary/40 text-primary cursor-not-allowed";
              }
              if (isPast) cls += " opacity-40 cursor-not-allowed";
              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => handleClick(dateStr)}
                  disabled={isPast || row?.status === "booked"}
                  className={`aspect-square border ${cls} text-sm flex flex-col items-center justify-center transition-colors ${
                    isToday ? "ring-2 ring-wine-deep ring-offset-1" : ""
                  }`}
                  data-testid={`day-${dateStr}`}
                  aria-label={`${new Date(dateStr).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} — ${row?.status === "booked" ? t("vendor.availability.legend_booked") : row?.status === "blocked" ? t("vendor.availability.legend_blocked") : t("vendor.availability.legend_free")}`}
                >
                  <span className="font-medium">{cell.date.getDate()}</span>
                  {row?.status === "booked" && (
                    <span className="text-[9px] uppercase tracking-widest mt-0.5">
                      {t("vendor.availability.short_booked")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Mobile list */}
      <section className="md:hidden bg-cream border border-neutral-200 p-4">
        <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
          {t("vendor.availability.mobile_list_title")}
        </h3>
        {blockedDays.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">
            {t("vendor.availability.mobile_empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {blockedDays.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border border-neutral-200 px-3 py-2"
                data-testid={`mobile-day-${row.date}`}
              >
                <div>
                  <p className="text-sm font-medium text-wine-deep">
                    {new Date(row.date).toLocaleDateString(i18n.language || "fr", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest mt-0.5 text-neutral-500">
                    {row.status === "booked"
                      ? t("vendor.availability.legend_booked")
                      : t("vendor.availability.legend_blocked")}
                  </p>
                </div>
                {row.status === "blocked" && row.date >= todayStr && (
                  <button
                    type="button"
                    onClick={() => unblockMutation.mutate(row.date)}
                    className="p-1.5 text-neutral-500 hover:text-wine-deep"
                    aria-label={t("vendor.availability.remove_block")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 mb-2">{t("vendor.availability.mobile_add_label")}</p>
          <input
            type="date"
            min={todayStr}
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                const existing = byDate.get(v);
                if (existing?.status === "booked") {
                  toast({ title: t("vendor.availability.cannot_change_booked") });
                  return;
                }
                blockMutation.mutate(v);
                e.target.value = "";
              }
            }}
            className="w-full border border-neutral-300 px-3 py-2 text-sm rounded-none"
            data-testid="input-mobile-block-date"
          />
        </div>
      </section>
    </div>
  );
}
