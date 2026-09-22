# Blueprint Produk — Contractor Safety Passport

**Status:** Blueprint produk utama  
**Cakupan:** Badan usaha jasa konstruksi, profesional konstruksi, pemilik proyek, dan operasi keselamatan lapangan  
**Prinsip utama:** Klasifikasi usaha → konteks proyek → risiko → kompetensi → bukti → keputusan kesiapan

---

## 1. Tujuan Produk

Contractor Safety Passport adalah platform kesiapan jasa konstruksi yang membantu organisasi dan profesional membuktikan bahwa mereka:

1. Berwenang dan sesuai untuk menjalankan jenis pekerjaan tertentu.
2. Memiliki tenaga profesional dengan kompetensi yang tepat.
3. Memahami risiko pekerjaan dan memiliki kontrol yang memadai.
4. Memiliki RKK, CSMS, BOQ keselamatan, dan bukti yang relevan.
5. Siap melakukan mobilisasi dan mempertahankan kepatuhan selama proyek berjalan.
6. Memiliki rekam jejak yang dapat diverifikasi untuk tender dan penugasan berikutnya.

Produk tidak hanya menyimpan dokumen. Produk harus mengubah data usaha, proyek, kompetensi, dan bukti lapangan menjadi keputusan yang dapat dijelaskan dan diaudit.

---

## 2. Proposition Utama

### Untuk badan usaha

- Menilai kesesuaian perusahaan terhadap proyek sebelum mengikuti tender.
- Mengetahui kekurangan tenaga ahli, sertifikat, kontrol, dan dokumen.
- Menghasilkan baseline RKK, CSMS, risk register, dan BOQ keselamatan.
- Menjaga bukti perusahaan tetap siap untuk prakualifikasi.
- Membangun rekam jejak keselamatan menurut jenis pekerjaan.

### Untuk profesional jasa konstruksi

- Memiliki passport kompetensi digital yang dapat diverifikasi.
- Menyimpan SKK, SKKNI, pelatihan, pengalaman, dan penugasan.
- Mengetahui pekerjaan dan jenjang yang sesuai dengan kompetensinya.
- Mendapat peringatan sertifikat kedaluwarsa dan rekomendasi pengembangan.
- Membuktikan pengalaman pada klasifikasi dan risiko proyek tertentu.

### Untuk pemilik proyek

- Memeriksa kesiapan kontraktor secara konsisten.
- Memastikan tenaga profesional memenuhi persyaratan.
- Melihat alasan di balik status siap atau tidak siap.
- Memantau inspeksi, temuan, dan tindakan korektif.
- Membandingkan kinerja tanpa membuka data organisasi lain.

### Untuk petugas lapangan

- Mendapat checklist sesuai aktivitas dan risiko aktual.
- Bekerja secara offline dengan bukti foto, lokasi, waktu, dan tanda tangan.
- Menindaklanjuti temuan sampai terverifikasi selesai.
- Mengakses informasi kompetensi dan kontrol minimum di lokasi.

---

## 3. Model Konteks Produk

Seluruh keputusan aplikasi mengikuti rantai:

```text
Organisasi
  → Klasifikasi dan subklasifikasi usaha
  → Proyek dan subklasifikasi pekerjaan
  → Work package dan aktivitas
  → Bahaya, risiko, dan kontrol
  → Kebutuhan kompetensi dan bukti
  → Personel, sertifikat, dan penugasan
  → RKK, CSMS, BOQ keselamatan
  → Readiness gate
  → Operasi lapangan
  → Temuan dan tindakan korektif
  → Rekam jejak dan analitik
```

Setiap keputusan harus dapat menjawab:

- Data apa yang digunakan?
- Versi referensi apa yang digunakan?
- Siapa yang meninjau atau menyetujui?
- Persyaratan mana yang belum terpenuhi?
- Bukti apa yang mendukung keputusan?

---

## 4. Taksonomi Usaha Konstruksi

### 4.1 Jenis usaha

- Pekerjaan konstruksi.

### 4.2 Sifat usaha

