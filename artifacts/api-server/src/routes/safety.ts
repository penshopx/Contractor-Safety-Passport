import { clerkClient } from "@clerk/express";
import { Router, type IRouter, type RequestHandler } from "express";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  certificatesTable,
  csmsProfileVersionsTable,
  fieldActivitiesTable,
  monthlyReportsTable,
  peopleTable,
  projectCsmsReadinessHistoryTable,
  projectCsmsReadinessTable,
  projectsTable,
  safetyBoqDraftsTable,
  safetyBoqItemsTable,
  safetyPriceCatalogItemsTable,
  safetyDocumentsTable,
  businessClassificationsTable,
  classificationSourcesTable,
  classificationVersionsTable,
  organizationClassificationsTable,
  organizationProjectFitResultsTable,
  projectClassificationsTable,
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
  CreateCsmsProfileBody,
  CreateCsmsProfileResponse,
  GenerateDocumentBody,
  GenerateDocumentResponse,
  GetDashboardSummaryResponse,
  GetProjectParams,
  GetProjectResponse,
  GetProjectCsmsReadinessParams,
  GetProjectCsmsReadinessResponse,
  GetProjectSafetyBoqParams,
  GetProjectSafetyBoqResponse,
  GetReadinessSummaryResponse,
  ListActivityResponse,
  ListCertificatesResponse,
  ListDocumentsResponse,
  ListDocumentTemplatesResponse,
  ListFieldActivitiesResponse,
  ListPeopleResponse,
  ListProjectsResponse,
  ListMonthlyReportsResponse,
  ListCsmsProfilesResponse,
  CreateMonthlyReportBody,
  CreateMonthlyReportResponse,
  GetMonthlyReportParams,
  GetMonthlyReportResponse,
  UpdateMonthlyReportBody,
  UpdateMonthlyReportParams,
  UpdateMonthlyReportResponse,
  UpdatePersonBody,
  UpdatePersonParams,
  UpdatePersonResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
  UpdateProjectCsmsReadinessBody,
  UpdateProjectCsmsReadinessParams,
  UpdateProjectCsmsReadinessResponse,
  UpdateCsmsProfileBody,
  UpdateCsmsProfileParams,
  UpdateCsmsProfileResponse,
  SetCsmsProfileArchivedBody,
  SetCsmsProfileArchivedParams,
  SetCsmsProfileArchivedResponse,
  ReplaceProjectSafetyBoqBody,
  ReplaceProjectSafetyBoqParams,
  ReplaceProjectSafetyBoqResponse,
  CreateSafetyPriceCatalogItemBody,
  CreateSafetyPriceCatalogItemResponse,
  DeleteSafetyPriceCatalogItemParams,
  ListSafetyPriceCatalogItemsResponse,
  UpdateSafetyPriceCatalogItemBody,
  UpdateSafetyPriceCatalogItemParams,
  UpdateSafetyPriceCatalogItemResponse,
  AddOrganizationClassificationBody,
  AddOrganizationClassificationResponse,
  AddProjectClassificationBody,
  AddProjectClassificationParams,
  AddProjectClassificationResponse,
  GetOrganizationProjectFitParams,
  GetOrganizationProjectFitResponse,
  ListConstructionClassificationsResponse,
  ListOrganizationClassificationsResponse,
  ListProjectClassificationsParams,
  ListProjectClassificationsResponse,
} from "@workspace/api-zod";
import {
  requireOrganization,
  requireRole,
} from "../middlewares/organizationContext.ts";
import {
  buildCsmsReadiness,
  csmsProfiles,
  findCsmsProfile,
  resolveCsmsProfileForTemplate,
} from "../lib/csmsProfiles.ts";
import { qualificationSatisfies } from "../lib/classificationFit.ts";
import { tagEvidence } from "../lib/objectStorage.ts";
import { evidencePathLockQuery } from "../lib/evidencePathLock.ts";

type SafetyRouterHooks = {
  beforeSafetyBoqItemsRead?: () => Promise<void>;
  resolveUserName?: (userId: string) => Promise<string>;
};

