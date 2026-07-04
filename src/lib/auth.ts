/**
 * Session auth: signed JWT cookie (jose), bcrypt credentials.
 * MFA-ready: User.mfaSecret/mfaEnabled exist in the schema; the login flow
 * can add a TOTP step without changing session shape.
 */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const SESSION_COOKIE = "visaops_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h - short-lived sessions for a legal platform

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  tenantId: string | null;
  roleKey: string | null;
};

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      userId: payload.userId as string,
      tenantId: (payload.tenantId as string) ?? null,
      roleKey: (payload.roleKey as string) ?? null,
    };
  } catch {
    return null;
  }
});

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  locale: string;
  isPlatformAdmin: boolean;
  tenantId: string | null;
  tenantName: string | null;
  roleKey: string | null;
  roleName: string | null;
  permissions: Set<string>;
};

/** Load the authenticated user with role + permission set for the active tenant. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findFirst({
    where: { id: session.userId, deletedAt: null },
    include: {
      memberships: {
        where: { isActive: true },
        include: {
          tenant: true,
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  const membership =
    user.memberships.find((m) => m.tenantId === session.tenantId) ?? user.memberships[0] ?? null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    locale: user.locale,
    isPlatformAdmin: user.isPlatformAdmin,
    tenantId: membership?.tenantId ?? null,
    tenantName: membership?.tenant.name ?? null,
    roleKey: membership?.role.key ?? null,
    roleName: membership?.role.name ?? null,
    permissions: new Set(membership?.role.permissions.map((rp) => rp.permission.key) ?? []),
  };
});

export async function verifyCredentials(email: string, password: string) {
  const user = await db.user.findFirst({
    where: { email: email.toLowerCase().trim(), deletedAt: null },
    include: { memberships: { where: { isActive: true }, include: { role: true } } },
  });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await writeAudit({ action: "auth.login_failed", entity: "User", entityId: user.id });
    return null;
  }
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
