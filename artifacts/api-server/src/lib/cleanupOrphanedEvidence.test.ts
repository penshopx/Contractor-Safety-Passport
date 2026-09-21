import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanupOrphanedEvidence,
  orphanedEvidenceCandidates,
} from "./cleanupOrphanedEvidence.ts";
import {
  evidenceDeletePreconditions,
  type EvidenceObjectCandidate,
} from "./objectStorage.ts";

const candidates: EvidenceObjectCandidate[] = [
  {
    objectPath: "/objects/uploads/old-orphan",
    sizeBytes: 100,
    updatedAt: new Date("2026-09-19T00:00:00.000Z"),
    generation: "1",
    metageneration: "1",
  },
  {
    objectPath: "/objects/uploads/old-referenced",
    sizeBytes: 200,
    updatedAt: new Date("2026-09-19T00:00:00.000Z"),
    generation: "2",
    metageneration: "1",
  },
  {
    objectPath: "/objects/uploads/recent-orphan",
    sizeBytes: 300,
    updatedAt: new Date("2026-09-21T00:00:00.000Z"),
    generation: "3",
    metageneration: "1",
  },
];

describe("orphaned evidence cleanup selection", () => {
  it("only selects unreferenced uploads older than the cutoff", () => {
    const result = orphanedEvidenceCandidates(
      candidates,
      new Set(["/objects/uploads/old-referenced"]),
      new Date("2026-09-20T00:00:00.000Z"),
    );

    assert.deepEqual(
      result.map((candidate) => candidate.objectPath),
      ["/objects/uploads/old-orphan"],
    );
  });

  it("does not count an object tagged after the reference query as deleted", async () => {
    let currentMetageneration = "1";
    const candidate = candidates[0]!;
    const result = await cleanupOrphanedEvidence({
      now: new Date("2026-09-21T00:00:00.000Z"),
      gracePeriodMs: 24 * 60 * 60_000,
      dependencies: {
        listCandidates: async () => [candidate],
        findReferencedPaths: async () => {
          currentMetageneration = "2";
          return new Set();
        },
        deleteCandidate: async (snapshot) => {
          const preconditions = evidenceDeletePreconditions(snapshot);
          if (preconditions.ifMetagenerationMatch !== currentMetageneration) {
            const error = new Error("conditionNotMet");
            Object.assign(error, { code: 412 });
            throw error;
          }
        },
      },
    });

    assert.deepEqual(result, { deletedCount: 0, deletedBytes: 0 });
  });
});