import { sql } from "drizzle-orm";

const EVIDENCE_LOCK_NAMESPACE = 45;

export const evidencePathLockQuery = (objectPath: string) =>
  sql`SELECT pg_advisory_xact_lock(${EVIDENCE_LOCK_NAMESPACE}, hashtext(${objectPath}))`;