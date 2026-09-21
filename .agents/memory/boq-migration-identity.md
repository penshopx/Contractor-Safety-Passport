---
name: Identitas migrasi BOQ
description: Aturan idempotensi saat memindahkan item BOQ lokal ke draft proyek bersama.
---

Gunakan identitas migrasi yang stabil dan terpisah dari ID item BOQ biasa, dengan cakupan organisasi, proyek, sumber lokal per instalasi, dan item lokal. Kiriman ulang dengan revisi lama hanya boleh dianggap berhasil bila seluruh payload persis sama dengan data yang sudah tersimpan, tanpa bergantung pada urutan item.

**Why:** Respons dapat terputus setelah transaksi berhasil. Klien perlu menerima konfirmasi pada retry agar aman menghapus data lokal, tetapi retry tidak boleh menutupi edit lama yang isinya berbeda.

**How to apply:** Setiap alur migrasi atau perubahan format penyimpanan BOQ harus mempertahankan identitas ini, melakukan deduplikasi di server, dan membandingkan semua bidang yang dapat diedit sebelum menerima retry stale sebagai sukses.

Saat payload migrasi memuat item server dan item lokal dengan identitas migrasi sama, pertahankan salinan server yang muncul lebih dulu. Klien juga harus menganggap item dengan identitas yang sudah terlihat setelah refetch sebagai telah tersimpan, bukan mengirim ulang salinan lokal lama.