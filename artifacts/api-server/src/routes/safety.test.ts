import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express, { type RequestHandler } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  certificatesTable,
  csmsProfileVersionsTable,
  db,
  fieldActivitiesTable,
  monthlyReportsTable,
  organizationMembershipsTable,
  organizationsTable,
  peopleTable,
  projectCsmsReadinessHistoryTable,
  pool,
  projectCsmsReadinessTable,
  projectsTable,
  safetyBoqDraftsTable,
  safetyBoqItemsTable,
  safetyPriceCatalogItemsTable,
  safetyDocumentsTable,
  type OrganizationRole,
} from "@workspace/db";
import { createRequireOrganization } from "../middlewares/organizationContext.ts";
import { createSafetyRouter } from "./safety.ts";

const runId = crypto.randomUUID();
const organizationA = `isolation-a-${runId}`;
const organizationB = `isolation-b-${runId}`;
const userIds = {
  owner: `owner-${runId}`,
  safety_expert: `expert-${runId}`,
  field_officer: `field-${runId}`,
  viewer: `viewer-${runId}`,
} satisfies Record<OrganizationRole, string>;
const limitedUserId = `limited-${runId}`;

let baseUrl = "";
let closeServer: (() => Promise<void>) | undefined;
let projectAId = 0;
let projectBId = 0;
let personBId = 0;
let beforeSafetyBoqItemsRead: (() => Promise<void>) | undefined;

const contextMiddleware: RequestHandler = (req, res, next) => {
  const organizationId = req.header("x-organization-id");
  const role = req.header("x-test-role") as OrganizationRole | undefined;
  if (!organizationId || !role || !Object.hasOwn(userIds, role)) {
    res.status(403).json({ error: "Konteks pengujian tidak valid" });
    return;
  }
  req.organizationContext = {
    organizationId,
    role,
    userId: userIds[role],
  };
  next();
};

const request = async (
  path: string,
  options: {
    organizationId?: string;
    role?: OrganizationRole;
    method?: string;
    body?: unknown;
  } = {},
) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      "x-organization-id": options.organizationId ?? organizationA,
      "x-test-role": options.role ?? "viewer",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body: any = response.status === 204 ? undefined : await response.json();
  return { status: response.status, body };
};

const projectBody = (name: string) => ({
  name,
  client: `Klien ${name}`,
  location: "Jakarta",
  standard: "SMKK",
  status: "active",
  progress: 25,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  value: 1_000_000,
});

const personBody = (name: string, project: string) => ({
  name,
  role: "Petugas K3",
  level: "Muda",
  skkni: "SKK-K3",
  project,
  status: "active",
});

const documentBody = (name: string, project: string) => ({
  name,
  type: "RKK",
  standard: "SMKK",
  project,
  status: "ready",
});

const certificateBody = (owner: string) => ({
  owner,
  credential: "Sertifikat K3",
  issuer: "BNSP",
  expiresAt: "2027-01-01",
  status: "valid",
});

const activityBody = (
  suffix: string,
  project: string,
  projectId = projectAId,
) => ({
  clientId: `${runId}-${suffix}`,
  projectId,
  type: "Inspection",
  title: `Inspeksi ${suffix}`,
  project,
  actor: "Petugas Lapangan",
  status: "complete",
  occurredAt: "2026-09-20T08:00:00.000Z",
});

const csmsProfileBody = (suffix: string) => ({
  issuer: `Principal ${suffix}`,
  version: `Pedoman ${suffix}`,
  title: `CSMS ${suffix}`,
  source: `Sumber ${suffix}`,
  stages: [
    {
      code: "PQ",
      name: "Prakualifikasi",
      purpose: "Memastikan kontraktor memenuhi persyaratan keselamatan.",
      roles: ["Admin CSMS"],
      questions: ["Apakah persyaratan telah dipenuhi?"],
      evidence: ["Dokumen pendukung"],
      validations: ["Dokumen masih berlaku"],
    },
  ],
});

const catalogItemBody = (suffix: string) => ({
  description: `Helm keselamatan ${suffix}`,
  category: "APD & APK",
  unit: "Bh",
  referencePrice: 75_000,
  region: "Nasional",
  source: `Pemasok ${suffix}`,
  priceUpdatedAt: "2026-09-21",
  risk: "Tinggi",
  stage: "Pelaksanaan",
  controlNeed: "Pelindung kepala wajib",
});

const isForeignKeyViolation = (error: unknown) =>
  error instanceof Error &&
  "cause" in error &&
  error.cause instanceof Error &&
  "code" in error.cause &&
  error.cause.code === "23503";

