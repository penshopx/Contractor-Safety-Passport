export type InvitationAcceptanceRecord = {
  email: string;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  revokedAt: Date | null;
  compensationStatus?: string;
};

export type InvitationAcceptanceDecision =
  | { allowed: true; alreadyAccepted: boolean }
  | { allowed: false; status: 403 | 404 | 409; error: string };

export type InvitationCreationDecision =
  | { allowed: true }
  | { allowed: false; status: 409; error: string };

export type InvitationCreationResult<T> =
  | { created: true; invitation: T }
  | { created: false; status: 409; error: string };

type CreateInvitationAtomicallyOptions<TReservation, TInvitation> = {
  reserve: () => Promise<TReservation | undefined>;
  createClerkInvitation: () => Promise<{ id: string }>;
  attachClerkInvitation: (
    reservation: TReservation,
    clerkInvitationId: string,
  ) => Promise<TInvitation | undefined>;
  releaseReservation: (
    reservation: TReservation,
    clerkInvitationId?: string,
  ) => Promise<void>;
  revokeClerkInvitation: (clerkInvitationId: string) => Promise<void>;
  preserveAfterClerkCreate?: boolean;
};

const DUPLICATE_INVITATION_ERROR = "Email ini sudah memiliki undangan aktif";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const createInvitationAtomically = async <TReservation, TInvitation>({
  reserve,
  createClerkInvitation,
  attachClerkInvitation,
  releaseReservation,
  revokeClerkInvitation,
  preserveAfterClerkCreate = false,
}: CreateInvitationAtomicallyOptions<
  TReservation,
  TInvitation
>): Promise<InvitationCreationResult<TInvitation>> => {
  const reservation = await reserve();
  if (!reservation) {
    return {
      created: false,
      status: 409,
      error: DUPLICATE_INVITATION_ERROR,
    };
  }

  let clerkInvitationId: string | undefined;
  try {
    const clerkInvitation = await createClerkInvitation();
    clerkInvitationId = clerkInvitation.id;
    const invitation = await attachClerkInvitation(
      reservation,
      clerkInvitationId,
    );
    if (!invitation) {
      throw new Error("Reservasi undangan sudah tidak aktif");
    }
    return { created: true, invitation };
  } catch (error) {
    if (clerkInvitationId) {
      try {
        if (!preserveAfterClerkCreate) await revokeClerkInvitation(clerkInvitationId);
      } finally {
        await releaseReservation(reservation, clerkInvitationId);
      }
    } else {
      await releaseReservation(reservation);
    }
    throw error;
  }
};

export const decideInvitationCreation = (
  hasActiveInvitation: boolean,
  isExistingMember: boolean,
): InvitationCreationDecision => {
  if (hasActiveInvitation) {
    return {
      allowed: false,
      status: 409,
      error: DUPLICATE_INVITATION_ERROR,
    };
  }
  if (isExistingMember) {
    return {
      allowed: false,
      status: 409,
      error: "Pengguna ini sudah menjadi anggota ruang kerja",
    };
  }
  return { allowed: true };
};

const parseTrustedOrigin = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
};

export const getTrustedApplicationOrigin = (
  environment: { APP_ORIGIN?: string; REPLIT_DOMAINS?: string },
) => {
  const configuredOrigin = parseTrustedOrigin(environment.APP_ORIGIN);
  if (configuredOrigin) return configuredOrigin;

  const replitDomain = environment.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const replitOrigin = parseTrustedOrigin(replitDomain);
  if (replitOrigin) return replitOrigin;

  throw new Error("APP_ORIGIN atau REPLIT_DOMAINS harus dikonfigurasi");
};

export const decideInvitationAcceptance = (
  invitation: InvitationAcceptanceRecord | undefined,
  userId: string,
  userEmails: string[],
): InvitationAcceptanceDecision => {
  if (!invitation || invitation.revokedAt) {
    return {
      allowed: false,
      status: 404,
      error: "Undangan tidak ditemukan atau sudah tidak berlaku",
    };
  }
  if (invitation.compensationStatus && invitation.compensationStatus !== "NONE") {
    return { allowed: false, status: 409, error: "Undangan sedang diproses dan belum dapat digunakan" };
  }
  if (invitation.acceptedAt && invitation.acceptedBy !== userId) {
    return { allowed: false, status: 404, error: "Undangan sudah digunakan" };
  }
  const normalizedEmails = userEmails.map(normalizeEmail);
  if (!normalizedEmails.includes(normalizeEmail(invitation.email))) {
    return {
      allowed: false,
      status: 403,
      error: "Undangan ini ditujukan untuk alamat email lain",
    };
  }
  return { allowed: true, alreadyAccepted: Boolean(invitation.acceptedAt) };
};