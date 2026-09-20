import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import type { NextFunction, Request, RequestHandler, Response } from "express";
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

type ResolveUserId = (req: Request) => string | undefined;

export const createRequireOrganization =
  (
    resolveUserId: ResolveUserId = (req) => getAuth(req)?.userId ?? undefined,
  ): RequestHandler =>
  async (req, res, next): Promise<void> => {
    const userId = resolveUserId(req);
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
              eq(
                organizationMembershipsTable.organizationId,
                requestedOrganizationId,
              ),
            )
          : eq(organizationMembershipsTable.userId, userId),
      )
      .orderBy(desc(organizationMembershipsTable.createdAt))
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

export const requireOrganization = createRequireOrganization();

export const requireRole =
  (...roles: OrganizationRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const role = req.organizationContext?.role;
    if (!role || !roles.includes(role)) {
      res
        .status(403)
        .json({ error: "Peran Anda tidak memiliki akses untuk tindakan ini" });
      return;
    }
    next();
  };
