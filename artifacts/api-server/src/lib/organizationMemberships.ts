type OrganizationRole = "owner" | "safety_expert" | "field_officer" | "viewer";

export type MemberRoleChangeDecision =
  | { allowed: true }
  | { allowed: false; status: 403; error: string };

export const decideMemberRoleChange = (
  currentRole: OrganizationRole,
): MemberRoleChangeDecision =>
  currentRole === "owner"
    ? {
        allowed: false,
        status: 403,
        error: "Peran pemilik tidak dapat diubah",
      }
    : { allowed: true };