- Umum.
- Spesialis.

### 4.3 Kategori badan usaha

- BUJKN.
- BUJKA.

### 4.4 Klasifikasi umum

#### BG — Bangunan Gedung

- BG001 — Konstruksi Gedung Hunian.
- BG002 — Konstruksi Gedung Perkantoran.
- BG003 — Konstruksi Gedung Industri.
- BG004 — Konstruksi Gedung Perbelanjaan.
- BG005 — Konstruksi Gedung Kesehatan.
- BG006 — Konstruksi Gedung Pendidikan.
- BG007 — Konstruksi Gedung Penginapan.
- BG008 — Gedung Hiburan dan Olahraga.
- BG009 — Konstruksi Gedung Lainnya.

#### BS — Bangunan Sipil

Mencakup BS001–BS020, antara lain:

- Jalan.
- Jembatan, flyover, dan underpass.
- Jalan rel.
- Irigasi dan drainase.
- Pengolahan air dan limbah.
- Infrastruktur elektrikal dan telekomunikasi.
- Sumber daya air.
- Pelabuhan.
- Minyak dan gas.
- Pertambangan.
- Panas bumi.
- Fasilitas olahraga.
- Kimia, petrokimia, farmasi, dan industri.
- Fasilitas militer dan peluncuran satelit.

### 4.5 Klasifikasi spesialis

- IN — Instalasi.
- KK — Konstruksi Khusus.
- KP — Konstruksi Prapabrikasi.
- PA — Penyewaan Peralatan.
- PB — Penyelesaian Bangunan.
- PL — Persiapan.

### 4.6 Kualifikasi

- Kecil.
- Menengah.
- Besar.
- Tidak ditentukan pada referensi.

Kualifikasi tidak boleh disimpulkan hanya dari nilai proyek. Aturan kesesuaian harus menunjuk sumber regulasi yang sudah diverifikasi.

---

## 5. Tata Kelola Referensi

Data klasifikasi dan profesi harus diperlakukan sebagai referensi berversi, bukan konstanta aplikasi.

### Metadata sumber

- Penerbit.
- Nomor dan judul regulasi/standar.
- Tautan sumber.
- Tanggal terbit.
- Tanggal efektif.
- Tanggal berakhir.
- Checksum dokumen.
- Status verifikasi.
- Catatan interpretasi.

### Status referensi

- Draft.
- Menunggu verifikasi.
- Aktif.
- Digantikan.
- Dicabut.
- Diarsipkan.

### Aturan versioning

1. Proyek selalu menunjuk versi referensi tertentu.
2. Dokumen yang sudah diterbitkan tidak berubah saat referensi baru muncul.
3. Perubahan kode dibuat sebagai supersession mapping, bukan overwrite.
4. Label asli dan label normalisasi disimpan bersama.
5. Keputusan otomatis tidak diaktifkan sebelum mapping diverifikasi ahli.

---

## 6. Blueprint Profesi dan Kompetensi

### 6.1 Struktur profesi keselamatan awal

| Kelompok | Jabatan | Jenjang | Referensi awal |
|---|---|---:|---|
| Keselamatan Konstruksi | Petugas Keselamatan Konstruksi | 3 | SKKNI 60-2022 |
| K3 Konstruksi | Petugas K3 Konstruksi | 3 | SKKNI 307-2013 |
| K3 | Personel K3 | 4 | SKKNI 038-2019 |
| K3 | Supervisor K3 | 5 | SKKNI 350-2014 |
| K3 | Supervisor K3 Utama | 6 | SKKNI 350-2014 |
| Keselamatan Konstruksi | Ahli Muda Keselamatan Konstruksi | 7 | SKKNI 60-2022 |
| K3 Konstruksi | Ahli Muda K3 Konstruksi | 7 | SKKNI 350-2014 |
| Keselamatan Konstruksi | Ahli Madya Keselamatan Konstruksi | 8 | SKKNI 60-2022 |
| K3 Konstruksi | Ahli Madya K3 Konstruksi | 8 | SKKNI 350-2014 |
| Keselamatan Konstruksi | Ahli Utama Keselamatan Konstruksi | 9 | SKKNI 60-2022 |
| K3 Konstruksi | Ahli Utama K3 Konstruksi | 9 | SKKNI 350-2014 |

