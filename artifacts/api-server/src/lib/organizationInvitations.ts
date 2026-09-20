export type InvitationAcceptanceRecord = {
  email: string;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  revokedAt: Date | null;
};

export type InvitationAcceptanceDecision =
  | { allowed: true; alreadyAccepted: boolean }
  | { allowed: false; status: 403 | 404; error: string };

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

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