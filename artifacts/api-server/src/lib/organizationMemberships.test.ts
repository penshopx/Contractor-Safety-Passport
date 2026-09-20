import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideMemberRoleChange } from "./organizationMemberships.ts";

describe("perubahan peran anggota organisasi", () => {
  it("menolak perubahan peran pemilik", () => {
    assert.deepEqual(decideMemberRoleChange("owner"), {
      allowed: false,
      status: 403,
      error: "Peran pemilik tidak dapat diubah",
    });
  });

  it("mengizinkan perubahan peran anggota non-pemilik", () => {
    for (const role of ["safety_expert", "field_officer", "viewer"] as const) {
      assert.deepEqual(decideMemberRoleChange(role), { allowed: true });
    }
  });
});