import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type TemplateKind = "rkk" | "csms" | "hse-plan" | "periodic-report";

export interface ProjectDocumentData {
  kind: TemplateKind;
  project: {
    name: string;
    client: string;
    location: string;
    standard: string;
    startDate: string;
    endDate: string | null;
    progress: number;
    value: number;
  };
  people: Array<{ name: string; role: string; level: string; skkni: string; status: string }>;
  certificates: Array<{ owner: string; credential: string; issuer: string; expiresAt: string; status: string }>;
  activities: Array<{ type: string; title: string; actor: string; status: string; occurredAt: string }>;
  extra: Record<string, string>;
}

export const TEMPLATE_META: Record<TemplateKind, { title: string; version: string; basis: string }> = {
  rkk: {
    title: "Rencana Keselamatan Konstruksi (RKK)",
    version: "RKK-Pelaksanaan v1.0 · 2026",
    basis: "Permen PUPR No. 10 Tahun 2021 tentang Pedoman Sistem Manajemen Keselamatan Konstruksi",
  },
  csms: {
    title: "Formulir Pra-Kualifikasi CSMS",
    version: "CSMS-PQ v1.0 · 2026",
    basis: "IOGP Report 423 (2010), ISO 45001:2018, dan persyaratan K3 yang berlaku",
  },
  "hse-plan": {
    title: "HSE Plan Proyek",
    version: "HSE-PLAN v1.0 · 2026",
    basis: "ISO 45001:2018, PP No. 50 Tahun 2012, dan Permen PUPR No. 10 Tahun 2021",
  },
  "periodic-report": {
    title: "Laporan Berkala Kinerja Keselamatan",
    version: "HSE-REPORT v1.0 · 2026",
    basis: "Permen PUPR No. 10 Tahun 2021 dan praktik pemantauan kinerja HSE/CSMS",
  },
};

const labels: Record<string, string> = {
  providerName: "Nama penyedia jasa",
  contractNumber: "Nomor kontrak",
  approver: "Penanggung jawab/pengesah",
  scope: "Ruang lingkup pekerjaan",
  hazards: "Bahaya utama dan pengendalian",
  emergencyContact: "Kontak tanggap darurat",
  period: "Periode laporan",
  hsePolicy: "Pernyataan kebijakan HSE",
};

export function buildSections(data: ProjectDocumentData) {
  const meta = TEMPLATE_META[data.kind];
  const identity = [
    ["Paket pekerjaan", data.project.name],
    ["Pemberi tugas", data.project.client],
    ["Penyedia jasa", data.extra.providerName],
    ["Lokasi", data.project.location],
    ["Nomor kontrak", data.extra.contractNumber],
    ["Periode", data.extra.period || `${formatDate(data.project.startDate)} – ${formatDate(data.project.endDate)}`],
    ["Nilai proyek", formatCurrency(data.project.value)],
  ];
  const people = data.people.length
    ? data.people.map((item) => [item.name, item.role, `${item.level} · ${item.skkni}`, statusLabel(item.status)])
    : [["Belum ada personel proyek", "-", "-", "-"]];
  const certificates = data.certificates.length
    ? data.certificates.map((item) => [item.owner, item.credential, item.issuer, `${formatDate(item.expiresAt)} · ${statusLabel(item.status)}`])
    : [["Belum ada sertifikat yang terhubung", "-", "-", "-"]];
  const activities = data.activities.length
    ? data.activities.map((item) => [formatDate(item.occurredAt), item.type, item.title, `${item.actor} · ${statusLabel(item.status)}`])
    : [["Belum ada kegiatan lapangan", "-", "-", "-"]];

  const common = [
    { title: "Identitas Proyek", headers: ["Data", "Keterangan"], rows: identity },
    { title: "Organisasi dan Kompetensi", headers: ["Nama", "Jabatan", "Kompetensi", "Status"], rows: people },
    { title: "Sertifikasi Personel", headers: ["Pemilik", "Sertifikat", "Penerbit", "Masa berlaku"], rows: certificates },
  ];

  if (data.kind === "rkk") {
    return {
      meta,
      sections: [
        ...common,
        textSection("1. Kepemimpinan dan Partisipasi Pekerja", `Komitmen keselamatan konstruksi untuk ${data.project.name}. Pengesahan: ${data.extra.approver}.`),
        textSection("2. Perencanaan Keselamatan Konstruksi", `Ruang lingkup: ${data.extra.scope}\nBahaya dan pengendalian utama: ${data.extra.hazards}`),
        textSection("3. Dukungan Keselamatan Konstruksi", "Kompetensi, komunikasi, dokumentasi, sumber daya, dan sarana keselamatan disediakan sesuai tingkat risiko pekerjaan."),
        textSection("4. Operasi Keselamatan Konstruksi", `Pelaksanaan pekerjaan aman, inspeksi, izin kerja, dan kesiapsiagaan darurat. Kontak darurat: ${data.extra.emergencyContact}.`),
        { title: "5. Evaluasi Kinerja Keselamatan Konstruksi", headers: ["Tanggal", "Jenis", "Kegiatan", "Pelaksana / Status"], rows: activities },
      ],
    };
  }

  if (data.kind === "csms") {
    return {
      meta,
      sections: [
        ...common,
        textSection("A. Informasi Umum dan Komitmen HSE", data.extra.hsePolicy),
        textSection("B. Penilaian Risiko Pekerjaan", `Lingkup: ${data.extra.scope}\nBahaya, dampak, dan pengendalian: ${data.extra.hazards}`),
        textSection("C. Sistem Manajemen dan Pengendalian", "Mencakup kebijakan, tanggung jawab, kompetensi, HIRADC/JSA, APD, izin kerja, pemeliharaan peralatan, pengelolaan lingkungan, pelaporan insiden, audit, dan tinjauan manajemen."),
        textSection("D. Tanggap Darurat", `Koordinasi keadaan darurat dan latihan berkala. Kontak darurat: ${data.extra.emergencyContact}.`),
        { title: "E. Bukti Implementasi", headers: ["Tanggal", "Jenis", "Kegiatan", "Pelaksana / Status"], rows: activities },
      ],
    };
  }

  if (data.kind === "hse-plan") {
    return {
      meta,
      sections: [
        ...common,
        textSection("Kebijakan, Sasaran, dan Target HSE", data.extra.hsePolicy),
        textSection("Lingkup dan Perencanaan", `${data.extra.scope}\nRisiko utama: ${data.extra.hazards}`),
        textSection("Implementasi", "Program meliputi induksi, pelatihan, komunikasi/toolbox meeting, APD, izin kerja, inspeksi, pengendalian subkontraktor, pengelolaan lingkungan, serta pelaporan dan investigasi insiden."),
        textSection("Kesiapsiagaan dan Tanggap Darurat", `Kontak darurat: ${data.extra.emergencyContact}. Jalur komunikasi, evakuasi, pertolongan pertama, dan simulasi wajib dipelihara selama proyek.`),
        { title: "Pemantauan dan Tindakan Koreksi", headers: ["Tanggal", "Jenis", "Kegiatan", "Pelaksana / Status"], rows: activities },
      ],
    };
  }

  return {
    meta,
    sections: [
      ...common.slice(0, 1),
      textSection("Ringkasan Eksekutif", `Periode ${data.extra.period}. Kemajuan proyek ${data.project.progress}%. ${data.extra.hsePolicy}`),
      { title: "Kegiatan dan Temuan Periode Berjalan", headers: ["Tanggal", "Jenis", "Kegiatan", "Pelaksana / Status"], rows: activities },
      textSection("Risiko dan Tindak Lanjut", data.extra.hazards),
      textSection("Pengesahan", `Disusun oleh ${data.extra.providerName} dan disahkan oleh ${data.extra.approver}.`),
    ],
  };
}

