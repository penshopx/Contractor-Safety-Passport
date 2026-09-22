import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getInviteErrorMessage,
  getTeamMutationErrorMessage,
  teamMutationErrorMessages,
} from "./team-errors.ts";

describe("pesan error manajemen tim", () => {
  it("menampilkan konflik undangan duplikat secara khusus", () => {
    assert.equal(
      getInviteErrorMessage({ status: 409 }),
      "Pengguna dengan email ini sudah ada di dalam tim atau sudah diundang.",
    );
  });

  it("menampilkan kegagalan undangan umum", () => {
    assert.equal(
      getInviteErrorMessage({ status: 500 }),
      "Gagal mengirim undangan. Silakan coba lagi.",
    );
  });

  it("membedakan perubahan peran pemilik yang dilarang", () => {
    assert.equal(
      getTeamMutationErrorMessage("updateRole", {
        status: 403,
        data: { error: "Peran pemilik tidak dapat diubah" },
      }),
      "Peran pemilik workspace tidak dapat diubah.",
    );
  });

  it("membedakan anggota yang tidak ditemukan saat mengubah peran", () => {
    assert.equal(
      getTeamMutationErrorMessage("updateRole", {
        status: 404,
        data: { error: "Anggota tidak ditemukan" },
      }),
      "Anggota tidak ditemukan. Muat ulang halaman untuk melihat daftar tim terbaru.",
    );
  });

  it("membedakan anggota yang tidak ditemukan saat mencabut akses", () => {
    assert.equal(
      getTeamMutationErrorMessage("removeMember", {
        status: 404,
        data: { error: "Anggota tidak ditemukan" },
      }),
      "Anggota tidak ditemukan. Mungkin aksesnya sudah dicabut; muat ulang halaman.",
    );
  });

  it("membedakan pencabutan akses pemilik yang dilarang", () => {
    assert.equal(
      getTeamMutationErrorMessage("removeMember", {
        status: 403,
        data: { error: "Pemilik ruang kerja tidak dapat dihapus" },
      }),
      "Akses pemilik workspace tidak dapat dicabut.",
    );
  });

  it("membedakan undangan yang sudah tidak aktif", () => {
    assert.equal(
      getTeamMutationErrorMessage("revokeInvitation", {
        status: 404,
        data: { error: "Undangan aktif tidak ditemukan" },
      }),
      "Undangan sudah tidak aktif. Mungkin sudah digunakan atau dibatalkan; muat ulang halaman.",
    );
  });

  it("tidak menampilkan alasan API yang tidak dikenal", () => {
    assert.equal(
      getTeamMutationErrorMessage("removeMember", {
        status: 500,
        data: { error: "detail internal sensitif" },
      }),
      "Gagal mencabut akses anggota. Silakan coba lagi.",
    );
  });

  it("menyediakan fallback untuk semua perubahan keanggotaan", () => {
    assert.deepEqual(teamMutationErrorMessages, {
      updateRole: "Gagal memperbarui peran pengguna. Silakan coba lagi.",
      removeMember: "Gagal mencabut akses anggota. Silakan coba lagi.",
      revokeInvitation: "Gagal membatalkan undangan. Silakan coba lagi.",
    });
  });
});
