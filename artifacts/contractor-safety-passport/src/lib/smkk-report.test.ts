import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSections } from "./document-generator.ts";
import {
  countInvalidProjectActivityDates,
  createSmkkDocumentData,
  selectMonthlyProjectActivities,
  summarizeSmkkActivities,
  type SmkkActivity,
} from "./smkk-report.ts";

const activity = (
  title: string,
  type: string,
  status: string,
  occurredAt: string,
  projectId = 1,
  project = "Proyek A",
): SmkkActivity => ({
  title,
  type,
  status,
  occurredAt,
  project,
  projectId,
  actor: "Petugas",
});

const project = {
  name: "Proyek A",
  client: "Klien",
  location: "Jakarta",
  standard: "SMKK",
  startDate: "2026-01-01",
  endDate: null,
  progress: 50,
  value: 1_000_000,
};

const details = {
  period: "September 2026",
  providerName: "Penyedia",
  evaluation: "",
  notes: "",
  preparedBy: "",
  reviewedBy: "",
  approvedBy: "",
};

describe("laporan bulanan SMKK", () => {
  it("hanya memilih bulan kalender dan proyek yang diminta", () => {
    const activities = [
      activity("awal bulan", "Toolbox", "complete", "2026-09-01T00:00:00.000Z"),
      activity("akhir bulan", "Inspection", "open", "2026-09-30T23:59:59.999Z"),
      activity("bulan lalu", "Toolbox", "complete", "2026-08-31T23:59:59.999Z"),
      activity("bulan depan", "Toolbox", "complete", "2026-10-01T00:00:00.000Z"),
      activity("proyek lain", "Toolbox", "complete", "2026-09-15T08:00:00.000Z", 2, "Proyek B"),
    ];

    const selected = selectMonthlyProjectActivities(
      activities,
      1,
      "2026-09",
    );

    assert.deepEqual(
      selected.map(({ title }) => title),
      ["awal bulan", "akhir bulan"],
    );
  });

  it("menggunakan ringkasan yang sama untuk pratinjau dan PDF", () => {
    const activities = [
      activity("toolbox", "Toolbox", "complete", "2026-09-01T08:00:00Z"),
      activity("inspeksi", "Inspection", "open", "2026-09-02T08:00:00Z"),
      activity("izin", "Permit to work", "review", "2026-09-03T08:00:00Z"),
      activity("near miss", "Near miss", "complete", "2026-09-04T08:00:00Z"),
    ];
    const summary = summarizeSmkkActivities(activities);
    const documentData = createSmkkDocumentData(
      project,
      activities,
      summary,
      details,
    );
    const report = buildSections(documentData);
    const recap = report.sections.find(
      (section) => section.title === "2. Rekapitulasi Aktivitas Lapangan",
    );

    assert.deepEqual(summary, {
      toolbox: 1,
      inspection: 1,
      permit: 1,
      nearMiss: 1,
      openFindings: 2,
      closedFindings: 2,
    });
    assert.deepEqual(
      recap?.rows?.map((row) => Number(row[1])),
      [
        summary.toolbox,
        summary.inspection,
        summary.permit,
        summary.nearMiss,
        summary.openFindings,
        summary.closedFindings,
      ],
    );
    assert.equal(documentData.activities.length, activities.length);
  });

  it("menghasilkan laporan kosong yang valid untuk bulan tanpa aktivitas", () => {
    const selected = selectMonthlyProjectActivities([], 1, "2026-09");
    const summary = summarizeSmkkActivities(selected);
    const report = buildSections(
      createSmkkDocumentData(project, selected, summary, details),
    );
    const recap = report.sections.find(
      (section) => section.title === "2. Rekapitulasi Aktivitas Lapangan",
    );
    const activityDetails = report.sections.find(
      (section) => section.title === "3. Daftar Rincian Aktivitas",
    );

    assert.deepEqual(Object.values(summary), [0, 0, 0, 0, 0, 0]);
    assert.deepEqual(recap?.rows?.map((row) => row[1]), [
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
    ]);
    assert.deepEqual(activityDetails?.rows, [
      ["Belum ada kegiatan lapangan", "-", "-", "-"],
    ]);
  });

  it("memisahkan dua proyek dengan nama yang sama berdasarkan ID", () => {
    const activities = [
      activity("proyek pertama", "Toolbox", "complete", "2026-09-10T08:00:00Z", 101, "Nama Sama"),
      activity("proyek kedua", "Inspection", "complete", "2026-09-11T08:00:00Z", 202, "Nama Sama"),
    ];

    const selected = selectMonthlyProjectActivities(activities, 101, "2026-09");

    assert.deepEqual(selected.map(({ title }) => title), ["proyek pertama"]);
  });

  it("mengabaikan tanggal kosong dan format tanggal yang tidak valid", () => {
    const activities = [
      activity("tanggal kosong", "Toolbox", "complete", ""),
      activity("format salah", "Inspection", "open", "09/15/2026"),
      activity("tanggal mustahil", "Inspection", "open", "2026-09-31T08:00:00Z"),
      activity("valid", "Toolbox", "complete", "2026-09-15T08:00:00Z"),
    ];

    const selected = selectMonthlyProjectActivities(activities, 1, "2026-09");

    assert.deepEqual(selected.map(({ title }) => title), ["valid"]);
    assert.equal(countInvalidProjectActivityDates(activities, 1), 3);
  });

  it("menerima zona waktu eksplisit dan memakai bulan kalender pada nilai API", () => {
    const activities = [
      activity("awal September WIB", "Toolbox", "complete", "2026-09-01T00:30:00+07:00"),
      activity("akhir Agustus UTC", "Inspection", "open", "2026-08-31T17:30:00Z"),
    ];

    assert.deepEqual(
      selectMonthlyProjectActivities(activities, 1, "2026-09").map(
        ({ title }) => title,
      ),
      ["awal September WIB"],
    );
    assert.equal(countInvalidProjectActivityDates(activities, 1), 0);
  });
});