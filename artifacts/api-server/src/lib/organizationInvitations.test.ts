import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideInvitationAcceptance,
  decideInvitationCreation,
  getTrustedApplicationOrigin,
} from "./organizationInvitations.ts";

const pendingInvitation = {
  email: "anggota@example.com",
  acceptedAt: null,
  acceptedBy: null,
  revokedAt: null,
};

describe("penerimaan undangan organisasi", () => {
  it("mengizinkan undangan baru untuk email yang belum terdaftar", () => {
    assert.deepEqual(decideInvitationCreation(false, false), { allowed: true });
  });

  it("menolak undangan aktif yang duplikat", () => {
    assert.deepEqual(decideInvitationCreation(true, false), {
      allowed: false,
      status: 409,
      error: "Email ini sudah memiliki undangan aktif",
    });
  });

  it("menolak undangan untuk pengguna yang sudah menjadi anggota", () => {
    assert.deepEqual(decideInvitationCreation(false, true), {
      allowed: false,
      status: 409,
      error: "Pengguna ini sudah menjadi anggota ruang kerja",
    });
  });

  it("menerima undangan spesifik saat email akun cocok", () => {
    assert.deepEqual(
      decideInvitationAcceptance(
        pendingInvitation,
        "user_2",
        ["Anggota@Example.com"],
      ),
      { allowed: true, alreadyAccepted: false },
    );
  });

  it("tidak bergantung pada status keanggotaan ruang kerja lain", () => {
    assert.equal(
      decideInvitationAcceptance(
        pendingInvitation,
        "existing_user",
        ["anggota@example.com"],
      ).allowed,
      true,
    );
  });

  it("menolak akun dengan email yang berbeda", () => {
    const result = decideInvitationAcceptance(
      pendingInvitation,
      "user_3",
      ["orang-lain@example.com"],
    );
    assert.deepEqual(result, {
      allowed: false,
      status: 403,
      error: "Undangan ini ditujukan untuk alamat email lain",
    });
  });

  it("menolak undangan yang sudah dicabut", () => {
    const result = decideInvitationAcceptance(
      { ...pendingInvitation, revokedAt: new Date() },
      "user_2",
      ["anggota@example.com"],
    );
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.equal(result.status, 404);
  });

  it("membuat penerimaan ulang oleh pengguna yang sama idempoten", () => {
    assert.deepEqual(
      decideInvitationAcceptance(
        {
          ...pendingInvitation,
          acceptedAt: new Date(),
          acceptedBy: "user_2",
        },
        "user_2",
        ["anggota@example.com"],
      ),
      { allowed: true, alreadyAccepted: true },
    );
  });

  it("menolak penggunaan ulang oleh pengguna berbeda", () => {
    const result = decideInvitationAcceptance(
      {
        ...pendingInvitation,
        acceptedAt: new Date(),
        acceptedBy: "user_2",
      },
      "user_3",
      ["anggota@example.com"],
    );
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.equal(result.status, 404);
  });
});

describe("asal tautan undangan", () => {
  it("memakai origin aplikasi yang dikonfigurasi", () => {
    assert.equal(
      getTrustedApplicationOrigin({
        APP_ORIGIN: "https://safety.example.com/path",
        REPLIT_DOMAINS: "dev.example.replit.dev",
      }),
      "https://safety.example.com",
    );
  });

  it("memakai domain Replit tepercaya tanpa membaca header permintaan", () => {
    assert.equal(
      getTrustedApplicationOrigin({
        APP_ORIGIN: undefined,
        REPLIT_DOMAINS: "safety.example.replit.app,other.example.replit.app",
      }),
      "https://safety.example.replit.app",
    );
  });

  it("menolak origin HTTP non-lokal dan konfigurasi kosong", () => {
    assert.throws(() =>
      getTrustedApplicationOrigin({
        APP_ORIGIN: "http://attacker.example",
        REPLIT_DOMAINS: undefined,
      }),
    );
  });
});