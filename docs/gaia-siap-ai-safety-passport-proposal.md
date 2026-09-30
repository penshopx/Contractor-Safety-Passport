# Usulan kontrak AI Gustafta dari Safety Passport

**Status:** Draf kebutuhan Safety Passport untuk ditinjau pemilik API Gustafta; **bukan** dokumentasi API Gustafta yang berlaku.  
**Ruang lingkup:** Saran pemeriksaan bukti CSMS yang diminta pengguna, baca-saja, satu organisasi dan satu proyek per permintaan.  
**Prasyarat:** Pemilik API Gustafta mengonfirmasi kontrak, izin pemrosesan data, dan uji isolasi sebelum ada implementasi koneksi.

## 1. Kondisi saat ini dan batas produk

- Pilot yang berjalan memakai **data Safety Passport sendiri**: label butir bukti dari profil CSMS, status yang disimpan (`complete`, `follow_up`, atau belum ditandai), serta identitas dan versi profil dan revisi kesiapan. Maksimal lima butir yang belum lengkap dipilih. Pilot tidak membaca isi dokumen, tidak melakukan retrieval atau pemeriksaan izin per dokumen, dan tidak memanggil Gustafta.
- Pilihan pengguna untuk meminta saran tidak memberi AI wewenang mengubah status, menyetujui bukti, menerbitkan dokumen, menetapkan kepatuhan, atau membuka readiness gate. Keputusan kritis tetap milik manusia.
- Catatan yang diberikan tentang Gustafta menyebut kandidat endpoint `POST /api/v1/ai/assist`. **Keberadaan endpoint saja tidak membuktikan** format request/response, autentikasi, dukungan konteks proyek, kutipan, atau retensinya. Semua nama field, ukuran, dan contoh di bawah adalah **usulan**.
- Tidak ada migrasi data, sinkronisasi akun, penyalinan dokumen, atau penulisan lintas aplikasi dalam usulan tahap awal. Fitur internal tetap dapat dipakai terpisah jika koneksi Gustafta tidak tersedia; jangan diam-diam mengganti penyedia saat permintaan gagal.

## 2. Tahap awal yang diusulkan: label bukti saja

Safety Passport memilih proyek dari organisasi aktif dan membaca snapshot kesiapan **di server**, setelah autentikasi dan pemeriksaan keanggotaan. Server memilih maksimal lima label butir bukti yang belum ditandai lengkap, memprioritaskan `follow_up`. `unreviewed` berarti belum ditandai, **bukan** bukti tidak ada. Pengguna harus meminta saran secara eksplisit. Tidak ada nama petugas, isi dokumen, foto, riwayat percakapan, atau pertanyaan bebas pada tahap ini.

### Autentikasi dan batas kepercayaan (usulan, perlu persetujuan)

- Panggilan hanya server-ke-server melalui TLS. Tidak ada kredensial Gustafta atau permintaan Gustafta dari browser maupun perangkat lapangan.
- Mekanisme autentikasi, header, scope, penerbitan dan rotasi kredensial **ditentukan oleh pemilik API Gustafta**. Contoh `Authorization: Bearer ...` di sini bukan klaim bahwa Gustafta mendukungnya. Jangan masukkan kunci atau token ke dokumen maupun contoh.
- Organisasi, proyek, peran, dan butir berasal dari pemeriksaan server Safety Passport, **tidak dipercaya dari body yang dapat diisi browser**. Identitas aplikasi yang diautentikasi harus diikat Gustafta ke tenant yang diizinkan; `organization_ref` dalam payload tidak cukup sebagai bukti hak akses.
- Jika identitas organisasi/proyek lintas layanan belum dipetakan, gunakan referensi opak yang disepakati, bukan menganggap ID internal kedua aplikasi sama. Identitas pengguna akhir tetap dalam audit Safety Passport kecuali ada kebutuhan yang disetujui untuk membagikannya. Jika Gustafta mengambil data miliknya sendiri, model izin dan pemetaan pengguna harus disepakati terpisah.
- Peran organisasi Safety Passport saat ini: `owner`, `safety_expert`, `field_officer`, `viewer`. Peran ini **bukan** klaim tentang peran yang dikenali Gustafta; jangan mengirim daftar peran kecuali kontrak memang memerlukannya.

### Contoh request yang **diusulkan**, bukan payload API yang terverifikasi

```http
POST /api/v1/ai/assist
Content-Type: application/json
Authorization: <skema dan nilai ditentukan pemilik API>
```

```json
{
  "request_id": "4f64410e-a613-4d81-a80d-5d2d37f0461c",
  "task": "evidence_review_suggestions",
  "organization_ref": "opaque-organization-reference",
  "project_ref": "opaque-project-reference",
  "source": {
    "type": "csms_readiness_profile",
    "profile_ref": "opaque-profile-reference",
    "issuer": "Penerbit profil",
    "version": "v1",
    "revision": 3
  },
  "items": [
    {
      "key": "PQ:evidence:0",
      "stage_code": "PQ",
      "stage_name": "Prakualifikasi",
      "evidence_label": "Daftar bukti penerapan K3",
      "status": "follow_up"
    }
  ]
}
```

