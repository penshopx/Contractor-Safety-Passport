import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express, { type RequestHandler } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  certificatesTable,
  db,
  fieldActivitiesTable,
  monthlyReportsTable,
  organizationMembershipsTable,
  organizationsTable,
  peopleTable,
  pool,
  projectsTable,
  safetyBoqItemsTable,
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
  const body: any = await response.json();
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

const activityBody = (suffix: string, project: string) => ({
  clientId: `${runId}-${suffix}`,
  type: "Inspection",
  title: `Inspeksi ${suffix}`,
  project,
  actor: "Petugas Lapangan",
  status: "complete",
  occurredAt: "2026-09-20T08:00:00.000Z",
});

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
      ...activityBody("seed-a", projects[0].name),
      occurredAt: new Date("2026-09-20T08:00:00.000Z"),
      organizationId: organizationA,
      createdBy: userIds.owner,
    },
    {
      ...activityBody("seed-b", projects[1].name),
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
  app.use(createSafetyRouter(contextMiddleware));
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
    .delete(certificatesTable)
    .where(inArray(certificatesTable.organizationId, organizationIds));
  await db
    .delete(safetyDocumentsTable)
    .where(inArray(safetyDocumentsTable.organizationId, organizationIds));
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
        body: { items: [item] },
      });
      assert.equal(denied.status, 403);
    }

    const saved = await request(`/projects/${projectAId}/safety-boq`, {
      role: "safety_expert",
      method: "PUT",
      body: { items: [item] },
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.length, 1);
    assert.equal(saved.body[0].description, item.description);

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
        body: { items: [{ ...item, description: "Item proyek kedua" }] },
      },
    );
    const sameIdInOtherOrganization = await request(
      `/projects/${projectBId}/safety-boq`,
      {
        organizationId: organizationB,
        role: "owner",
        method: "PUT",
        body: { items: [{ ...item, description: "Item organisasi B" }] },
      },
    );
    assert.equal(sameIdInSecondProject.status, 200);
    assert.equal(sameIdInOtherOrganization.status, 200);
    assert.equal(sameIdInSecondProject.body[0].id, item.id);
    assert.equal(sameIdInOtherOrganization.body[0].id, item.id);

    for (const role of Object.keys(userIds) as OrganizationRole[]) {
      const visible = await request(`/projects/${projectAId}/safety-boq`, { role });
      assert.equal(visible.status, 200);
      assert.equal(visible.body[0].id, item.id);
    }

    const foreignRead = await request(`/projects/${projectAId}/safety-boq`, {
      organizationId: organizationB,
      role: "owner",
    });
    const foreignWrite = await request(`/projects/${projectAId}/safety-boq`, {
      organizationId: organizationB,
      role: "owner",
      method: "PUT",
      body: { items: [] },
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
    assert.equal(secondProjectRead.body[0].description, "Item proyek kedua");
    assert.equal(otherOrganizationRead.body[0].description, "Item organisasi B");

    const replaced = await request(`/projects/${projectAId}/safety-boq`, {
      role: "owner",
      method: "PUT",
      body: { items: [{ ...item, description: "Helm proyek terbaru" }] },
    });
    assert.equal(replaced.status, 200);
    assert.equal(replaced.body[0].description, "Helm proyek terbaru");

    await db
      .delete(safetyBoqItemsTable)
      .where(
        and(
          eq(safetyBoqItemsTable.organizationId, organizationA),
          eq(safetyBoqItemsTable.projectId, secondProject.body.id),
        ),
      );
    await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, secondProject.body.id));
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
      ...activityBody("shared-b", `Proyek B ${runId}`),
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
