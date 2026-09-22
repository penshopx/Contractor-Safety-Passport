---
name: Kunci bukti lintas storage dan database
description: Menjaga cleanup Object Storage tidak berlomba dengan transaksi yang menautkan foto ke aktivitas.
---

Penautan path bukti dan cleanup kandidat harus memakai PostgreSQL advisory transaction lock dengan namespace dan hash path yang sama. Penautan menahan lock selama verifikasi storage dan commit referensi; cleanup menahan lock selama recheck referensi dan penghapusan storage.

**Why:** Generation precondition hanya menangkap perubahan metadata storage. Referensi database dapat dibuat tanpa mengubah metageneration, sehingga recheck tanpa lock masih menyisakan celah antara query dan delete.

**How to apply:** Setiap writer baru untuk path bukti harus memakai helper lock yang sama. Cleanup harus memproses satu path per transaksi dan tidak boleh melepas lock sebelum delete selesai atau referensi ditemukan.