import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import pg, { type PoolClient } from "pg";
import { migrateOrganizationIntegrity } from "./organization-integrity.ts";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaName = `organization_integrity_${crypto.randomUUID().replaceAll("-", "")}`;
const safetyTables = [
  "projects",
  "project_csms_readiness",
  "project_csms_readiness_history",
  "csms_profile_versions",
  "people",
  "safety_documents",
  "monthly_reports",
  "safety_boq_items",
  "safety_boq_drafts",
  "safety_price_catalog_items",
  "certificates",
  "field_activities",
] as const;
let client: PoolClient;

before(async () => {
  client = await pool.connect();
  await client.query(`CREATE SCHEMA ${schemaName}`);
  await client.query(`SET search_path TO ${schemaName}`);
});

after(async () => {
  await client.query("SET search_path TO public");
  await client.query(`DROP SCHEMA ${schemaName} CASCADE`);
  client.release();
  await pool.end();
});

describe("migrasi integritas organisasi", () => {
  it("aman pada database kosong dan saat dijalankan ulang", async () => {
    assert.equal(await migrateOrganizationIntegrity(client), 0);
    assert.equal(await migrateOrganizationIntegrity(client), 0);
  });

  it("mempertahankan seluruh data legacy dan idempoten", async () => {
    await client.query(`
      CREATE TABLE organizations (
        id text PRIMARY KEY,
        name text NOT NULL,
        created_by text NOT NULL
      );
    `);

    for (const table of safetyTables) {
      await client.query(`
        CREATE TABLE ${table} (
          id serial PRIMARY KEY,
          organization_id text NOT NULL,
          legacy_value text NOT NULL
        )
      `);
      await client.query(
        `INSERT INTO ${table} (organization_id, legacy_value)
         VALUES ('legacy', $1), ('org-lama', $2)`,
        [`${table}-legacy`, `${table}-org-lama`],
      );
    }

    assert.equal(await migrateOrganizationIntegrity(client), safetyTables.length);
    const firstMigrationRows = new Map<string, unknown[]>();
    for (const table of safetyTables) {
      const result = await client.query(
        `SELECT organization_id, legacy_value FROM ${table} ORDER BY id`,
      );
      firstMigrationRows.set(table, result.rows);
    }
    const firstMigrationOrganizations = await client.query(
      "SELECT id, name, created_by FROM organizations ORDER BY id",
    );

    assert.equal(await migrateOrganizationIntegrity(client), safetyTables.length);

    const secondMigrationOrganizations = await client.query(
      "SELECT id, name, created_by FROM organizations ORDER BY id",
    );
    assert.deepEqual(
      secondMigrationOrganizations.rows,
      firstMigrationOrganizations.rows,
    );
    assert.deepEqual(secondMigrationOrganizations.rows, [
      {
        id: "legacy",
        name: "Data Legacy",
        created_by: "system:migration",
      },
      {
        id: "org-lama",
        name: "Organisasi Migrasi org-lama",
        created_by: "system:migration",
      },
    ]);

    for (const table of safetyTables) {
      const rows = await client.query(
        `SELECT organization_id, legacy_value FROM ${table} ORDER BY id`,
      );
      assert.deepEqual(rows.rows, firstMigrationRows.get(table));
      assert.equal(rows.rowCount, 2);

      const constraints = await client.query(
        `
          SELECT constraint_record.confdeltype, constraint_record.convalidated
          FROM pg_constraint constraint_record
          JOIN pg_attribute source_column
            ON source_column.attrelid = constraint_record.conrelid
           AND source_column.attnum = ANY (constraint_record.conkey)
          JOIN pg_attribute target_column
            ON target_column.attrelid = constraint_record.confrelid
           AND target_column.attnum = ANY (constraint_record.confkey)
          WHERE constraint_record.contype = 'f'
            AND constraint_record.conrelid = $1::regclass
            AND constraint_record.confrelid = 'organizations'::regclass
            AND source_column.attname = 'organization_id'
            AND target_column.attname = 'id'
        `,
        [table],
      );
      assert.deepEqual(constraints.rows, [
        { confdeltype: "r", convalidated: true },
      ]);

      const indexes = await client.query(
        `
          SELECT index_definition.indexdef
          FROM pg_indexes index_definition
          WHERE index_definition.schemaname = current_schema()
            AND index_definition.indexname = $1
        `,
        [`${table}_organization_id_idx`],
      );
      assert.equal(indexes.rowCount, 1);
      assert.match(indexes.rows[0].indexdef, /\(organization_id\)$/);
    }
  });
});
