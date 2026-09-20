---
name: Pengujian database bersama
description: Batasan urutan saat migrasi dan integration test memakai database pengembangan yang sama.
---

Jalankan migrasi skema hingga selesai sebelum memulai integration test yang memodifikasi database bersama.

**Why:** Menjalankan keduanya secara paralel dapat membuat test mulai sebelum constraint tersedia, lalu fixture test dan migrasi saling memengaruhi sehingga hasilnya tidak deterministik.

**How to apply:** Untuk perubahan skema, jalankan migrasi, verifikasi constraint, lalu jalankan suite database secara berurutan. Typecheck dan pemeriksaan statis tetap boleh diparalelkan.