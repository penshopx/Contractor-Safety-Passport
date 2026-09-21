import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSafetyBoqCatalogSnapshot,
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

  it("menyalin harga dan metadata katalog ke draft lokal tanpa mengikuti perubahan katalog", () => {
    const catalogItem = { ...validCatalogItem };
    const snapshot = createSafetyBoqCatalogSnapshot(catalogItem, null, "boq-local");

    Object.assign(catalogItem, {
      referencePrice: 90_000,
      region: "Jabodetabek",
      source: "Pemasok revisi",
      priceUpdatedAt: "2026-10-01",
    });

    assert.deepEqual(
      {
        projectId: snapshot.projectId,
        unitPrice: snapshot.unitPrice,
        priceRegion: snapshot.priceRegion,
        priceSource: snapshot.priceSource,
        priceUpdatedAt: snapshot.priceUpdatedAt,
      },
      {
        projectId: null,
        unitPrice: 75_000,
        priceRegion: "Nasional",
        priceSource: "Pemasok",
        priceUpdatedAt: "2026-09-21",
      },
    );
  });

  it("membuat item proyek baru dari versi katalog terbaru", () => {
    const revisedCatalogItem = {
      ...validCatalogItem,
      referencePrice: 90_000,
      region: "Jabodetabek",
      source: "Pemasok revisi",
      priceUpdatedAt: "2026-10-01",
    };

    const snapshot = createSafetyBoqCatalogSnapshot(revisedCatalogItem, 42, "boq-project");

    assert.equal(snapshot.projectId, 42);
    assert.equal(snapshot.catalogItemId, validCatalogItem.id);
    assert.equal(snapshot.unitPrice, 90_000);
    assert.equal(snapshot.priceRegion, "Jabodetabek");
    assert.equal(snapshot.priceSource, "Pemasok revisi");
    assert.equal(snapshot.priceUpdatedAt, "2026-10-01");
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