import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { createHealthRouter } from "./health.ts";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  server = undefined;
});

async function requestHealth(readinessCheck: () => Promise<unknown>) {
  const app = express();
  app.use((req, _res, next) => {
    req.log = {
      warn: () => undefined,
    } as unknown as typeof req.log;
    next();
  });
  app.use(createHealthRouter(readinessCheck));
  server = app.listen(0);
  await new Promise<void>((resolve) => server!.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return fetch(`http://127.0.0.1:${address.port}/healthz`);
}

describe("database readiness", () => {
  it("returns 200 when the database check succeeds", async () => {
    const response = await requestHealth(async () => ({ rows: [{ "?column?": 1 }] }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });

  it("returns 503 when the database check fails", async () => {
    const response = await requestHealth(async () => {
      throw new Error("database unavailable");
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "Layanan belum siap" });
  });
});