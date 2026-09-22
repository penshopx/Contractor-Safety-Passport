import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  primaryKey,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./identity.ts";

export const projectsTable = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .default("legacy")
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull().default("system"),
    name: text("name").notNull(),
    client: text("client").notNull(),
    location: text("location").notNull(),
    standard: text("standard").notNull(),
    status: text("status").notNull(),
    progress: integer("progress").notNull().default(0),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }),
    value: real("value").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("projects_organization_id_idx").on(table.organizationId)],
);

export const projectCsmsReadinessTable = pgTable(
  "project_csms_readiness",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    projectId: integer("project_id").notNull(),
    profileId: text("profile_id").notNull(),
    itemStatuses: jsonb("item_statuses")
      .$type<Record<string, "complete" | "follow_up">>()
      .notNull()
      .default({}),
    revision: integer("revision").notNull().default(0),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      name: "project_csms_readiness_organization_project_pk",
      columns: [table.organizationId, table.projectId],
    }),
    index("project_csms_readiness_organization_id_idx").on(table.organizationId),
  ],
);

export const projectCsmsReadinessHistoryTable = pgTable(
  "project_csms_readiness_history",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    projectId: integer("project_id").notNull(),
    profileId: text("profile_id").notNull(),
    itemStatuses: jsonb("item_statuses")
      .$type<Record<string, "complete" | "follow_up">>()
      .notNull(),
    revision: integer("revision").notNull(),
    changedBy: text("changed_by").notNull(),
    changedByName: text("changed_by_name").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("project_csms_readiness_history_organization_project_idx").on(
      table.organizationId,
      table.projectId,
    ),
  ],
);

export const csmsProfileVersionsTable = pgTable(
  "csms_profile_versions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    issuer: text("issuer").notNull(),
    version: text("version").notNull(),
    title: text("title").notNull(),
    source: text("source").notNull(),
    stages: jsonb("stages").$type<Array<{
      code: string;
      name: string;
      purpose: string;
      roles: string[];
      questions: string[];
      evidence: string[];
      validations: string[];
    }>>().notNull(),
    locked: boolean("locked").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("csms_profile_versions_org_issuer_version_unique").on(
      table.organizationId,
      table.issuer,
      table.version,
    ),
    index("csms_profile_versions_organization_id_idx").on(table.organizationId),
  ],
);

export const peopleTable = pgTable(
  "people",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .default("legacy")
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull().default("system"),
    name: text("name").notNull(),
    role: text("role").notNull(),
    level: text("level").notNull(),
    skkni: text("skkni").notNull(),
    project: text("project").notNull(),
    status: text("status").notNull(),
    initials: text("initials").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("people_organization_id_idx").on(table.organizationId)],
);

export const safetyDocumentsTable = pgTable(
  "safety_documents",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .default("legacy")
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull().default("system"),
    name: text("name").notNull(),
    type: text("type").notNull(),
    standard: text("standard").notNull(),
    project: text("project").notNull(),
    status: text("status").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("safety_documents_organization_id_idx").on(table.organizationId)],
);

export const monthlyReportsTable = pgTable(
  "monthly_reports",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull(),
    projectId: integer("project_id").notNull(),
    period: text("period").notNull(),
    status: text("status").notNull().default("draft"),
    evaluation: text("evaluation").notNull().default(""),
    notes: text("notes").notNull().default(""),
    preparedBy: text("prepared_by").notNull().default(""),
    reviewedBy: text("reviewed_by").notNull().default(""),
    approvedBy: text("approved_by").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("monthly_reports_organization_project_period_idx").on(
      table.organizationId,
      table.projectId,
      table.period,
    ),
    index("monthly_reports_organization_id_idx").on(table.organizationId),
  ],
);

