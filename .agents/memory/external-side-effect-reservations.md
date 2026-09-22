---
name: Reservasi sebelum efek eksternal
description: Pola konsistensi untuk operasi yang menggabungkan batas unik database dengan pembuatan resource eksternal.
---

Buat reservasi lokal dengan batas unik atomik sebelum memanggil layanan eksternal. Hanya permintaan yang memperoleh reservasi boleh membuat resource eksternal. Jika finalisasi lokal gagal setelah resource dibuat, cabut resource eksternal dan bersihkan reservasi.

**Why:** Pemeriksaan read-before-write tidak mencegah dua permintaan paralel sama-sama membuat resource eksternal sebelum salah satunya ditolak oleh indeks unik database.

**How to apply:** Gunakan pola ini pada alur baru yang memiliki identitas unik lokal dan side effect eksternal yang tidak dapat dimasukkan dalam transaksi database yang sama.