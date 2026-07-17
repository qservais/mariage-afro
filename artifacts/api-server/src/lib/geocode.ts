/**
 * Address -> lat/long via OpenStreetMap's free Nominatim API (Task 11).
 * Usage policy requires: max ~1 req/s (enforced with a simple in-process
 * throttle — admin address edits are low-frequency, no queue needed) and a
 * descriptive User-Agent identifying the app + a contact.
 */
import { logger } from "./logger";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MariageAfro/1.0 (https://mariage-afro.com; contact: hello@mariage-afro.com)";
const MIN_INTERVAL_MS = 1100;

let lastCallAt = 0;

async function throttle(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export interface GeocodeResult {
  latitude: string;
  longitude: string;
}

/** Returns null if the address could not be geocoded (caller must surface a clear error, not save null coords silently). */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) return null;
  await throttle();
  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if (!res.ok) {
      logger.warn({ status: res.status, address: query }, "Nominatim geocoding request failed");
      return null;
    }
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;
    return { latitude: first.lat, longitude: first.lon };
  } catch (err) {
    logger.error({ err, address: query }, "Nominatim geocoding error");
    return null;
  }
}
