"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyCredentials, createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { portalHome } from "@/lib/permissions";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid" };

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) return { error: "invalid" };

  const membership = user.memberships[0] ?? null;
  await createSession({
    userId: user.id,
    tenantId: membership?.tenantId ?? null,
    roleKey: membership?.role.key ?? null,
  });
  await writeAudit({
    tenantId: membership?.tenantId,
    actorId: user.id,
    action: "auth.login",
    entity: "User",
    entityId: user.id,
  });

  const current = await getCurrentUser();
  redirect(current ? portalHome(current) : "/login");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await writeAudit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.logout",
      entity: "User",
      entityId: user.id,
    });
  }
  await destroySession();
  redirect("/login");
}
