import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import pg, { type PoolClient } from "pg";
import { migrateOrganizationIntegrity } from "./organization-integrity.ts";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schemaName = `organization_integrity_${crypto.randomUUID().replaceAll("-", "")}`;
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

  it("mempertahankan data legacy dan idempoten pada tabel yang tersedia", async () => {
    await client.query(`
      CREATE TABLE organizations (
        id text PRIMARY KEY,
        name text NOT NULL,
        created_by text NOT NULL
      );
      CREATE TABLE projects (
        id serial PRIMARY KEY,
        organization_id text NOT NULL,
        name text NOT NULL
      );
      INSERT INTO projects (organization_id, name)
      VALUES ('legacy', 'Proyek Lama'), ('org-lama', 'Proyek Lama Lain');
    `);

    assert.equal(await migrateOrganizationIntegrity(client), 1);
    assert.equal(await migrateOrganizationIntegrity(client), 1);

    const projects = await client.query("SELECT count(*)::int AS count FROM projects");
    const organizations = await client.query(
      "SELECT id FROM organizations ORDER BY id",
    );
    const constraints = await client.query(`
      SELECT count(*)::int AS count
      FROM pg_constraint
      WHERE conname = 'projects_organization_id_organizations_id_fk'
        AND conrelid = 'projects'::regclass
    `);
    const indexes = await client.query(`
      SELECT count(*)::int AS count
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND indexname = 'projects_organization_id_idx'
    `);

    assert.equal(projects.rows[0].count, 2);
    assert.deepEqual(
      organizations.rows.map(({ id }) => id),
      ["legacy", "org-lama"],
    );
    assert.equal(constraints.rows[0].count, 1);
    assert.equal(indexes.rows[0].count, 1);
  });
});