---
name: Instalasi paket pada workspace pnpm
description: Batasan pemasang paket saat menambah dependency pada satu package di monorepo.
---

Pemasang paket Replit untuk Node menjalankan `pnpm add` dari akar workspace dan menolak target root; argumen `--filter` juga ditolak sebagai nama paket. Untuk dependency package lokal pada monorepo ini, deklarasikan dependency pada package yang tepat lalu gunakan `pnpm install --no-frozen-lockfile` bila callback pemasang tidak dapat menarget package.

**Why:** Dua upaya melalui callback gagal masing-masing karena pemeriksaan root pnpm dan validasi token callback, bukan karena paket tidak tersedia.

**How to apply:** Pakai callback terlebih dahulu; jika keterbatasan targeting yang sama muncul, gunakan install workspace setelah deklarasi dependency, lalu periksa lockfile dan typecheck.