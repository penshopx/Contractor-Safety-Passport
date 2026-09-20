import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
    assert.throws(
      () => resolveCsmsProfileForTemplate("CSMS_PRAKUALIFIKASI", "UNKNOWN"),
      /wajib dipilih/,
    );
    assert.equal(
      resolveCsmsProfileForTemplate("RKK_TENDER", undefined),
      undefined,
    );
  });
});