import { clerkClient, getAuth } from "@clerk/express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  db,
  organizationInvitationsTable,
  organizationMembershipsTable,
  organizationsTable,
} from "@workspace/db";
import {
  AcceptOrganizationInvitationParams,
  AcceptOrganizationInvitationResponse,
  CreateOrganizationBody,
  CreateOrganizationResponse,
  GetOrganizationContextResponse,
  InviteOrganizationMemberBody,
  InviteOrganizationMemberResponse,
  ListOrganizationMembersResponse,
  RemoveOrganizationMemberParams,
  RevokeOrganizationInvitationParams,
  UpdateOrganizationMemberRoleBody,
  UpdateOrganizationMemberRoleParams,
  UpdateOrganizationMemberRoleResponse,
} from "@workspace/api-zod";
import {
  requireOrganization,
  requireRole,
} from "../middlewares/organizationContext";
import {
  decideInvitationAcceptance,
  decideInvitationCreation,
  getTrustedApplicationOrigin,
  normalizeEmail,
} from "../lib/organizationInvitations";
import { decideMemberRoleChange } from "../lib/organizationMemberships";

const router: IRouter = Router();

const getInvitationRedirectUrl = (invitationId: string) =>
  `${getTrustedApplicationOrigin(process.env)}/accept-invitation?invitation=${encodeURIComponent(invitationId)}`;

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
    .orderBy(desc(organizationMembershipsTable.createdAt))
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

router.get(
  "/organization-members",
  requireOrganization,
  requireRole("owner"),
  async (req, res): Promise<void> => {
    const organizationId = req.organizationContext!.organizationId;
    const memberships = await db
      .select()
      .from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.organizationId, organizationId));
    const userIds = memberships.map((membership) => membership.userId);
    const users =
      userIds.length > 0
        ? (await clerkClient.users.getUserList({ userId: userIds, limit: 100 })).data
        : [];
    const usersById = new Map(users.map((user) => [user.id, user]));
    const invitations = await db
      .select()
      .from(organizationInvitationsTable)
      .where(
        and(
          eq(organizationInvitationsTable.organizationId, organizationId),
          isNull(organizationInvitationsTable.acceptedAt),
          isNull(organizationInvitationsTable.revokedAt),
        ),
      );

    res.json(
      ListOrganizationMembersResponse.parse({
        members: memberships.map((membership) => {
          const user = usersById.get(membership.userId);
          const email =
            user?.primaryEmailAddress?.emailAddress ??
            user?.emailAddresses[0]?.emailAddress ??
            `${membership.userId}@unknown.invalid`;
          const name =
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            email.split("@")[0] ||
            "Anggota";
          return {
            userId: membership.userId,
            email,
            name,
            role: membership.role,
            joinedAt: membership.createdAt,
          };
        }),
        invitations: invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: "pending",
          createdAt: invitation.createdAt,
        })),
      }),
    );
  },
);

router.post(
  "/organization-invitations",
  requireOrganization,
  requireRole("owner"),
  async (req, res): Promise<void> => {
    const parsed = InviteOrganizationMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const organizationId = req.organizationContext!.organizationId;
    const userId = req.organizationContext!.userId;
    const email = normalizeEmail(parsed.data.email);
    const [existingInvitation] = await db
      .select()
      .from(organizationInvitationsTable)
      .where(
        and(
          eq(organizationInvitationsTable.organizationId, organizationId),
          eq(organizationInvitationsTable.email, email),
          isNull(organizationInvitationsTable.acceptedAt),
          isNull(organizationInvitationsTable.revokedAt),
        ),
      )
      .limit(1);
    const invitationDecision = decideInvitationCreation(
      Boolean(existingInvitation),
      false,
    );
    if (!invitationDecision.allowed) {
      res
        .status(invitationDecision.status)
        .json({ error: invitationDecision.error });
      return;
    }

    const knownUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    if (knownUsers.data[0]) {
      const [existingMembership] = await db
        .select()
        .from(organizationMembershipsTable)
        .where(
          and(
            eq(organizationMembershipsTable.organizationId, organizationId),
            eq(organizationMembershipsTable.userId, knownUsers.data[0].id),
          ),
        )
        .limit(1);
      const membershipDecision = decideInvitationCreation(
        false,
        Boolean(existingMembership),
      );
      if (!membershipDecision.allowed) {
        res
          .status(membershipDecision.status)
          .json({ error: membershipDecision.error });
        return;
      }
    }

    const invitationId = crypto.randomUUID();
    const clerkInvitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: getInvitationRedirectUrl(invitationId),
      ignoreExisting: true,
      notify: true,
      publicMetadata: { organizationId, invitationId },
    });
    const [invitation] = await db
      .insert(organizationInvitationsTable)
      .values({
        id: invitationId,
        organizationId,
        email,
        role: parsed.data.role,
        invitedBy: userId,
        clerkInvitationId: clerkInvitation.id,
      })
      .returning();

    res.status(201).json(
      InviteOrganizationMemberResponse.parse({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: "pending",
        createdAt: invitation.createdAt,
      }),
    );
  },
);

