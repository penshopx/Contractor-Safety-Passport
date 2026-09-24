import { csmsReadinessItemKey, type CsmsReadinessStatus } from "./csmsProfiles.ts";

type ReadinessSnapshot = {
  stages: Array<{ code: string; name: string; evidence: string[] }>;
  itemStatuses: Array<{ key: string; status: CsmsReadinessStatus }>;
};

export type EvidenceCandidate = {
  key: string;
  stageCode: string;
  stageName: string;
  evidence: string;
  status: "unreviewed" | "follow_up";
};

export function selectEvidenceCandidates(readiness: ReadinessSnapshot): EvidenceCandidate[] {
  const statuses = new Map(readiness.itemStatuses.map(({ key, status }) => [key, status]));
  return readiness.stages
    .flatMap((stage) =>
      stage.evidence.map((evidence, index) => {
        const key = csmsReadinessItemKey(stage.code, "evidence", index);
        const status = statuses.get(key);
        return {
          key,
          stageCode: stage.code,
          stageName: stage.name,
          evidence,
          status: status === "follow_up" ? "follow_up" as const : "unreviewed" as const,
          completed: status === "complete",
        };
      }),
    )
    .filter((item) => !item.completed)
    .sort((a, b) => Number(b.status === "follow_up") - Number(a.status === "follow_up"))
    .slice(0, 5)
    .map(({ completed: _completed, ...item }) => item);
}

export function validateEvidenceSuggestions(
  raw: string,
  candidates: EvidenceCandidate[],
): Array<EvidenceCandidate & { nextStep: string }> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || !("suggestions" in parsed) ||
      !Array.isArray(parsed.suggestions) || parsed.suggestions.length !== candidates.length) return null;
  const seen = new Set<string>();
  const steps = new Map<string, string>();
  for (const item of parsed.suggestions) {
    if (!item || typeof item !== "object" || typeof item.key !== "string" ||
        typeof item.nextStep !== "string" || seen.has(item.key) ||
        !candidates.some((candidate) => candidate.key === item.key) ||
        item.nextStep.trim().length < 12 || item.nextStep.length > 300) return null;
    seen.add(item.key);
    steps.set(item.key, item.nextStep.trim());
  }
  return candidates.map((candidate) => ({ ...candidate, nextStep: steps.get(candidate.key)! }));
}