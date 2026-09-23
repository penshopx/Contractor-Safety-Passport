---
name: Timeout draf AI laporan lapangan
description: Pilihan UX saat bantuan draf AI terlambat merespons tanpa menghentikan pekerjaan petugas.
---

Untuk permintaan draf AI yang lambat, utamakan peringatan non-blocking dan validasi relevansi respons yang datang belakangan (*warn-and-validate*), bukan otomatis membatalkan permintaan pada batas peringatan.

**Why:** Pengguna menilai respons yang tetap berhasil setelah peringatan masih berharga, selama draf usang tidak ditampilkan atau menimpa catatan. Pembatalan ketat pada detik peringatan akan membuang respons itu.

**How to apply:** Saat mengerjakan batas waktu klien, bedakan waktu peringatan UX dari waktu pembatalan nyata. Respons terlambat hanya boleh ditampilkan jika identitas permintaan dan konteks formulir masih cocok; simpan manual tetap tersedia. Jika ada batas pembatalan akhir, jelaskan bahwa respons setelahnya tidak bisa dipakai.