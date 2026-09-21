import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBoqMigrationItemId, getBoqMigrationKey } from "./boq-store.ts";

describe("identitas migrasi BOQ lokal", () => {
  it("stabil untuk organisasi, proyek, dan item lokal yang sama", () => {
    const key = getBoqMigrationKey("org-a", 42, "device-a", "local-item");

    assert.equal(key, getBoqMigrationKey("org-a", 42, "device-a", "local-item"));
    assert.equal(getBoqMigrationItemId(key), getBoqMigrationItemId(key));
  });

  it("berbeda saat organisasi, proyek, atau sumber lokal berubah", () => {
    const first = getBoqMigrationKey("org-a", 42, "device-a", "seed-1");
    const otherOrganization = getBoqMigrationKey("org-b", 42, "device-a", "seed-1");
    const otherProject = getBoqMigrationKey("org-a", 43, "device-a", "seed-1");
    const otherDevice = getBoqMigrationKey("org-a", 42, "device-b", "seed-1");

    assert.notEqual(first, otherOrganization);
    assert.notEqual(first, otherProject);
    assert.notEqual(first, otherDevice);
    assert.notEqual(getBoqMigrationItemId(first), getBoqMigrationItemId(otherProject));
  });
});