import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import { requireRole } from "./organizationContext.ts";

const runOwnerGuard = (role?: "owner" | "safety_expert" | "field_officer" | "viewer") => {
  let nextCalled = false;
  let statusCode: number | undefined;
  let body: unknown;
  const req = {
    organizationContext: role
      ? { userId: "user_1", organizationId: "org_1", role }
      : undefined,
  } as Request;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;
  const next = (() => {
    nextCalled = true;
  }) as NextFunction;

  requireRole("owner")(req, res, next);
  return { nextCalled, statusCode, body };
};

describe("pembatasan pengelolaan keanggotaan", () => {
  it("mengizinkan pemilik melihat dan mengubah keanggotaan", () => {
    assert.deepEqual(runOwnerGuard("owner"), {
      nextCalled: true,
      statusCode: undefined,
      body: undefined,
    });
  });

  it("menolak setiap peran non-pemilik", () => {
    for (const role of ["safety_expert", "field_officer", "viewer"] as const) {
      assert.deepEqual(runOwnerGuard(role), {
        nextCalled: false,
        statusCode: 403,
        body: { error: "Peran Anda tidak memiliki akses untuk tindakan ini" },
      });
    }
  });

  it("menolak permintaan tanpa konteks organisasi", () => {
    assert.equal(runOwnerGuard().statusCode, 403);
  });
});