export const safetyBoqItemsTable = pgTable(
  "safety_boq_items",
  {
    id: text("id").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    projectId: integer("project_id").notNull(),
    createdBy: text("created_by").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    volume: real("volume").notNull(),
    unit: text("unit").notNull(),
    unitPrice: real("unit_price").notNull(),
    migrationKey: text("migration_key"),
    catalogItemId: text("catalog_item_id"),
    priceRegion: text("price_region"),
    priceSource: text("price_source"),
    priceUpdatedAt: date("price_updated_at", { mode: "date" }),
    risk: text("risk").notNull(),
    stage: text("stage").notNull(),
    controlNeed: text("control_need").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      name: "safety_boq_items_organization_project_id_pk",
      columns: [table.organizationId, table.projectId, table.id],
    }),
    uniqueIndex("safety_boq_items_organization_project_migration_key_idx").on(
      table.organizationId,
      table.projectId,
      table.migrationKey,
    ),
    index("safety_boq_items_organization_id_idx").on(table.organizationId),
  ],
);

export const safetyBoqDraftsTable = pgTable(
  "safety_boq_drafts",
  {
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    projectId: integer("project_id").notNull(),
    revision: integer("revision").notNull().default(0),
    updatedBy: text("updated_by").notNull().default("system"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      name: "safety_boq_drafts_organization_project_pk",
      columns: [table.organizationId, table.projectId],
    }),
    index("safety_boq_drafts_organization_id_idx").on(table.organizationId),
  ],
);

export const safetyPriceCatalogItemsTable = pgTable(
  "safety_price_catalog_items",
  {
    id: text("id").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    unit: text("unit").notNull(),
    referencePrice: real("reference_price").notNull(),
    region: text("region").notNull(),
    source: text("source").notNull(),
    priceUpdatedAt: date("price_updated_at", { mode: "string" }).notNull(),
    risk: text("risk").notNull(),
    stage: text("stage").notNull(),
    controlNeed: text("control_need").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      name: "safety_price_catalog_items_organization_id_pk",
      columns: [table.organizationId, table.id],
    }),
    index("safety_price_catalog_items_organization_id_idx").on(table.organizationId),
  ],
);

export const certificatesTable = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .default("legacy")
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull().default("system"),
    owner: text("owner").notNull(),
    credential: text("credential").notNull(),
    issuer: text("issuer").notNull(),
    expiresAt: date("expires_at", { mode: "string" }).notNull(),
    status: text("status").notNull(),
  },
  (table) => [index("certificates_organization_id_idx").on(table.organizationId)],
);

export const fieldActivitiesTable = pgTable(
  "field_activities",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .default("legacy")
      .references(() => organizationsTable.id, { onDelete: "restrict" }),
    createdBy: text("created_by").notNull().default("system"),
    clientId: text("client_id").notNull().default("legacy"),
    projectId: integer("project_id").references(() => projectsTable.id, {
      onDelete: "restrict",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    project: text("project").notNull(),
    actor: text("actor").notNull(),
    status: text("status").notNull(),
    notes: text("notes"),
    photoObjectPath: text("photo_object_path"),
    // Kept temporarily so the startup migration can move existing base64 photos.
    photoDataUrl: text("photo_data_url"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    locationAccuracy: real("location_accuracy"),
    signatureSvg: text("signature_svg"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("field_activities_organization_client_id_idx").on(
      table.organizationId,
      table.clientId,
    ).where(sql`${table.clientId} <> 'legacy'`),
    index("field_activities_organization_id_idx").on(table.organizationId),
    index("field_activities_project_id_idx").on(table.projectId),
    index("field_activities_photo_object_path_idx").on(table.photoObjectPath),
  ],
);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  createdAt: true,
});
export const insertPersonSchema = createInsertSchema(peopleTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  createdAt: true,
});
export const insertDocumentSchema = createInsertSchema(safetyDocumentsTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  updatedAt: true,
});
export const insertMonthlyReportSchema = createInsertSchema(monthlyReportsTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSafetyBoqItemSchema = createInsertSchema(safetyBoqItemsTable).omit({
  organizationId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSafetyPriceCatalogItemSchema = createInsertSchema(
  safetyPriceCatalogItemsTable,
).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
});
export const insertFieldActivitySchema = createInsertSchema(fieldActivitiesTable).omit({
  id: true,
  organizationId: true,
  createdBy: true,
  syncedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type InsertSafetyBoqItem = z.infer<typeof insertSafetyBoqItemSchema>;
export type InsertSafetyPriceCatalogItem = z.infer<
  typeof insertSafetyPriceCatalogItemSchema
>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertFieldActivity = z.infer<typeof insertFieldActivitySchema>;