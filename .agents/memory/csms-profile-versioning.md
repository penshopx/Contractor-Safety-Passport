---
name: Versi profil CSMS
description: Aturan immutability untuk profil principal yang dipakai kesiapan proyek atau dokumen.
---

Setiap revisi pedoman CSMS harus menjadi versi tersendiri. Profil boleh diedit saat masih draft, tetapi harus dikunci secara atomik saat pertama kali dipakai dan tidak boleh dibuka kembali.

**Why:** Kesiapan proyek dan dokumen harus tetap merujuk pada struktur pertanyaan, bukti, dan validasi yang sama seperti saat dibuat; perubahan diam-diam akan merusak keterlacakan.

**How to apply:** Untuk fitur yang memakai profil, kunci versi sebelum atau bersamaan dengan penggunaan. Perubahan draft harus mensyaratkan status belum terkunci pada operasi tulis, bukan hanya pada pembacaan awal.