**Kontrak batas yang diminta untuk disepakati:** hanya `unreviewed` atau `follow_up` boleh dikirim; maksimum 5 butir, ukuran total usulan maksimum 16 KiB dan setiap label usulan maksimum 240 karakter. Jika melewati batas, **tolak secara jelas sebelum mengirim**, jangan memotong teks tanpa sepengetahuan pengguna. Pemilik API perlu mengonfirmasi byte/token limit aktual, charset, versi kontrak, dan validasi input.

### Contoh response yang **diusulkan**

```json
{
  "request_id": "4f64410e-a613-4d81-a80d-5d2d37f0461c",
  "suggestions": [
    {
      "key": "PQ:evidence:0",
      "next_step": "Periksa apakah daftar bukti penerapan K3 tersedia dan catat bagian yang masih perlu ditinjau."
    }
  ],
  "limitations": [
    "Saran dibuat dari label dan status saja; isi bukti belum diperiksa."
  ]
}
```

Safety Passport **harus** mencocokkan `request_id` dan semua `key` terhadap snapshot permintaan, menolak duplikasi, key asing, respons parsial, field yang tidak valid, atau teks yang mengklaim kelayakan/persetujuan. Referensi profil, issuer, versi, dan revisi yang ditampilkan kepada pengguna ditambahkan **oleh server Safety Passport dari snapshot tepercaya**, bukan diambil dari klaim AI. Jika kesiapan/profil berubah sebelum penyajian, jangan tampilkan saran lama sebagai kondisi terkini; minta pengguna membuat permintaan baru. Tidak ada skor keyakinan yang dipakai sebagai dasar keputusan.

Respons tetap berupa **saran untuk diperiksa manusia**, bukan pernyataan bahwa dokumen ada/tidak ada. Pada fase ini tidak ada kutipan dokumen atau klaim bahwa isi dokumen telah dibaca. Jika Gustafta tidak mendukung kontrak terstruktur dan pembatasan task ini, **jangan hubungkan endpoint tersebut untuk pilot**.

## 3. Perluasan terpisah: dokumen, retrieval, dan percakapan

Bagian ini **bukan bagian dari tahap awal** dan tidak boleh diaktifkan hanya karena endpoint `ai/assist` tersedia.

Sebelum cuplikan dokumen atau riwayat percakapan dapat dikirim, kedua pihak perlu menyepakati: apakah Safety Passport atau Gustafta yang melakukan retrieval; izin **mengekspor isi ke layanan AI** yang terpisah dari izin melihat dokumen; sumber, versi, integritas, waktu berlaku, tujuan penggunaan, cakupan organisasi/proyek, klasifikasi sensitivitas, redaksi, dan cara memvalidasi setiap kutipan/claim. Keputusan historis yang dibekukan mempertahankan versi sumber historisnya; perubahan referensi memicu peninjauan, **bukan** penggantian diam-diam dengan versi terbaru. Akses pengguna atas dokumen historis tetap harus dievaluasi saat ini.

Jika Gustafta melakukan retrieval dari penyimpanannya sendiri, Gustafta harus membuktikan isolasi tenant dan pemeriksaan izin pada sumbernya; klaim `asker_roles` dari pemanggil saja tidak cukup. Jika Safety Passport mengirim cuplikan yang telah difilter, Gustafta hanya boleh menjawab dari daftar sumber yang diberikan, dan Safety Passport harus memverifikasi sitasi terhadap ID, versi, dan teks yang benar-benar dikirim. Riwayat chat tidak boleh otomatis disisipkan sebagai sumber fakta. Gunakan tanggapan tanpa dokumen daripada konteks yang izin/versinya tidak dapat diverifikasi.

### Empat aturan pencabutan akses untuk fase dokumen

