import app from "./app";
import { logger } from "./lib/logger";
import { runVendorFollowupCron, runVendorFeaturedBackfill, runServicesObjectMigration } from "./routes/vendor";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // One-time backfill: ensure all existing vendors have tier=featured + status=active.
  runVendorFeaturedBackfill().catch((err) =>
    logger.warn({ err }, "Featured subscription backfill failed")
  );

  // One-time migration: convert legacy string services to object format.
  runServicesObjectMigration().catch((err) =>
    logger.warn({ err }, "Services object migration failed")
  );

  // LOT 8 — daily vendor follow-up cron (with internal throttle).
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const tick = (): void => {
    runVendorFollowupCron().catch((err) => logger.warn({ err }, "Vendor follow-up cron failed"));
  };
  setTimeout(tick, 60 * 1000);
  setInterval(tick, SIX_HOURS);
});
