const KEY = "marketplace.comparator.vendorIds";
export const MAX_COMPARE = 3;

export type CompareKind = "vendor" | "venue";

function readSet(kind: CompareKind): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${KEY}:${kind}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => typeof n === "number" && Number.isFinite(n)).slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

function writeSet(kind: CompareKind, ids: number[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${KEY}:${kind}`, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("comparator:changed", { detail: { kind, ids } }));
}

export const comparator = {
  get: readSet,
  has(kind: CompareKind, id: number): boolean {
    return readSet(kind).includes(id);
  },
  toggle(kind: CompareKind, id: number): { ids: number[]; reachedMax: boolean } {
    const cur = readSet(kind);
    if (cur.includes(id)) {
      const next = cur.filter((x) => x !== id);
      writeSet(kind, next);
      return { ids: next, reachedMax: false };
    }
    if (cur.length >= MAX_COMPARE) {
      return { ids: cur, reachedMax: true };
    }
    const next = [...cur, id];
    writeSet(kind, next);
    return { ids: next, reachedMax: false };
  },
  remove(kind: CompareKind, id: number): number[] {
    const next = readSet(kind).filter((x) => x !== id);
    writeSet(kind, next);
    return next;
  },
  clear(kind: CompareKind): void {
    writeSet(kind, []);
  },
};
