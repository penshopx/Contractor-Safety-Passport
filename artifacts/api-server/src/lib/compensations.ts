import { clerkClient } from "@clerk/express";
import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import {
  db,
  organizationInvitationsTable,
  type CompensationReason,
  type CompensationStatus,
  type ErrorCategory,
} from "@workspace/db";
import { logger } from "./logger.ts";

export type { CompensationStatus } from "@workspace/db";

export const LEASE_MS = Number(process.env.COMPENSATION_LEASE_MS ?? 300_000);
export const CLERK_TIMEOUT_MS = Number(process.env.COMPENSATION_CLERK_TIMEOUT_MS ?? 60_000);
export const MAX_RETRIES = Number(process.env.COMPENSATION_MAX_RETRIES ?? 10);
export const RECONCILIATION_GRACE_MS = Number(process.env.COMPENSATION_RECONCILIATION_GRACE_MS ?? 300_000);

if (!Number.isFinite(LEASE_MS) || LEASE_MS <= 0) {
  throw new Error("COMPENSATION_LEASE_MS must be a positive number");
}
if (!Number.isFinite(CLERK_TIMEOUT_MS) || CLERK_TIMEOUT_MS <= 0 || CLERK_TIMEOUT_MS >= LEASE_MS) {
  throw new Error("COMPENSATION_CLERK_TIMEOUT_MS must be positive and shorter than COMPENSATION_LEASE_MS");
}

const legalTransitions: Record<CompensationStatus, CompensationStatus[]> = {
  NONE: ["PENDING_REVOKE"],
  PENDING_REVOKE: ["REVOKED", "REVOKE_FAILED", "REVOKE_PERMANENTLY_FAILED", "DEAD_LETTER"],
  REVOKE_FAILED: ["REVOKED", "REVOKE_FAILED", "REVOKE_PERMANENTLY_FAILED", "DEAD_LETTER"],
  REVOKE_PERMANENTLY_FAILED: ["PENDING_REVOKE"],
  DEAD_LETTER: ["PENDING_REVOKE"],
  REVOKED: [],
};

export class InvalidCompensationTransitionError extends Error {
  constructor(from: CompensationStatus, to: CompensationStatus) {
    super(`Illegal compensation transition ${from} -> ${to}`);
    this.name = "InvalidCompensationTransitionError";
  }
}

export const canTransitionCompensation = (from: CompensationStatus, to: CompensationStatus) =>
  legalTransitions[from].includes(to);

export const calculateBackoffMs = (
  retryCount: number,
  random = Math.random,
  base = 1_000,
  max = 300_000,
) => Math.min(max, base * 2 ** Math.max(0, retryCount)) + Math.floor(random() * Math.min(1_000, base));

export type ClerkError = {
  status?: number;
  code?: string;
  errors?: Array<{ code?: string; message?: string }>;
  message?: string;
  headers?: Headers | Record<string, string | undefined>;
};

export type ClassifiedClerkError = {
  category: ErrorCategory;
  message: string;
  retryAfterMs?: number;
};

const redactSensitiveText = (value: string) =>
  value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]");

const header = (headers: ClerkError["headers"], name: string) => {
  if (!headers) return undefined;
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  return headers[name] ?? headers[name.toLowerCase()];
};

