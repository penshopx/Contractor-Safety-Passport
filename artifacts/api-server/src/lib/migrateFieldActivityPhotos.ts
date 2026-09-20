import { db, fieldActivitiesTable, pool } from "@workspace/db";
import { asc, eq, isNotNull } from "drizzle-orm";
import { logger } from "./logger.ts";
import { storeMigratedEvidence } from "./objectStorage.ts";

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s;

export async function migrateFieldActivityPhotos() {
  const lockClient = await pool.connect();
  const lockKey = 1_104_202_609;
  const lock = await lockClient.query<{ acquired: boolean }>(
    "select pg_try_advisory_lock($1) as acquired",
    [lockKey],
  );
  if (!lock.rows[0]?.acquired) {
    lockClient.release();
    return;
  }
  let processed = 0;
  let migrationFailed = false;
  try {
    while (!migrationFailed) {
      const legacyRows = await db
        .select({
          id: fieldActivitiesTable.id,
          organizationId: fieldActivitiesTable.organizationId,
          photoDataUrl: fieldActivitiesTable.photoDataUrl,
          photoObjectPath: fieldActivitiesTable.photoObjectPath,
        })
        .from(fieldActivitiesTable)
        .where(isNotNull(fieldActivitiesTable.photoDataUrl))
        .orderBy(asc(fieldActivitiesTable.id))
        .limit(25);
      if (legacyRows.length === 0) break;
      for (const row of legacyRows) {
        if (!row.photoDataUrl) continue;
        if (row.photoObjectPath) {
          await db
            .update(fieldActivitiesTable)
            .set({ photoDataUrl: null })
            .where(eq(fieldActivitiesTable.id, row.id));
          processed += 1;
          continue;
        }
        const match = DATA_URL.exec(row.photoDataUrl);
        if (!match?.[1] || !match[2]) {
          logger.warn({ activityId: row.id }, "Removed unsupported legacy field photo value");
          await db
            .update(fieldActivitiesTable)
            .set({ photoDataUrl: null })
            .where(eq(fieldActivitiesTable.id, row.id));
          processed += 1;
          continue;
        }
        try {
          const photoObjectPath = await storeMigratedEvidence(
            Buffer.from(match[2], "base64"),
            match[1],
            row.organizationId,
            row.id,
          );
          await db
            .update(fieldActivitiesTable)
            .set({ photoObjectPath, photoDataUrl: null })
            .where(eq(fieldActivitiesTable.id, row.id));
          processed += 1;
        } catch (error) {
          logger.error(
            { err: error, activityId: row.id },
            "Failed to migrate legacy field photo; it remains in the database for retry",
          );
          migrationFailed = true;
          break;
        }
      }
      await new Promise((resolve) => setImmediate(resolve));
    }
  } finally {
    await lockClient.query("select pg_advisory_unlock($1)", [lockKey]);
    lockClient.release();
  }

  if (processed > 0) {
    logger.info({ count: processed }, "Processed legacy field photos");
  }
}