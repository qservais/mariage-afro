/**
 * Server-side counterpart of the frontend's src/lib/phone.ts — kept as a small
 * standalone copy since api-server and the Vite app are separate workspace
 * packages. Strips a redundant leading trunk "0" after a dial code
 * (e.g. "+32 0472992417" -> "+32 472 99 24 17") for admin-list display.
 */
const DIAL_CODES = ["+352", "+237", "+225", "+221", "+351", "+32", "+33", "+31", "+44", "+49", "+34", "+39", "+1"];

export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const code = DIAL_CODES.find((c) => trimmed.startsWith(c));
  if (!code) return trimmed;
  const rest = trimmed.slice(code.length).trim();
  const digits = rest.replace(/[^\d]/g, "");
  const localDigits = digits.startsWith("0") ? digits.slice(1) : digits;
  if (!localDigits) return code;
  const grouped = localDigits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return `${code} ${grouped}`;
}
