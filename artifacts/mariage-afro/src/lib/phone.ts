/**
 * A stored vendor phone number is "<dial code> <local number>", e.g. "+32 472992417".
 * Historically the local part could still carry its national trunk prefix (a
 * leading "0" for Belgian-style numbers), producing "+32 0472992417" — invalid
 * once a country code is already shown. Both the formatter (display) and the
 * tel: href (dialling) must drop that redundant leading 0; fixing it here
 * covers already-stored bad values without touching the database.
 */
const DIAL_CODES = ["+352", "+237", "+225", "+221", "+351", "+32", "+33", "+31", "+44", "+49", "+34", "+39", "+1"];

function splitDialCode(raw: string): { dial: string; rest: string } {
  const trimmed = raw.trim();
  const code = DIAL_CODES.find((c) => trimmed.startsWith(c));
  if (!code) return { dial: "", rest: trimmed };
  return { dial: code, rest: trimmed.slice(code.length).trim() };
}

/** Strips a leading trunk "0" from the local part once a dial code is present. */
function stripTrunkZero(rest: string): string {
  const digitsOnly = rest.replace(/[^\d]/g, "");
  return digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly;
}

/** Human-readable display: "+32 472 99 24 17". Falls back to the raw value if unparseable. */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const { dial, rest } = splitDialCode(raw);
  if (!dial) return raw.trim();
  const digits = stripTrunkZero(rest);
  if (!digits) return dial;
  const grouped = digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return `${dial} ${grouped}`;
}

/** E.164-ish value for tel:/wa.me links: "+32472992417", digits only after the +. */
export function formatPhoneHref(raw: string | null | undefined): string {
  if (!raw) return "";
  const { dial, rest } = splitDialCode(raw);
  if (!dial) return raw.replace(/[^\d+]/g, "");
  return `${dial}${stripTrunkZero(rest)}`;
}