1. **Sebelum retrieval/transfer:** Safety Passport memeriksa ulang keanggotaan, izin baca **dan izin transfer ke AI**, status, versi, waktu berlaku, serta cakupan proyek/tujuan penggunaan untuk **setiap** sumber. Belum diimplementasikan dalam pilot label bukti. Jika Gustafta melakukan retrieval, kewajiban setara berlaku di sisinya.
2. **Sebelum respons ditampilkan:** Server Safety Passport memeriksa ulang izin dan status setiap sumber serta memvalidasi seluruh klaim/sitasi terhadap sumber yang diizinkan. Jika sumber dicabut selama proses, **tahan seluruh jawaban** dan berikan fallback netral; menghapus sitasi saja tidak menghilangkan isi yang mungkin sudah terserap di teks. Jangan sajikan jawaban lama atau regenerasi tanpa pemeriksaan izin baru.
3. **Cache dan riwayat:** Cache retrieval, indeks, cache jawaban, dan konteks lanjutan harus mengikuti pencabutan; konten yang dicabut tidak boleh dipakai ulang. Riwayat yang pernah terlihat tidak dapat ditarik dari ingatan pengguna, tetapi tidak boleh menjadi sumber fakta terkini. Untuk cache/retensi di sisi Gustafta diperlukan mekanisme invalidasi dengan konfirmasi atau larangan menyimpan; TTL saja belum cukup tanpa batas risiko yang disetujui. Bila pencabutan tidak dapat ditegakkan, jangan kirim konten dokumen.
4. **Tidak membocorkan keberadaan sumber rahasia:** Penolakan, error, kutipan, metadata, maupun jawaban bebas tidak boleh mengonfirmasi nama/keberadaan dokumen atau proyek yang tidak boleh diketahui peminta. Fallback netral diproduksi server Safety Passport. Instruksi prompt Gustafta **bukan** satu-satunya perlindungan; filter input, validasi output, dan uji serangan diperlukan.

Pencabutan setelah data sudah dikirim ke Gustafta tidak dapat ditarik kembali hanya dengan menyembunyikan UI. Pemilik API harus menjelaskan cache, penghapusan, dan retensi sebelum fase dokumen layak disetujui.

## 4. Kegagalan, audit, dan privasi

- **Tahap awal non-streaming.** Streaming dan multi-turn ditunda agar respons dapat divalidasi seluruhnya sebelum tampil.
- Timeout dan batas pemakaian disepakati berdasarkan kemampuan API; nilai lokal 20 detik pada pilot internal **bukan SLA Gustafta**. Pada timeout, 429, 5xx, schema mismatch, sumber asing, atau ketidakcocokan revisi, tampilkan pesan netral “Saran tidak tersedia; data kesiapan tidak berubah”. Jangan mengarang saran pengganti atau diam-diam beralih ke layanan lain.
- Tidak ada retry otomatis sebagai syarat awal. Bila retry kelak disepakati, baca ulang izin/snapshot sebelum setiap pengiriman; hormati `Retry-After`, batasi jumlahnya, dan sepakati `request_id`/idempotensi agar penggunaan tidak terhitung ganda. 4xx selain 429 tidak diulang.
- Catat metadata minimum untuk audit di Safety Passport: waktu, aktor internal, organisasi/proyek internal, `request_id`, versi kontrak, status hasil, versi profil/revisi. **Jangan log** token, pertanyaan bebas, cuplikan dokumen, atau respons mentah.
- Jangan kirim token pengguna akhir, nama atau identitas personel, foto, tanda tangan, sertifikat pribadi, lokasi, maupun isi dokumen pada tahap awal. Label profil kustom dapat mengandung informasi sensitif: validasi dan tinjau sebelum mengirim. Pemrosesan data oleh layanan lain harus memiliki izin organisasi yang jelas.
- Retensi prompt/respons, penggunaan untuk pelatihan, subprosesor, lokasi pemrosesan, penghapusan atas permintaan, dan insiden keamanan **belum diketahui**. Jangan menyatakan “zero retention” sebelum ada konfirmasi tertulis. Kebijakan riwayat, cache, dan audit di Safety Passport juga harus diputuskan sebelum fase dokumen.

## 5. Jawaban yang diperlukan dari pemilik API Gustafta

1. Apakah `POST /api/v1/ai/assist` mendukung task baca-saja dengan input dan output terstruktur seperti tahap awal? Berikan **kontrak request/response dan error aktual** beserta versi API; apakah perlu adaptasi endpoint atau task baru?
2. Bagaimana autentikasi server-ke-server, scope tenant, pemetaan identitas organisasi/proyek, rotasi/pencabutan kredensial, dan larangan akses silang ditegakkan?
3. Apa batas byte/token, rate limit, timeout, retry/idempotensi, dan apakah respons dapat memuat keluaran yang tidak bersumber dari input?
4. Apakah prompt, respons, dan metadata disimpan/dilatih/dibagikan ke subprosesor; berapa lama, di mana, dan bagaimana penghapusan serta pencabutan cache diverifikasi?
5. **Hanya jika fase dokumen dipertimbangkan:** siapa melakukan retrieval, bagaimana izin transfer konten, versi dan sitasi diverifikasi, bagaimana pencabutan mid-flight serta invalidasi cache dijamin, dan bagaimana kebocoran keberadaan sumber dicegah?

**Kriteria lanjut:** pemilik API menyetujui kontrak aktual dan kewenangan data; Safety Passport menguji isolasi lintas organisasi, respons asing/tidak lengkap, revisi berubah, kegagalan jaringan, dan—untuk fase dokumen—keempat aturan pencabutan. Sampai itu selesai, pilot internal tetap berjalan sendiri dan **tidak ada kode integrasi Gustafta yang ditulis**.