before(async () => {
  await db.insert(organizationsTable).values([
    { id: organizationA, name: "Kontraktor A", createdBy: userIds.owner },
    { id: organizationB, name: "Kontraktor B", createdBy: userIds.owner },
  ]);
  await db.insert(organizationMembershipsTable).values([
    ...(Object.entries(userIds) as [OrganizationRole, string][]).flatMap(
      ([role, userId]) => [
        { organizationId: organizationA, userId, role },
        { organizationId: organizationB, userId, role },
      ],
    ),
    {
      organizationId: organizationA,
      userId: limitedUserId,
      role: "viewer",
    },
  ]);
  const projects = await db
    .insert(projectsTable)
    .values([
      {
        ...projectBody(`Proyek A ${runId}`),
        organizationId: organizationA,
        createdBy: userIds.owner,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
      {
        ...projectBody(`Proyek B ${runId}`),
        organizationId: organizationB,
        createdBy: userIds.owner,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    ])
    .returning();
  projectAId = projects[0].id;
  projectBId = projects[1].id;

  const people = await db
    .insert(peopleTable)
    .values([
      {
        ...personBody(`Personel A ${runId}`, projects[0].name),
        initials: "PA",
        organizationId: organizationA,
        createdBy: userIds.owner,
      },
      {
        ...personBody(`Personel B ${runId}`, projects[1].name),
        initials: "PB",
        organizationId: organizationB,
        createdBy: userIds.owner,
      },
    ])
    .returning();
  personBId = people[1].id;
  await db.insert(safetyDocumentsTable).values([
    {
      ...documentBody(`Dokumen A ${runId}`, projects[0].name),
      organizationId: organizationA,
      createdBy: userIds.owner,
    },
    {
      ...documentBody(`Dokumen B ${runId}`, projects[1].name),
      organizationId: organizationB,
      createdBy: userIds.owner,
      status: "review",
    },
  ]);
  await db.insert(certificatesTable).values([
    {
      ...certificateBody(people[0].name),
      expiresAt: "2027-01-01",
      organizationId: organizationA,
      createdBy: userIds.owner,
    },
    {
      ...certificateBody(people[1].name),
      expiresAt: "2027-01-01",
      organizationId: organizationB,
      createdBy: userIds.owner,
      status: "expired",
    },
  ]);
  await db.insert(fieldActivitiesTable).values([
    {
      ...activityBody("seed-a", projects[0].name, projects[0].id),
      occurredAt: new Date("2026-09-20T08:00:00.000Z"),
      organizationId: organizationA,
      createdBy: userIds.owner,
    },
    {
      ...activityBody("seed-b", projects[1].name, projects[1].id),
      occurredAt: new Date("2026-09-20T09:00:00.000Z"),
      organizationId: organizationB,
      createdBy: userIds.owner,
      status: "open",
    },
  ]);

  const app = express();
  app.use(express.json());
  app.use(
    "/membership",
    createSafetyRouter(createRequireOrganization(() => limitedUserId)),
  );
  app.use(createSafetyRouter(contextMiddleware, {
    beforeSafetyBoqItemsRead: () => beforeSafetyBoqItemsRead?.() ?? Promise.resolve(),
    resolveUserName: async (userId) =>
      userId === userIds.safety_expert ? "Ahli K3" : "Pemilik Workspace",
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
  closeServer = () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

after(async () => {
  await closeServer?.();
  const organizationIds = [organizationA, organizationB];
  await db
    .delete(fieldActivitiesTable)
    .where(inArray(fieldActivitiesTable.organizationId, organizationIds));
  await db
    .delete(monthlyReportsTable)
    .where(inArray(monthlyReportsTable.organizationId, organizationIds));
  await db
    .delete(safetyBoqItemsTable)
    .where(inArray(safetyBoqItemsTable.organizationId, organizationIds));
  await db
    .delete(safetyBoqDraftsTable)
    .where(inArray(safetyBoqDraftsTable.organizationId, organizationIds));
  await db
    .delete(safetyPriceCatalogItemsTable)
    .where(inArray(safetyPriceCatalogItemsTable.organizationId, organizationIds));
  await db
    .delete(certificatesTable)
    .where(inArray(certificatesTable.organizationId, organizationIds));
  await db
    .delete(safetyDocumentsTable)
    .where(inArray(safetyDocumentsTable.organizationId, organizationIds));
  await db
    .delete(projectCsmsReadinessHistoryTable)
    .where(
      inArray(projectCsmsReadinessHistoryTable.organizationId, organizationIds),
    );
  await db
    .delete(projectCsmsReadinessTable)
    .where(inArray(projectCsmsReadinessTable.organizationId, organizationIds));
  await db
    .delete(csmsProfileVersionsTable)
    .where(inArray(csmsProfileVersionsTable.organizationId, organizationIds));
  await db
    .delete(peopleTable)
    .where(inArray(peopleTable.organizationId, organizationIds));
  await db
    .delete(projectsTable)
    .where(inArray(projectsTable.organizationId, organizationIds));
  await db
    .delete(organizationMembershipsTable)
    .where(
      inArray(organizationMembershipsTable.organizationId, organizationIds),
    );
  await db
    .delete(organizationsTable)
    .where(inArray(organizationsTable.id, organizationIds));
  await pool.end();
});

describe("isolasi data antar kontraktor", () => {
  it("membagikan katalog dalam organisasi dan membatasi perubahan berdasarkan peran", async () => {
    const forbiddenCreate = await request("/safety-price-catalog", {
      role: "viewer",
      method: "POST",
      body: catalogItemBody("ditolak"),
    });
    assert.equal(forbiddenCreate.status, 403);

    const created = await request("/safety-price-catalog", {
      role: "owner",
      method: "POST",
      body: catalogItemBody("A"),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.referencePrice, 75_000);
    assert.equal(created.body.priceUpdatedAt, "2026-09-21");

    const visibleToMember = await request("/safety-price-catalog", {
      role: "field_officer",
    });
    assert.equal(visibleToMember.status, 200);
    assert.equal(visibleToMember.body.length, 1);
    assert.equal(visibleToMember.body[0].id, created.body.id);

    const hiddenFromOtherOrganization = await request("/safety-price-catalog", {
      organizationId: organizationB,
      role: "viewer",
    });
    assert.equal(hiddenFromOtherOrganization.status, 200);
    assert.equal(hiddenFromOtherOrganization.body.length, 0);

    const forbiddenUpdate = await request(`/safety-price-catalog/${created.body.id}`, {
      role: "field_officer",
      method: "PATCH",
      body: catalogItemBody("tidak sah"),
    });
    assert.equal(forbiddenUpdate.status, 403);

    const updated = await request(`/safety-price-catalog/${created.body.id}`, {
      role: "safety_expert",
      method: "PATCH",
      body: { ...catalogItemBody("revisi"), referencePrice: 90_000 },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.referencePrice, 90_000);
    assert.equal(updated.body.priceUpdatedAt, "2026-09-21");

    const crossOrganizationDelete = await request(`/safety-price-catalog/${created.body.id}`, {
      organizationId: organizationB,
      role: "owner",
      method: "DELETE",
    });
    assert.equal(crossOrganizationDelete.status, 404);

    const deleted = await request(`/safety-price-catalog/${created.body.id}`, {
      role: "owner",
      method: "DELETE",
    });
    assert.equal(deleted.status, 204);
  });

  it("mempertahankan snapshot draft proyek setelah katalog diubah dan dihapus", async () => {
    const project = await request("/projects", {
      role: "owner",
      method: "POST",
      body: projectBody(`Snapshot katalog ${runId}`),
    });
    assert.equal(project.status, 201);

    const createdCatalog = await request("/safety-price-catalog", {
      role: "owner",
      method: "POST",
      body: catalogItemBody("snapshot lama"),
    });
    assert.equal(createdCatalog.status, 201);

    const oldSnapshot = {
      id: `boq-catalog-old-${runId}`,
      description: createdCatalog.body.description,
      category: createdCatalog.body.category,
      volume: 1,
      unit: createdCatalog.body.unit,
      unitPrice: createdCatalog.body.referencePrice,
      catalogItemId: createdCatalog.body.id,
      priceRegion: createdCatalog.body.region,
      priceSource: createdCatalog.body.source,
      priceUpdatedAt: createdCatalog.body.priceUpdatedAt,
      risk: createdCatalog.body.risk,
      stage: createdCatalog.body.stage,
      controlNeed: createdCatalog.body.controlNeed,
    };
    const firstDraft = await request(`/projects/${project.body.id}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: { revision: 0, items: [oldSnapshot] },
    });
    assert.equal(firstDraft.status, 200);

    const revisedCatalogBody = {
      ...catalogItemBody("snapshot baru"),
      referencePrice: 90_000,
      region: "Jabodetabek",
      source: "Survei pasar revisi",
      priceUpdatedAt: "2026-10-01",
    };
    const revisedCatalog = await request(
      `/safety-price-catalog/${createdCatalog.body.id}`,
      {
        role: "safety_expert",
        method: "PATCH",
        body: revisedCatalogBody,
      },
    );
    assert.equal(revisedCatalog.status, 200);

    const newSnapshot = {
      ...oldSnapshot,
      id: `boq-catalog-new-${runId}`,
      description: revisedCatalog.body.description,
      unitPrice: revisedCatalog.body.referencePrice,
      priceRegion: revisedCatalog.body.region,
      priceSource: revisedCatalog.body.source,
      priceUpdatedAt: revisedCatalog.body.priceUpdatedAt,
    };
    const secondDraft = await request(`/projects/${project.body.id}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: {
        revision: firstDraft.body.revision,
        items: [firstDraft.body.items[0], newSnapshot],
      },
    });
    assert.equal(secondDraft.status, 200);

    const deletedCatalog = await request(
      `/safety-price-catalog/${createdCatalog.body.id}`,
      { role: "owner", method: "DELETE" },
    );
    assert.equal(deletedCatalog.status, 204);

    const reloadedDraft = await request(`/projects/${project.body.id}/safety-boq`);
    assert.equal(reloadedDraft.status, 200);
    assert.deepEqual(
      reloadedDraft.body.items.map((item: {
        unitPrice: number;
        priceRegion: string;
        priceSource: string;
        priceUpdatedAt: string;
      }) => ({
        unitPrice: item.unitPrice,
        priceRegion: item.priceRegion,
        priceSource: item.priceSource,
        priceUpdatedAt: item.priceUpdatedAt,
      })),
      [
        {
          unitPrice: 75_000,
          priceRegion: "Nasional",
          priceSource: "Pemasok snapshot lama",
          priceUpdatedAt: "2026-09-21",
        },
        {
          unitPrice: 90_000,
          priceRegion: "Jabodetabek",
          priceSource: "Survei pasar revisi",
          priceUpdatedAt: "2026-10-01",
        },
      ],
    );
  });

  it("menolak data keselamatan untuk organisasi yang tidak ada", async () => {
    await assert.rejects(
      db.insert(projectsTable).values({
        ...projectBody(`Orphan ${runId}`),
        organizationId: `missing-${runId}`,
        createdBy: userIds.owner,
      }),
      isForeignKeyViolation,
    );
  });

  it("menolak penghapusan organisasi yang masih memiliki data keselamatan", async () => {
    await assert.rejects(
      db
        .delete(organizationsTable)
        .where(eq(organizationsTable.id, organizationA)),
      isForeignKeyViolation,
    );
  });

  it("mengisolasi profil CSMS kustom dan membatasi pengelolaan pada pemilik", async () => {
    const deniedCreate = await request("/csms-profiles", {
      role: "safety_expert",
      method: "POST",
      body: csmsProfileBody(`denied-${runId}`),
    });
    assert.equal(deniedCreate.status, 403);

    const created = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`private-${runId}`),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.builtIn, false);
    assert.equal(created.body.locked, false);

    const [profilesA, profilesB, foreignUpdate] = await Promise.all([
      request("/csms-profiles", { organizationId: organizationA }),
      request("/csms-profiles", { organizationId: organizationB }),
      request(`/csms-profiles/${created.body.id}`, {
        organizationId: organizationB,
        role: "owner",
        method: "PUT",
        body: csmsProfileBody(`foreign-${runId}`),
      }),
    ]);
    assert.ok(profilesA.body.some((profile: { id: string }) => profile.id === created.body.id));
    assert.ok(profilesB.body.every((profile: { id: string }) => profile.id !== created.body.id));
    assert.equal(foreignUpdate.status, 404);
  });

  it("mengarsipkan profil workspace tanpa memutus kesiapan yang sudah memakainya", async () => {
    const created = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`archive-${runId}`),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.archived, false);

    const deniedArchive = await request(
      `/csms-profiles/${created.body.id}/archive`,
      {
        role: "safety_expert",
        method: "PATCH",
        body: { archived: true },
      },
    );
    assert.equal(deniedArchive.status, 403);

    const archived = await request(
      `/csms-profiles/${created.body.id}/archive`,
      {
        role: "owner",
        method: "PATCH",
        body: { archived: true },
      },
    );
    assert.equal(archived.status, 200);
    assert.equal(archived.body.archived, true);

    const profiles = await request("/csms-profiles", { role: "owner" });
    assert.equal(
      profiles.body.find(
        (profile: { id: string }) => profile.id === created.body.id,
      ).archived,
      true,
    );

    const currentReadiness = await request(
      `/projects/${projectAId}/csms-readiness`,
    );
    const rejectedSelection = await request(
      `/projects/${projectAId}/csms-readiness`,
      {
        role: "owner",
        method: "PUT",
        body: {
          profileId: created.body.id,
          revision: currentReadiness.body.revision,
          itemStatuses: [],
        },
      },
    );
    assert.equal(rejectedSelection.status, 409);

    const rejectedDocument = await request("/generated-documents", {
      role: "owner",
      method: "POST",
      body: {
        projectId: projectAId,
        template: "CSMS_PRAKUALIFIKASI",
        companyName: "Kontraktor A",
        directorName: "Direktur A",
        safetyLead: "Ahli K3 A",
        scopeOfWork: "Pekerjaan pengujian profil terarsip",
        csmsProfileId: created.body.id,
      },
    });
    assert.equal(rejectedDocument.status, 400);

    const restored = await request(
      `/csms-profiles/${created.body.id}/archive`,
      {
        role: "owner",
        method: "PATCH",
        body: { archived: false },
      },
    );
    assert.equal(restored.status, 200);
    assert.equal(restored.body.archived, false);

    const selected = await request(`/projects/${projectAId}/csms-readiness`, {
      role: "owner",
      method: "PUT",
      body: {
        profileId: created.body.id,
        revision: currentReadiness.body.revision,
        itemStatuses: [],
      },
    });
    assert.equal(selected.status, 200);

    await request(`/csms-profiles/${created.body.id}/archive`, {
      role: "owner",
      method: "PATCH",
      body: { archived: true },
    });
    const reopened = await request(`/projects/${projectAId}/csms-readiness`);
    assert.equal(reopened.status, 200);
    assert.equal(reopened.body.profileId, created.body.id);
    assert.equal(reopened.body.title, created.body.title);

    const existingItemUpdate = await request(
      `/projects/${projectAId}/csms-readiness`,
      {
        role: "owner",
        method: "PUT",
        body: {
          profileId: created.body.id,
          revision: reopened.body.revision,
          itemStatuses: [
            {
              key: `${reopened.body.stages[0].code}:question:0`,
              status: "complete",
            },
          ],
        },
      },
    );
    assert.equal(existingItemUpdate.status, 200);
    assert.equal(existingItemUpdate.body.profileId, created.body.id);

    const builtInArchive = await request(
      "/csms-profiles/PERTAMINA_2020/archive",
      {
        role: "owner",
        method: "PATCH",
        body: { archived: true },
      },
    );
    assert.equal(builtInArchive.status, 404);
  });

  it("menolak kode tahap profil yang duplikat tanpa membedakan huruf besar-kecil", async () => {
    const duplicateStages = [
      csmsProfileBody(`duplicate-${runId}`).stages[0],
      {
        ...csmsProfileBody(`duplicate-${runId}`).stages[0],
        code: "pq",
        name: "Prakualifikasi lanjutan",
      },
    ];
    const rejectedCreate = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: {
        ...csmsProfileBody(`duplicate-create-${runId}`),
        stages: duplicateStages,
      },
    });
    assert.equal(rejectedCreate.status, 400);
    assert.match(rejectedCreate.body.error, /kode tahap harus unik/i);

    const created = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`duplicate-update-${runId}`),
    });
    assert.equal(created.status, 201);

    const rejectedUpdate = await request(`/csms-profiles/${created.body.id}`, {
      role: "owner",
      method: "PUT",
      body: {
        ...csmsProfileBody(`duplicate-update-${runId}`),
        stages: duplicateStages,
      },
    });
    assert.equal(rejectedUpdate.status, 400);
    assert.match(rejectedUpdate.body.error, /kode tahap harus unik/i);
  });

  it("mengunci snapshot profil saat pertama dipakai kesiapan atau dokumen", async () => {
    const readinessProfile = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`readiness-${runId}`),
    });
    const currentReadiness = await request(
      `/projects/${projectAId}/csms-readiness`,
    );
    const readiness = await request(`/projects/${projectAId}/csms-readiness`, {
      role: "safety_expert",
      method: "PUT",
      body: {
        profileId: readinessProfile.body.id,
        revision: currentReadiness.body.revision,
        itemStatuses: [],
      },
    });
    const updateAfterReadiness = await request(
      `/csms-profiles/${readinessProfile.body.id}`,
      {
        role: "owner",
        method: "PUT",
        body: { ...csmsProfileBody(`changed-${runId}`), title: "Tidak boleh berubah" },
      },
    );
    assert.equal(readiness.status, 200);
    assert.equal(readiness.body.title, readinessProfile.body.title);
    assert.equal(updateAfterReadiness.status, 409);

    const documentProfile = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`document-${runId}`),
    });
    const generated = await request("/generated-documents", {
      role: "owner",
      method: "POST",
      body: {
        projectId: projectAId,
        template: "CSMS_PRAKUALIFIKASI",
        companyName: "Kontraktor A",
        directorName: "Direktur A",
        safetyLead: "Ahli K3 A",
        scopeOfWork: "Pekerjaan pengujian profil CSMS",
        csmsProfileId: documentProfile.body.id,
      },
    });
    const updateAfterDocument = await request(
      `/csms-profiles/${documentProfile.body.id}`,
      {
        role: "owner",
        method: "PUT",
        body: { ...csmsProfileBody(`changed-doc-${runId}`), title: "Tidak boleh berubah" },
      },
    );
    assert.equal(generated.status, 201);
    assert.equal(generated.body.title.includes(documentProfile.body.issuer), true);
    assert.equal(updateAfterDocument.status, 409);
    await db
      .delete(safetyDocumentsTable)
      .where(
        and(
          eq(safetyDocumentsTable.organizationId, organizationA),
          eq(safetyDocumentsTable.name, generated.body.title),
        ),
      );
  });

  it("menjaga snapshot konsisten saat pembaruan bersamaan dengan penggunaan pertama", async () => {
    const created = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`race-${runId}`),
    });
    const replacement = {
      ...csmsProfileBody(`race-${runId}`),
      title: `Judul pembaruan ${runId}`,
    };
    const currentReadiness = await request(
      `/projects/${projectAId}/csms-readiness`,
    );
    const [updated, readiness] = await Promise.all([
      request(`/csms-profiles/${created.body.id}`, {
        role: "owner",
        method: "PUT",
        body: replacement,
      }),
      request(`/projects/${projectAId}/csms-readiness`, {
        role: "owner",
        method: "PUT",
        body: {
          profileId: created.body.id,
          revision: currentReadiness.body.revision,
          itemStatuses: [],
        },
      }),
    ]);
    assert.equal(readiness.status, 200);
    assert.ok([200, 409].includes(updated.status));

    const profiles = await request("/csms-profiles", { role: "owner" });
    const locked = profiles.body.find(
      (profile: { id: string }) => profile.id === created.body.id,
    );
    assert.equal(locked.locked, true);
    assert.equal(readiness.body.title, locked.title);
    assert.equal(
      locked.title,
      updated.status === 200 ? replacement.title : created.body.title,
    );
  });

  it("menolak revisi kesiapan lama dan mengembalikan status terbaru", async () => {
    const alternateProfile = await request("/csms-profiles", {
      role: "owner",
      method: "POST",
      body: csmsProfileBody(`stale-switch-${runId}`),
    });
    const firstSnapshot = await request(
      `/projects/${projectAId}/csms-readiness`,
    );
    const secondSnapshot = await request(
      `/projects/${projectAId}/csms-readiness`,
    );
    const firstKey = `${firstSnapshot.body.stages[0].code}:question:0`;
    const secondKey = `${firstSnapshot.body.stages[0].code}:evidence:0`;

    const firstUpdate = await request(
      `/projects/${projectAId}/csms-readiness`,
      {
        role: "safety_expert",
        method: "PUT",
        body: {
          profileId: firstSnapshot.body.profileId,
          revision: firstSnapshot.body.revision,
          itemStatuses: [{ key: firstKey, status: "complete" }],
        },
      },
    );
    const staleUpdate = await request(
      `/projects/${projectAId}/csms-readiness`,
      {
        role: "owner",
        method: "PUT",
        body: {
          profileId: alternateProfile.body.id,
          revision: secondSnapshot.body.revision,
          itemStatuses: [{ key: secondKey, status: "follow_up" }],
        },
      },
    );

    assert.equal(firstUpdate.status, 200);
    assert.equal(firstUpdate.body.revision, firstSnapshot.body.revision + 1);
    assert.equal(firstUpdate.body.updatedBy, userIds.safety_expert);
    assert.equal(firstUpdate.body.updatedByName, "Ahli K3");
    assert.ok(Date.parse(firstUpdate.body.updatedAt));
    assert.equal(staleUpdate.status, 409);
    assert.equal(staleUpdate.body.revision, firstUpdate.body.revision);
    assert.equal(staleUpdate.body.profileId, firstUpdate.body.profileId);
    assert.deepEqual(staleUpdate.body.itemStatuses, firstUpdate.body.itemStatuses);
    assert.equal(staleUpdate.body.updatedBy, userIds.safety_expert);
    assert.equal(staleUpdate.body.updatedByName, "Ahli K3");

    const history = await db
      .select()
      .from(projectCsmsReadinessHistoryTable)
      .where(
        and(
          eq(projectCsmsReadinessHistoryTable.organizationId, organizationA),
          eq(projectCsmsReadinessHistoryTable.projectId, projectAId),
        ),
      );
    assert.ok(
      history.some(
        (entry) =>
          entry.revision === firstUpdate.body.revision &&
          entry.changedBy === userIds.safety_expert &&
          entry.changedByName === "Ahli K3",
      ),
    );
    assert.ok(
      history.every(
        (entry) =>
          entry.organizationId === organizationA &&
          entry.projectId === projectAId,
      ),
    );
    assert.ok(
      staleUpdate.body.itemStatuses.some(
        (item: { key: string; status: string }) =>
          item.key === firstKey && item.status === "complete",
      ),
    );
    assert.ok(
      staleUpdate.body.itemStatuses.every(
        (item: { key: string }) => item.key !== secondKey,
      ),
    );
    const profiles = await request("/csms-profiles", { role: "owner" });
    const alternateAfterConflict = profiles.body.find(
      (profile: { id: string }) => profile.id === alternateProfile.body.id,
    );
    assert.equal(alternateAfterConflict.locked, false);
  });

  it("membagikan draft BOQ proyek dengan isolasi organisasi dan izin peran", async () => {
    const item = {
      id: `boq-${runId}`,
      description: "Helm keselamatan",
      category: "APD & APK",
      volume: 10,
      unit: "Bh",
      unitPrice: 75_000,
      risk: "Tinggi",
      stage: "Pelaksanaan",
      controlNeed: "Wajib digunakan di area kerja",
    };

    for (const role of ["viewer", "field_officer"] as const) {
      const denied = await request(`/projects/${projectAId}/safety-boq`, {
        role,
        method: "PUT",
        body: { revision: 0, items: [item] },
      });
      assert.equal(denied.status, 403);
    }

    const saved = await request(`/projects/${projectAId}/safety-boq`, {
      role: "safety_expert",
      method: "PUT",
      body: { revision: 0, items: [item] },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.revision, 1);
    assert.equal(saved.body.items.length, 1);
    assert.equal(saved.body.items[0].description, item.description);

    const secondProject = await request("/projects", {
      role: "owner",
      method: "POST",
      body: projectBody(`Proyek A kedua ${runId}`),
    });
    assert.equal(secondProject.status, 201);
    const sameIdInSecondProject = await request(
      `/projects/${secondProject.body.id}/safety-boq`,
      {
        role: "owner",
        method: "PUT",
        body: { revision: 0, items: [{ ...item, description: "Item proyek kedua" }] },
      },
    );
    const sameIdInOtherOrganization = await request(
      `/projects/${projectBId}/safety-boq`,
      {
        organizationId: organizationB,
        role: "owner",
        method: "PUT",
        body: { revision: 0, items: [{ ...item, description: "Item organisasi B" }] },
      },
    );
    assert.equal(sameIdInSecondProject.status, 200);
    assert.equal(sameIdInOtherOrganization.status, 200);
    assert.equal(sameIdInSecondProject.body.items[0].id, item.id);
    assert.equal(sameIdInOtherOrganization.body.items[0].id, item.id);

    for (const role of Object.keys(userIds) as OrganizationRole[]) {
      const visible = await request(`/projects/${projectAId}/safety-boq`, { role });
      assert.equal(visible.status, 200);
      assert.equal(visible.body.items[0].id, item.id);
    }

    const foreignRead = await request(`/projects/${projectAId}/safety-boq`, {
      organizationId: organizationB,
      role: "owner",
    });
    const foreignWrite = await request(`/projects/${projectAId}/safety-boq`, {
      organizationId: organizationB,
      role: "owner",
      method: "PUT",
      body: { revision: 0, items: [] },
    });
    assert.equal(foreignRead.status, 404);
    assert.equal(foreignWrite.status, 404);

    const secondProjectRead = await request(
      `/projects/${secondProject.body.id}/safety-boq`,
    );
    const otherOrganizationRead = await request(
      `/projects/${projectBId}/safety-boq`,
      { organizationId: organizationB },
    );
    assert.equal(secondProjectRead.body.items[0].description, "Item proyek kedua");
    assert.equal(otherOrganizationRead.body.items[0].description, "Item organisasi B");

    const replaced = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: { revision: saved.body.revision, items: [{ ...item, description: "Helm proyek terbaru" }] },
    });
    assert.equal(replaced.status, 200);
    assert.equal(replaced.body.items[0].description, "Helm proyek terbaru");

    const [firstConcurrent, secondConcurrent] = await Promise.all([
      request(`/projects/${projectAId}/safety-boq`, {
        role: "owner",
        method: "PUT",
        body: { revision: replaced.body.revision, items: [{ ...item, description: "Perubahan sesi pemilik" }] },
      }),
      request(`/projects/${projectAId}/safety-boq`, {
        role: "safety_expert",
        method: "PUT",
        body: { revision: replaced.body.revision, items: [{ ...item, description: "Perubahan sesi ahli K3" }] },
      }),
    ]);
    assert.deepEqual(
      [firstConcurrent.status, secondConcurrent.status].sort(),
      [200, 409],
    );
    const latest = await request(`/projects/${projectAId}/safety-boq`);
    assert.equal(latest.body.revision, replaced.body.revision + 1);
    assert.equal(
      latest.body.items[0].description,
      firstConcurrent.status === 200 ? "Perubahan sesi pemilik" : "Perubahan sesi ahli K3",
    );

    let signalRevisionRead!: () => void;
    let releaseItemsRead!: () => void;
    const revisionRead = new Promise<void>((resolve) => {
      signalRevisionRead = resolve;
    });
    const continueItemsRead = new Promise<void>((resolve) => {
      releaseItemsRead = resolve;
    });
    beforeSafetyBoqItemsRead = async () => {
      signalRevisionRead();
      await continueItemsRead;
    };
    const interleavedReadPromise = request(`/projects/${projectAId}/safety-boq`);
    await revisionRead;
    const interleavedWrite = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: {
        revision: latest.body.revision,
        items: [{ ...item, description: "Perubahan saat pembacaan berlangsung" }],
      },
    });
    assert.equal(interleavedWrite.status, 200);
    releaseItemsRead();
    const interleavedRead = await interleavedReadPromise;
    beforeSafetyBoqItemsRead = undefined;
    assert.equal(interleavedRead.body.revision, latest.body.revision);
    assert.equal(interleavedRead.body.items[0].description, latest.body.items[0].description);

    const staleSnapshotSave = await request(`/projects/${projectAId}/safety-boq`, {
      role: "safety_expert",
      method: "PUT",
      body: {
        revision: interleavedRead.body.revision,
        items: [{ ...item, description: "Tidak boleh menimpa perubahan sela" }],
      },
    });
    assert.equal(staleSnapshotSave.status, 409);

    await db
      .delete(safetyBoqItemsTable)
      .where(
        and(
          eq(safetyBoqItemsTable.organizationId, organizationA),
          eq(safetyBoqItemsTable.projectId, secondProject.body.id),
        ),
      );
    await db
      .delete(safetyBoqDraftsTable)
      .where(
        and(
          eq(safetyBoqDraftsTable.organizationId, organizationA),
          eq(safetyBoqDraftsTable.projectId, secondProject.body.id),
        ),
      );
    await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, secondProject.body.id));
  });

  it("tidak menggandakan item BOQ lokal ketika respons migrasi terputus lalu dicoba ulang", async () => {
    const firstLocalItem = {
      id: `migrated-device-a-${runId}`,
      migrationKey: `local-boq:${organizationA}:${projectAId}:device-a:seed-1`,
      description: "Helm dari penyimpanan lokal",
      category: "APD & APK",
      volume: 10,
      unit: "Bh",
      unitPrice: 75_000,
      risk: "Tinggi",
      stage: "Pelaksanaan",
      controlNeed: "Wajib digunakan di area kerja",
    };
    const secondLocalItem = {
      ...firstLocalItem,
      id: `migrated-device-b-${runId}`,
      migrationKey: `local-boq:${organizationA}:${projectAId}:device-b:seed-1`,
      description: "Helm dari perangkat anggota lain",
    };
    const migratedItems = [firstLocalItem, secondLocalItem];

    const initial = await request(`/projects/${projectAId}/safety-boq`);
    const firstSave = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: { revision: initial.body.revision, items: migratedItems },
    });
    assert.equal(firstSave.status, 200);

    // Simulasikan respons pertama tidak pernah diterima: klien mengirim ulang
    // payload dan revisi yang sama sementara data lokal masih tersimpan.
    const retry = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: {
        revision: initial.body.revision,
        items: [...migratedItems].reverse(),
      },
    });

    assert.equal(retry.status, 200);
    assert.equal(retry.body.items.length, 2);
    assert.deepEqual(
      new Set(retry.body.items.map((item: { migrationKey: string }) => item.migrationKey)),
      new Set(migratedItems.map((item) => item.migrationKey)),
    );
    assert.deepEqual(
      new Set(retry.body.items.map((item: { id: string }) => item.id)),
      new Set(migratedItems.map((item) => item.id)),
    );
    assert.equal(retry.body.revision, firstSave.body.revision);

    const remotelyEditedItems = retry.body.items.map((item: {
      id: string;
      migrationKey: string;
      description: string;
      projectId: number;
      updatedAt: string;
      [key: string]: unknown;
    }) => {
      const {
        projectId: _projectId,
        updatedAt: _updatedAt,
        ...input
      } = item;
      return item.id === firstLocalItem.id
        ? { ...input, description: "Helm yang sudah diedit anggota tim" }
        : input;
    });
    const remoteEdit = await request(`/projects/${projectAId}/safety-boq`, {
      role: "safety_expert",
      method: "PUT",
      body: {
        revision: retry.body.revision,
        items: remotelyEditedItems,
      },
    });
    assert.equal(remoteEdit.status, 200);

    const staleRetry = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: {
        revision: retry.body.revision,
        items: migratedItems,
      },
    });
    assert.equal(staleRetry.status, 409);

    const reloaded = await request(`/projects/${projectAId}/safety-boq`);
    const retryAfterRefetch = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: {
        revision: reloaded.body.revision,
        items: [
          ...reloaded.body.items.map((item: {
            projectId: number;
            updatedAt: string;
            [key: string]: unknown;
          }) => {
            const {
              projectId: _projectId,
              updatedAt: _updatedAt,
              ...input
            } = item;
            return input;
          }),
          ...migratedItems,
        ],
      },
    });
    assert.equal(retryAfterRefetch.status, 200);
    assert.equal(retryAfterRefetch.body.items.length, 2);
    assert.equal(
      retryAfterRefetch.body.items.find(
        (item: { id: string }) => item.id === firstLocalItem.id,
      ).description,
      "Helm yang sudah diedit anggota tim",
    );
  });

  it("menyimpan, membuka, memperbarui, dan menolak draf bulanan ganda", async () => {
    const report = {
      projectId: projectAId,
      period: "2026-09",
      status: "draft",
      evaluation: "Evaluasi awal",
      notes: "Tindak lanjut",
      preparedBy: "Petugas K3",
      reviewedBy: "Konsultan",
      approvedBy: "Pemberi Tugas",
    };
    const created = await request("/monthly-reports", {
      method: "POST",
      role: "safety_expert",
      body: report,
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.projectId, projectAId);
    assert.equal(created.body.projectName, `Proyek A ${runId}`);

    const duplicate = await request("/monthly-reports", {
      method: "POST",
      role: "safety_expert",
      body: report,
    });
    assert.equal(duplicate.status, 409);

    const opened = await request(`/monthly-reports/${created.body.id}`);
    assert.equal(opened.status, 200);
    assert.equal(opened.body.evaluation, "Evaluasi awal");

    const updated = await request(`/monthly-reports/${created.body.id}`, {
      method: "PATCH",
      role: "safety_expert",
      body: { status: "final", approvedBy: "Direktur Proyek" },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.status, "final");
    assert.equal(updated.body.approvedBy, "Direktur Proyek");

    const otherOrganization = await request(`/monthly-reports/${created.body.id}`, {
      organizationId: organizationB,
    });
    assert.equal(otherOrganization.status, 404);
  });

  it("menolak header organisasi yang bukan keanggotaan pengguna", async () => {
    const allowed = await request("/membership/projects", {
      organizationId: organizationA,
    });
    const denied = await request("/membership/projects", {
      organizationId: organizationB,
    });

    assert.equal(allowed.status, 200);
    assert.deepEqual(
      allowed.body.map((item: { id: number }) => item.id),
      [projectAId],
    );
    assert.equal(denied.status, 403);
  });

  it("membatasi seluruh daftar, aktivitas, dan ringkasan pada organisasi aktif", async () => {
    for (const role of Object.keys(userIds) as OrganizationRole[]) {
      const [
        projects,
        people,
        documents,
        certificates,
        fieldActivities,
        activity,
        dashboard,
        readiness,
      ] = await Promise.all([
        request("/projects", { role }),
        request("/people", { role }),
        request("/documents", { role }),
        request("/certificates", { role }),
        request("/field-activities", { role }),
        request("/activity", { role }),
        request("/dashboard/summary", { role }),
        request("/dashboard/readiness", { role }),
      ]);

      for (const response of [
        projects,
        people,
        documents,
        certificates,
        fieldActivities,
        activity,
        dashboard,
        readiness,
      ]) {
        assert.equal(response.status, 200, `${role} harus dapat membaca`);
      }
      assert.deepEqual(
        projects.body.map((item: { id: number }) => item.id),
        [projectAId],
      );
      assert.ok(
        people.body.every((item: { name: string }) =>
          item.name.includes("Personel A"),
        ),
      );
      assert.ok(
        documents.body.every((item: { name: string }) =>
          item.name.includes("Dokumen A"),
        ),
      );
      assert.ok(
        certificates.body.every((item: { owner: string }) =>
          item.owner.includes("Personel A"),
        ),
      );
      assert.ok(
        fieldActivities.body.every((item: { project: string }) =>
          item.project.includes("Proyek A"),
        ),
      );
      assert.ok(
        activity.body.every((item: { title: string }) =>
          item.title.includes("seed-a"),
        ),
      );
      assert.equal(dashboard.body.activeProjects, 1);
      assert.equal(dashboard.body.peopleTracked, 1);
      assert.equal(dashboard.body.documentReady, 1);
      assert.equal(dashboard.body.documentTotal, 1);
      assert.equal(dashboard.body.expiringSoon, 0);
      assert.equal(dashboard.body.openActions, 0);
      assert.equal(readiness.body.overall, 100);
    }
  });

  it("menolak detail dan perubahan ID proyek atau personel organisasi lain", async () => {
    const foreignDetail = await request(`/projects/${projectBId}`, {
      role: "owner",
    });
    const foreignProjectUpdate = await request(`/projects/${projectBId}`, {
      role: "owner",
      method: "PATCH",
      body: { name: "Tidak boleh berubah" },
    });
    const foreignPersonUpdate = await request(`/people/${personBId}`, {
      role: "owner",
      method: "PATCH",
      body: { name: "Tidak boleh berubah" },
    });
    const foreignGeneration = await request("/generated-documents", {
      role: "owner",
      method: "POST",
      body: {
        projectId: projectBId,
        template: "RKK_TENDER",
        companyName: "Kontraktor A",
        directorName: "Direktur A",
        safetyLead: "Ahli K3 A",
        scopeOfWork: "Pekerjaan A",
      },
    });

    assert.equal(foreignDetail.status, 404);
    assert.equal(foreignProjectUpdate.status, 404);
    assert.equal(foreignPersonUpdate.status, 404);
    assert.equal(foreignGeneration.status, 404);
    const [projectB] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectBId));
    const [personB] = await db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, personBId));
    assert.ok(projectB.name.includes("Proyek B"));
    assert.ok(personB.name.includes("Personel B"));
  });

  it("menerapkan izin viewer, petugas lapangan, ahli K3, dan pemilik", async () => {
    const managementWrites = [
      ["/projects", projectBody(`Baru ${runId}`)],
      ["/people", personBody(`Baru ${runId}`, `Proyek A ${runId}`)],
      ["/documents", documentBody(`Baru ${runId}`, `Proyek A ${runId}`)],
      ["/certificates", certificateBody(`Personel A ${runId}`)],
    ] as const;

    for (const role of ["viewer", "field_officer"] as const) {
      for (const [path, body] of managementWrites) {
        const response = await request(path, { role, method: "POST", body });
        assert.equal(
          response.status,
          403,
          `${role} tidak boleh mengelola ${path}`,
        );
      }
    }
    const viewerActivity = await request("/field-activities", {
      role: "viewer",
      method: "POST",
      body: activityBody("viewer", `Proyek A ${runId}`),
    });
    assert.equal(viewerActivity.status, 403);

    const fieldActivity = await request("/field-activities", {
      role: "field_officer",
      method: "POST",
      body: activityBody("field", `Proyek A ${runId}`),
    });
    assert.equal(fieldActivity.status, 201);

    for (const role of ["safety_expert", "owner"] as const) {
      const project = await request("/projects", {
        role,
        method: "POST",
        body: projectBody(`${role} ${runId}`),
      });
      const activity = await request("/field-activities", {
        role,
        method: "POST",
        body: activityBody(role, `Proyek A ${runId}`),
      });
      assert.equal(project.status, 201);
      assert.equal(activity.status, 201);
      assert.equal(project.body.name, `${role} ${runId}`);
    }
  });

  it("menjaga idempotensi aktivitas tetap terpisah per organisasi", async () => {
    const sharedClientId = `${runId}-shared-client-id`;
    const bodyA = {
      ...activityBody("shared-a", `Proyek A ${runId}`),
      clientId: sharedClientId,
    };
    const bodyB = {
      ...activityBody("shared-b", `Proyek B ${runId}`, projectBId),
      clientId: sharedClientId,
    };
    const createdA = await request("/field-activities", {
      role: "field_officer",
      method: "POST",
      body: bodyA,
    });
    const createdB = await request("/field-activities", {
      organizationId: organizationB,
      role: "field_officer",
      method: "POST",
      body: bodyB,
    });

    assert.equal(createdA.status, 201);
    assert.equal(createdB.status, 201);
    assert.notEqual(createdA.body.id, createdB.body.id);
    const rows = await db
      .select()
      .from(fieldActivitiesTable)
      .where(
        and(
          eq(fieldActivitiesTable.clientId, sharedClientId),
          inArray(fieldActivitiesTable.organizationId, [
            organizationA,
            organizationB,
          ]),
        ),
      );
    assert.equal(rows.length, 2);
  });

  it("menghasilkan satu aktivitas saat client ID yang sama dikirim ulang", async () => {
    const clientId = `${runId}-retry-client-id`;
    const body = {
      ...activityBody("retry", `Proyek A ${runId}`),
      clientId,
    };

    const [first, retry] = await Promise.all([
      request("/field-activities", {
        role: "field_officer",
        method: "POST",
        body,
      }),
      request("/field-activities", {
        role: "field_officer",
        method: "POST",
        body,
      }),
    ]);

    assert.deepEqual([first.status, retry.status].sort(), [200, 201]);
    assert.equal(first.body.id, retry.body.id);

    const rows = await db
      .select()
      .from(fieldActivitiesTable)
      .where(
        and(
          eq(fieldActivitiesTable.organizationId, organizationA),
          eq(fieldActivitiesTable.clientId, clientId),
        ),
      );
    const dashboardActivities = await request("/field-activities", {
      role: "viewer",
    });

    assert.equal(rows.length, 1);
    assert.equal(
      dashboardActivities.body.filter(
        (item: { clientId: string }) => item.clientId === clientId,
      ).length,
      1,
    );
  });
});
