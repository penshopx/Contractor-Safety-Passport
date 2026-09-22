---
name: Migrasi produksi Replit
description: Batasan proses migrasi schema untuk database PostgreSQL terkelola Replit.
---

Perubahan schema produksi harus diterapkan melalui diff dan konfirmasi dalam alur Publish Replit. Build dan startup service produksi hanya membangun dan menjalankan aplikasi; keduanya tidak boleh menjalankan `db push`, migration script, atau DDL.

**Why:** Migrasi saat startup dapat dijalankan bersamaan oleh beberapa instance Autoscale, melewati pemeriksaan rename/diff Publish, serta menahan atau menggagalkan health check aplikasi.

**How to apply:** Setiap perubahan schema dilakukan di development lebih dahulu. Saat publikasi, periksa diff development-ke-production dan konfirmasikan perubahan melalui UI Publish sebelum service baru mulai menerima trafik.