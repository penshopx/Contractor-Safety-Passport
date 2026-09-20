import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCsmsReadiness,
  csmsReadinessItemKey,
  csmsProfiles,
  resolveCsmsProfileForTemplate,
} from "./csmsProfiles.ts";

describe("profil CSMS issuer", () => {
  it("menjaga enam tahap Pertamina dalam urutan resmi", () => {
    const profile = csmsProfiles.find((item) => item.id === "PERTAMINA_2020");

    assert.ok(profile);
    assert.deepEqual(
      profile.stages.map((stage) => stage.name),
      [
        "Penilaian risiko",
        "Prakualifikasi",
        "Seleksi",
        "Pra-pelaksanaan",
        "Pelaksanaan",
        "Evaluasi akhir",
      ],
    );
  });

  it("menjaga enam tahap PLN dalam urutan resmi", () => {
    const profile = csmsProfiles.find((item) => item.id === "PLN_2021");

    assert.ok(profile);
    assert.deepEqual(
      profile.stages.map((stage) => stage.name),
      [
        "Penilaian risiko",
        "Prakualifikasi kontraktor",
        "Pengadaan barang/jasa",
        "Kegiatan pra-pelaksanaan",
        "Pekerjaan sedang berlangsung",
        "Evaluasi akhir pekerjaan",
      ],
    );
  });

  it("mewajibkan isi dan validasi khusus pada setiap tahap", () => {
    for (const profile of csmsProfiles) {
      assert.ok(profile.issuer);
      assert.ok(profile.version);
      assert.ok(profile.source);
      for (const stage of profile.stages) {
        assert.ok(stage.roles.length > 0, `${profile.id}/${stage.code}: roles`);
        assert.ok(stage.questions.length > 0, `${profile.id}/${stage.code}: questions`);
        assert.ok(stage.evidence.length > 0, `${profile.id}/${stage.code}: evidence`);
        assert.ok(stage.validations.length > 0, `${profile.id}/${stage.code}: validations`);
      }
    }
  });

  it("menolak generator CSMS tanpa profil yang didukung", () => {
    assert.throws(
      () => resolveCsmsProfileForTemplate("CSMS_PRAKUALIFIKASI", undefined),
      /wajib dipilih/,
    );
    assert.equal(
      resolveCsmsProfileForTemplate("RKK_TENDER", undefined),
      undefined,
    );
  });

  it("menghitung progres hanya dari tahap profil yang aktif", () => {
    const pertamina = csmsProfiles.find((item) => item.id === "PERTAMINA_2020");
    assert.ok(pertamina);
    const firstQuestion = csmsReadinessItemKey("RA", "question", 0);
    const foreignPlnStage = csmsReadinessItemKey("SEL", "question", 0);

    const result = buildCsmsReadiness(
      7,
      pertamina,
      {
        [firstQuestion]: "complete",
        [foreignPlnStage]: "complete",
      },
      null,
    );

    assert.equal(result.profileId, "PERTAMINA_2020");
    assert.equal(result.completed, 1);
    assert.deepEqual(result.itemStatuses, [
      { key: firstQuestion, status: "complete" },
    ]);
    assert.equal(result.stages.some((stage) => stage.code === "SEL"), false);
  });

  it("membedakan butir lengkap dan tindak lanjut dalam ringkasan tahap", () => {
    const pln = csmsProfiles.find((item) => item.id === "PLN_2021");
    assert.ok(pln);

    const result = buildCsmsReadiness(
      8,
      pln,
      {
        [csmsReadinessItemKey("RA", "question", 0)]: "complete",
        [csmsReadinessItemKey("RA", "evidence", 0)]: "follow_up",
      },
      null,
    );

    assert.equal(result.completed, 1);
    assert.equal(result.followUp, 1);
    assert.equal(result.stages[0]?.completed, 1);
    assert.equal(result.stages[0]?.followUp, 1);
  });
});