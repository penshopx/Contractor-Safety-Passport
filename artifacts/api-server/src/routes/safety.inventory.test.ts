import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RequestHandler } from "express";
import { createSafetyRouter } from "./safety.ts";

type SafetyRouteKey = `${Uppercase<string>} ${string}`;
type IsolationScenario = "active-organization" | "foreign-id";

const passThroughOrganization: RequestHandler = (_req, _res, next) => next();

const organizationIsolationMatrix = {
  "GET /dashboard/summary": ["active-organization"],
  "GET /dashboard/readiness": ["active-organization"],
  "GET /activity": ["active-organization"],
  "GET /projects": ["active-organization"],
  "POST /projects": ["active-organization"],
  "GET /projects/:id": ["active-organization", "foreign-id"],
  "GET /projects/:projectId/csms-readiness": ["active-organization", "foreign-id"],
  "PUT /projects/:projectId/csms-readiness": ["active-organization", "foreign-id"],
  "GET /projects/:projectId/safety-boq": ["active-organization", "foreign-id"],
  "PUT /projects/:projectId/safety-boq": ["active-organization", "foreign-id"],
  "PATCH /projects/:id": ["active-organization", "foreign-id"],
  "GET /people": ["active-organization"],
  "POST /people": ["active-organization"],
  "PATCH /people/:id": ["active-organization", "foreign-id"],
  "GET /documents": ["active-organization"],
  "POST /documents": ["active-organization"],
  "GET /csms-profiles": ["active-organization"],
  "POST /csms-profiles": ["active-organization"],
  "PUT /csms-profiles/:id": ["active-organization", "foreign-id"],
  "POST /generated-documents": ["active-organization", "foreign-id"],
  "GET /monthly-reports": ["active-organization"],
  "POST /monthly-reports": ["active-organization", "foreign-id"],
  "GET /monthly-reports/:id": ["active-organization", "foreign-id"],
  "PATCH /monthly-reports/:id": ["active-organization", "foreign-id"],
  "GET /certificates": ["active-organization"],
  "POST /certificates": ["active-organization"],
  "GET /field-activities": ["active-organization"],
  "POST /field-activities": ["active-organization"],
} as const satisfies Partial<
  Record<SafetyRouteKey, readonly IsolationScenario[]>
>;

const organizationIsolationExceptions = {
  "GET /document-templates":
    "Daftar template bersifat statis dan tidak membaca atau mengubah data organisasi.",
} as const satisfies Partial<Record<SafetyRouteKey, string>>;

const listSafetyRoutes = (): SafetyRouteKey[] => {
  const router = createSafetyRouter(passThroughOrganization);
  const stack = (
    router as unknown as {
      stack: Array<{
        route?: { path: string; methods: Record<string, boolean> };
      }>;
    }
  ).stack;

  return stack
    .flatMap((layer) => {
      if (!layer.route) return [];
      return Object.entries(layer.route.methods)
        .filter(([, enabled]) => enabled)
        .map(
          ([method]) =>
            `${method.toUpperCase()} ${layer.route!.path}` as SafetyRouteKey,
        );
    })
    .sort();
};

describe("inventaris cakupan isolasi organisasi", () => {
  it("mewajibkan setiap route data memiliki skenario organisasi aktif dan ID asing bila relevan", () => {
    const registeredRoutes = listSafetyRoutes();
    const documentedRoutes = [
      ...Object.keys(organizationIsolationMatrix),
      ...Object.keys(organizationIsolationExceptions),
    ].sort();

    assert.deepEqual(
      documentedRoutes,
      registeredRoutes,
      [
        "Inventaris route keselamatan berubah.",
        "Tambahkan skenario organisasi aktif dan ID asing ke matriks isolasi,",
        "atau kecualikan route publik statis secara eksplisit dengan alasannya.",
      ].join(" "),
    );

    for (const [route, scenarios] of Object.entries(
      organizationIsolationMatrix,
    )) {
      const declaredScenarios = scenarios as readonly IsolationScenario[];
      assert.ok(
        declaredScenarios.includes("active-organization"),
        `${route} belum memiliki skenario organisasi aktif`,
      );
      if (/\/:[^/]+/.test(route) || route === "POST /generated-documents") {
        assert.ok(
          declaredScenarios.includes("foreign-id"),
          `${route} belum memiliki skenario ID asing`,
        );
      }
    }

    for (const [route, reason] of Object.entries(
      organizationIsolationExceptions,
    )) {
      assert.match(route, /^GET /, `${route} bukan route baca statis`);
      assert.ok(reason.trim().length > 0, `${route} harus memiliki alasan`);
    }
  });
});