router.post(
  "/organization-invitations/:invitationId/accept",
  async (req, res): Promise<void> => {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Silakan masuk terlebih dahulu" });
      return;
    }
    const params = AcceptOrganizationInvitationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Undangan tidak valid" });
      return;
    }

    const [invitation] = await db
      .select()
      .from(organizationInvitationsTable)
      .where(eq(organizationInvitationsTable.id, params.data.invitationId))
      .limit(1);
    const user = await clerkClient.users.getUser(userId);
    const decision = decideInvitationAcceptance(
      invitation,
      userId,
      user.emailAddresses.map((item) => item.emailAddress),
    );
    if (!decision.allowed) {
      res.status(decision.status).json({ error: decision.error });
      return;
    }

    if (!decision.alreadyAccepted) {
      const accepted = await db.transaction(async (tx) => {
        const [claimed] = await tx
          .update(organizationInvitationsTable)
          .set({ acceptedBy: userId, acceptedAt: new Date() })
          .where(
            and(
              eq(organizationInvitationsTable.id, invitation.id),
              isNull(organizationInvitationsTable.acceptedAt),
              isNull(organizationInvitationsTable.revokedAt),
            ),
          )
          .returning();
        if (!claimed) {
          const [current] = await tx
            .select()
            .from(organizationInvitationsTable)
            .where(eq(organizationInvitationsTable.id, invitation.id))
            .limit(1);
          return current?.acceptedBy === userId ? current : null;
        }

        await tx
          .insert(organizationMembershipsTable)
          .values({
            organizationId: claimed.organizationId,
            userId,
            role: claimed.role,
          })
          .onConflictDoNothing();
        return claimed;
      });
      if (!accepted) {
        res.status(404).json({ error: "Undangan sudah digunakan" });
        return;
      }
    }

    const [organization] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, invitation.organizationId))
      .limit(1);
    res.json(
      AcceptOrganizationInvitationResponse.parse({
        organizationId: invitation.organizationId,
        organizationName: organization.name,
        role: invitation.role,
      }),
    );
  },
);

router.delete(
  "/organization-invitations/:invitationId",
  requireOrganization,
  requireRole("owner"),
  async (req, res): Promise<void> => {
    const params = RevokeOrganizationInvitationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Undangan tidak valid" });
      return;
    }

    const organizationId = req.organizationContext!.organizationId;
    const [invitation] = await db
      .select()
      .from(organizationInvitationsTable)
      .where(
        and(
          eq(organizationInvitationsTable.id, params.data.invitationId),
          eq(organizationInvitationsTable.organizationId, organizationId),
          isNull(organizationInvitationsTable.acceptedAt),
          isNull(organizationInvitationsTable.revokedAt),
        ),
      )
      .limit(1);
    if (!invitation) {
      res.status(404).json({ error: "Undangan aktif tidak ditemukan" });
      return;
    }

    if (invitation.clerkInvitationId) {
      await clerkClient.invitations.revokeInvitation(invitation.clerkInvitationId);
    }
    await db
      .update(organizationInvitationsTable)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(organizationInvitationsTable.id, invitation.id),
          isNull(organizationInvitationsTable.acceptedAt),
          isNull(organizationInvitationsTable.revokedAt),
        ),
      );

    res.sendStatus(204);
  },
);

router.patch(
  "/organization-members/:userId",
  requireOrganization,
  requireRole("owner"),
  async (req, res): Promise<void> => {
    const params = UpdateOrganizationMemberRoleParams.safeParse(req.params);
    const body = UpdateOrganizationMemberRoleBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Data perubahan peran tidak valid" });
      return;
    }

    const organizationId = req.organizationContext!.organizationId;
    const [membership] = await db
      .select()
      .from(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.organizationId, organizationId),
          eq(organizationMembershipsTable.userId, params.data.userId),
        ),
      )
      .limit(1);
    if (!membership) {
      res.status(404).json({ error: "Anggota tidak ditemukan" });
      return;
    }
    const roleDecision = decideMemberRoleChange(membership.role);
    if (!roleDecision.allowed) {
      res.status(roleDecision.status).json({ error: roleDecision.error });
      return;
    }

    const [updated] = await db
      .update(organizationMembershipsTable)
      .set({ role: body.data.role })
      .where(
        and(
          eq(organizationMembershipsTable.organizationId, organizationId),
          eq(organizationMembershipsTable.userId, params.data.userId),
        ),
      )
      .returning();
    const user = await clerkClient.users.getUser(updated.userId);
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      `${updated.userId}@unknown.invalid`;
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "Anggota";
    res.json(
      UpdateOrganizationMemberRoleResponse.parse({
        userId: updated.userId,
        email,
        name,
        role: updated.role,
        joinedAt: updated.createdAt,
      }),
    );
  },
);

router.delete(
  "/organization-members/:userId",
  requireOrganization,
  requireRole("owner"),
  async (req, res): Promise<void> => {
    const params = RemoveOrganizationMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Anggota tidak valid" });
      return;
    }

    const organizationId = req.organizationContext!.organizationId;
    const requestingUserId = req.organizationContext!.userId;
    if (params.data.userId === requestingUserId) {
      res.status(403).json({ error: "Pemilik tidak dapat menghapus dirinya sendiri" });
      return;
    }

    const [membership] = await db
      .select()
      .from(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.organizationId, organizationId),
          eq(organizationMembershipsTable.userId, params.data.userId),
        ),
      )
      .limit(1);
    if (!membership) {
      res.status(404).json({ error: "Anggota tidak ditemukan" });
      return;
    }
    if (membership.role === "owner") {
      res.status(403).json({ error: "Pemilik ruang kerja tidak dapat dihapus" });
      return;
    }

    await db
      .delete(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.organizationId, organizationId),
          eq(organizationMembershipsTable.userId, params.data.userId),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;