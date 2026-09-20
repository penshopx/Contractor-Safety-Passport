import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  certificatesTable,
  fieldActivitiesTable,
  peopleTable,
  projectsTable,
  safetyDocumentsTable,
} from "@workspace/db";
import {
  CreateCertificateBody,
  CreateCertificateResponse,
  CreateDocumentBody,
  CreateDocumentResponse,
  CreateFieldActivityBody,
  CreateFieldActivityResponse,
  CreatePersonBody,
  CreatePersonResponse,
  CreateProjectBody,
  CreateProjectResponse,
  GetDashboardSummaryResponse,
  GetProjectParams,
  GetProjectResponse,
  GetReadinessSummaryResponse,
  ListActivityResponse,
  ListCertificatesResponse,
  ListDocumentsResponse,
  ListFieldActivitiesResponse,
  ListPeopleResponse,
  ListProjectsResponse,
  UpdatePersonBody,
  UpdatePersonParams,
  UpdatePersonResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const dateOnly = (value: Date | string) =>
  typeof value === "string" ? value : value.toISOString().slice(0, 10);

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [[active], [people], [expiring], [open], [ready], [documents]] =
    await Promise.all([
      db.select({ value: count() }).from(projectsTable).where(eq(projectsTable.status, "active")),
      db.select({ value: count() }).from(peopleTable),
      db
        .select({ value: count() })
        .from(certificatesTable)
        .where(inArray(certificatesTable.status, ["expiring", "expired"])),
      db
        .select({ value: count() })
        .from(fieldActivitiesTable)
        .where(inArray(fieldActivitiesTable.status, ["review", "open"])),
      db
        .select({ value: count() })
        .from(safetyDocumentsTable)
        .where(eq(safetyDocumentsTable.status, "ready")),
      db.select({ value: count() }).from(safetyDocumentsTable),
    ]);

  const documentTotal = documents?.value ?? 0;
  const documentReady = ready?.value ?? 0;
  const readinessScore = documentTotal
    ? Math.round((documentReady / documentTotal) * 100)
    : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      readinessScore,
      activeProjects: active?.value ?? 0,
      peopleTracked: people?.value ?? 0,
      expiringSoon: expiring?.value ?? 0,
      openActions: open?.value ?? 0,
      documentReady,
      documentTotal,
    }),
  );
});

router.get("/dashboard/readiness", async (_req, res): Promise<void> => {
  const documents = await db.select().from(safetyDocumentsTable);
  const certificates = await db.select().from(certificatesTable);
  const ready = documents.filter((item) => item.status === "ready").length;
  const smkkDocs = documents.filter((item) => item.standard.includes("SMKK"));
  const csmsDocs = documents.filter((item) => item.standard.includes("CSMS"));
  const score = (items: typeof documents) =>
    items.length
      ? Math.round(
          (items.filter((item) => item.status === "ready").length / items.length) *
            100,
        )
      : 0;
  const validCredentials = certificates.filter(
    (item) => item.status === "valid",
  ).length;
  const credentialScore = certificates.length
    ? Math.round((validCredentials / certificates.length) * 100)
    : 0;

  res.json(
    GetReadinessSummaryResponse.parse({
      overall: documents.length
        ? Math.round((ready / documents.length) * 100)
        : 0,
      smkk: score(smkkDocs),
      csms: score(csmsDocs),
      checks: [
        {
          id: 1,
          title: "Rencana Keselamatan Konstruksi",
          detail: "Dokumen RKK dan pengendalian risiko pekerjaan",
          standard: "SMKK",
          status: score(smkkDocs) >= 80 ? "done" : "attention",
        },
        {
          id: 2,
          title: "Pra-kualifikasi kontraktor",
          detail: "Profil HSE, kebijakan, statistik, dan bukti penerapan",
          standard: "CSMS",
          status: score(csmsDocs) >= 80 ? "done" : "attention",
        },
        {
          id: 3,
          title: "Kompetensi dan sertifikasi",
          detail: `${validCredentials} dari ${certificates.length} sertifikat masih valid`,
          standard: "SMKK",
          status:
            credentialScore >= 80
              ? "done"
              : credentialScore > 0
                ? "attention"
                : "missing",
        },
        {
          id: 4,
          title: "Evaluasi kinerja lapangan",
          detail: "Rekam toolbox meeting, inspeksi, PTW, dan near miss",
          standard: "CSMS",
          status: "attention",
        },
      ],
    }),
  );
});

