import { count, eq } from "drizzle-orm";
import { db, classificationSourcesTable, classificationVersionsTable, businessClassificationsTable } from "../src/index.ts";
import { constructionClassificationSeed } from "../src/classification-data.ts";

const sourceId = "construction-classification-snapshot";
const versionId = `${sourceId}:snapshot-2026-09`;

const run = async () => {
  await db.insert(classificationSourcesTable).values({
    id: sourceId,
    issuer: "Snapshot referensi jasa konstruksi",
    title: "Jenis Usaha Pekerjaan Konstruksi, Klasifikasi dan Subklasifikasi",
    documentVersion: "snapshot-2026-09",
    verificationStatus: "MENUNGGU_VERIFIKASI",
    notes: "Data diimpor dari snapshot referensi yang disediakan; belum merupakan penetapan kepatuhan hukum.",
  }).onConflictDoNothing({ target: classificationSourcesTable.id });

  await db.insert(classificationVersionsTable).values({
    id: versionId,
    sourceId,
    version: "snapshot-2026-09",
    status: "ACTIVE",
  }).onConflictDoNothing({ target: classificationVersionsTable.id });

  for (const item of constructionClassificationSeed) {
    await db.insert(businessClassificationsTable).values({
      id: `${versionId}:${item.code}`,
      versionId,
      code: item.code,
      family: item.family,
      name: item.name,
      nature: item.nature,
      allowedQualifications: item.qualifications,
      originalLabel: item.name,
    }).onConflictDoNothing({ target: businessClassificationsTable.id });
  }
  const [{ count: seededCount }] = await db.select({ count: count() }).from(businessClassificationsTable).where(eq(businessClassificationsTable.versionId, versionId));
  process.stdout.write(`Seeded ${seededCount} construction classifications for ${versionId}\n`);
};

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});