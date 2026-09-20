import {
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("legacy"),
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
});

export const peopleTable = pgTable("people", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("legacy"),
  createdBy: text("created_by").notNull().default("system"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  level: text("level").notNull(),
  skkni: text("skkni").notNull(),
  project: text("project").notNull(),
  status: text("status").notNull(),
  initials: text("initials").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const safetyDocumentsTable = pgTable("safety_documents", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("legacy"),
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
});

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("legacy"),
  createdBy: text("created_by").notNull().default("system"),
  owner: text("owner").notNull(),
  credential: text("credential").notNull(),
  issuer: text("issuer").notNull(),
  expiresAt: date("expires_at", { mode: "string" }).notNull(),
  status: text("status").notNull(),
});

export const fieldActivitiesTable = pgTable("field_activities", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id").notNull().default("legacy"),
  createdBy: text("created_by").notNull().default("system"),
  clientId: text("client_id").notNull().default("legacy"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  project: text("project").notNull(),
  actor: text("actor").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  photoDataUrl: text("photo_data_url"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationAccuracy: real("location_accuracy"),
  signatureSvg: text("signature_svg"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

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
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertFieldActivity = z.infer<typeof insertFieldActivitySchema>;