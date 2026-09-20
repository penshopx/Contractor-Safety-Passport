import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  organizationMembershipsTable,
  organizationsTable,
} from "@workspace/db";
import {
  CreateOrganizationBody,
  CreateOrganizationResponse,
  GetOrganizationContextResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/organization-context", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
    return;
  }
  const [membership] = await db
    .select({
      organizationId: organizationMembershipsTable.organizationId,
      role: organizationMembershipsTable.role,
      organizationName: organizationsTable.name,
    })
    .from(organizationMembershipsTable)
    .innerJoin(
      organizationsTable,
      eq(organizationsTable.id, organizationMembershipsTable.organizationId),
    )
    .where(eq(organizationMembershipsTable.userId, userId))
    .limit(1);
  res.json(GetOrganizationContextResponse.parse(membership ?? null));
});

router.post("/organizations", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
    return;
  }
  const parsed = CreateOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db
    .select()
    .from(organizationMembershipsTable)
    .where(eq(organizationMembershipsTable.userId, userId))
    .limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "Akun ini sudah memiliki ruang kerja" });
    return;
  }
  const organizationId = crypto.randomUUID();
  const [organization] = await db.transaction(async (tx) => {
    const created = await tx
      .insert(organizationsTable)
      .values({ id: organizationId, name: parsed.data.name, createdBy: userId })
      .returning();
    await tx.insert(organizationMembershipsTable).values({
      organizationId,
      userId,
      role: "owner",
    });
    return created;
  });
  res.status(201).json(
    CreateOrganizationResponse.parse({
      organizationId: organization.id,
      organizationName: organization.name,
      role: "owner",
    }),
  );
});

export default router;