import assert from "node:assert/strict";
import { test } from "node:test";
import { selectEvidenceCandidates, validateEvidenceSuggestions } from "./evidenceSuggestions.ts";

const readiness = {
  stages: [{
    code: "A",
    name: "Persiapan",
    evidence: ["Rencana kerja", "Catatan pertemuan", "Daftar periksa"],
  }],
  itemStatuses: [
    { key: "A:evidence:0", status: "complete" as const },
    { key: "A:evidence:2", status: "follow_up" as const },
  ],
};

test("only unfinished evidence is suggested and follow-up comes first", () => {
  const candidates = selectEvidenceCandidates(readiness);
  assert.deepEqual(candidates.map(({ key, status }) => [key, status]), [
    ["A:evidence:2", "follow_up"],
    ["A:evidence:1", "unreviewed"],
  ]);
});

test("model output cannot invent keys or omit an item", () => {
  const candidates = selectEvidenceCandidates(readiness);
  assert.equal(validateEvidenceSuggestions(JSON.stringify({
    suggestions: [{ key: "other", nextStep: "Periksa bukti tersedia." }],
  }), candidates), null);
  assert.equal(validateEvidenceSuggestions(JSON.stringify({
    suggestions: [{ key: "A:evidence:2", nextStep: "Periksa bukti tersedia." }],
  }), candidates), null);
  const result = validateEvidenceSuggestions(JSON.stringify({
    suggestions: [
      { key: "A:evidence:1", nextStep: "Tinjau catatan pertemuan yang tersedia." },
      { key: "A:evidence:2", nextStep: "Periksa daftar periksa dan catat kekurangannya." },
    ],
  }), candidates);
  assert.equal(result?.[0].key, "A:evidence:2");
  assert.equal(result?.[0].evidence, "Daftar periksa");
});