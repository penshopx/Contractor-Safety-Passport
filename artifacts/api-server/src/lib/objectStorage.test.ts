import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canReadEvidence, verifyEvidenceFile } from "./objectStorage.ts";

describe("field evidence validation", () => {
  it("accepts a small image whose bytes match its declared type", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    assert.equal(
      verifyEvidenceFile({ contentType: "image/jpeg", size: jpeg.length, firstBytes: jpeg }),
      "image/jpeg",
    );
  });

  it("rejects HTML disguised as an image and oversized files", () => {
    assert.throws(() => verifyEvidenceFile({
      contentType: "image/jpeg",
      size: 20,
      firstBytes: Buffer.from("<html><script>"),
    }));
    assert.throws(() => verifyEvidenceFile({
      contentType: "image/png",
      size: 12_000_001,
      firstBytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    }));
  });

  it("only allows verified evidence from the active organization", () => {
    const metadata = { organizationId: "org-a", evidenceVerified: "true" };
    assert.equal(canReadEvidence(metadata, "org-a"), true);
    assert.equal(canReadEvidence(metadata, "org-b"), false);
    assert.equal(canReadEvidence({ organizationId: "org-a" }, "org-a"), false);
  });
});