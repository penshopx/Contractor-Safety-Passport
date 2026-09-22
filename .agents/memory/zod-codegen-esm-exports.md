---
name: Ekspor codegen Zod
description: Menjaga barrel hasil Orval tetap dapat dimuat langsung oleh runner Node ESM.
---

Barrel `api-zod` dan `api-client-react` harus mengekspor hasil generated serta custom fetch melalui path eksplisit berakhiran `.ts`; hapus ekspor extensionless duplikat yang dapat ditambahkan oleh codegen.

**Why:** Runner tes Node dan Vite workspace tidak selalu menyelesaikan path ESM extensionless lintas package, sehingga tes route atau frontend dapat gagal memuat file generated yang sebenarnya ada.

**How to apply:** Setiap selesai menjalankan codegen OpenAPI, periksa kedua barrel, jalankan tes API, lalu typecheck atau build frontend; jangan mengandalkan typecheck library saja.