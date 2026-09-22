import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInvitationAtomically,
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

describe("pembuatan undangan organisasi atomik", () => {
  it("hanya membuat satu undangan Clerk untuk dua permintaan bersamaan", async () => {
    let reservationTaken = false;
    let clerkInvitations = 0;
    const localInvitations: Array<{ id: string; clerkInvitationId?: string }> = [];

    const create = () =>
      createInvitationAtomically({
        reserve: async (): Promise<
          { id: string; clerkInvitationId?: string } | undefined
        > => {
          if (reservationTaken) return undefined;
          reservationTaken = true;
          const reservation = { id: "invitation-1" };
          localInvitations.push(reservation);
          return reservation;
        },
        createClerkInvitation: async () => {
          clerkInvitations += 1;
          await new Promise((resolve) => setTimeout(resolve, 5));
          return { id: "clerk-1" };
        },
        attachClerkInvitation: async (reservation, clerkInvitationId) => {
          reservation.clerkInvitationId = clerkInvitationId;
          return reservation;
        },
        releaseReservation: async (reservation) => {
          localInvitations.splice(localInvitations.indexOf(reservation), 1);
          reservationTaken = false;
        },
        revokeClerkInvitation: async () => {},
      });

    const results = await Promise.all([create(), create()]);

    assert.equal(results.filter((result) => result.created).length, 1);
    assert.deepEqual(
      results.find((result) => !result.created),
      {
        created: false,
        status: 409,
        error: "Email ini sudah memiliki undangan aktif",
      },
    );
    assert.equal(localInvitations.length, 1);
    assert.equal(clerkInvitations, 1);
  });

  it("mencabut undangan Clerk dan membersihkan reservasi saat penyimpanan gagal", async () => {
    const revoked: string[] = [];
    let reservationExists = false;

    await assert.rejects(() =>
      createInvitationAtomically({
        reserve: async () => {
          reservationExists = true;
          return { id: "invitation-1" };
        },
        createClerkInvitation: async () => ({ id: "clerk-1" }),
        attachClerkInvitation: async () => {
          throw new Error("database unavailable");
        },
        releaseReservation: async () => {
          reservationExists = false;
        },
        revokeClerkInvitation: async (id) => {
          revoked.push(id);
        },
      }),
    );

    assert.deepEqual(revoked, ["clerk-1"]);
    assert.equal(reservationExists, false);
  });

  it("mencabut Clerk bila reservasi dicabut saat pembuatan masih berjalan", async () => {
    const reservation = {
      id: "invitation-1",
      active: true,
      clerkInvitationId: undefined as string | undefined,
    };
    const revokedClerkInvitations: string[] = [];
    let continueClerkCreation!: () => void;
    const clerkCreationPaused = new Promise<void>((resolve) => {
      continueClerkCreation = resolve;
    });

    const creation = createInvitationAtomically({
      reserve: async () => reservation,
      createClerkInvitation: async () => {
        await clerkCreationPaused;
        return { id: "clerk-1" };
      },
      attachClerkInvitation: async (current, clerkInvitationId) => {
        if (!current.active) return undefined;
        current.clerkInvitationId = clerkInvitationId;
        return current;
      },
      releaseReservation: async (current) => {
        current.active = false;
      },
      revokeClerkInvitation: async (id) => {
        revokedClerkInvitations.push(id);
      },
    });

    reservation.active = false;
    continueClerkCreation();

    await assert.rejects(creation, /sudah tidak aktif/);
    assert.deepEqual(revokedClerkInvitations, ["clerk-1"]);
    assert.equal(reservation.clerkInvitationId, undefined);
  });

  it("membersihkan reservasi tanpa mencabut Clerk bila pembuatan Clerk gagal", async () => {
    let reservationExists = false;
    let revokeCalls = 0;

    await assert.rejects(() =>
      createInvitationAtomically({
        reserve: async () => {
          reservationExists = true;
          return { id: "invitation-1" };
        },
        createClerkInvitation: async () => {
          throw new Error("Clerk unavailable");
        },
        attachClerkInvitation: async (reservation) => reservation,
        releaseReservation: async () => {
          reservationExists = false;
        },
        revokeClerkInvitation: async () => {
          revokeCalls += 1;
        },
      }),
    );

    assert.equal(reservationExists, false);
    assert.equal(revokeCalls, 0);
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