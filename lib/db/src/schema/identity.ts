import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const organizationRoleEnum = pgEnum("organization_role", [
  "owner",
  "safety_expert",
  "field_officer",
  "viewer",
]);

export const compensationStatusValues = [
  "NONE",
  "PENDING_REVOKE",
  "REVOKE_FAILED",
  "REVOKE_PERMANENTLY_FAILED",
  "DEAD_LETTER",
  "REVOKED",
] as const;
export type CompensationStatus = (typeof compensationStatusValues)[number];
export const compensationReasonValues = [
  "FINALIZATION_FAILED",
  "REVOKE_RETRYABLE",
  "REVOKE_PERMANENT",
  "RETRY_EXHAUSTED",
  "RETRY_SUCCESS",
  "MANUAL_OVERRIDE",
  "RECONCILIATION",
] as const;
export type CompensationReason = (typeof compensationReasonValues)[number];
export const errorCategoryValues = [
  "TERMINAL_SUCCESS",
  "RETRYABLE",
  "PERMANENT",
  "UNKNOWN",
] as const;
export type ErrorCategory = (typeof errorCategoryValues)[number];

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizationMembershipsTable = pgTable(
  "organization_memberships",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: organizationRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.userId] })],
);

export const organizationInvitationsTable = pgTable(
  "organization_invitations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: organizationRoleEnum("role").notNull(),
    invitedBy: text("invited_by").notNull(),
    clerkInvitationId: text("clerk_invitation_id"),
    correlationId: text("correlation_id").notNull().default(sql`gen_random_uuid()`),
    compensationStatus: text("compensation_status")
      .$type<CompensationStatus>()
      .notNull()
      .default("NONE"),
    compensationReason: text("compensation_reason").$type<CompensationReason>(),
    compensationUpdatedAt: timestamp("compensation_updated_at", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    claimToken: text("claim_token"),
    lastErrorMessage: text("last_error_message"),
    lastErrorCategory: text("last_error_category").$type<ErrorCategory>(),
    acceptedBy: text("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_invitations_active_email_idx")
      .on(table.organizationId, table.email)
      .where(sql`${table.acceptedAt} is null and ${table.revokedAt} is null`),
    index("organization_invitations_email_idx").on(table.email),
    index("organization_invitations_compensation_claim_idx").on(
      table.compensationStatus,
      table.nextRetryAt,
      table.leaseExpiresAt,
    ),
    index("organization_invitations_correlation_idx").on(table.correlationId),
  ],
);

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({
  createdAt: true,
});
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
export type OrganizationMembership = typeof organizationMembershipsTable.$inferSelect;
export type OrganizationInvitation = typeof organizationInvitationsTable.$inferSelect;
export type OrganizationRole = OrganizationMembership["role"];