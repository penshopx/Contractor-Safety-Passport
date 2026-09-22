---
name: Reservasi sebelum efek eksternal
description: Pola konsistensi untuk operasi yang menggabungkan batas unik database dengan pembuatan resource eksternal.
---

Buat reservasi lokal dengan batas unik atomik sebelum memanggil layanan eksternal. Hanya permintaan yang memperoleh reservasi boleh membuat resource eksternal. Jika finalisasi lokal gagal setelah resource dibuat, pertahankan reservasi dalam state kompensasi sampai resource eksternal pasti sudah dicabut; jangan membersihkannya saat hasil pencabutan belum diketahui.

**Why:** Pemeriksaan read-before-write tidak mencegah dua permintaan paralel sama-sama membuat resource eksternal sebelum salah satunya ditolak oleh indeks unik database. Membersihkan reservasi sebelum kompensasi selesai juga membuka acceptance atau pembuatan ulang ketika resource lama mungkin masih aktif.

**How to apply:** Gunakan pola ini pada alur yang memiliki identitas unik lokal dan side effect eksternal yang tidak dapat dimasukkan dalam transaksi database yang sama. State kompensasi yang belum terminal harus ikut memblokir konsumsi dan pembuatan ulang.