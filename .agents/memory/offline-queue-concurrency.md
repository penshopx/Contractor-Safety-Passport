---
name: Mutasi antrean offline
description: Aturan konkurensi agar aktivitas baru tidak hilang ketika sinkronisasi sedang berjalan.
---

Semua perubahan antrean offline harus berupa mutasi terhadap kondisi terbaru dan diserialisasikan sampai penyimpanan persisten selesai. Permintaan sinkronisasi yang masuk saat proses aktif harus dijadwalkan ulang setelah proses saat ini selesai.

**Why:** Sinkronisasi yang menyimpan snapshot lama dapat menimpa aktivitas yang baru ditambahkan selama request jaringan berlangsung, sehingga laporan hilang walaupun sempat tersimpan.

**How to apply:** Gunakan updater berbasis antrean terbaru untuk setiap transisi status dan checkpoint. Saat menambah pemicu sinkronisasi atau status baru, uji enqueue saat item sebelumnya sengaja ditahan.