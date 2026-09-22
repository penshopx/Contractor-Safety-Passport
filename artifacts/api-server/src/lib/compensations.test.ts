import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBackoffMs,
  canTransitionCompensation,
  classifyClerkError,
} from "./compensations.ts";

test("state machine accepts every legal retry transition", () => {
  assert.equal(canTransitionCompensation("NONE", "PENDING_REVOKE"), true);
  assert.equal(canTransitionCompensation("PENDING_REVOKE", "REVOKE_FAILED"), true);
  assert.equal(canTransitionCompensation("REVOKE_FAILED", "REVOKE_FAILED"), true);
  assert.equal(canTransitionCompensation("REVOKE_FAILED", "REVOKED"), true);
  assert.equal(
    canTransitionCompensation("REVOKE_PERMANENTLY_FAILED", "PENDING_REVOKE"),
    true,
  );
  assert.equal(canTransitionCompensation("DEAD_LETTER", "PENDING_REVOKE"), true);
});

test("state machine rejects unsafe transitions", () => {
  assert.equal(canTransitionCompensation("NONE", "REVOKED"), false);
  assert.equal(canTransitionCompensation("REVOKED", "PENDING_REVOKE"), false);
  assert.equal(canTransitionCompensation("DEAD_LETTER", "REVOKED"), false);
});

test("Clerk terminal states are idempotent successes", () => {
  assert.equal(classifyClerkError({ status: 404, message: "not found" }).category, "TERMINAL_SUCCESS");
  assert.equal(classifyClerkError({ status: 409, message: "already revoked" }).category, "TERMINAL_SUCCESS");
});

test("Clerk retryable and permanent errors are separated", () => {
  assert.equal(classifyClerkError({ status: 408, message: "timeout" }).category, "RETRYABLE");
  assert.equal(classifyClerkError({ status: 503, message: "unavailable" }).category, "RETRYABLE");
  assert.equal(classifyClerkError({ status: 400, message: "bad request" }).category, "PERMANENT");
  assert.equal(classifyClerkError(new Error("unexpected")).category, "UNKNOWN");
});

test("Clerk error messages redact email addresses before persistence", () => {
  assert.equal(
    classifyClerkError(new Error("Invitation for user@example.com failed")).message,
    "Invitation for [redacted-email] failed",
  );
});

test("429 honors numeric Retry-After", () => {
  const result = classifyClerkError({
    status: 429,
    message: "rate limited",
    headers: { "retry-after": "60" },
  });
  assert.equal(result.category, "RETRYABLE");
  assert.equal(result.retryAfterMs, 60_000);
});

test("backoff grows exponentially and respects its cap", () => {
  assert.equal(calculateBackoffMs(0, () => 0), 1_000);
  assert.equal(calculateBackoffMs(3, () => 0), 8_000);
  assert.equal(calculateBackoffMs(20, () => 0), 300_000);
});