import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getInviteErrorMessage,
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

  it("menyediakan respons error untuk semua perubahan keanggotaan", () => {
    assert.deepEqual(teamMutationErrorMessages, {
      updateRole: "Gagal memperbarui peran pengguna.",
      removeMember: "Gagal mencabut akses anggota.",
      revokeInvitation: "Gagal membatalkan undangan.",
    });
  });
});