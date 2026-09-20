import { Router, type IRouter } from "express";
import {
  RequestEvidenceUploadUrlBody,
  RequestEvidenceUploadUrlResponse,
} from "@workspace/api-zod";
import { requireOrganization, requireRole } from "../middlewares/organizationContext.ts";
import {
  createEvidenceUploadTarget,
  canReadEvidence,
  evidenceFile,
  streamEvidence,
} from "../lib/objectStorage.ts";

const router: IRouter = Router();
router.use("/storage", requireOrganization);

router.post(
  "/storage/uploads/request-url",
  requireRole("owner", "safety_expert", "field_officer"),
  async (req, res) => {
    const parsed = RequestEvidenceUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Metadata foto tidak valid" });
      return;
    }
    try {
      res.json(RequestEvidenceUploadUrlResponse.parse(
        await createEvidenceUploadTarget(parsed.data.contentType),
      ));
    } catch (error) {
      req.log.error({ err: error }, "Failed to create evidence upload URL");
      res.status(500).json({ error: "Gagal menyiapkan unggahan foto" });
    }
  },
);

router.get("/storage/objects/*path", async (req, res) => {
  try {
    const raw = req.params.path;
    const path = Array.isArray(raw) ? raw.join("/") : raw;
    const file = evidenceFile(`/objects/${path}`);
    const [metadata] = await file.getMetadata();
    if (!canReadEvidence(
      metadata.metadata,
      req.organizationContext!.organizationId,
    )) {
      res.status(404).json({ error: "Foto tidak ditemukan" });
      return;
    }
    await streamEvidence(file, res);
  } catch (error) {
    req.log.warn({ err: error }, "Evidence object unavailable");
    if (!res.headersSent) res.status(404).json({ error: "Foto tidak ditemukan" });
  }
});

export default router;