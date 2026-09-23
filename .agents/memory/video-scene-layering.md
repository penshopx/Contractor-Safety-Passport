---
name: Lapisan transisi video
description: Pelajaran tentang adegan animasi yang terlihat kosong meski timer dan aset berfungsi.
---

Pada pergantian adegan, setiap adegan harus berbagi posisi bingkai yang sama. Jika sistem animasi mencoba mengeluarkan komponen React kustom dari alur dokumen tanpa elemen DOM yang dapat diposisikan, adegan berikutnya dapat tersusun di bawah adegan lama dan keluar dari area tampilan.

**Why:** Pemeriksaan bingkai awal, status HTTP gambar, dan build semuanya berhasil, tetapi cuplikan saat pemutaran memperlihatkan adegan lama tetap berada di atas sementara gambar baru hanya muncul sebagai garis tipis di bawah. Masalahnya adalah lapisan transisi, bukan file gambar.

**How to apply:** Pastikan pembungkus adegan yang diberi kunci transisi adalah elemen DOM satu bingkai penuh dengan posisi absolut; periksa beberapa waktu nyata di seluruh video serta putaran terakhir-ke-pertama, bukan hanya tangkapan layar saat halaman dibuka atau simulasi waktu virtual.