Daftar ini adalah baseline awal. Produk harus mendukung profesi konstruksi lain tanpa perubahan schema.

### 6.2 Passport profesional

Passport memuat:

- Identitas profesional.
- Jabatan dan jenjang.
- Kompetensi.
- SKK dan sertifikat.
- Penerbit dan nomor kredensial.
- Masa berlaku.
- Pelatihan dan induksi.
- Pengalaman proyek.
- Klasifikasi proyek yang pernah ditangani.
- Work package dan aktivitas.
- Riwayat penugasan.
- Status verifikasi.
- QR verifikasi dengan data publik minimum.
- Riwayat perubahan, pembekuan, dan pencabutan.

### 6.3 Status kredensial

- Belum diajukan.
- Menunggu verifikasi.
- Terverifikasi.
- Akan kedaluwarsa.
- Kedaluwarsa.
- Ditolak.
- Dicabut.

### 6.4 Mesin pencocokan kompetensi

Input:

- Klasifikasi proyek.
- Work package.
- Aktivitas.
- Tingkat risiko.
- Tahap pelaksanaan.
- Jumlah pekerja.
- Lokasi dan pola kerja.
- Aturan kompetensi terverifikasi.

Output:

- Jabatan dan jenjang minimum.
- Jumlah personel.
- Sertifikat wajib.
- Kandidat yang memenuhi.
- Kekurangan kompetensi.
- Sertifikat yang hampir kedaluwarsa.
- Konflik penugasan.
- Alasan keputusan.

---

## 7. Domain Produk

### Domain A — Organization Capability

Mengelola:

- Profil badan usaha.
- Kategori BUJKN/BUJKA.
- Klasifikasi dan subklasifikasi.
- Kualifikasi.
- Sertifikat badan usaha.
- Lingkup layanan.
- Pengalaman proyek.
- Status verifikasi.

Keluaran utama: **Organization Capability Profile**.

### Domain B — Project Classification

Mengelola:

- Klasifikasi utama dan pendukung.
- Kualifikasi proyek.
- Tahap proyek.
- Kompleksitas.
- Metode kerja utama.
- Referensi regulasi.
- Subkontraktor spesialis.

Keluaran utama: **Project Context Profile**.

### Domain C — Risk and Control Library

Mengelola:

- Bahaya.
- Risiko.
- Kontrol minimum.
- Izin kerja.
- Checklist.
- Bukti wajib.
- Peralatan keselamatan.
- Frekuensi inspeksi.
- Tanggap darurat.

Keluaran utama: **Project Risk Baseline**.

### Domain D — Work Package and Safety BOQ

Mengelola:

- Work package.
- Aktivitas.
- Kuantitas.
- Risiko aktivitas.
- Kontrol.
- Kebutuhan personel.
- Item BOQ keselamatan.
- Harga rencana dan realisasi.

Keluaran utama: **Integrated Safety Plan and Budget**.

### Domain E — People and Professional Passport

Mengelola:

- Identitas personel.
- Kompetensi.
- Sertifikat.
- Pelatihan.
- Pengalaman.
- Penugasan.
- Verifikasi.
- QR passport.

Keluaran utama: **Verified Professional Passport**.

### Domain F — CSMS, RKK, and Evidence

Mengelola:

- Profil CSMS.
- Pertanyaan dan bobot.
- Bukti.
- Template RKK.
- Bagian dokumen.
- Persetujuan.
- Versi.
- Audit trail.

Keluaran utama: **Auditable Safety Submission**.

### Domain G — Readiness and Mobilization

Mengelola:

- Persyaratan.
- Hasil evaluasi.
- Hard gate.
- Skor informatif.
- Pengecualian.
- Persetujuan.
- Masa berlaku keputusan.

Keluaran utama: **Mobilization Readiness Decision**.

