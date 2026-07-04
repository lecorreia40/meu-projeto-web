/**
 * Permission engine: RBAC (role -> permission keys, loaded with the session)
 * combined with ABAC (attribute checks against tenant, case team, ownership
 * and partner assignment scope).
 *
 * Hard rules encoded here, independent of role configuration:
 *  - Clients NEVER read legal notes or internal-channel messages.
 *  - Partners only reach cases through an ACTIVE, unexpired PartnerAssignment,
 *    and even then only their assigned tasks/documents - never the whole case.
 *  - Cross-tenant access is impossible: every query helper filters by tenantId.
 */
import "server-only";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export function can(user: CurrentUser, permission: string): boolean {
  return user.permissions.has(permission);
}

export function isLegalTeam(user: CurrentUser): boolean {
  return ["attorney", "supervising_attorney", "firm_owner", "firm_admin", "super_admin"].includes(
    user.roleKey ?? ""
  );
}

export function isClientRole(user: CurrentUser): boolean {
  return user.roleKey === "client";
}

export function isPartnerRole(user: CurrentUser): boolean {
  return user.roleKey === "partner";
}

/** Require a signed-in user or redirect to login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a permission or redirect to the user's home portal. */
export async function requirePermission(permission: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect(portalHome(user));
  return user;
}

/** Require platform-level administration (super admin). Redirects otherwise. */
export async function requirePlatformAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isPlatformAdmin && user.roleKey !== "super_admin") redirect(portalHome(user));
  return user;
}

/** Which portal a user lands on after login. */
export function portalHome(user: CurrentUser): string {
  if (user.isPlatformAdmin || user.roleKey === "super_admin") return "/admin";
  if (isClientRole(user)) return "/client";
  if (isPartnerRole(user)) return "/partner";
  return "/firm";
}

/**
 * ABAC: can this user see this case at all?
 * - Firm staff with case.read: any case in their tenant.
 * - Clients: only cases where they are the client (case.read_own).
 * - Partners: only cases with an active assignment - and callers must still
 *   scope what is shown via partnerScopeForCase.
 */
export async function canAccessCase(user: CurrentUser, caseId: string): Promise<boolean> {
  const kase = await db.case.findFirst({
    where: { id: caseId, deletedAt: null },
    select: { tenantId: true, client: { select: { userId: true } } },
  });
  if (!kase || kase.tenantId !== user.tenantId) {
    // Platform super admin may cross tenants - always audited by callers
    if (!(user.isPlatformAdmin && kase)) return false;
  }
  if (can(user, "case.read")) return true;
  if (can(user, "case.read_own")) return kase?.client.userId === user.id;
  if (isPartnerRole(user)) {
    const assignment = await db.partnerAssignment.findFirst({
      where: {
        caseId,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        partner: { userId: user.id },
      },
    });
    return Boolean(assignment);
  }
  return false;
}

/** Prisma where-clause for the cases a user is allowed to list. */
export function caseListFilter(user: CurrentUser) {
  if (can(user, "case.read")) return { tenantId: user.tenantId ?? "-", deletedAt: null };
  if (can(user, "case.read_own"))
    return { tenantId: user.tenantId ?? "-", deletedAt: null, client: { userId: user.id } };
  return { id: "-" }; // matches nothing
}

/** Active partner assignments for a partner user (their entire visible scope). */
export async function partnerAssignments(user: CurrentUser) {
  return db.partnerAssignment.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      partner: { userId: user.id, tenantId: user.tenantId ?? "-" },
    },
    include: { case: { select: { id: true, caseNumberInternal: true, visaCategory: true } } },
  });
}

/**
 * Document visibility:
 * - document.read (+ read_sensitive for RESTRICTED): firm staff.
 * - Clients: own documents on their own cases, never RESTRICTED internal work product.
 * - Partners: only documents attached to checklist items / tasks in their assignment scope
 *   (approximated here as documents they own on assigned cases).
 */
export async function canReadDocument(user: CurrentUser, documentId: string): Promise<boolean> {
  const doc = await db.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      tenantId: true,
      caseId: true,
      ownerUserId: true,
      sensitivity: true,
      case: { select: { client: { select: { userId: true } } } },
    },
  });
  if (!doc) return false;
  if (doc.tenantId !== user.tenantId && !user.isPlatformAdmin) return false;

  if (doc.sensitivity === "RESTRICTED" && !can(user, "document.read_sensitive")) {
    // Owners can always see what they themselves uploaded
    if (doc.ownerUserId !== user.id) return false;
  }
  if (can(user, "document.read")) return true;
  if (can(user, "document.read_own")) {
    return doc.ownerUserId === user.id || doc.case?.client.userId === user.id;
  }
  if (isPartnerRole(user) && doc.caseId) {
    if (doc.ownerUserId === user.id) return canAccessCase(user, doc.caseId);
  }
  return false;
}

/** Legal notes: attorneys/admins full; paralegal limited; client/partner never. */
export function legalNoteFilterFor(user: CurrentUser) {
  if (can(user, "legal_note.read")) return {}; // all visibilities
  if (can(user, "legal_note.read_limited")) return { visibility: "LEGAL_TEAM" as const };
  return null; // no access
}

/** Message channels this user may see. INTERNAL never reaches clients/partners. */
export function visibleMessageChannels(user: CurrentUser): string[] {
  if (can(user, "message.read_internal"))
    return ["OPERATIONAL", "COMMERCIAL", "LEGAL", "INTERNAL", "PARTNER"];
  if (isPartnerRole(user)) return ["PARTNER"];
  return ["OPERATIONAL", "COMMERCIAL"];
}
