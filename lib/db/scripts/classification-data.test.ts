import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { constructionClassificationSeed } from "../src/classification-data.ts";

describe("construction classification snapshot", () => {
  it("contains unique version-stable codes across all eight families", () => {
    assert.equal(constructionClassificationSeed.length, 73);
    assert.equal(new Set(constructionClassificationSeed.map((item) => item.code)).size, 73);
    assert.deepEqual(
      [...new Set(constructionClassificationSeed.map((item) => item.family))].sort(),
      ["BG", "BS", "IN", "KK", "KP", "PA", "PB", "PL"],
    );
  });

  it("keeps qualification constraints explicit instead of inferring them", () => {
    assert.deepEqual(
      constructionClassificationSeed.find((item) => item.code === "BS013")?.qualifications,
      ["MENENGAH", "BESAR"],
    );
    assert.deepEqual(
      constructionClassificationSeed.find((item) => item.code === "BG001")?.qualifications,
      ["KECIL", "MENENGAH", "BESAR"],
    );
    assert.deepEqual(
      constructionClassificationSeed.find((item) => item.code === "IN001")?.qualifications,
      [],
    );
  });
});