### Domain H — Field Assurance

Mengelola:

- Inspeksi.
- Observasi.
- Toolbox meeting.
- Permit to work.
- Temuan.
- Tindakan korektif.
- Bukti lapangan.
- Verifikasi penutupan.
- Offline sync.

Keluaran utama: **Field Assurance Record**.

### Domain I — Analytics and Reputation

Mengelola:

- Kesiapan.
- Kepatuhan.
- Kompetensi.
- Sertifikat kedaluwarsa.
- Inspeksi.
- Temuan.
- Tindakan korektif.
- Near miss dan insiden.
- Rekam jejak organisasi/profesional.

Keluaran utama: **Construction Safety Performance Profile**.

---

## 8. Alur Utama

### 8.1 Onboarding badan usaha

1. Organisasi dibuat.
2. Kategori badan usaha dipilih.
3. Klasifikasi/subklasifikasi ditambahkan.
4. Sertifikat badan usaha diunggah.
5. Data diverifikasi.
6. Capability profile diterbitkan.

### 8.2 Persiapan tender

1. Proyek dibuat.
2. Klasifikasi dan work package dipilih.
3. Sistem memeriksa kesesuaian organisasi.
4. Baseline risiko dibuat.
5. Kebutuhan kompetensi dihitung.
6. Kekurangan bukti dan personel ditampilkan.
7. Draft CSMS/RKK/BOQ disusun.

### 8.3 Mobilisasi

1. Personel ditugaskan.
2. Passport dan sertifikat diperiksa.
3. Kontrol kritis diverifikasi.
4. Dokumen disetujui.
5. Hard gate dievaluasi.
6. Keputusan siap/bersyarat/tidak siap diterbitkan.

### 8.4 Pelaksanaan

1. Aktivitas direncanakan.
2. Checklist dan permit ditentukan.
3. Personel kompeten diverifikasi.
4. Inspeksi dilakukan secara mobile.
5. Temuan menghasilkan tindakan korektif.
6. Penutupan diverifikasi.
7. Readiness diperbarui jika kondisi material berubah.

### 8.5 Closeout

1. Dokumen akhir dihimpun.
2. Temuan tersisa diselesaikan.
3. Pengalaman profesional dicatat.
4. Rekam jejak organisasi diperbarui.
5. Insight proyek diterbitkan.

---

## 9. Mesin Keputusan

Keputusan aplikasi dibagi menjadi dua jenis.

### Hard gate

Harus terpenuhi sebelum proses dilanjutkan:

- Klasifikasi usaha tidak sesuai.
- Sertifikat wajib tidak valid.
- Jabatan kompeten belum tersedia.
- Kontrol risiko fatal belum tersedia.
- Temuan kritis masih terbuka.
- Dokumen wajib belum disetujui.

### Informational score

Membantu prioritas tetapi tidak menggantikan hard gate:

- Kelengkapan dokumen.
- Kesiapan personel.
- Kinerja inspeksi.
- Kecepatan penutupan temuan.
- Kematangan sistem keselamatan.

Semua hasil harus memiliki explanation record:

- Rule yang dijalankan.
- Data input.
- Versi referensi.
- Hasil.
- Alasan.
- Waktu.
- Aktor atau proses yang menerbitkan.

---

## 10. Arsitektur Informasi Antarmuka

### Web

Navigasi utama:

1. Ringkasan.
2. Proyek.
3. Kesiapan.
4. Risiko dan Work Package.
5. RKK dan CSMS.
6. BOQ Keselamatan.
7. Profesional.
8. Passport dan Sertifikat.
9. Operasi Lapangan.
10. Laporan.
11. Klasifikasi Usaha.
12. Referensi dan Pengaturan.

### Mobile

Navigasi utama:

1. Tugas Hari Ini.
2. Proyek.
3. Inspeksi.
4. Temuan.
5. Bukti.
6. Passport Saya.
7. Sinkronisasi.

### Tampilan per peran

