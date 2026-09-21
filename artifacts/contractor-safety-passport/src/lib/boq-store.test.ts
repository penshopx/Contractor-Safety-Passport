import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBoqMigrationItemId,
  getBoqMigrationKey,
  parseLegacySafetyPriceCatalog,
  safetyPriceCatalogItemInputSchema,
} from "./boq-store.ts";

describe("katalog harga keselamatan", () => {
  const validCatalogItem = {
    id: "catalog-1",
    description: "Helm keselamatan",
    category: "APD & APK",
    unit: "Bh",
    referencePrice: 75_000,
    region: "Nasional",
    source: "Pemasok",
    priceUpdatedAt: "2026-09-21",
    risk: "Tinggi",
    stage: "Pelaksanaan",
    controlNeed: "Pelindung kepala wajib",
  };

  it("menerima form katalog tanpa field harga BOQ", () => {
    const { id: _id, ...form } = validCatalogItem;
    assert.equal(safetyPriceCatalogItemInputSchema.safeParse(form).success, true);
    assert.equal("unitPrice" in form, false);
  });

  it("memulihkan hanya item katalog lokal yang valid", () => {
    const recovered = parseLegacySafetyPriceCatalog(JSON.stringify([
      validCatalogItem,
      { ...validCatalogItem, id: "invalid", priceUpdatedAt: "21-09-2026" },
    ]));
    assert.deepEqual(recovered, [validCatalogItem]);
  });
});

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