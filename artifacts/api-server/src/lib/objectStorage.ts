import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { Storage, type File } from "@google-cloud/storage";

const SIDECAR = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const MAX_EVIDENCE_BYTES = 12_000_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function privateDir() {
  const value = process.env.PRIVATE_OBJECT_DIR;
  if (!value) throw new Error("PRIVATE_OBJECT_DIR is not configured");
  return value.replace(/\/$/, "");
}

function parsePath(path: string) {
  const [bucketName, ...parts] = path.replace(/^\//, "").split("/");
  if (!bucketName || parts.length === 0) throw new Error("Invalid object path");
  return { bucketName, objectName: parts.join("/") };
}

export function evidenceFile(objectPath: string): File {
  if (!/^\/objects\/(?:uploads\/[a-f0-9-]+|legacy-field-activities\/\d+)$/.test(objectPath)) {
    throw new Error("Invalid evidence object path");
  }
  const relative = objectPath.replace(/^\/objects\//, "");
  const { bucketName, objectName } = parsePath(`${privateDir()}/${relative}`);
  return objectStorageClient.bucket(bucketName).file(objectName);
}

export async function createEvidenceUploadTarget(contentType: string) {
  const objectPath = `/objects/uploads/${randomUUID()}`;
  const file = evidenceFile(objectPath);
  const response = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: file.bucket.name,
      object_name: file.name,
      method: "PUT",
      content_type: contentType,
      expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Failed to sign upload URL (${response.status})`);
  const body = (await response.json()) as { signed_url: string };
  return { uploadURL: body.signed_url, objectPath };
}

export async function tagEvidence(objectPath: string, organizationId: string) {
  const file = evidenceFile(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new Error("Uploaded evidence was not found");
  const [metadata] = await file.getMetadata();
  const firstBytes = await readFirstBytes(file);
  const verifiedContentType = verifyEvidenceFile({
    contentType: metadata.contentType,
    size: metadata.size,
    firstBytes,
  });
  await file.setMetadata({
    contentType: verifiedContentType,
    metadata: { organizationId, evidenceVerified: "true" },
  });
}

export async function storeMigratedEvidence(
  bytes: Buffer,
  contentType: string,
  organizationId: string,
  activityId: number,
) {
  const verifiedContentType = verifyEvidenceFile({
    contentType,
    size: bytes.length,
    firstBytes: bytes.subarray(0, 12),
  });
  const objectPath = `/objects/legacy-field-activities/${activityId}`;
  const file = evidenceFile(objectPath);
  await file.save(bytes, {
    resumable: false,
    contentType: verifiedContentType,
    metadata: { metadata: { organizationId, evidenceVerified: "true" } },
  });
  return objectPath;
}

export async function streamEvidence(file: File, res: import("express").Response) {
  const [metadata] = await file.getMetadata();
  const contentType = metadata.contentType;
  if (
    metadata.metadata?.evidenceVerified !== "true"
    || !contentType
    || !ALLOWED_IMAGE_TYPES.has(contentType)
  ) {
    throw new Error("Evidence object is not verified");
  }
  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", "inline; filename=\"bukti-lapangan\"");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Cache-Control", "private, max-age=300");
  if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
  Readable.from(file.createReadStream()).pipe(res);
}

async function readFirstBytes(file: File) {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    file.createReadStream({ start: 0, end: 11 })
      .on("data", (chunk: Buffer) => chunks.push(chunk))
      .on("end", resolve)
      .on("error", reject);
  });
  return Buffer.concat(chunks);
}

export function verifyEvidenceFile(input: {
  contentType?: string;
  size?: string | number;
  firstBytes: Uint8Array;
}) {
  const size = Number(input.size);
  if (!Number.isFinite(size) || size < 1 || size > MAX_EVIDENCE_BYTES) {
    throw new Error("Evidence file size is not allowed");
  }
  if (!input.contentType || !ALLOWED_IMAGE_TYPES.has(input.contentType)) {
    throw new Error("Evidence content type is not allowed");
  }
  const bytes = input.firstBytes;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const webp = Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF"
    && Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP";
  const matches = input.contentType === "image/jpeg" ? jpeg
    : input.contentType === "image/png" ? png
      : webp;
  if (!matches) throw new Error("Evidence bytes do not match the declared image type");
  return input.contentType;
}

export function canReadEvidence(
  metadata: Record<string, unknown> | undefined,
  organizationId: string,
) {
  return metadata?.evidenceVerified === "true"
    && metadata.organizationId === organizationId;
}