import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PublicAvailabilityRow {
  date: string;
  status: "blocked" | "booked";
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

function buildMiniGrid(month: Date) {
  const first = startOfMonth(month);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface Props {
  vendorId: number;
  months?: number;
  baseUrl?: string;
}

export default function VendorAvailabilityCalendar({
  vendorId,
  months = 6,
  baseUrl,
}: Props) {
  const { t, i18n } = useTranslation();

  const today = new Date();
  const startMonth = startOfMonth(today);
  const endMonth = new Date(today.getFullYear(), today.getMonth() + months, 0);
  const from = ymd(startMonth);
  const to = ymd(endMonth);

  const apiBase = baseUrl ?? import.meta.env.BASE_URL.replace(/\/$/, "");

  const { data: rows = [], isLoading } = useQuery<PublicAvailabilityRow[]>({
    queryKey: ["vendor-availability-public", vendorId, from, to],
    queryFn: async () => {
      const res = await fetch(
        `${apiBase}/api/marketplace/vendors/${vendorId}/availability?from=${from}&to=${to}`,
      );
      if (!res.ok) return [];
      return (await res.json()) as PublicAvailabilityRow[];
    },
  });

  const byDate = useMemo(() => {
    const m = new Map<string, PublicAvailabilityRow>();
    rows.forEach((r) => m.set(r.date, r));
    return m;
  }, [rows]);

  const monthList = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < months; i += 1) {
      list.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
    return list;
  }, [months, today.getFullYear(), today.getMonth()]);

  const todayStr = ymd(today);
  const weekdayLabels = (t("marketplace.availability.weekdays_short", {
    returnObjects: true,
  }) as string[]) || ["L", "M", "M", "J", "V", "S", "D"];

  const hasIndispo = rows.some((r) => r.date >= todayStr);

  return (
    <div className="bg-white border border-wine-deep/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] uppercase tracking-[0.25em] text-wine-deep font-medium">
          {t("marketplace.availability.title")}
        </h4>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-wine-deep/70">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-gold/10 border border-gold/30" />
            {t("marketplace.availability.legend_free")}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-neutral-300 border border-neutral-400" />
            {t("marketplace.availability.legend_unavailable")}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-wine-deep/60">
          <Loader2 className="w-4 h-4 animate-spin inline" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {monthList.map((m) => {
              const cells = buildMiniGrid(m);
              const label = m.toLocaleDateString(i18n.language || "fr", {
                month: "short",
                year: "numeric",
              });
              return (
                <div key={ymd(m)} className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-wine-deep/70 font-medium capitalize">
                    {label}
                  </p>
                  <div className="grid grid-cols-7 gap-px text-[8px] text-wine-deep/50">
                    {weekdayLabels.map((d, i) => (
                      <div key={`${d}-${i}`} className="text-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px">
                    {cells.map((d, idx) => {
                      if (!d) {
                        return <div key={`e-${idx}`} className="aspect-square" />;
                      }
                      const dateStr = ymd(d);
                      const row = byDate.get(dateStr);
                      const isPast = dateStr < todayStr;
                      let cls =
                        "bg-gold/10 text-wine-deep/70 border border-gold/20";
                      if (row) {
                        cls = "bg-neutral-300 text-neutral-600 border border-neutral-400";
                      }
                      if (isPast) cls += " opacity-30";
                      return (
                        <div
                          key={dateStr}
                          className={`aspect-square text-[9px] flex items-center justify-center ${cls}`}
                          title={
                            row
                              ? t("marketplace.availability.legend_unavailable")
                              : t("marketplace.availability.legend_free")
                          }
                          data-testid={`mini-${dateStr}`}
                        >
                          {d.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {!hasIndispo && (
            <p className="mt-4 text-xs text-wine-deep/60 italic">
              {t("marketplace.availability.no_blocks")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export async function fetchVendorAvailabilityStatus(
  vendorId: number,
  date: string,
  baseUrl?: string,
): Promise<"blocked" | "booked" | null> {
  const apiBase = baseUrl ?? import.meta.env.BASE_URL.replace(/\/$/, "");
  try {
    const res = await fetch(
      `${apiBase}/api/marketplace/vendors/${vendorId}/availability?from=${date}&to=${date}`,
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as PublicAvailabilityRow[];
    const found = rows.find((r) => r.date === date);
    return found?.status ?? null;
  } catch {
    return null;
  }
}