router.get("/activity", async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(fieldActivitiesTable)
    .orderBy(desc(fieldActivitiesTable.occurredAt))
    .limit(8);
  res.json(
    ListActivityResponse.parse(
      activities.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: `${item.project} · ${item.status}`,
        actor: item.actor,
        timestamp: item.occurredAt,
      })),
    ),
  );
});

router.get("/projects", async (_req, res): Promise<void> => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  res.json(ListProjectsResponse.parse(projects));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .insert(projectsTable)
    .values({
      ...parsed.data,
      progress: parsed.data.progress ?? 0,
      startDate: dateOnly(parsed.data.startDate),
      endDate: parsed.data.endDate ? dateOnly(parsed.data.endDate) : null,
    })
    .returning();
  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Proyek tidak ditemukan" });
    return;
  }
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  const body = UpdateProjectBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Data proyek tidak valid" });
    return;
  }
  const { startDate, endDate, ...projectFields } = body.data;
  const update = {
    ...projectFields,
    ...(startDate ? { startDate: dateOnly(startDate) } : {}),
    ...(endDate !== undefined
      ? { endDate: endDate ? dateOnly(endDate) : null }
      : {}),
  };
  const [project] = await db
    .update(projectsTable)
    .set(update)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Proyek tidak ditemukan" });
    return;
  }
  res.json(UpdateProjectResponse.parse(project));
});

router.get("/people", async (_req, res): Promise<void> => {
  const people = await db.select().from(peopleTable).orderBy(asc(peopleTable.name));
  res.json(ListPeopleResponse.parse(people));
});

router.post("/people", async (req, res): Promise<void> => {
  const parsed = CreatePersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [person] = await db
    .insert(peopleTable)
    .values({ ...parsed.data, initials: initialsFor(parsed.data.name) })
    .returning();
  res.status(201).json(CreatePersonResponse.parse(person));
});

router.patch("/people/:id", async (req, res): Promise<void> => {
  const params = UpdatePersonParams.safeParse(req.params);
  const body = UpdatePersonBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Data personel tidak valid" });
    return;
  }
  const update = {
    ...body.data,
    ...(body.data.name ? { initials: initialsFor(body.data.name) } : {}),
  };
  const [person] = await db
    .update(peopleTable)
    .set(update)
    .where(eq(peopleTable.id, params.data.id))
    .returning();
  if (!person) {
    res.status(404).json({ error: "Personel tidak ditemukan" });
    return;
  }
  res.json(UpdatePersonResponse.parse(person));
});

router.get("/documents", async (_req, res): Promise<void> => {
  const documents = await db
    .select()
    .from(safetyDocumentsTable)
    .orderBy(desc(safetyDocumentsTable.updatedAt));
  res.json(ListDocumentsResponse.parse(documents));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [document] = await db
    .insert(safetyDocumentsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(CreateDocumentResponse.parse(document));
});

router.get("/certificates", async (_req, res): Promise<void> => {
  const certificates = await db
    .select()
    .from(certificatesTable)
    .orderBy(asc(certificatesTable.expiresAt));
  res.json(ListCertificatesResponse.parse(certificates));
});

router.post("/certificates", async (req, res): Promise<void> => {
  const parsed = CreateCertificateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [certificate] = await db
    .insert(certificatesTable)
    .values({
      ...parsed.data,
      expiresAt: dateOnly(parsed.data.expiresAt),
    })
    .returning();
  res.status(201).json(CreateCertificateResponse.parse(certificate));
});

router.get("/field-activities", async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(fieldActivitiesTable)
    .orderBy(desc(fieldActivitiesTable.occurredAt));
  res.json(ListFieldActivitiesResponse.parse(activities));
});

router.post("/field-activities", async (req, res): Promise<void> => {
  const parsed = CreateFieldActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [activity] = await db
    .insert(fieldActivitiesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(CreateFieldActivityResponse.parse(activity));
});

export default router;