export const classifyClerkError = (error: unknown): ClassifiedClerkError => {
  const value = (error ?? {}) as ClerkError;
  const message = redactSensitiveText(
    typeof value.message === "string" ? value.message : String(error),
  );
  const code = [value.code, ...(value.errors ?? []).map((item) => item.code)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const normalized = message.toLowerCase();
  if (
    value.status === 404 ||
    /not.?found|already.?revoked|revoked|inactive|not active/.test(`${code} ${normalized}`)
  ) {
    return { category: "TERMINAL_SUCCESS", message };
  }
  if (value.status === 408 || value.status === 429 || (value.status !== undefined && value.status >= 500) ||
      /abort|timeout|timed out|network|fetch failed|econn|socket/.test(`${code} ${normalized}`)) {
    const retryAfter = value.status === 429 ? Number(header(value.headers, "retry-after")) : NaN;
    return {
      category: "RETRYABLE",
      message,
      retryAfterMs: Number.isFinite(retryAfter) ? retryAfter * 1_000 : undefined,
    };
  }
  if (value.status !== undefined && value.status >= 400 && value.status < 500) {
    return { category: "PERMANENT", message };
  }
  return { category: "UNKNOWN", message };
};

const revokeClerkInvitation = async (
  invitationId: string,
  timeoutMs = CLERK_TIMEOUT_MS,
) => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured");
  const apiUrl = (process.env.CLERK_API_URL ?? "https://api.clerk.com").replace(/\/+$/, "");
  const response = await fetch(
    `${apiUrl}/v1/invitations/${encodeURIComponent(invitationId)}/revoke`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (response.ok) return;
  const body = await response.json().catch(() => null) as {
    errors?: Array<{ code?: string; message?: string }>;
  } | null;
  throw Object.assign(
    new Error(body?.errors?.[0]?.message ?? `Clerk revoke failed with status ${response.status}`),
    {
      status: response.status,
      errors: body?.errors,
      headers: response.headers,
    },
  );
};

export const transitionCompensation = async (
  invitationId: string,
  from: CompensationStatus[],
  to: CompensationStatus,
  reason: CompensationReason,
  patch: Record<string, unknown> = {},
) => {
  if (from.some((status) => !canTransitionCompensation(status, to))) {
    throw new InvalidCompensationTransitionError(from.join("|") as CompensationStatus, to);
  }
  const [updated] = await db
    .update(organizationInvitationsTable)
    .set({
      ...patch,
      compensationStatus: to,
      compensationReason: reason,
      compensationUpdatedAt: new Date(),
    })
    .where(and(eq(organizationInvitationsTable.id, invitationId), inArray(organizationInvitationsTable.compensationStatus, from)))
    .returning();
  if (!updated) throw new Error("Compensation state changed concurrently");
  logger.info({ invitation_id: invitationId, organization_id: updated.organizationId, status_from: from.join("|"), status_to: to, reason }, "Invitation compensation transition");
  return updated;
};

export const claimNextJob = async (workerId: string, leaseMs = LEASE_MS) => {
  const claimed = await db.execute(sql`
    UPDATE organization_invitations
    SET lease_owner = ${workerId},
        lease_expires_at = NOW() + (${leaseMs} * INTERVAL '1 millisecond'),
        claim_token = gen_random_uuid(),
        compensation_updated_at = NOW()
    WHERE id = (
      SELECT id FROM organization_invitations
      WHERE compensation_status IN ('PENDING_REVOKE', 'REVOKE_FAILED')
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND (lease_expires_at IS NULL OR lease_expires_at <= NOW())
        AND accepted_at IS NULL
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id
  `);
  const id = (claimed.rows[0] as { id?: string } | undefined)?.id;
  if (!id) return null;
  const [job] = await db.select().from(organizationInvitationsTable).where(eq(organizationInvitationsTable.id, id)).limit(1);
  return job ?? null;
};

const finalizeTransitionWithClaim = async (
  invitationId: string,
  claimToken: string,
  from: CompensationStatus[],
  to: CompensationStatus,
  reason: CompensationReason,
  patch: Record<string, unknown> = {},
) => {
  if (from.some((status) => !canTransitionCompensation(status, to))) {
    throw new InvalidCompensationTransitionError(from.join("|") as CompensationStatus, to);
  }
  const [updated] = await db
    .update(organizationInvitationsTable)
    .set({
      ...patch,
      compensationStatus: to,
      compensationReason: reason,
      compensationUpdatedAt: new Date(),
      leaseOwner: null,
      leaseExpiresAt: null,
      claimToken: null,
    })
    .where(and(
      eq(organizationInvitationsTable.id, invitationId),
      inArray(organizationInvitationsTable.compensationStatus, from),
      eq(organizationInvitationsTable.claimToken, claimToken),
      lte(sql`NOW()`, organizationInvitationsTable.leaseExpiresAt),
    ))
    .returning();
  if (!updated) throw new Error("Compensation claim was lost before finalization");
  logger.info({
    invitation_id: invitationId,
    organization_id: updated.organizationId,
    status_from: from.join("|"),
    status_to: to,
    reason,
  }, "Invitation compensation transition");
  return updated;
};

export const processCompensationJob = async (job: typeof organizationInvitationsTable.$inferSelect) => {
  if (!job.claimToken || !job.clerkInvitationId) return;
  const token = job.claimToken;
  try {
    await revokeClerkInvitation(job.clerkInvitationId);
    await finalizeTransitionWithClaim(
      job.id,
      token,
      ["PENDING_REVOKE", "REVOKE_FAILED"],
      "REVOKED",
      "RETRY_SUCCESS",
      { revokedAt: new Date(), nextRetryAt: null },
    );
  } catch (error) {
    const classified = classifyClerkError(error);
    if (classified.category === "TERMINAL_SUCCESS") {
      await finalizeTransitionWithClaim(
        job.id,
        token,
        ["PENDING_REVOKE", "REVOKE_FAILED"],
        "REVOKED",
        "RETRY_SUCCESS",
        {
          revokedAt: new Date(),
          nextRetryAt: null,
          lastErrorMessage: classified.message,
          lastErrorCategory: classified.category,
        },
      );
      return;
    }
    const retryCount = job.retryCount + 1;
    if (classified.category === "PERMANENT") {
      await finalizeTransitionWithClaim(
        job.id,
        token,
        ["PENDING_REVOKE", "REVOKE_FAILED"],
        "REVOKE_PERMANENTLY_FAILED",
        "REVOKE_PERMANENT",
        { lastErrorMessage: classified.message, lastErrorCategory: classified.category },
      );
      return;
    }
    if (retryCount >= MAX_RETRIES) {
      await finalizeTransitionWithClaim(
        job.id,
        token,
        ["PENDING_REVOKE", "REVOKE_FAILED"],
        "DEAD_LETTER",
        "RETRY_EXHAUSTED",
        { retryCount, lastErrorMessage: classified.message, lastErrorCategory: classified.category },
      );
      return;
    }
    const delay = classified.retryAfterMs ?? calculateBackoffMs(retryCount);
    await finalizeTransitionWithClaim(
      job.id,
      token,
      ["PENDING_REVOKE", "REVOKE_FAILED"],
      "REVOKE_FAILED",
      "REVOKE_RETRYABLE",
      {
        retryCount,
        nextRetryAt: new Date(Date.now() + delay),
        lastErrorMessage: classified.message,
        lastErrorCategory: classified.category,
      },
    );
  }
};

export const reconcileOrphans = async () => {
  const cutoff = new Date(Date.now() - RECONCILIATION_GRACE_MS);
  const orphans = await db.select().from(organizationInvitationsTable).where(and(
    isNull(organizationInvitationsTable.clerkInvitationId),
    eq(organizationInvitationsTable.compensationStatus, "NONE"),
    lte(organizationInvitationsTable.createdAt, cutoff),
  )).orderBy(asc(organizationInvitationsTable.createdAt)).limit(100);
  const invitationsApi = clerkClient.invitations as typeof clerkClient.invitations & {
    getInvitationList?: (params?: { limit?: number; offset?: number }) => Promise<{ data: Array<{ id: string; publicMetadata?: Record<string, unknown> }> }>;
  };
  if (typeof invitationsApi.getInvitationList !== "function") return 0;
  let recovered = 0;
  for (const orphan of orphans) {
    for (let offset = 0; offset < 10_000; offset += 100) {
      const page = await invitationsApi.getInvitationList({ limit: 100, offset });
      const found = page.data.find((item) => item.publicMetadata?.correlationId === orphan.correlationId);
      if (found) {
        await db.update(organizationInvitationsTable).set({ clerkInvitationId: found.id, compensationStatus: "PENDING_REVOKE", compensationReason: "RECONCILIATION", compensationUpdatedAt: new Date() }).where(and(eq(organizationInvitationsTable.id, orphan.id), isNull(organizationInvitationsTable.clerkInvitationId)));
        recovered++;
        break;
      }
      if (page.data.length < 100) break;
    }
  }
  return recovered;
};

export const startCompensationWorker = () => {
  let running = true;
  const workerId = `compensation-${process.pid}-${crypto.randomUUID()}`;
  const tick = async () => {
    if (!running) return;
    const job = await claimNextJob(workerId);
    if (job) await processCompensationJob(job);
  };
  const timer = setInterval(() => void tick().catch((error) => logger.error({ err: error }, "Compensation worker failed")), 5_000);
  timer.unref();
  void tick().catch((error) => logger.error({ err: error }, "Compensation worker failed"));
  const reconcileTimer = setInterval(() => void reconcileOrphans().catch((error) => logger.error({ err: error }, "Invitation reconciliation failed")), RECONCILIATION_GRACE_MS);
  reconcileTimer.unref();
  return () => { running = false; clearInterval(timer); clearInterval(reconcileTimer); };
};