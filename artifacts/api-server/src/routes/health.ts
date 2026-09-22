import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

type ReadinessCheck = () => Promise<unknown>;
const READINESS_TIMEOUT_MS = 2_000;

const checkDatabase: ReadinessCheck = async () => {
  let timeout: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Database readiness check timed out")),
          READINESS_TIMEOUT_MS,
        );
        timeout.unref();
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export function createHealthRouter(
  readinessCheck: ReadinessCheck = checkDatabase,
): IRouter {
  const router: IRouter = Router();

  router.get("/healthz", async (req, res): Promise<void> => {
    try {
      await readinessCheck();
      res.json(HealthCheckResponse.parse({ status: "ok" }));
    } catch (error) {
      req.log.warn({ err: error }, "Database readiness check failed");
      res.status(503).json({ error: "Layanan belum siap" });
    }
  });

  return router;
}

export default createHealthRouter();
