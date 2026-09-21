import { db, fieldActivitiesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";
import { logger } from "./logger.ts";
import {
  deleteEvidenceUploadCandidate,
  listEvidenceUploadCandidates,
  type EvidenceObjectCandidate,
} from "./objectStorage.ts";

const DEFAULT_GRACE_PERIOD_MS = 24 * 60 * 60_000;
const REFERENCE_QUERY_BATCH_SIZE = 500;

export type EvidenceCleanupResult = {
  deletedCount: number;
  deletedBytes: number;
};

export function orphanedEvidenceCandidates(
  candidates: EvidenceObjectCandidate[],
  referencedPaths: ReadonlySet<string>,
  cutoff: Date,
) {
  return candidates.filter(
    (candidate) =>
      candidate.updatedAt < cutoff && !referencedPaths.has(candidate.objectPath),
  );
}

export async function cleanupOrphanedEvidence(
  options: {
    now?: Date;
    gracePeriodMs?: number;
    dependencies?: {
      listCandidates: typeof listEvidenceUploadCandidates;
      deleteCandidate: typeof deleteEvidenceUploadCandidate;
      findReferencedPaths: (paths: string[]) => Promise<ReadonlySet<string>>;
    };
  } = {},
): Promise<EvidenceCleanupResult> {
  const gracePeriodMs = options.gracePeriodMs ?? DEFAULT_GRACE_PERIOD_MS;
  const now = options.now ?? new Date();
  const dependencies = options.dependencies ?? {
    listCandidates: listEvidenceUploadCandidates,
    deleteCandidate: deleteEvidenceUploadCandidate,
    findReferencedPaths: async (paths: string[]) => {
      const references = await db
        .select({ objectPath: fieldActivitiesTable.photoObjectPath })
        .from(fieldActivitiesTable)
        .where(inArray(fieldActivitiesTable.photoObjectPath, paths));
      return new Set(
        references.flatMap((reference) =>
          reference.objectPath ? [reference.objectPath] : []),
      );
    },
  };
  const candidates = await dependencies.listCandidates();
  const oldCandidates = candidates.filter(
    (candidate) => candidate.updatedAt.getTime() < now.getTime() - gracePeriodMs,
  );
  const referencedPaths = new Set<string>();

  for (let offset = 0; offset < oldCandidates.length; offset += REFERENCE_QUERY_BATCH_SIZE) {
    const paths = oldCandidates
      .slice(offset, offset + REFERENCE_QUERY_BATCH_SIZE)
      .map((candidate) => candidate.objectPath);
    if (paths.length === 0) continue;
    const references = await dependencies.findReferencedPaths(paths);
    for (const objectPath of references) referencedPaths.add(objectPath);
  }

  const orphaned = orphanedEvidenceCandidates(
    oldCandidates,
    referencedPaths,
    new Date(now.getTime() - gracePeriodMs),
  );
  let deletedCount = 0;
  let deletedBytes = 0;

  for (const candidate of orphaned) {
    try {
      await dependencies.deleteCandidate(candidate);
      deletedCount += 1;
      deletedBytes += candidate.sizeBytes;
    } catch (error) {
      logger.warn(
        { err: error },
        "Skipped evidence object during orphan cleanup",
      );
    }
  }

  logger.info(
    { deletedCount, deletedBytes },
    "Completed orphaned evidence cleanup",
  );
  return { deletedCount, deletedBytes };
}