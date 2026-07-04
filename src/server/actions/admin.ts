"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";

// ---------------------------------------------------------------------------
// User management (platform admin)
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  tenantId: z.string().min(1),
  roleId: z.string().min(1),
  password: z.string().min(8),
});

export async function createUserAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const parsed = createUserSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    tenantId: formData.get("tenantId"),
    roleId: formData.get("roleId"),
    password: formData.get("password"),
  });

  const existing = await db.user.findUnique({ where: { email: parsed.email.toLowerCase().trim() } });
  if (existing) throw new Error("A user with this email already exists");

  const tenant = await db.tenant.findUnique({ where: { id: parsed.tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const user = await db.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase().trim(),
      passwordHash: await hashPassword(parsed.password),
      memberships: { create: { tenantId: parsed.tenantId, roleId: parsed.roleId } },
    },
  });

  await writeAudit({
    tenantId: parsed.tenantId,
    actorId: admin.id,
    action: "user.create",
    entity: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });
  revalidatePath("/admin/users");
}

export async function setUserActiveAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const userId = String(formData.get("userId"));
  const active = formData.get("active") === "true";

  if (userId === admin.id) throw new Error("You cannot deactivate your own account");

  await db.user.update({
    where: { id: userId },
    data: { deletedAt: active ? null : new Date() },
  });
  await writeAudit({
    actorId: admin.id,
    action: active ? "user.activate" : "user.deactivate",
    entity: "User",
    entityId: userId,
  });
  revalidatePath("/admin/users");
}

export async function changeUserRoleAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const membershipId = String(formData.get("membershipId"));
  const roleId = String(formData.get("roleId"));

  const membership = await db.membership.update({
    where: { id: membershipId },
    data: { roleId },
    include: { role: true },
  });
  await writeAudit({
    tenantId: membership.tenantId,
    actorId: admin.id,
    action: "user.change_role",
    entity: "Membership",
    entityId: membershipId,
    metadata: { role: membership.role.key },
  });
  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Visa category catalog management (platform admin)
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  key: z.string().min(2).max(20),
  name: z.string().min(2),
  description: z.string().optional(),
  audience: z.string().optional(),
});

export async function createVisaCategoryAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const parsed = categorySchema.parse({
    key: formData.get("key"),
    name: formData.get("name"),
    description: (formData.get("description") as string) || undefined,
    audience: (formData.get("audience") as string) || undefined,
  });

  const existing = await db.visaCategory.findUnique({ where: { key: parsed.key } });
  if (existing) throw new Error("A visa category with this key already exists");

  const category = await db.visaCategory.create({ data: parsed });
  await writeAudit({
    actorId: admin.id,
    action: "visa_category.create",
    entity: "VisaCategory",
    entityId: category.id,
    metadata: { key: category.key },
  });
  revalidatePath("/admin/visa-categories");
}

export async function updateVisaCategoryAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const name = z.string().min(2).parse(formData.get("name"));
  const description = (formData.get("description") as string) || null;
  const audience = (formData.get("audience") as string) || null;

  await db.visaCategory.update({ where: { id }, data: { name, description, audience } });
  await writeAudit({ actorId: admin.id, action: "visa_category.update", entity: "VisaCategory", entityId: id });
  revalidatePath("/admin/visa-categories");
}

export async function toggleVisaCategoryAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  await db.visaCategory.update({ where: { id }, data: { isActive } });
  await writeAudit({
    actorId: admin.id,
    action: isActive ? "visa_category.activate" : "visa_category.deactivate",
    entity: "VisaCategory",
    entityId: id,
  });
  revalidatePath("/admin/visa-categories");
}
