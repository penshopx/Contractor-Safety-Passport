---
name: Bingkai pertama animasi
description: Hindari kesan adegan kosong saat animasi Safety Passport baru dimulai.
---

Nilai komposisi video bukan hanya pada keadaan setelah semua animasi selesai, tetapi juga pada bingkai awal tiap adegan dan saat ditampilkan dalam iframe kecil. Elemen utama harus sudah terbaca sejak awal; animasi bertahap boleh memperkaya komposisi, bukan menunda seluruh isi.

**Why:** Versi dengan tata letak akhir lebih padat masih terlihat hampir kosong pada tangkapan layar awal karena judul dan panel utama muncul setelah jeda. Ini sesuai keluhan pengguna bahwa beberapa bagian video kosong.

**How to apply:** Saat mengubah adegan, tinjau bingkai awal dan keadaan setelah animasi selesai pada lebar desktop dan iframe ponsel. Jangan menyembunyikan seluruh konten utama di balik opacity nol atau delay panjang.