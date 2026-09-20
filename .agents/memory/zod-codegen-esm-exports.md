---
name: Ekspor codegen Zod
description: Menjaga barrel hasil Orval tetap dapat dimuat langsung oleh runner Node ESM.
---

Barrel `api-zod` harus mengekspor validator melalui path eksplisit berakhiran `.ts`; hapus ekspor extensionless duplikat yang dapat ditambahkan oleh codegen.

**Why:** Runner tes Node yang mengeksekusi TypeScript langsung tidak menyelesaikan path ESM extensionless, sehingga seluruh tes route berhenti sebelum dijalankan.

**How to apply:** Setiap selesai menjalankan codegen OpenAPI, periksa barrel `api-zod` dan jalankan tes API lengkap, bukan hanya typecheck.