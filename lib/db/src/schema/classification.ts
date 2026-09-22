import { date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./identity.ts";
import { projectsTable } from "./safety.ts";

export const classificationSourcesTable = pgTable("classification_sources", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  documentVersion: text("document_version").notNull(),
  checksum: text("checksum"),
  verificationStatus: text("verification_status").notNull().default("MENUNGGU_VERIFIKASI"),
  effectiveFrom: date("effective_from", { mode: "string" }),
  effectiveTo: date("effective_to", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by"),
});

export const classificationVersionsTable = pgTable("classification_versions", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => classificationSourcesTable.id, { onDelete: "restrict" }),
  version: text("version").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("classification_versions_source_version_unique").on(table.sourceId, table.version),
]);

export const businessClassificationsTable = pgTable("business_classifications", {
  id: text("id").primaryKey(),
  versionId: text("version_id").notNull().references(() => classificationVersionsTable.id, { onDelete: "restrict" }),
  code: text("code").notNull(),
  family: text("family").notNull(),
  name: text("name").notNull(),
  businessType: text("business_type").notNull().default("PEKERJAAN_KONSTRUKSI"),
  nature: text("nature").notNull(),
  allowedQualifications: jsonb("allowed_qualifications").$type<string[]>().notNull().default([]),
  originalLabel: text("original_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("business_classifications_version_code_unique").on(table.versionId, table.code),
  index("business_classifications_code_idx").on(table.code),
]);

export const organizationClassificationsTable = pgTable("organization_classifications", {
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  classificationId: text("classification_id").notNull().references(() => businessClassificationsTable.id, { onDelete: "restrict" }),
  qualification: text("qualification"),
  evidenceStatus: text("evidence_status").notNull().default("MENUNGGU_VERIFIKASI"),
  evidenceReference: text("evidence_reference"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.classificationId] }),
  index("organization_classifications_organization_idx").on(table.organizationId),
]);

export const projectClassificationsTable = pgTable("project_classifications", {
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  classificationId: text("classification_id").notNull().references(() => businessClassificationsTable.id, { onDelete: "restrict" }),
  role: text("role").notNull().default("SUPPORTING"),
  requiredQualification: text("required_qualification"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.projectId, table.classificationId] }),
  uniqueIndex("project_classifications_primary_unique")
    .on(table.organizationId, table.projectId)
    .where(sql`${table.role} = 'PRIMARY'`),
  index("project_classifications_project_idx").on(table.organizationId, table.projectId),
]);

export const organizationProjectFitResultsTable = pgTable("organization_project_fit_results", {
  organizationId: text("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  score: integer("score").notNull().default(0),
  explanation: jsonb("explanation").$type<{
    sourceVerified: boolean;
    organizationEvidenceVerified: boolean;
    matched: string[];
    missing: string[];
    warnings: string[];
  }>().notNull(),
  referenceVersionIds: jsonb("reference_version_ids").$type<string[]>().notNull().default([]),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
  evaluatedBy: text("evaluated_by").notNull(),
}, (table) => [
  primaryKey({ columns: [table.organizationId, table.projectId] }),
  index("organization_project_fit_results_status_idx").on(table.organizationId, table.status),
]);

export const insertOrganizationClassificationSchema = createInsertSchema(organizationClassificationsTable).omit({ organizationId: true, createdBy: true, createdAt: true });
export const insertProjectClassificationSchema = createInsertSchema(projectClassificationsTable).omit({ organizationId: true, createdBy: true, createdAt: true });
export const classificationQualificationSchema = z.enum(["KECIL", "MENENGAH", "BESAR"]);
export type ClassificationQualification = z.infer<typeof classificationQualificationSchema>;