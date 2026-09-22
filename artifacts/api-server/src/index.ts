import app from "./app";
import { logger } from "./lib/logger";
import { migrateFieldActivityPhotos } from "./lib/migrateFieldActivityPhotos.ts";
import { cleanupOrphanedEvidence } from "./lib/cleanupOrphanedEvidence.ts";
import { startCompensationWorker } from "./lib/compensations.ts";
import { pool } from "@workspace/db";
import type { Server } from "node:http";

const EVIDENCE_CLEANUP_INTERVAL_MS = 6 * 60 * 60_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

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
  const server = app.listen(port);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  logger.info({ port }, "Server listening");
  void migrateFieldActivityPhotos().catch((error) => {
    logger.error({ err: error }, "Legacy field photo migration failed");
  });
  runEvidenceCleanup();
  const cleanupTimer = setInterval(runEvidenceCleanup, EVIDENCE_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();
  const stopCompensationWorker = startCompensationWorker();
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");
    clearInterval(cleanupTimer);

    const forceExitTimer = setTimeout(() => {
      logger.error({ signal }, "Graceful shutdown timed out");
      server.closeAllConnections();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await Promise.all([
        stopCompensationWorker(),
        closeHttpServer(server),
      ]);
      await pool.end();
      clearTimeout(forceExitTimer);
      logger.info({ signal }, "Graceful shutdown completed");
      process.exitCode = 0;
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error({ err: error, signal }, "Graceful shutdown failed");
      server.closeAllConnections();
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

function closeHttpServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
    server.closeIdleConnections();
  });
}

start().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
