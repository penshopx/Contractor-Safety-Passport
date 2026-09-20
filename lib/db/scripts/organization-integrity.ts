import type { PoolClient } from "pg";

const safetyTables = [
  "projects",
  "project_csms_readiness",
  "csms_profile_versions",
  "people",
  "safety_documents",
  "monthly_reports",
  "safety_boq_items",
  "certificates",
  "field_activities",
] as const;

export async function migrateOrganizationIntegrity(client: PoolClient) {
  await client.query("BEGIN");

  try {
    const organizationTable = await client.query<{ table_name: string | null }>(
      "SELECT to_regclass('organizations')::text AS table_name",
    );

    if (!organizationTable.rows[0]?.table_name) {
      await client.query("COMMIT");
      return 0;
    }

    let migratedTables = 0;

    for (const table of safetyTables) {
      const tableResult = await client.query<{ table_name: string | null }>(
        "SELECT to_regclass($1)::text AS table_name",
        [table],
      );
      if (!tableResult.rows[0]?.table_name) continue;

      await client.query(`
        INSERT INTO organizations (id, name, created_by)
        SELECT DISTINCT organization_id,
          CASE
            WHEN organization_id = 'legacy' THEN 'Data Legacy'
            ELSE 'Organisasi Migrasi ' || organization_id
          END,
          'system:migration'
        FROM ${table}
        WHERE organization_id IS NOT NULL
        ON CONFLICT (id) DO NOTHING
      `);

      await client.query(
        `CREATE INDEX IF NOT EXISTS ${table}_organization_id_idx
         ON ${table} (organization_id)`,
      );

      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = '${table}_organization_id_organizations_id_fk'
              AND conrelid = '${table}'::regclass
          ) THEN
            ALTER TABLE ${table}
              ADD CONSTRAINT ${table}_organization_id_organizations_id_fk
              FOREIGN KEY (organization_id)
              REFERENCES organizations(id)
              ON DELETE RESTRICT;
          END IF;
        END
        $$
      `);

      migratedTables += 1;
    }

    await client.query("COMMIT");
    return migratedTables;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}