- Owner organisasi melihat capability, readiness, dan keputusan.
- HSE manager melihat risiko, RKK, CSMS, inspeksi, dan CAPA.
- Project manager melihat hambatan mobilisasi dan progres.
- Profesional melihat passport, penugasan, dan masa berlaku.
- Petugas lapangan melihat tugas dan checklist.
- Client/auditor melihat data terbatas yang dibagikan.

---

## 11. Model Data Konseptual

### Referensi

- `classification_sources`
- `business_classifications`
- `classification_versions`
- `competency_frameworks`
- `competency_levels`
- `occupations`
- `credential_types`

### Organisasi dan proyek

- `organization_classifications`
- `organization_credentials`
- `project_classifications`
- `work_packages`
- `activities`
- `project_assignments`

### Risiko dan kontrol

- `hazards`
- `risk_templates`
- `risk_template_versions`
- `controls`
- `project_risk_register`
- `work_package_risks`

### Profesional

- `professional_passports`
- `person_competencies`
- `person_credentials`
- `credential_verifications`
- `training_records`
- `passport_events`

### Kompetensi proyek

- `competency_requirements`
- `assignment_eligibility_results`
- `competency_gap_actions`

### Assurance

- `inspection_templates`
- `inspections`
- `inspection_items`
- `findings`
- `corrective_actions`
- `permits`
- `toolbox_records`

### Keputusan dan audit

- `readiness_requirements`
- `readiness_results`
- `readiness_gates`
- `approval_events`
- `audit_events`
- `evidence_links`

---

## 12. Integrasi dengan Modul yang Sudah Ada

### Projects

Tambahkan:

- Klasifikasi utama.
- Subklasifikasi pendukung.
- Kualifikasi.
- Versi referensi.
- Work package.

### People

Ganti data peran/proyek yang masih bebas dengan:

- Identitas personel.
- Occupation.
- Jenjang.
- Kompetensi.
- Assignment.

### Certificates

Hubungkan sertifikat ke personel dan tipe kredensial, bukan hanya nama pemilik bebas.

### CSMS Profiles

Gunakan sebagai dasar mesin template berversi:

- Profil per klasifikasi.
- Pertanyaan.
- Bukti.
- Validasi.
- Scoring.
- Hard gate.

### Safety BOQ

Hubungkan item ke:

- Work package.
- Aktivitas.
- Risiko.
- Kontrol.
- Sumber rekomendasi.

### Readiness

Perluas dari kelengkapan dokumen menjadi:

- Organization fit.
- Competency fit.
- Risk control readiness.
- Field assurance.
- Open critical findings.

### Field Activities

Pisahkan aktivitas generik menjadi objek terstruktur:

- Inspection.
- Finding.
- Corrective action.
- Permit.
- Toolbox.
- Observation.

---

## 13. Roadmap Implementasi

### Fase 1 — Reference Foundation

- Import klasifikasi BG/BS/IN/KK/KP/PA/PB/PL.
- Versioning sumber.
- Admin verification.
- Profil klasifikasi organisasi.

**Outcome:** capability profile badan usaha.

### Fase 2 — Classification-Aware Projects

- Profil klasifikasi proyek.
- Pemeriksaan kesesuaian organisasi.
- Work package dan aktivitas.

**Outcome:** keputusan awal kelayakan proyek.

### Fase 3 — Risk and Control Engine

- Hazard library.
- Risk template.
- Control library.
- Risk register awal.
- BOQ safety generation.

**Outcome:** baseline keselamatan sesuai pekerjaan.

### Fase 4 — Competency and Passport

- Framework profesi.
- Credential verification.
- Passport profesional.
- QR verification.

**Outcome:** identitas kompetensi terverifikasi.

### Fase 5 — Competency Matching

- Requirement rules.
- Project assignment.
- Gap analysis.
- Expiry and conflict alerts.

**Outcome:** kebutuhan dan kekurangan personel terlihat.

### Fase 6 — Contextual CSMS/RKK

- Template berversi.
- Pengisian dari data proyek.
- Evidence workflow.
- Approval dan publication.