export const createSafetyRouter = (
  organizationMiddleware: RequestHandler = requireOrganization,
  hooks: SafetyRouterHooks = {},
): IRouter => {
  const router: IRouter = Router();
  router.use(organizationMiddleware);

  const resolveUserName =
    hooks.resolveUserName ??
    (async (userId: string) => {
      try {
        const user = await clerkClient.users.getUser(userId);
        return (
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          userId
        );
      } catch {
        return userId;
      }
    });

  const initialsFor = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  const dateOnly = (value: Date | string) =>
    typeof value === "string" ? value : value.toISOString().slice(0, 10);

  const listAvailableCsmsProfiles = async (organizationId: string) => {
    const customProfiles = await db
      .select()
      .from(csmsProfileVersionsTable)
      .where(eq(csmsProfileVersionsTable.organizationId, organizationId))
      .orderBy(asc(csmsProfileVersionsTable.issuer), desc(csmsProfileVersionsTable.createdAt));
    return [
      ...csmsProfiles.map((profile) => ({
        ...profile,
        locked: true,
        builtIn: true,
        archived: false,
      })),
      ...customProfiles.map((profile) => ({ ...profile, builtIn: false })),
    ];
  };

  const findAvailableCsmsProfile = async (
    organizationId: string,
    profileId: string | undefined,
  ) => {
    const builtIn = findCsmsProfile(profileId);
    if (builtIn) {
      return { ...builtIn, locked: true, builtIn: true, archived: false };
    }
    if (!profileId) return undefined;
    const [custom] = await db
      .select()
      .from(csmsProfileVersionsTable)
      .where(
        and(
          eq(csmsProfileVersionsTable.id, profileId),
          eq(csmsProfileVersionsTable.organizationId, organizationId),
        ),
      );
    return custom ? { ...custom, builtIn: false } : undefined;
  };

  const documentTemplates = [
    {
      id: "RKK_TENDER" as const,
      name: "RKK Usulan Penawaran",
      standard: "SMKK" as const,
      description:
        "Draf Rencana Keselamatan Konstruksi untuk tahap pemilihan atau penawaran.",
      sourceBasis: [
        "Modul 9 RKK Usulan Penawaran",
        "Contoh Rencana Keselamatan Konstruksi",
      ],
      sectionCount: 6,
    },
    {
      id: "RKK_PELAKSANAAN" as const,
      name: "RKK Pelaksanaan",
      standard: "SMKK" as const,
      description:
        "Draf RKK pelaksanaan dengan struktur kepemimpinan, perencanaan, dukungan, operasi, dan evaluasi.",
      sourceBasis: [
        "Format RKK Pelaksanaan",
        "Contoh Rencana Keselamatan Konstruksi",
      ],
      sectionCount: 6,
    },
    {
      id: "CSMS_PRAKUALIFIKASI" as const,
      name: "Formulir Pra-kualifikasi CSMS",
      standard: "CSMS" as const,
      description:
        "Draf jawaban dan daftar bukti untuk penilaian awal keselamatan kontraktor.",
      sourceBasis: [
        "SPLN U1.006:2021 Contractor Safety Management System",
        "Formulir CSMS dan Lampiran Formulir CSMS",
      ],
      sectionCount: 13,
    },
  ];

  const valueOrReview = (value: string | null | undefined) =>
    value?.trim() || "Belum diisi — wajib ditinjau dan dilengkapi";

  router.get("/dashboard/summary", async (req, res): Promise<void> => {
    const { organizationId } = req.organizationContext!;
    const [[active], [people], [expiring], [open], [ready], [documents]] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(projectsTable)
          .where(
            and(
              eq(projectsTable.organizationId, organizationId),
              eq(projectsTable.status, "active"),
            ),
          ),
        db
          .select({ value: count() })
          .from(peopleTable)
          .where(eq(peopleTable.organizationId, organizationId)),
        db
          .select({ value: count() })
          .from(certificatesTable)
          .where(
            and(
              eq(certificatesTable.organizationId, organizationId),
              inArray(certificatesTable.status, ["expiring", "expired"]),
            ),
          ),
        db
          .select({ value: count() })
          .from(fieldActivitiesTable)
          .where(
            and(
              eq(fieldActivitiesTable.organizationId, organizationId),
              inArray(fieldActivitiesTable.status, ["review", "open"]),
            ),
          ),
        db
          .select({ value: count() })
          .from(safetyDocumentsTable)
          .where(
            and(
              eq(safetyDocumentsTable.organizationId, organizationId),
              eq(safetyDocumentsTable.status, "ready"),
            ),
          ),
        db
          .select({ value: count() })
          .from(safetyDocumentsTable)
          .where(eq(safetyDocumentsTable.organizationId, organizationId)),
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

  router.get("/dashboard/readiness", async (req, res): Promise<void> => {
    const { organizationId } = req.organizationContext!;
    const documents = await db
      .select()
      .from(safetyDocumentsTable)
      .where(eq(safetyDocumentsTable.organizationId, organizationId));
    const certificates = await db
      .select()
      .from(certificatesTable)
      .where(eq(certificatesTable.organizationId, organizationId));
    const ready = documents.filter((item) => item.status === "ready").length;
    const smkkDocs = documents.filter((item) => item.standard.includes("SMKK"));
    const csmsDocs = documents.filter((item) => item.standard.includes("CSMS"));
    const score = (items: typeof documents) =>
      items.length
        ? Math.round(
            (items.filter((item) => item.status === "ready").length /
              items.length) *
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

  router.get("/activity", async (req, res): Promise<void> => {
    const { organizationId } = req.organizationContext!;
    const activities = await db
      .select()
      .from(fieldActivitiesTable)
      .where(eq(fieldActivitiesTable.organizationId, organizationId))
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

  router.get("/projects", async (req, res): Promise<void> => {
    const { organizationId } = req.organizationContext!;
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.organizationId, organizationId))
      .orderBy(desc(projectsTable.createdAt));
    res.json(ListProjectsResponse.parse(projects));
  });

  router.get("/construction-classifications", async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: businessClassificationsTable.id,
        versionId: businessClassificationsTable.versionId,
        code: businessClassificationsTable.code,
        family: businessClassificationsTable.family,
        name: businessClassificationsTable.name,
        nature: businessClassificationsTable.nature,
        allowedQualifications: businessClassificationsTable.allowedQualifications,
        sourceVerificationStatus: classificationSourcesTable.verificationStatus,
      })
      .from(businessClassificationsTable)
      .innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId))
      .innerJoin(classificationSourcesTable, eq(classificationSourcesTable.id, classificationVersionsTable.sourceId))
      .where(eq(classificationVersionsTable.status, "ACTIVE"))
      .orderBy(asc(businessClassificationsTable.code));
    res.json(ListConstructionClassificationsResponse.parse(rows));
  });

  router.get("/organization-classifications", async (req, res): Promise<void> => {
    const rows = await db
      .select({
        organizationId: organizationClassificationsTable.organizationId,
        classificationId: organizationClassificationsTable.classificationId,
        qualification: organizationClassificationsTable.qualification,
        evidenceStatus: organizationClassificationsTable.evidenceStatus,
        evidenceReference: organizationClassificationsTable.evidenceReference,
        notes: organizationClassificationsTable.notes,
        code: businessClassificationsTable.code,
        name: businessClassificationsTable.name,
        family: businessClassificationsTable.family,
        nature: businessClassificationsTable.nature,
        versionId: businessClassificationsTable.versionId,
        sourceVerificationStatus: classificationSourcesTable.verificationStatus,
      })
      .from(organizationClassificationsTable)
      .innerJoin(businessClassificationsTable, eq(businessClassificationsTable.id, organizationClassificationsTable.classificationId))
      .innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId))
      .innerJoin(classificationSourcesTable, eq(classificationSourcesTable.id, classificationVersionsTable.sourceId))
      .where(eq(organizationClassificationsTable.organizationId, req.organizationContext!.organizationId))
      .orderBy(asc(businessClassificationsTable.code));
    res.json(ListOrganizationClassificationsResponse.parse(rows));
  });

  router.post(
    "/organization-classifications",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const body = AddOrganizationClassificationBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: "Klasifikasi badan usaha tidak valid" });
        return;
      }
      const { organizationId, userId } = req.organizationContext!;
      const [classification] = await db
        .select({ id: businessClassificationsTable.id, allowedQualifications: businessClassificationsTable.allowedQualifications })
        .from(businessClassificationsTable)
        .innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId))
        .where(and(eq(businessClassificationsTable.id, body.data.classificationId), eq(classificationVersionsTable.status, "ACTIVE")));
      if (!classification) {
        res.status(404).json({ error: "Referensi klasifikasi tidak ditemukan" });
        return;
      }
      if (body.data.qualification && !classification.allowedQualifications.includes(body.data.qualification)) {
        res.status(400).json({ error: "Kualifikasi tidak tersedia untuk klasifikasi ini" });
        return;
      }
      const [saved] = await db
        .insert(organizationClassificationsTable)
        .values({ ...body.data, organizationId, createdBy: userId })
        .onConflictDoUpdate({
          target: [organizationClassificationsTable.organizationId, organizationClassificationsTable.classificationId],
          set: {
            qualification: body.data.qualification,
            evidenceStatus: body.data.evidenceStatus ?? "MENUNGGU_VERIFIKASI",
            evidenceReference: body.data.evidenceReference ?? null,
            notes: body.data.notes ?? null,
          },
        })
        .returning();
      const [result] = await db
        .select({
          organizationId: organizationClassificationsTable.organizationId,
          classificationId: organizationClassificationsTable.classificationId,
          qualification: organizationClassificationsTable.qualification,
          evidenceStatus: organizationClassificationsTable.evidenceStatus,
          evidenceReference: organizationClassificationsTable.evidenceReference,
          notes: organizationClassificationsTable.notes,
          code: businessClassificationsTable.code,
          name: businessClassificationsTable.name,
          family: businessClassificationsTable.family,
          nature: businessClassificationsTable.nature,
          versionId: businessClassificationsTable.versionId,
          sourceVerificationStatus: classificationSourcesTable.verificationStatus,
        })
        .from(organizationClassificationsTable)
        .innerJoin(businessClassificationsTable, eq(businessClassificationsTable.id, organizationClassificationsTable.classificationId))
        .innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId))
        .innerJoin(classificationSourcesTable, eq(classificationSourcesTable.id, classificationVersionsTable.sourceId))
        .where(and(eq(organizationClassificationsTable.organizationId, organizationId), eq(organizationClassificationsTable.classificationId, saved.classificationId)));
      res.status(201).json(AddOrganizationClassificationResponse.parse(result));
    },
  );

  const findProject = async (organizationId: string, projectId: number) =>
    (await db.select({ id: projectsTable.id }).from(projectsTable).where(and(eq(projectsTable.id, projectId), eq(projectsTable.organizationId, organizationId))))[0];

  router.get("/projects/:projectId/classifications", async (req, res): Promise<void> => {
    const params = ListProjectClassificationsParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: "ID proyek tidak valid" }); return; }
    const { organizationId } = req.organizationContext!;
    if (!(await findProject(organizationId, params.data.projectId))) { res.status(404).json({ error: "Proyek tidak ditemukan" }); return; }
    const rows = await db
      .select({
        organizationId: projectClassificationsTable.organizationId,
        projectId: projectClassificationsTable.projectId,
        classificationId: projectClassificationsTable.classificationId,
        role: projectClassificationsTable.role,
        requiredQualification: projectClassificationsTable.requiredQualification,
        code: businessClassificationsTable.code,
        name: businessClassificationsTable.name,
        family: businessClassificationsTable.family,
        versionId: businessClassificationsTable.versionId,
      })
      .from(projectClassificationsTable)
      .innerJoin(businessClassificationsTable, eq(businessClassificationsTable.id, projectClassificationsTable.classificationId))
      .where(and(eq(projectClassificationsTable.organizationId, organizationId), eq(projectClassificationsTable.projectId, params.data.projectId)))
      .orderBy(asc(projectClassificationsTable.role), asc(businessClassificationsTable.code));
    res.json(ListProjectClassificationsResponse.parse(rows));
  });

  router.post("/projects/:projectId/classifications", requireRole("owner", "safety_expert"), async (req, res): Promise<void> => {
    const params = AddProjectClassificationParams.safeParse(req.params);
    const body = AddProjectClassificationBody.safeParse(req.body);
    if (!params.success || !body.success) { res.status(400).json({ error: "Klasifikasi proyek tidak valid" }); return; }
    const { organizationId, userId } = req.organizationContext!;
    if (!(await findProject(organizationId, params.data.projectId))) { res.status(404).json({ error: "Proyek tidak ditemukan" }); return; }
    const [classification] = await db.select({
      id: businessClassificationsTable.id,
      allowedQualifications: businessClassificationsTable.allowedQualifications,
    }).from(businessClassificationsTable).innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId)).where(and(eq(businessClassificationsTable.id, body.data.classificationId), eq(classificationVersionsTable.status, "ACTIVE")));
    if (!classification) { res.status(404).json({ error: "Referensi klasifikasi tidak ditemukan" }); return; }
    if (body.data.requiredQualification && !classification.allowedQualifications.includes(body.data.requiredQualification)) {
      res.status(400).json({ error: "Kualifikasi tidak tersedia untuk klasifikasi ini" });
      return;
    }
    if (body.data.role === "PRIMARY") {
      const [existingPrimary] = await db.select({ classificationId: projectClassificationsTable.classificationId }).from(projectClassificationsTable).where(and(eq(projectClassificationsTable.organizationId, organizationId), eq(projectClassificationsTable.projectId, params.data.projectId), eq(projectClassificationsTable.role, "PRIMARY")));
      if (existingPrimary && existingPrimary.classificationId !== body.data.classificationId) {
        res.status(409).json({ error: "Proyek sudah memiliki klasifikasi utama" });
        return;
      }
    }
    const [saved] = await db.insert(projectClassificationsTable).values({ ...body.data, organizationId, projectId: params.data.projectId, createdBy: userId }).onConflictDoUpdate({ target: [projectClassificationsTable.organizationId, projectClassificationsTable.projectId, projectClassificationsTable.classificationId], set: { role: body.data.role, requiredQualification: body.data.requiredQualification ?? null } }).returning();
    const [result] = await db.select({ organizationId: projectClassificationsTable.organizationId, projectId: projectClassificationsTable.projectId, classificationId: projectClassificationsTable.classificationId, role: projectClassificationsTable.role, requiredQualification: projectClassificationsTable.requiredQualification, code: businessClassificationsTable.code, name: businessClassificationsTable.name, family: businessClassificationsTable.family, versionId: businessClassificationsTable.versionId }).from(projectClassificationsTable).innerJoin(businessClassificationsTable, eq(businessClassificationsTable.id, projectClassificationsTable.classificationId)).where(and(eq(projectClassificationsTable.organizationId, organizationId), eq(projectClassificationsTable.projectId, saved.projectId), eq(projectClassificationsTable.classificationId, saved.classificationId)));
    res.status(201).json(AddProjectClassificationResponse.parse(result));
  });

  router.get("/projects/:projectId/organization-fit", async (req, res): Promise<void> => {
    const params = GetOrganizationProjectFitParams.safeParse(req.params);
    if (!params.success) { res.status(400).json({ error: "ID proyek tidak valid" }); return; }
    const { organizationId, userId } = req.organizationContext!;
    if (!(await findProject(organizationId, params.data.projectId))) { res.status(404).json({ error: "Proyek tidak ditemukan" }); return; }
    const required = await db.select({ classificationId: projectClassificationsTable.classificationId, requiredQualification: projectClassificationsTable.requiredQualification, code: businessClassificationsTable.code, name: businessClassificationsTable.name, versionId: businessClassificationsTable.versionId, sourceStatus: classificationSourcesTable.verificationStatus }).from(projectClassificationsTable).innerJoin(businessClassificationsTable, eq(businessClassificationsTable.id, projectClassificationsTable.classificationId)).innerJoin(classificationVersionsTable, eq(classificationVersionsTable.id, businessClassificationsTable.versionId)).innerJoin(classificationSourcesTable, eq(classificationSourcesTable.id, classificationVersionsTable.sourceId)).where(and(eq(projectClassificationsTable.organizationId, organizationId), eq(projectClassificationsTable.projectId, params.data.projectId)));
    const capabilities = await db.select({ classificationId: organizationClassificationsTable.classificationId, qualification: organizationClassificationsTable.qualification, evidenceStatus: organizationClassificationsTable.evidenceStatus }).from(organizationClassificationsTable).where(eq(organizationClassificationsTable.organizationId, organizationId));
    const matched: string[] = [];
    const missing: string[] = [];
    const warnings: string[] = [];
    const sourceVerified = required.length > 0 && required.every((item) => item.sourceStatus === "TERVERIFIKASI");
    const organizationEvidenceVerified = required.every((item) => {
      const capability = capabilities.find((candidate) => candidate.classificationId === item.classificationId);
      if (!capability) { missing.push(`${item.code} — ${item.name}`); return false; }
      if (!qualificationSatisfies(capability.qualification, item.requiredQualification)) { missing.push(`${item.code} — minimal kualifikasi ${item.requiredQualification}`); return false; }
      if (capability.evidenceStatus !== "TERVERIFIKASI") warnings.push(`${item.code} memiliki bukti organisasi yang belum terverifikasi`);
      matched.push(`${item.code} — ${item.name}`);
      return true;
    });
    if (!required.length) warnings.push("Belum ada klasifikasi proyek yang ditetapkan");
    if (!sourceVerified) warnings.push("Referensi klasifikasi belum diverifikasi; hasil ini bukan penetapan kepatuhan hukum");
    const status = !required.length || !sourceVerified ? "MENUNGGU_VERIFIKASI" : missing.length === required.length ? "TIDAK_SESUAI" : missing.length ? "MEMERLUKAN_MITRA" : organizationEvidenceVerified && !warnings.length ? "SESUAI" : "SESUAI_BERSYARAT";
    const score = required.length ? Math.round((matched.length / required.length) * 100) : 0;
    const result = { organizationId, projectId: params.data.projectId, status, score, explanation: { sourceVerified, organizationEvidenceVerified, matched, missing, warnings }, referenceVersionIds: [...new Set(required.map((item) => item.versionId))], evaluatedAt: new Date() };
    await db.insert(organizationProjectFitResultsTable).values({ ...result, evaluatedBy: userId }).onConflictDoUpdate({ target: [organizationProjectFitResultsTable.organizationId, organizationProjectFitResultsTable.projectId], set: { status: result.status, score, explanation: result.explanation, referenceVersionIds: result.referenceVersionIds, evaluatedAt: result.evaluatedAt, evaluatedBy: userId } });
    res.json(GetOrganizationProjectFitResponse.parse(result));
  });

  router.post(
    "/projects",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = CreateProjectBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [project] = await db
        .insert(projectsTable)
        .values({
          ...parsed.data,
          organizationId: req.organizationContext!.organizationId,
          createdBy: req.organizationContext!.userId,
          progress: parsed.data.progress ?? 0,
          startDate: dateOnly(parsed.data.startDate),
          endDate: parsed.data.endDate ? dateOnly(parsed.data.endDate) : null,
        })
        .returning();
      res.status(201).json(CreateProjectResponse.parse(project));
    },
  );

  router.get("/projects/:id", async (req, res): Promise<void> => {
    const params = GetProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.id, params.data.id),
          eq(
            projectsTable.organizationId,
            req.organizationContext!.organizationId,
          ),
        ),
      );
    if (!project) {
      res.status(404).json({ error: "Proyek tidak ditemukan" });
      return;
    }
    res.json(GetProjectResponse.parse(project));
  });

  router.get("/projects/:projectId/csms-readiness", async (req, res): Promise<void> => {
    const params = GetProjectCsmsReadinessParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const { organizationId } = req.organizationContext!;
    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, params.data.projectId), eq(projectsTable.organizationId, organizationId)));
    if (!project) {
      res.status(404).json({ error: "Proyek tidak ditemukan" });
      return;
    }
    const [saved] = await db
      .select()
      .from(projectCsmsReadinessTable)
      .where(and(eq(projectCsmsReadinessTable.projectId, project.id), eq(projectCsmsReadinessTable.organizationId, organizationId)));
    const profile =
      (await findAvailableCsmsProfile(organizationId, saved?.profileId)) ??
      { ...csmsProfiles[0]!, locked: true, builtIn: true };
    const updatedByName = saved?.updatedBy
      ? await resolveUserName(saved.updatedBy)
      : null;
    res.json(
      GetProjectCsmsReadinessResponse.parse(
        buildCsmsReadiness(
          project.id,
          profile,
          saved?.itemStatuses ?? {},
          saved?.updatedAt ?? null,
          saved?.revision ?? 0,
          saved?.updatedBy ?? null,
          updatedByName,
        ),
      ),
    );
  });

  router.put(
    "/projects/:projectId/csms-readiness",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const params = UpdateProjectCsmsReadinessParams.safeParse(req.params);
      const body = UpdateProjectCsmsReadinessBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Data kesiapan CSMS tidak valid" });
        return;
      }
      const { organizationId, userId } = req.organizationContext!;
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(and(eq(projectsTable.id, params.data.projectId), eq(projectsTable.organizationId, organizationId)));
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      const itemStatuses = Object.fromEntries(
        body.data.itemStatuses.map((item) => [item.key, item.status]),
      );
      const builtInProfile = findCsmsProfile(body.data.profileId);
      const updatedByName = await resolveUserName(userId);
      const result = await db.transaction(async (tx) => {
        const profile = builtInProfile
          ? {
              ...builtInProfile,
              locked: true,
              builtIn: true,
              archived: false,
            }
          : (
              await tx
                .select()
                .from(csmsProfileVersionsTable)
                .where(
                  and(
                    eq(csmsProfileVersionsTable.id, body.data.profileId),
                    eq(csmsProfileVersionsTable.organizationId, organizationId),
                  ),
                )
                .for("update")
            )[0];
        if (!profile) return undefined;
        if (!builtInProfile && profile.archived) {
          const [current] = await tx
            .select({ profileId: projectCsmsReadinessTable.profileId })
            .from(projectCsmsReadinessTable)
            .where(
              and(
                eq(projectCsmsReadinessTable.organizationId, organizationId),
                eq(projectCsmsReadinessTable.projectId, project.id),
              ),
            );
          if (current?.profileId !== profile.id) {
            return { archived: true as const };
          }
        }
        const [updated] = await tx
          .update(projectCsmsReadinessTable)
          .set({
            profileId: profile.id,
            itemStatuses,
            revision: sql`${projectCsmsReadinessTable.revision} + 1`,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectCsmsReadinessTable.organizationId, organizationId),
              eq(projectCsmsReadinessTable.projectId, project.id),
              eq(projectCsmsReadinessTable.revision, body.data.revision),
            ),
          )
          .returning();
        const [inserted] = updated
          ? []
          : await tx
              .insert(projectCsmsReadinessTable)
              .values({
                organizationId,
                projectId: project.id,
                profileId: profile.id,
                itemStatuses,
                revision: 1,
                updatedBy: userId,
              })
              .onConflictDoNothing()
              .returning();
        const saved = updated ?? inserted;
        if (!saved) return { conflict: true as const };
        await tx.insert(projectCsmsReadinessHistoryTable).values({
          organizationId,
          projectId: project.id,
          profileId: saved.profileId,
          itemStatuses: saved.itemStatuses,
          revision: saved.revision,
          changedBy: userId,
          changedByName: updatedByName,
          changedAt: saved.updatedAt,
        });
        if (!builtInProfile) {
          await tx
            .update(csmsProfileVersionsTable)
            .set({ locked: true })
            .where(
              and(
                eq(csmsProfileVersionsTable.id, profile.id),
                eq(csmsProfileVersionsTable.organizationId, organizationId),
              ),
            );
        }
        return {
          conflict: false as const,
          profile: builtInProfile
            ? profile
            : { ...profile, locked: true, builtIn: false },
          saved,
        };
      });
      if (!result) {
        res.status(400).json({ error: "Profil CSMS tidak valid" });
        return;
      }
      if ("archived" in result) {
        res.status(409).json({
          error: "Profil CSMS sudah diarsipkan dan tidak dapat dipilih untuk kesiapan baru",
        });
        return;
      }
      if (result.conflict) {
        const [latest] = await db
          .select()
          .from(projectCsmsReadinessTable)
          .where(
            and(
              eq(projectCsmsReadinessTable.projectId, project.id),
              eq(projectCsmsReadinessTable.organizationId, organizationId),
            ),
          );
        const latestProfile =
          (await findAvailableCsmsProfile(organizationId, latest?.profileId)) ??
          { ...csmsProfiles[0]!, locked: true, builtIn: true };
        const updatedByName = latest?.updatedBy
          ? await resolveUserName(latest.updatedBy)
          : null;
        res.status(409).json(
          GetProjectCsmsReadinessResponse.parse(
            buildCsmsReadiness(
              project.id,
              latestProfile,
              latest?.itemStatuses ?? {},
              latest?.updatedAt ?? null,
              latest?.revision ?? 0,
              latest?.updatedBy ?? null,
              updatedByName,
            ),
          ),
        );
        return;
      }
      res.json(
        UpdateProjectCsmsReadinessResponse.parse(
          buildCsmsReadiness(
            project.id,
            result.profile,
            result.saved.itemStatuses,
            result.saved.updatedAt,
            result.saved.revision,
            result.saved.updatedBy,
            updatedByName,
          ),
        ),
      );
    },
  );

  router.get("/safety-price-catalog", async (req, res): Promise<void> => {
    const items = await db
      .select()
      .from(safetyPriceCatalogItemsTable)
      .where(
        eq(
          safetyPriceCatalogItemsTable.organizationId,
          req.organizationContext!.organizationId,
        ),
      )
      .orderBy(asc(safetyPriceCatalogItemsTable.description));
    res.json(ListSafetyPriceCatalogItemsResponse.parse(items));
  });

  router.post(
    "/safety-price-catalog",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const body = CreateSafetyPriceCatalogItemBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: "Data item katalog tidak valid" });
        return;
      }
      const { organizationId, userId } = req.organizationContext!;
      const [item] = await db
        .insert(safetyPriceCatalogItemsTable)
        .values({
          ...body.data,
          priceUpdatedAt: dateOnly(body.data.priceUpdatedAt),
          id: crypto.randomUUID(),
          organizationId,
          createdBy: userId,
        })
        .returning();
      res.status(201).json(CreateSafetyPriceCatalogItemResponse.parse(item));
    },
  );

  router.patch(
    "/safety-price-catalog/:id",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const params = UpdateSafetyPriceCatalogItemParams.safeParse(req.params);
      const body = UpdateSafetyPriceCatalogItemBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Data item katalog tidak valid" });
        return;
      }
      const [item] = await db
        .update(safetyPriceCatalogItemsTable)
        .set({
          ...body.data,
          priceUpdatedAt: dateOnly(body.data.priceUpdatedAt),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(safetyPriceCatalogItemsTable.id, params.data.id),
            eq(
              safetyPriceCatalogItemsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .returning();
      if (!item) {
        res.status(404).json({ error: "Item katalog tidak ditemukan" });
        return;
      }
      res.json(UpdateSafetyPriceCatalogItemResponse.parse(item));
    },
  );

  router.delete(
    "/safety-price-catalog/:id",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const params = DeleteSafetyPriceCatalogItemParams.safeParse(req.params);
      if (!params.success) {
        res.status(400).json({ error: "ID item katalog tidak valid" });
        return;
      }
      const [item] = await db
        .delete(safetyPriceCatalogItemsTable)
        .where(
          and(
            eq(safetyPriceCatalogItemsTable.id, params.data.id),
            eq(
              safetyPriceCatalogItemsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .returning({ id: safetyPriceCatalogItemsTable.id });
      if (!item) {
        res.status(404).json({ error: "Item katalog tidak ditemukan" });
        return;
      }
      res.sendStatus(204);
    },
  );

  router.get("/projects/:projectId/safety-boq", async (req, res): Promise<void> => {
    const params = GetProjectSafetyBoqParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const { organizationId } = req.organizationContext!;
    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, params.data.projectId), eq(projectsTable.organizationId, organizationId)));
    if (!project) {
      res.status(404).json({ error: "Proyek tidak ditemukan" });
      return;
    }
    const result = await db.transaction(async (tx) => {
      const [draft] = await tx
        .select({ revision: safetyBoqDraftsTable.revision })
        .from(safetyBoqDraftsTable)
        .where(and(
          eq(safetyBoqDraftsTable.organizationId, organizationId),
          eq(safetyBoqDraftsTable.projectId, project.id),
        ));
      await hooks.beforeSafetyBoqItemsRead?.();
      const items = await tx
        .select()
        .from(safetyBoqItemsTable)
        .where(and(eq(safetyBoqItemsTable.organizationId, organizationId), eq(safetyBoqItemsTable.projectId, project.id)))
        .orderBy(asc(safetyBoqItemsTable.createdAt));
      return { revision: draft?.revision ?? 0, items };
    }, {
      isolationLevel: "repeatable read",
      accessMode: "read only",
    });
    res.json(GetProjectSafetyBoqResponse.parse(result));
  });

  router.put(
    "/projects/:projectId/safety-boq",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const params = ReplaceProjectSafetyBoqParams.safeParse(req.params);
      const body = ReplaceProjectSafetyBoqBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Data BOQ tidak valid" });
        return;
      }
      const { organizationId, userId } = req.organizationContext!;
      const [project] = await db
        .select({ id: projectsTable.id })
        .from(projectsTable)
        .where(and(eq(projectsTable.id, params.data.projectId), eq(projectsTable.organizationId, organizationId)));
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      const uniqueItems = Array.from(
        body.data.items.reduce((itemsByIdentity, item) => {
          const identity = item.migrationKey
            ? `migration:${item.migrationKey}`
            : `item:${item.id}`;
          if (!itemsByIdentity.has(identity)) {
            itemsByIdentity.set(identity, item);
          }
          return itemsByIdentity;
        }, new Map<string, (typeof body.data.items)[number]>()),
      ).map(([, item]) => item);
      const result = await db.transaction(async (tx) => {
        await tx
          .insert(safetyBoqDraftsTable)
          .values({ organizationId, projectId: project.id, updatedBy: userId })
          .onConflictDoNothing();
        const [revision] = await tx
          .update(safetyBoqDraftsTable)
          .set({
            revision: sql`${safetyBoqDraftsTable.revision} + 1`,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(safetyBoqDraftsTable.organizationId, organizationId),
            eq(safetyBoqDraftsTable.projectId, project.id),
            eq(safetyBoqDraftsTable.revision, body.data.revision),
          ))
          .returning({ revision: safetyBoqDraftsTable.revision });
        if (!revision) {
          const [currentDraft] = await tx
            .select({ revision: safetyBoqDraftsTable.revision })
            .from(safetyBoqDraftsTable)
            .where(and(
              eq(safetyBoqDraftsTable.organizationId, organizationId),
              eq(safetyBoqDraftsTable.projectId, project.id),
            ));
          const currentItems = await tx
            .select()
            .from(safetyBoqItemsTable)
            .where(and(
              eq(safetyBoqItemsTable.organizationId, organizationId),
              eq(safetyBoqItemsTable.projectId, project.id),
            ))
            .orderBy(asc(safetyBoqItemsTable.createdAt));
          const comparableInput = uniqueItems.map((item) => ({
            id: item.id,
            description: item.description,
            category: item.category,
            volume: item.volume,
            unit: item.unit,
            unitPrice: item.unitPrice,
            migrationKey: item.migrationKey ?? null,
            catalogItemId: item.catalogItemId ?? null,
            priceRegion: item.priceRegion ?? null,
            priceSource: item.priceSource ?? null,
            priceUpdatedAt: item.priceUpdatedAt?.toISOString().slice(0, 10) ?? null,
            risk: item.risk,
            stage: item.stage,
            controlNeed: item.controlNeed,
          })).sort((first, second) => (
            (first.migrationKey ?? first.id).localeCompare(second.migrationKey ?? second.id)
          ));
          const comparableCurrent = currentItems.map((item) => ({
            id: item.id,
            description: item.description,
            category: item.category,
            volume: item.volume,
            unit: item.unit,
            unitPrice: item.unitPrice,
            migrationKey: item.migrationKey ?? null,
            catalogItemId: item.catalogItemId ?? null,
            priceRegion: item.priceRegion ?? null,
            priceSource: item.priceSource ?? null,
            priceUpdatedAt: item.priceUpdatedAt?.toISOString().slice(0, 10) ?? null,
            risk: item.risk,
            stage: item.stage,
            controlNeed: item.controlNeed,
          })).sort((first, second) => (
            (first.migrationKey ?? first.id).localeCompare(second.migrationKey ?? second.id)
          ));
          const isExactMigrationRetry = uniqueItems.some((item) => item.migrationKey)
            && JSON.stringify(comparableInput) === JSON.stringify(comparableCurrent);
          return isExactMigrationRetry
            ? { revision: currentDraft!.revision, items: currentItems }
            : null;
        }
        await tx
          .delete(safetyBoqItemsTable)
          .where(and(eq(safetyBoqItemsTable.organizationId, organizationId), eq(safetyBoqItemsTable.projectId, project.id)));
        const items = uniqueItems.length === 0
          ? []
          : await tx
              .insert(safetyBoqItemsTable)
              .values(uniqueItems.map((item) => ({
                ...item,
                organizationId,
                projectId: project.id,
                createdBy: userId,
              })))
              .returning();
        return { revision: revision.revision, items };
      });
      if (!result) {
        res.status(409).json({ error: "Draft BOQ telah diubah anggota tim lain. Muat revisi terbaru sebelum menyimpan." });
        return;
      }
      res.json(ReplaceProjectSafetyBoqResponse.parse(result));
    },
  );

  router.patch(
    "/projects/:id",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
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
        .where(
          and(
            eq(projectsTable.id, params.data.id),
            eq(
              projectsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .returning();
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      res.json(UpdateProjectResponse.parse(project));
    },
  );

  router.get("/people", async (req, res): Promise<void> => {
    const people = await db
      .select()
      .from(peopleTable)
      .where(
        eq(peopleTable.organizationId, req.organizationContext!.organizationId),
      )
      .orderBy(asc(peopleTable.name));
    res.json(ListPeopleResponse.parse(people));
  });

  router.post(
    "/people",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = CreatePersonBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [person] = await db
        .insert(peopleTable)
        .values({
          ...parsed.data,
          initials: initialsFor(parsed.data.name),
          organizationId: req.organizationContext!.organizationId,
          createdBy: req.organizationContext!.userId,
        })
        .returning();
      res.status(201).json(CreatePersonResponse.parse(person));
    },
  );

  router.patch(
    "/people/:id",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
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
        .where(
          and(
            eq(peopleTable.id, params.data.id),
            eq(
              peopleTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .returning();
      if (!person) {
        res.status(404).json({ error: "Personel tidak ditemukan" });
        return;
      }
      res.json(UpdatePersonResponse.parse(person));
    },
  );

  router.get("/documents", async (req, res): Promise<void> => {
    const documents = await db
      .select()
      .from(safetyDocumentsTable)
      .where(
        eq(
          safetyDocumentsTable.organizationId,
          req.organizationContext!.organizationId,
        ),
      )
      .orderBy(desc(safetyDocumentsTable.updatedAt));
    res.json(ListDocumentsResponse.parse(documents));
  });

  router.post(
    "/documents",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = CreateDocumentBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [document] = await db
        .insert(safetyDocumentsTable)
        .values({
          ...parsed.data,
          organizationId: req.organizationContext!.organizationId,
          createdBy: req.organizationContext!.userId,
        })
        .returning();
      res.status(201).json(CreateDocumentResponse.parse(document));
    },
  );

  router.get("/document-templates", (_req, res): void => {
    res.json(ListDocumentTemplatesResponse.parse(documentTemplates));
  });

  router.get("/csms-profiles", async (req, res): Promise<void> => {
    const profiles = await listAvailableCsmsProfiles(
      req.organizationContext!.organizationId,
    );
    res.json(ListCsmsProfilesResponse.parse(profiles));
  });

  const findDuplicateStageCode = (
    stages: Array<{ code: string }>,
  ): string | undefined => {
    const seen = new Set<string>();
    for (const stage of stages) {
      const code = stage.code.trim();
      const normalizedCode = code.toLowerCase();
      if (seen.has(normalizedCode)) return code;
      seen.add(normalizedCode);
    }
    return undefined;
  };

  router.post(
    "/csms-profiles",
    requireRole("owner"),
    async (req, res): Promise<void> => {
      const body = CreateCsmsProfileBody.safeParse(req.body);
      if (!body.success) {
        res.status(400).json({ error: body.error.message });
        return;
      }
      const duplicateStageCode = findDuplicateStageCode(body.data.stages);
      if (duplicateStageCode) {
        res.status(400).json({
          error: `Kode tahap harus unik tanpa membedakan huruf besar-kecil. Kode duplikat: ${duplicateStageCode}`,
        });
        return;
      }
      const { organizationId, userId } = req.organizationContext!;
      const id = `ORG_${crypto.randomUUID()}`;
      try {
        const [profile] = await db
          .insert(csmsProfileVersionsTable)
          .values({ id, organizationId, createdBy: userId, ...body.data })
          .returning();
        res.status(201).json(
          CreateCsmsProfileResponse.parse({ ...profile!, builtIn: false }),
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("csms_profile_versions_org_issuer_version_unique")
        ) {
          res.status(409).json({ error: "Issuer dan versi pedoman sudah ada" });
          return;
        }
        throw error;
      }
    },
  );

  router.put(
    "/csms-profiles/:id",
    requireRole("owner"),
    async (req, res): Promise<void> => {
      const params = UpdateCsmsProfileParams.safeParse(req.params);
      const body = UpdateCsmsProfileBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Data profil CSMS tidak valid" });
        return;
      }
      const duplicateStageCode = findDuplicateStageCode(body.data.stages);
      if (duplicateStageCode) {
        res.status(400).json({
          error: `Kode tahap harus unik tanpa membedakan huruf besar-kecil. Kode duplikat: ${duplicateStageCode}`,
        });
        return;
      }
      const { organizationId } = req.organizationContext!;
      const [existing] = await db
        .select()
        .from(csmsProfileVersionsTable)
        .where(
          and(
            eq(csmsProfileVersionsTable.id, params.data.id),
            eq(csmsProfileVersionsTable.organizationId, organizationId),
          ),
        );
      if (!existing) {
        res.status(404).json({ error: "Profil CSMS tidak ditemukan" });
        return;
      }
      if (existing.locked) {
        res.status(409).json({
          error: "Versi ini sudah dipakai dan tidak dapat diubah. Buat versi baru.",
        });
        return;
      }
      try {
        const [profile] = await db
          .update(csmsProfileVersionsTable)
          .set({ ...body.data, updatedAt: new Date() })
          .where(
            and(
              eq(csmsProfileVersionsTable.id, params.data.id),
              eq(csmsProfileVersionsTable.organizationId, organizationId),
              eq(csmsProfileVersionsTable.locked, false),
            ),
          )
          .returning();
        if (!profile) {
          res.status(409).json({
            error: "Versi ini sudah dipakai dan tidak dapat diubah. Buat versi baru.",
          });
          return;
        }
        res.json(UpdateCsmsProfileResponse.parse({ ...profile!, builtIn: false }));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("csms_profile_versions_org_issuer_version_unique")
        ) {
          res.status(409).json({ error: "Issuer dan versi pedoman sudah ada" });
          return;
        }
        throw error;
      }
    },
  );

  router.patch(
    "/csms-profiles/:id/archive",
    requireRole("owner"),
    async (req, res): Promise<void> => {
      const params = SetCsmsProfileArchivedParams.safeParse(req.params);
      const body = SetCsmsProfileArchivedBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Status arsip profil CSMS tidak valid" });
        return;
      }
      const [profile] = await db
        .update(csmsProfileVersionsTable)
        .set({ archived: body.data.archived, updatedAt: new Date() })
        .where(
          and(
            eq(csmsProfileVersionsTable.id, params.data.id),
            eq(
              csmsProfileVersionsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .returning();
      if (!profile) {
        res.status(404).json({
          error: "Profil CSMS workspace tidak ditemukan",
        });
        return;
      }
      res.json(
        SetCsmsProfileArchivedResponse.parse({
          ...profile,
          builtIn: false,
        }),
      );
    },
  );

  router.post(
    "/generated-documents",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = GenerateDocumentBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [project] = await db
        .select()
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, parsed.data.projectId),
            eq(
              projectsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        );
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }

      const template = documentTemplates.find(
        (item) => item.id === parsed.data.template,
      );
      if (!template) {
        res.status(400).json({ error: "Template tidak didukung" });
        return;
      }
      const isRkk = parsed.data.template !== "CSMS_PRAKUALIFIKASI";
      let csmsProfile;
      try {
        const builtInProfile = findCsmsProfile(parsed.data.csmsProfileId);
        const selectedProfile =
          parsed.data.template !== "CSMS_PRAKUALIFIKASI"
            ? undefined
            : builtInProfile
              ? {
                  ...builtInProfile,
                  locked: true,
                  builtIn: true,
                  archived: false,
                }
              : (
                  await db
                    .update(csmsProfileVersionsTable)
                    .set({ locked: true })
                    .where(
                      and(
                        eq(csmsProfileVersionsTable.id, parsed.data.csmsProfileId ?? ""),
                        eq(
                          csmsProfileVersionsTable.organizationId,
                          req.organizationContext!.organizationId,
                        ),
                        eq(csmsProfileVersionsTable.archived, false),
                      ),
                    )
                    .returning()
                )[0];
        csmsProfile = resolveCsmsProfileForTemplate(
          parsed.data.template,
          selectedProfile && !builtInProfile
            ? { ...selectedProfile, builtIn: false }
            : selectedProfile,
        );
      } catch (error) {
        res.status(400).json({
          error:
            error instanceof Error ? error.message : "Profil CSMS tidak valid",
        });
        return;
      }

      const personnel = await db
        .select()
        .from(peopleTable)
        .where(
          and(
            eq(
              peopleTable.organizationId,
              req.organizationContext!.organizationId,
            ),
            eq(peopleTable.project, project.name),
          ),
        )
        .orderBy(asc(peopleTable.name));
      const personnelNames = personnel.map((person) => person.name);
      const credentials = personnelNames.length
        ? await db
            .select()
            .from(certificatesTable)
            .where(
              and(
                eq(
                  certificatesTable.organizationId,
                  req.organizationContext!.organizationId,
                ),
                inArray(certificatesTable.owner, personnelNames),
              ),
            )
        : [];

      const commonRows = [
        { label: "Nama proyek", value: project.name },
        { label: "Pemberi kerja / klien", value: project.client },
        { label: "Lokasi", value: project.location },
        { label: "Lingkup pekerjaan", value: parsed.data.scopeOfWork },
        {
          label: "Nilai proyek",
          value: new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(project.value),
        },
        {
          label: "Periode",
          value: `${project.startDate} s.d. ${project.endDate ?? "belum ditetapkan"}`,
        },
        { label: "Penyedia", value: parsed.data.companyName },
        { label: "Direktur / pimpinan", value: parsed.data.directorName },
        { label: "Penanggung jawab K3", value: parsed.data.safetyLead },
      ];

      const personnelRows = personnel.length
        ? personnel.map((person) => ({
            label: `${person.name} — ${person.role}`,
            value: `${person.level}; ${person.skkni}; status ${person.status}`,
          }))
        : [
            {
              label: "Personel keselamatan",
              value:
                "Belum tersedia — tetapkan personel kompeten sesuai risiko proyek",
            },
          ];

      const credentialRows = credentials.length
        ? credentials.map((credential) => ({
            label: `${credential.owner} — ${credential.credential}`,
            value: `${credential.issuer}; berlaku sampai ${credential.expiresAt}; ${credential.status}`,
          }))
        : [
            {
              label: "Bukti kompetensi",
              value: "Belum tersedia — lampirkan SKK/sertifikat yang relevan",
            },
          ];

      const sections = isRkk
        ? [
            {
              code: "0",
              title: "Identitas dan Pengesahan Dokumen",
              narrative: [
                "Draf ini merangkum informasi proyek dan pihak yang bertanggung jawab untuk ditinjau sebelum pengesahan.",
              ],
              rows: commonRows,
            },
            {
              code: "A",
              title:
                "Kepemimpinan dan Partisipasi Pekerja dalam Keselamatan Konstruksi",
              narrative: [
                `${parsed.data.companyName} berkomitmen menyediakan kepemimpinan, sumber daya, konsultasi, dan partisipasi pekerja dalam penerapan keselamatan konstruksi.`,
                valueOrReview(parsed.data.commitment),
              ],
              rows: [
                {
                  label: "Penanggung jawab perusahaan",
                  value: parsed.data.directorName,
                },
                {
                  label: "Penanggung jawab keselamatan",
                  value: parsed.data.safetyLead,
                },
                {
                  label: "Konsultasi pekerja",
                  value:
                    "Toolbox meeting, pelaporan bahaya, inspeksi bersama, dan tindak lanjut temuan",
                },
              ],
            },
            {
              code: "B",
              title: "Perencanaan Keselamatan Konstruksi",
              narrative: [
                "IBPRP, sasaran, program, jadwal, dan pengendalian harus disusun berdasarkan tahapan pekerjaan aktual.",
              ],
              rows: [
                { label: "Tahapan utama", value: parsed.data.scopeOfWork },
                {
                  label: "IBPRP",
                  value:
                    "Lengkapi aktivitas, bahaya, tingkat risiko, pengendalian, penanggung jawab, dan peluang perbaikan",
                },
                {
                  label: "Acuan",
                  value:
                    "Permen PUPR Nomor 10 Tahun 2021, kontrak, metode kerja, dan ketentuan lain yang berlaku",
                },
              ],
            },
            {
              code: "C",
              title: "Dukungan Keselamatan Konstruksi",
              narrative: [
                "Sumber daya, kompetensi, komunikasi, kepedulian, dan informasi terdokumentasi harus tersedia selama proyek.",
              ],
              rows: [...personnelRows, ...credentialRows],
            },
            {
              code: "D",
              title: "Operasi Keselamatan Konstruksi",
              narrative: [
                "Pengendalian operasional mencakup metode kerja aman, CSA/JSA, izin kerja, APD, inspeksi, kesehatan kerja, lingkungan, dan kesiapsiagaan darurat.",
              ],
              rows: [
                {
                  label: "Rencana pengendalian",
                  value:
                    "Susun CSA/JSA per pekerjaan kritis dan tautkan dengan metode kerja serta izin kerja",
                },
                {
                  label: "Kontak darurat",
                  value: valueOrReview(parsed.data.emergencyContact),
                },
                {
                  label: "Subkontraktor",
                  value:
                    "Wajib mengikuti persyaratan RKK, induksi, pengawasan, dan evaluasi penyedia",
                },
              ],
            },
            {
              code: "E",
              title: "Evaluasi dan Peningkatan Kinerja Keselamatan Konstruksi",
              narrative: [
                "Kinerja dipantau melalui inspeksi, pengukuran, audit, rapat tinjauan, tindakan koreksi, dan evaluasi RKK.",
              ],
              rows: [
                {
                  label: "Pemantauan",
                  value:
                    "Inspeksi harian/mingguan, rekap tindakan, statistik insiden, dan capaian program",
                },
                {
                  label: "Tinjauan manajemen",
                  value:
                    "Dilakukan berkala dan setelah insiden signifikan atau perubahan pekerjaan",
                },
              ],
            },
          ]
        : [
            {
              code: "0",
              title: "Identitas Kontraktor dan Konteks Pekerjaan",
              narrative: [
                "Data ini menjadi dasar pra-kualifikasi dan harus didukung bukti yang dapat diverifikasi.",
              ],
              rows: commonRows,
            },
            ...csmsProfile!.stages.map((stage) => ({
              code: stage.code,
              title: stage.name,
              narrative: [stage.purpose],
              rows: [
                { label: "Peran", value: stage.roles.join(", ") },
                {
                  label: "Pertanyaan",
                  value: stage.questions
                    .map((item, index) => `${index + 1}. ${item}`)
                    .join("\n"),
                },
                { label: "Bukti wajib", value: stage.evidence.join(", ") },
                { label: "Validasi", value: stage.validations.join("\n") },
              ],
            })),
            {
              code: "L",
              title: "Lampiran personel dan kompetensi",
              narrative: [
                "Personel dan kompetensi berikut harus diverifikasi terhadap kebutuhan setiap tahap.",
              ],
              rows: [...personnelRows, ...credentialRows],
            },
          ];

      const generatedAt = new Date();
      const title = isRkk ? template.name : `CSMS ${csmsProfile!.issuer}`;
      const documentNumber = `${template.standard}-${project.id}-${generatedAt
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}`;

      await db.insert(safetyDocumentsTable).values({
        organizationId: req.organizationContext!.organizationId,
        createdBy: req.organizationContext!.userId,
        name: title,
        type: isRkk ? "RKK" : "Pre-qualification",
        standard: template.standard,
        project: project.name,
        status: "review",
      });

      res.status(201).json(
        GenerateDocumentResponse.parse({
          id: crypto.randomUUID(),
          title,
          documentNumber,
          template: template.id,
          standard: template.standard,
          projectName: project.name,
          companyName: parsed.data.companyName,
          generatedAt,
          issuer: isRkk
            ? "Kementerian PUPR Republik Indonesia"
            : csmsProfile!.issuer,
          guidelineVersion: isRkk
            ? "Permen PUPR Nomor 10 Tahun 2021"
            : csmsProfile!.version,
          source: isRkk ? template.sourceBasis.join("; ") : csmsProfile!.source,
          draftStatus: "DRAF",
          disclaimer:
            "Dokumen ini merupakan draf berbantuan sistem. Dokumen wajib ditinjau oleh personel K3 yang kompeten, disesuaikan dengan kontrak dan risiko aktual, dilengkapi bukti, ditandatangani, serta disetujui pihak proyek/principal sebelum digunakan.",
          sources: isRkk ? template.sourceBasis : [csmsProfile!.source],
          sections,
        }),
      );
    },
  );

  const monthlyReportSelection = {
    id: monthlyReportsTable.id,
    projectId: monthlyReportsTable.projectId,
    projectName: projectsTable.name,
    period: monthlyReportsTable.period,
    status: monthlyReportsTable.status,
    evaluation: monthlyReportsTable.evaluation,
    notes: monthlyReportsTable.notes,
    preparedBy: monthlyReportsTable.preparedBy,
    reviewedBy: monthlyReportsTable.reviewedBy,
    approvedBy: monthlyReportsTable.approvedBy,
    createdAt: monthlyReportsTable.createdAt,
    updatedAt: monthlyReportsTable.updatedAt,
  };

  router.get("/monthly-reports", async (req, res): Promise<void> => {
    const reports = await db
      .select(monthlyReportSelection)
      .from(monthlyReportsTable)
      .innerJoin(projectsTable, eq(monthlyReportsTable.projectId, projectsTable.id))
      .where(
        and(
          eq(monthlyReportsTable.organizationId, req.organizationContext!.organizationId),
          eq(projectsTable.organizationId, req.organizationContext!.organizationId),
        ),
      )
      .orderBy(desc(monthlyReportsTable.period), desc(monthlyReportsTable.updatedAt));
    res.json(ListMonthlyReportsResponse.parse(reports));
  });

  router.post(
    "/monthly-reports",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = CreateMonthlyReportBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [project] = await db
        .select({ id: projectsTable.id, name: projectsTable.name })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, parsed.data.projectId),
            eq(projectsTable.organizationId, req.organizationContext!.organizationId),
          ),
        );
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      try {
        const [report] = await db
          .insert(monthlyReportsTable)
          .values({
            ...parsed.data,
            organizationId: req.organizationContext!.organizationId,
            createdBy: req.organizationContext!.userId,
          })
          .returning();
        res.status(201).json(
          CreateMonthlyReportResponse.parse({ ...report, projectName: project.name }),
        );
      } catch (error) {
        const cause =
          typeof error === "object" && error !== null && "cause" in error
            ? error.cause
            : undefined;
        const errorCode =
          typeof error === "object" && error !== null && "code" in error
            ? error.code
            : typeof cause === "object" && cause !== null && "code" in cause
              ? cause.code
              : undefined;
        if (
          errorCode === "23505"
        ) {
          res.status(409).json({
            error: "Laporan untuk proyek dan periode ini sudah ada. Buka laporan yang tersimpan untuk melanjutkan.",
          });
          return;
        }
        throw error;
      }
    },
  );

  router.get("/monthly-reports/:id", async (req, res): Promise<void> => {
    const params = GetMonthlyReportParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [report] = await db
      .select(monthlyReportSelection)
      .from(monthlyReportsTable)
      .innerJoin(projectsTable, eq(monthlyReportsTable.projectId, projectsTable.id))
      .where(
        and(
          eq(monthlyReportsTable.id, params.data.id),
          eq(monthlyReportsTable.organizationId, req.organizationContext!.organizationId),
          eq(projectsTable.organizationId, req.organizationContext!.organizationId),
        ),
      );
    if (!report) {
      res.status(404).json({ error: "Laporan tidak ditemukan" });
      return;
    }
    res.json(GetMonthlyReportResponse.parse(report));
  });

  router.patch(
    "/monthly-reports/:id",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const params = UpdateMonthlyReportParams.safeParse(req.params);
      const body = UpdateMonthlyReportBody.safeParse(req.body);
      if (!params.success || !body.success) {
        res.status(400).json({ error: "Data laporan tidak valid" });
        return;
      }
      const [report] = await db
        .update(monthlyReportsTable)
        .set(body.data)
        .where(
          and(
            eq(monthlyReportsTable.id, params.data.id),
            eq(monthlyReportsTable.organizationId, req.organizationContext!.organizationId),
          ),
        )
        .returning();
      if (!report) {
        res.status(404).json({ error: "Laporan tidak ditemukan" });
        return;
      }
      const [project] = await db
        .select({ name: projectsTable.name })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, report.projectId),
            eq(projectsTable.organizationId, req.organizationContext!.organizationId),
          ),
        );
      if (!project) {
        res.status(404).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      res.json(
        UpdateMonthlyReportResponse.parse({ ...report, projectName: project.name }),
      );
    },
  );

  router.get("/certificates", async (req, res): Promise<void> => {
    const certificates = await db
      .select()
      .from(certificatesTable)
      .where(
        eq(
          certificatesTable.organizationId,
          req.organizationContext!.organizationId,
        ),
      )
      .orderBy(asc(certificatesTable.expiresAt));
    res.json(ListCertificatesResponse.parse(certificates));
  });

  router.post(
    "/certificates",
    requireRole("owner", "safety_expert"),
    async (req, res): Promise<void> => {
      const parsed = CreateCertificateBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [certificate] = await db
        .insert(certificatesTable)
        .values({
          ...parsed.data,
          organizationId: req.organizationContext!.organizationId,
          createdBy: req.organizationContext!.userId,
          expiresAt: dateOnly(parsed.data.expiresAt),
        })
        .returning();
      res.status(201).json(CreateCertificateResponse.parse(certificate));
    },
  );

  router.get("/field-activities", async (req, res): Promise<void> => {
    const activities = await db
      .select()
      .from(fieldActivitiesTable)
      .where(
        eq(
          fieldActivitiesTable.organizationId,
          req.organizationContext!.organizationId,
        ),
      )
      .orderBy(desc(fieldActivitiesTable.occurredAt));
    res.json(ListFieldActivitiesResponse.parse(activities));
  });

  router.post(
    "/field-activities",
    requireRole("owner", "safety_expert", "field_officer"),
    async (req, res): Promise<void> => {
      const parsed = CreateFieldActivityBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }
      const [existing] = await db
        .select()
        .from(fieldActivitiesTable)
        .where(
          and(
            eq(
              fieldActivitiesTable.organizationId,
              req.organizationContext!.organizationId,
            ),
            eq(fieldActivitiesTable.clientId, parsed.data.clientId),
          ),
        )
        .limit(1);
      if (existing) {
        res.status(200).json(CreateFieldActivityResponse.parse(existing));
        return;
      }
      const [project] = await db
        .select({ id: projectsTable.id, name: projectsTable.name })
        .from(projectsTable)
        .where(
          and(
            eq(projectsTable.id, parsed.data.projectId),
            eq(
              projectsTable.organizationId,
              req.organizationContext!.organizationId,
            ),
          ),
        )
        .limit(1);
      if (!project) {
        res.status(400).json({ error: "Proyek tidak ditemukan" });
        return;
      }
      let activity: typeof fieldActivitiesTable.$inferSelect | undefined;
      try {
        [activity] = await db.transaction(async (tx) => {
          if (parsed.data.photoObjectPath) {
            await tx.execute(
              evidencePathLockQuery(parsed.data.photoObjectPath),
            );
          await tagEvidence(
            parsed.data.photoObjectPath,
            req.organizationContext!.organizationId,
          );
          }
          return tx
            .insert(fieldActivitiesTable)
            .values({
              ...parsed.data,
              project: project.name,
              notes: parsed.data.notes ?? null,
              photoObjectPath: parsed.data.photoObjectPath ?? null,
              photoDataUrl: null,
              latitude: parsed.data.latitude ?? null,
              longitude: parsed.data.longitude ?? null,
              locationAccuracy: parsed.data.locationAccuracy ?? null,
              signatureSvg: parsed.data.signatureSvg ?? null,
              occurredAt: new Date(parsed.data.occurredAt),
              organizationId: req.organizationContext!.organizationId,
              createdBy: req.organizationContext!.userId,
            })
            .onConflictDoNothing({
              target: [
                fieldActivitiesTable.organizationId,
                fieldActivitiesTable.clientId,
              ],
              where: sql`${fieldActivitiesTable.clientId} <> 'legacy'`,
            })
            .returning();
        });
      } catch (error) {
        if (parsed.data.photoObjectPath) {
          req.log.warn({ err: error }, "Failed to link uploaded evidence");
          res.status(400).json({ error: "Foto bukti belum selesai diunggah" });
          return;
        }
        throw error;
      }
      if (activity) {
        res.status(201).json(CreateFieldActivityResponse.parse(activity));
        return;
      }
      const [concurrentExisting] = await db
        .select()
        .from(fieldActivitiesTable)
        .where(
          and(
            eq(
              fieldActivitiesTable.organizationId,
              req.organizationContext!.organizationId,
            ),
            eq(fieldActivitiesTable.clientId, parsed.data.clientId),
          ),
        )
        .limit(1);
      res.status(200).json(CreateFieldActivityResponse.parse(concurrentExisting));
    },
  );

  return router;
};

export default createSafetyRouter();
