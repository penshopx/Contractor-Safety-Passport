export type CsmsStage = {
  code: string;
  name: string;
  purpose: string;
  roles: string[];
  questions: string[];
  evidence: string[];
  validations: string[];
};

export type CsmsProfile = {
  id: "PERTAMINA_2020" | "PLN_2021";
  issuer: string;
  version: string;
  title: string;
  source: string;
  stages: CsmsStage[];
};

export const csmsProfiles: CsmsProfile[] = [
  {
    id: "PERTAMINA_2020",
    issuer: "PT Pertamina (Persero)",
    version: "A7-001/S00000/2020-S0 · Revisi 0 · 2 Juli 2020",
    title: "Pedoman Contractor Safety Management System (CSMS)",
    source: "Pedoman Fungsi Corporate HSSE No. A7-001/S00000/2020-S0",
    stages: [
      {
        code: "RA",
        name: "Penilaian risiko",
        purpose: "Menentukan tingkat risiko pekerjaan sebagai dasar penerapan tahapan dan persyaratan CSMS.",
        roles: ["Pemilik pekerjaan", "Fungsi HSSE", "Fungsi Pengadaan", "Pimpinan berwenang"],
        questions: [
          "Apakah lingkup pekerjaan, lokasi, bahaya, konsekuensi, dan pengendalian awal telah diidentifikasi?",
          "Apakah tingkat risiko pekerjaan telah ditetapkan dan disetujui sebelum proses pemilihan penyedia?",
        ],
        evidence: ["Form penilaian risiko pekerjaan", "Daftar bahaya dan pengendalian", "Persetujuan tingkat risiko"],
        validations: ["Penilaian dilakukan sebelum pemilihan penyedia", "Tingkat risiko harus menjadi dasar kualifikasi dan persyaratan HSSE pengadaan"],
      },
      {
        code: "PQ",
        name: "Prakualifikasi",
        purpose: "Menilai kemampuan penyedia dalam menerapkan sistem manajemen HSSE dan mengelola risiko.",
        roles: ["Penyedia Barang/Jasa", "Tim Registrasi", "Tim Verifikator CSMS", "Fungsi HSSE"],
        questions: [
          "Apakah kebijakan, organisasi, sasaran, dan program HSSE telah disahkan pimpinan?",
          "Apakah statistik insiden, kompetensi, audit, serta pengelolaan subkontraktor dapat diverifikasi?",
        ],
        evidence: ["Form penilaian kualifikasi", "Kebijakan dan organisasi HSSE", "Statistik insiden", "Sertifikat kompetensi", "Hasil audit/verifikasi"],
        validations: ["Bukti harus masih berlaku dan dapat diverifikasi", "Hasil kualifikasi harus menyatakan kelompok Rendah, Menengah, atau Tinggi"],
      },
      {
        code: "VS",
        name: "Seleksi",
        purpose: "Memilih penyedia dengan HSSE Plan yang sesuai risiko pekerjaan dan menjadi bagian evaluasi pengadaan.",
        roles: ["Fungsi Pengadaan", "Pemilik pekerjaan", "Fungsi HSSE", "Peserta pemilihan"],
        questions: [
          "Apakah persyaratan HSSE dan tingkat risiko tercantum dalam dokumen pengadaan?",
          "Apakah HSSE Plan peserta menjawab bahaya, pengendalian, sumber daya, dan biaya keselamatan?",
        ],
        evidence: ["Dokumen pengadaan", "Risk assessment pekerjaan", "HSSE Plan penawaran", "Berita acara evaluasi HSSE"],
        validations: ["Kualifikasi penyedia harus sesuai tingkat risiko", "Evaluasi HSSE Plan harus terdokumentasi sebelum penetapan pemenang"],
      },
      {
        code: "PJA",
        name: "Pra-pelaksanaan",
        purpose: "Memastikan HSSE Plan telah dikomunikasikan, dipahami, dan siap diterapkan sebelum pekerjaan dimulai.",
        roles: ["Penanggung Jawab Kontrak", "Pelaksana Kontrak", "Fungsi HSSE", "Pengawas pekerjaan"],
        questions: [
          "Apakah kick-off meeting, bridging document, JSA/HIRADC, izin kerja, dan rencana darurat telah disepakati?",
          "Apakah personel, peralatan, APD, dan fasilitas keselamatan siap dan telah diverifikasi?",
        ],
        evidence: ["Berita acara pre-job meeting", "HSSE Plan final", "Bridging document", "JSA/HIRADC", "Daftar personel dan peralatan"],
        validations: ["Seluruh tindakan pra-kerja kritis harus ditutup", "Pekerjaan tidak boleh dimulai sebelum persetujuan kesiapan"],
      },
      {
        code: "WIP",
        name: "Pelaksanaan",
        purpose: "Memastikan HSSE Plan yang disepakati diterapkan selama pekerjaan kontrak.",
        roles: ["Pelaksana Kontrak", "Pengawas pekerjaan", "Fungsi HSSE", "Penanggung Jawab Kontrak"],
        questions: [
          "Apakah inspeksi, toolbox meeting, izin kerja, pengendalian perubahan, dan pelaporan insiden berjalan?",
          "Apakah temuan dan ketidaksesuaian ditindaklanjuti tepat waktu?",
        ],
        evidence: ["Catatan inspeksi", "Toolbox meeting", "Permit to work", "Laporan insiden", "Daftar tindakan koreksi", "Penilaian pekerjaan berjalan"],
        validations: ["Bukti harus sesuai periode pelaksanaan", "Temuan kritis harus memiliki tindakan, penanggung jawab, dan tenggat"],
      },
      {
        code: "FE",
        name: "Evaluasi akhir",
        purpose: "Mengevaluasi kinerja HSSE pelaksana kontrak saat pekerjaan berakhir.",
        roles: ["Penanggung Jawab Kontrak", "Fungsi HSSE", "Pengawas pekerjaan", "Pelaksana Kontrak"],
        questions: [
          "Apakah capaian KPI, insiden, kepatuhan, dan penyelesaian temuan telah direkap?",
          "Apakah pelajaran dan rekomendasi untuk pengadaan berikutnya telah dicatat?",
        ],
        evidence: ["Form evaluasi akhir", "Rekap KPI HSSE", "Rekap insiden dan temuan", "Berita acara penutupan kontrak"],
        validations: ["Evaluasi harus diselesaikan pada penutupan kontrak", "Hasil akhir harus dapat ditelusuri ke bukti selama pelaksanaan"],
      },
    ],
  },
  {
    id: "PLN_2021",
    issuer: "PT PLN (Persero)",
    version: "SPLN U1.006:2021",
    title: "Contractor Safety Management System (CSMS)",
    source: "Standar PLN SPLN U1.006:2021",
    stages: [
      {
        code: "RA",
        name: "Penilaian risiko",
        purpose: "Menetapkan tingkat risiko awal pekerjaan: rendah, moderat, tinggi, sangat tinggi, atau ekstrem.",
        roles: ["User/pemilik proses bisnis", "Fungsi K3L", "EVP/GM/MD"],
        questions: ["Apakah ruang lingkup, bahaya, dampak sosial-lingkungan, dan pengendalian telah dinilai?", "Apakah level risiko awal sudah ditetapkan?"],
        evidence: ["Daftar risk assessment atau Form IBPPR", "Usulan pengadaan"],
        validations: ["Level risiko awal wajib tersedia", "Pekerjaan yang tidak ada dalam daftar risiko wajib menggunakan IBPPR"],
      },
      {
        code: "PQ",
        name: "Prakualifikasi kontraktor",
        purpose: "Memastikan kontraktor memiliki kapabilitas K3L sesuai tingkat risiko pekerjaan.",
        roles: ["Tim Prakualifikasi CSMS", "Kontraktor", "User", "Fungsi K3L"],
        questions: ["Apakah self-assessment dan bukti pendukung lengkap?", "Apakah verifikasi dokumen/lapangan telah dilakukan?"],
        evidence: ["Form prakualifikasi", "Bukti sistem K3L", "Berita acara", "Sertifikat kualifikasi CSMS"],
        validations: ["Wajib untuk seluruh tingkat risiko", "Sertifikat kualifikasi harus diterbitkan PLN dan masih berlaku"],
      },
      {
        code: "SEL",
        name: "Pengadaan barang/jasa",
        purpose: "Menilai pemenuhan persyaratan K3L dalam proses pemilihan.",
        roles: ["Pejabat pengadaan", "User", "Fungsi K3L", "Kontraktor"],
        questions: ["Apakah persyaratan K3L dan evaluasi rencana keselamatan tercantum dalam pengadaan?"],
        evidence: ["Dokumen pengadaan", "Rencana K3L", "Hasil evaluasi"],
        validations: ["Diterapkan untuk risiko moderat sampai ekstrem", "Kontraktor harus memenuhi kualifikasi yang dipersyaratkan"],
      },
      {
        code: "PJA",
        name: "Kegiatan pra-pelaksanaan",
        purpose: "Memastikan kesiapan rencana, personel, peralatan, komunikasi, dan keadaan darurat.",
        roles: ["User", "Kontraktor", "Fungsi K3L", "Pengawas pekerjaan"],
        questions: ["Apakah pre-job meeting dan seluruh kesiapan K3L telah ditutup sebelum mobilisasi?"],
        evidence: ["Berita acara pre-job meeting", "JSA/HIRADC", "Rencana darurat", "Daftar personel/peralatan"],
        validations: ["Diterapkan untuk risiko moderat sampai ekstrem", "Pekerjaan dimulai setelah kesiapan disetujui"],
      },
      {
        code: "WIP",
        name: "Pekerjaan sedang berlangsung",
        purpose: "Memantau penerapan persyaratan K3L selama pekerjaan.",
        roles: ["Kontraktor", "User/pengawas", "Fungsi K3L"],
        questions: ["Apakah inspeksi, pelaporan, evaluasi berkala, dan tindak lanjut temuan berjalan?"],
        evidence: ["Inspeksi", "Toolbox meeting", "Izin kerja", "Laporan insiden", "Tindakan koreksi"],
        validations: ["Diterapkan untuk risiko moderat sampai ekstrem", "Temuan wajib memiliki status tindak lanjut"],
      },
      {
        code: "FE",
        name: "Evaluasi akhir pekerjaan",
        purpose: "Menilai kinerja akhir K3L kontraktor sebagai masukan pekerjaan berikutnya.",
        roles: ["User", "Fungsi K3L", "Kontraktor"],
        questions: ["Apakah hasil kinerja, insiden, dan tindak lanjut telah dirangkum dan disepakati?"],
        evidence: ["Form evaluasi akhir", "Rekap kinerja K3L", "Berita acara penyelesaian"],
        validations: ["Diterapkan untuk risiko moderat sampai ekstrem", "Hasil harus ditutup sebelum administrasi akhir pekerjaan"],
      },
    ],
  },
];

export const findCsmsProfile = (id: string | undefined) =>
  csmsProfiles.find((profile) => profile.id === id);

export const resolveCsmsProfileForTemplate = (
  template: string,
  profileId: string | undefined,
) => {
  if (template !== "CSMS_PRAKUALIFIKASI") return undefined;
  const profile = findCsmsProfile(profileId);
  if (!profile) {
    throw new Error("Profil issuer dan versi pedoman CSMS wajib dipilih");
  }
  return profile;
};