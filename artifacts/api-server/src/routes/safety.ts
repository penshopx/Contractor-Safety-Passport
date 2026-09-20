import { Router, type IRouter, type RequestHandler } from "express";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  certificatesTable,
  fieldActivitiesTable,
  monthlyReportsTable,
  peopleTable,
  projectCsmsReadinessTable,
  projectsTable,
  safetyBoqItemsTable,
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
  ReplaceProjectSafetyBoqBody,
  ReplaceProjectSafetyBoqParams,
  ReplaceProjectSafetyBoqResponse,
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
import { tagEvidence } from "../lib/objectStorage.ts";

export const createSafetyRouter = (
  organizationMiddleware: RequestHandler = requireOrganization,
): IRouter => {
  const router: IRouter = Router();
  router.use(organizationMiddleware);

  const initialsFor = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  const dateOnly = (value: Date | string) =>
    typeof value === "string" ? value : value.toISOString().slice(0, 10);

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
    const profile = findCsmsProfile(saved?.profileId) ?? csmsProfiles[0]!;
    res.json(
      GetProjectCsmsReadinessResponse.parse(
        buildCsmsReadiness(project.id, profile, saved?.itemStatuses ?? {}, saved?.updatedAt ?? null),
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
      const profile = findCsmsProfile(body.data.profileId);
      if (!profile) {
        res.status(400).json({ error: "Profil CSMS tidak valid" });
        return;
      }
      const itemStatuses = Object.fromEntries(
        body.data.itemStatuses.map((item) => [item.key, item.status]),
      );
      const [saved] = await db
        .insert(projectCsmsReadinessTable)
        .values({
          organizationId,
          projectId: project.id,
          profileId: profile.id,
          itemStatuses,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: [
            projectCsmsReadinessTable.organizationId,
            projectCsmsReadinessTable.projectId,
          ],
          set: { profileId: profile.id, itemStatuses, updatedBy: userId, updatedAt: new Date() },
        })
        .returning();
      res.json(
        UpdateProjectCsmsReadinessResponse.parse(
          buildCsmsReadiness(project.id, profile, saved!.itemStatuses, saved!.updatedAt),
        ),
      );
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
    const items = await db
      .select()
      .from(safetyBoqItemsTable)
      .where(and(eq(safetyBoqItemsTable.organizationId, organizationId), eq(safetyBoqItemsTable.projectId, project.id)))
      .orderBy(asc(safetyBoqItemsTable.createdAt));
    res.json(GetProjectSafetyBoqResponse.parse(items));
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
      const items = await db.transaction(async (tx) => {
        await tx
          .delete(safetyBoqItemsTable)
          .where(and(eq(safetyBoqItemsTable.organizationId, organizationId), eq(safetyBoqItemsTable.projectId, project.id)));
        if (body.data.items.length === 0) return [];
        return tx
          .insert(safetyBoqItemsTable)
          .values(body.data.items.map((item) => ({
            ...item,
            organizationId,
            projectId: project.id,
            createdBy: userId,
          })))
          .returning();
      });
      res.json(ReplaceProjectSafetyBoqResponse.parse(items));
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

  router.get("/csms-profiles", (_req, res): void => {
    res.json(csmsProfiles);
  });

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
        csmsProfile = resolveCsmsProfileForTemplate(
          parsed.data.template,
          parsed.data.csmsProfileId,
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
      if (parsed.data.photoObjectPath) {
        try {
          await tagEvidence(
            parsed.data.photoObjectPath,
            req.organizationContext!.organizationId,
          );
        } catch {
          res.status(400).json({ error: "Foto bukti belum selesai diunggah" });
          return;
        }
      }
      const [activity] = await db
        .insert(fieldActivitiesTable)
        .values({
          ...parsed.data,
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