export async function downloadPdf(data: ProjectDocumentData) {
  const { meta, sections } = buildSections(data);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(meta.title, 105, 28, { align: "center", maxWidth: 170 });
  pdf.setFontSize(11);
  pdf.text(data.project.name, 105, 48, { align: "center", maxWidth: 165 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(meta.basis, 105, 63, { align: "center", maxWidth: 170 });
  pdf.text(meta.version, 105, 72, { align: "center" });
  let y = 88;
  for (const section of sections) {
    if (y > 255) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(section.title, 14, y);
    y += 4;
    autoTable(pdf, {
      startY: y,
      head: [section.headers],
      body: section.rows,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [15, 86, 138], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  }
  addPdfFooters(pdf, meta.version);
  pdf.save(fileName(data, "pdf"));
}

export async function downloadDocx(data: ProjectDocumentData) {
  const { meta, sections } = buildSections(data);
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: meta.title, heading: HeadingLevel.TITLE, alignment: "center" }),
    new Paragraph({ text: data.project.name, heading: HeadingLevel.HEADING_1, alignment: "center" }),
    new Paragraph({ children: [new TextRun({ text: meta.basis, italics: true })], alignment: "center" }),
    new Paragraph({ text: meta.version, alignment: "center", spacing: { after: 420 } }),
  ];
  for (const section of sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2, pageBreakBefore: false }));
    children.push(makeDocxTable(section.headers, section.rows));
    children.push(new Paragraph(""));
  }
  const document = new Document({
    sections: [{ properties: {}, children }],
    creator: data.extra.providerName,
    title: `${meta.title} - ${data.project.name}`,
    description: `${meta.basis}; ${meta.version}`,
  });
  const blob = await Packer.toBlob(document);
  triggerDownload(blob, fileName(data, "docx"));
}

function textSection(title: string, text: string) {
  return { title, headers: ["Uraian"], rows: text.split("\n").map((line) => [line || "-"]) };
}

function makeDocxTable(headers: string[], rows: string[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map((value) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })] })) }),
      ...rows.map((row) => new TableRow({ children: row.map((value) => new TableCell({ children: [new Paragraph(value || "-")] })) })),
    ],
  });
}

function addPdfFooters(pdf: jsPDF, version: string) {
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(7);
    pdf.setTextColor(90);
    pdf.text(`${version} · Halaman ${page} dari ${pages}`, 105, 290, { align: "center" });
  }
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileName(data: ProjectDocumentData, extension: string) {
  const slug = data.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${data.kind}-${slug || "proyek"}.${extension}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function statusLabel(value: string) {
  return value.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function fieldLabel(key: string) {
  return labels[key] ?? key;
}