import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import {
  db,
  organizationMembershipsTable,
  type OrganizationRole,
} from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      organizationContext?: {
        userId: string;
        organizationId: string;
        role: OrganizationRole;
      };
    }
  }
}

export const requireOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
    return;
  }

  const requestedOrganizationId = req.header("x-organization-id");
  const memberships = await db
    .select()
    .from(organizationMembershipsTable)
    .where(
      requestedOrganizationId
        ? and(
            eq(organizationMembershipsTable.userId, userId),
            eq(organizationMembershipsTable.organizationId, requestedOrganizationId),
          )
        : eq(organizationMembershipsTable.userId, userId),
    )
    .limit(1);
  const membership = memberships[0];
  if (!membership) {
    res.status(403).json({ error: "Ruang kerja aktif tidak tersedia" });
    return;
  }

  req.organizationContext = {
    userId,
    organizationId: membership.organizationId,
    role: membership.role,
  };
  next();
};

export const requireRole =
  (...roles: OrganizationRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.organizationContext?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ error: "Peran Anda tidak memiliki akses untuk tindakan ini" });
      return;
    }
    next();
  };