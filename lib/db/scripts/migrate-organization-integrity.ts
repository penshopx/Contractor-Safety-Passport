import pg from "pg";
import { migrateOrganizationIntegrity } from "./organization-integrity.ts";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  const migratedTables = await migrateOrganizationIntegrity(client);
  console.log(
    `Organization integrity migration completed for ${migratedTables} tables`,
  );
} finally {
  client.release();
  await pool.end();
}