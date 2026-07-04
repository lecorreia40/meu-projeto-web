"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const SELF_SERVE_SLUG = "visaops-direct";

const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  visaCategoryId: z.string().min(1),
});

export type SelfServeState = { error?: "invalid" | "email_taken" | "unavailable" };

/**
 * Direct self-serve engagement: an applicant creates their own account and
 * starts a Document Readiness case in the shared self-serve workspace. No
 * attorney is assigned, so this is organization and readiness only, never
 * legal advice. Attorney-gated actions remain unavailable until a firm engages.
 */
export async function selfServeSignupAction(
  _prev: SelfServeState,
  formData: FormData
): Promise<SelfServeState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    visaCategoryId: formData.get("visaCategoryId"),
  });
  if (!parsed.success) return { error: "invalid" };
  const { name, email, password, visaCategoryId } = parsed.data;

  const tenant = await db.tenant.findUnique({ where: { slug: SELF_SERVE_SLUG } });
  const clientRole = await db.role.findUnique({ where: { key: "client" } });
  if (!tenant || !clientRole) return { error: "unavailable" };

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: "email_taken" };

  const category = await db.visaCategory.findFirst({ where: { id: visaCategoryId, isActive: true } });
  if (!category) return { error: "invalid" };

  const org = await db.organization.findFirst({ where: { tenantId: tenant.id } });

  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      memberships: { create: { tenantId: tenant.id, organizationId: org?.id, roleId: clientRole.id } },
    },
  });

  const client = await db.client.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      fullName: name,
      email: normalizedEmail,
      profile: { create: { data: {} } },
    },
  });

  const count = await db.case.count({ where: { tenantId: tenant.id } });
  const caseNumber = `SS-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const kase = await db.case.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      visaCategoryId: category.id,
      caseNumberInternal: caseNumber,
      status: "INTAKE_STARTED",
      nextAction: "Complete your profile and start uploading documents",
      applicants: { create: [{ fullName: name, kind: "PRINCIPAL" }] },
      events: {
        create: [{ actorId: user.id, kind: "STATUS_CHANGE", title: "Self-serve case started", detail: category.key }],
      },
    },
  });

  // Instantiate the document checklist from the visa category requirements
  const requirements = await db.documentRequirement.findMany({
    where: { visaCategoryId: category.id },
    orderBy: { sortOrder: "asc" },
  });
  if (requirements.length > 0) {
    await db.checklist.create({
      data: {
        tenantId: tenant.id,
        caseId: kase.id,
        name: "Document checklist",
        items: {
          create: requirements.map((r) => ({
            requirementId: r.id,
            label: r.label,
            necessity: r.necessity,
            ownerRole: r.ownerRole,
            sortOrder: r.sortOrder,
          })),
        },
      },
    });
  }

  await createSession({ userId: user.id, tenantId: tenant.id, roleKey: "client" });
  await writeAudit({
    tenantId: tenant.id,
    actorId: user.id,
    action: "self_serve.signup",
    entity: "Case",
    entityId: kase.id,
    metadata: { visaKey: category.key },
  });

  redirect("/client");
}
