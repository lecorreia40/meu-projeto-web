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

// ---------------------------------------------------------------------------
// Plans & pricing (platform admin)
// ---------------------------------------------------------------------------

const INTERVALS = ["MONTHLY", "ANNUAL", "PER_USER", "CUSTOM"] as const;

const planSchema = z.object({
  key: z.string().min(2).max(30).regex(/^[A-Z0-9_]+$/, "Use UPPER_SNAKE keys"),
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default("USD"),
  interval: z.enum(INTERVALS).default("MONTHLY"),
  seats: z.coerce.number().int().min(0).optional(),
  activeCasesLimit: z.coerce.number().int().min(0).optional(),
  features: z.string().optional(), // newline-separated
});

function parseFeatures(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createPlanAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const parsed = planSchema.parse({
    key: String(formData.get("key") ?? "").toUpperCase(),
    name: formData.get("name"),
    description: (formData.get("description") as string) || undefined,
    priceMonthly: formData.get("priceMonthly"),
    currency: (formData.get("currency") as string) || "USD",
    interval: (formData.get("interval") as string) || "MONTHLY",
    seats: (formData.get("seats") as string) || undefined,
    activeCasesLimit: (formData.get("activeCasesLimit") as string) || undefined,
    features: (formData.get("features") as string) || undefined,
  });

  const existing = await db.plan.findUnique({ where: { key: parsed.key } });
  if (existing) throw new Error("A plan with this key already exists");

  const count = await db.plan.count();
  const plan = await db.plan.create({
    data: {
      key: parsed.key,
      name: parsed.name,
      description: parsed.description,
      priceMonthly: parsed.priceMonthly,
      currency: parsed.currency.toUpperCase(),
      interval: parsed.interval,
      seats: parsed.seats,
      activeCasesLimit: parsed.activeCasesLimit,
      features: parseFeatures(parsed.features),
      sortOrder: count,
    },
  });
  await writeAudit({
    actorId: admin.id,
    action: "plan.create",
    entity: "Plan",
    entityId: plan.id,
    metadata: { key: plan.key, price: Number(plan.priceMonthly) },
  });
  revalidatePath("/admin/plans");
}

export async function updatePlanAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const parsed = planSchema.omit({ key: true }).parse({
    name: formData.get("name"),
    description: (formData.get("description") as string) || undefined,
    priceMonthly: formData.get("priceMonthly"),
    currency: (formData.get("currency") as string) || "USD",
    interval: (formData.get("interval") as string) || "MONTHLY",
    seats: (formData.get("seats") as string) || undefined,
    activeCasesLimit: (formData.get("activeCasesLimit") as string) || undefined,
    features: (formData.get("features") as string) || undefined,
  });

  await db.plan.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description ?? null,
      priceMonthly: parsed.priceMonthly,
      currency: parsed.currency.toUpperCase(),
      interval: parsed.interval,
      seats: parsed.seats ?? null,
      activeCasesLimit: parsed.activeCasesLimit ?? null,
      features: parseFeatures(parsed.features),
    },
  });
  await writeAudit({ actorId: admin.id, action: "plan.update", entity: "Plan", entityId: id });
  revalidatePath("/admin/plans");
}

export async function togglePlanAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";

  await db.plan.update({ where: { id }, data: { isActive } });
  await writeAudit({
    actorId: admin.id,
    action: isActive ? "plan.activate" : "plan.deactivate",
    entity: "Plan",
    entityId: id,
  });
  revalidatePath("/admin/plans");
}

const TENANT_PLANS = ["STARTER", "FIRM", "GROWTH", "ENTERPRISE", "WHITE_LABEL"] as const;

/** Assign a plan tier to a tenant (updates Tenant.plan; enum keyed by Plan.key). */
export async function assignTenantPlanAction(formData: FormData) {
  const admin = await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId"));
  const plan = z.enum(TENANT_PLANS).parse(formData.get("plan"));

  await db.tenant.update({ where: { id: tenantId }, data: { plan } });
  await writeAudit({
    tenantId,
    actorId: admin.id,
    action: "tenant.assign_plan",
    entity: "Tenant",
    entityId: tenantId,
    metadata: { plan },
  });
  revalidatePath("/admin/plans");
  revalidatePath("/admin/tenants");
}