**Outcome:** dokumen lebih cepat, konsisten, dan dapat diaudit.

### Fase 7 — Readiness Gate

- Hard gate.
- Explanation.
- Conditional approval.
- Re-evaluation.

**Outcome:** keputusan mobilisasi yang dapat dipercaya.

### Fase 8 — Field Assurance

- Inspection template.
- Findings/CAPA.
- Permit dan toolbox.
- Offline evidence.

**Outcome:** rencana keselamatan terhubung ke lapangan.

### Fase 9 — Analytics and Reputation

- Organization scorecard.
- Professional track record.
- Benchmarking.
- Client portal.

**Outcome:** data menghasilkan reputasi dan peluang bisnis.

### Fase 10 — Ecosystem

- Integrasi HR/procurement/project control.
- Verifikasi eksternal.
- API partner.
- Marketplace profesional opsional.

**Outcome:** platform ekosistem jasa konstruksi.

---

## 14. KPI Dampak

### Badan usaha

- Waktu persiapan prakualifikasi.
- Waktu penyusunan RKK/CSMS.
- Persentase persyaratan ditemukan sebelum tender.
- Kekurangan kompetensi sebelum mobilisasi.
- Persentase sertifikat diperbarui tepat waktu.
- Persentase proyek tanpa temuan kritis terlambat.

### Profesional

- Kompetensi terverifikasi.
- Penugasan tercatat.
- Pengalaman menurut klasifikasi.
- Pembaruan sertifikat tepat waktu.
- Kenaikan jenjang kompetensi.
- Peluang penugasan yang sesuai.

### Pemilik proyek

- Waktu verifikasi kontraktor.
- Ketidaksesuaian saat mobilisasi.
- Persentase kontrol kritis tervalidasi.
- Kecepatan penutupan tindakan korektif.
- Kelengkapan audit trail.

### Produk

- Organisasi aktif.
- Proyek aktif.
- Passport terverifikasi.
- Persentase proyek dengan klasifikasi lengkap.
- Persentase readiness decision dengan explanation.
- Retensi pengguna lapangan.

---

## 15. Guardrail

1. Aplikasi bukan pengganti keputusan ahli atau kewenangan regulator.
2. Rule regulasi tidak boleh diaktifkan tanpa sumber dan review.
3. Rekomendasi otomatis selalu dapat dijelaskan.
4. Data pribadi profesional mengikuti prinsip minimum disclosure.
5. Data antarorganisasi harus terisolasi.
6. Dokumen dan keputusan yang sudah diterbitkan tidak berubah diam-diam.
7. Perubahan referensi memicu review, bukan update historis.
8. Keputusan kritis memerlukan persetujuan manusia.
9. Bukti harus memiliki asal, waktu, dan integritas.
10. Operasi offline harus idempoten dan dapat dipulihkan.

---

## 16. Definisi Produk Matang

Produk dianggap matang ketika:

- Klasifikasi organisasi dan proyek tervalidasi.
- Risiko diturunkan sampai work package.
- Kompetensi personel dapat dicocokkan.
- Passport dapat diverifikasi.
- RKK/CSMS mengambil data yang sama dengan readiness.
- Mobilisasi memakai hard gate yang dapat diaudit.
- Inspeksi dan CAPA terhubung ke risiko.
- Rekam jejak organisasi dan profesional terbentuk otomatis.
- Referensi regulasi berversi.
- Web, mobile, API, database, dan offline sync memiliki pengujian kritis.

---

## 17. Prioritas Berikutnya

Urutan pembangunan yang direkomendasikan:

1. Reference Foundation.
2. Organization Capability Profile.
3. Project Classification.
4. Risk and Work Package Engine.
5. Competency Framework.
6. Professional Passport.
7. Competency Matching.
8. Contextual RKK/CSMS.
9. Readiness Gate.
10. Field Assurance.
11. Analytics and Ecosystem.

Urutan ini memastikan aplikasi memberikan manfaat sejak tahap awal tanpa membuat keputusan regulasi otomatis sebelum sumber dan rule diverifikasi.
