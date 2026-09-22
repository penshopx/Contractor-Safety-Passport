import app from "./app";
import { logger } from "./lib/logger";
import { migrateFieldActivityPhotos } from "./lib/migrateFieldActivityPhotos.ts";
import { cleanupOrphanedEvidence } from "./lib/cleanupOrphanedEvidence.ts";
import { startCompensationWorker } from "./lib/compensations.ts";

const EVIDENCE_CLEANUP_INTERVAL_MS = 6 * 60 * 60_000;

function runEvidenceCleanup() {
  void cleanupOrphanedEvidence().catch((error) => {
    logger.error({ err: error }, "Orphaned evidence cleanup failed");
  });
}

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

async function start() {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
    void migrateFieldActivityPhotos().catch((error) => {
      logger.error({ err: error }, "Legacy field photo migration failed");
    });
    runEvidenceCleanup();
    const cleanupTimer = setInterval(runEvidenceCleanup, EVIDENCE_CLEANUP_INTERVAL_MS);
    cleanupTimer.unref();
    const stopCompensationWorker = startCompensationWorker();
    const shutdown = () => {
      stopCompensationWorker();
      process.exit(0);
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  });
}

start().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
