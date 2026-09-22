import assert from "node:assert/strict";
import test from "node:test";

import { qualificationSatisfies } from "./classificationFit.ts";

test("kualifikasi yang lebih tinggi memenuhi persyaratan yang lebih rendah", () => {
  assert.equal(qualificationSatisfies("BESAR", "KECIL"), true);
  assert.equal(qualificationSatisfies("BESAR", "MENENGAH"), true);
  assert.equal(qualificationSatisfies("MENENGAH", "KECIL"), true);
});

test("kualifikasi yang lebih rendah tidak memenuhi persyaratan lebih tinggi", () => {
  assert.equal(qualificationSatisfies("KECIL", "MENENGAH"), false);
  assert.equal(qualificationSatisfies("MENENGAH", "BESAR"), false);
});

test("klasifikasi tanpa persyaratan kualifikasi tetap dapat dicocokkan", () => {
  assert.equal(qualificationSatisfies(null, null), true);
  assert.equal(qualificationSatisfies("KECIL", null), true);
  assert.equal(qualificationSatisfies(null, "KECIL"), false);
});