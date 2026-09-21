---
name: Versi agregat bersama
description: Kontrol konkurensi untuk draft bersama yang disimpan sebagai kumpulan baris anak.
---

Simpan revisi server pada satu baris metadata per agregat, terpisah dari item-item anaknya. Pembaruan harus menaikkan revisi secara atomik hanya bila revisi klien masih cocok.

**Why:** Revisi yang diturunkan dari item anak tidak dapat membedakan draft kosong yang belum pernah disimpan dari draft yang sengaja dikosongkan, dan operasi hapus-lalu-tambah tetap rentan saling menimpa.

**How to apply:** Gunakan pola ini untuk draft bersama berbentuk koleksi yang diganti sekaligus; pada konflik, pertahankan edit klien sampai pengguna memilih memuat ulang atau menggabungkan.