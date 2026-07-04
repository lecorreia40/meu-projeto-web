"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  source: z.enum(["ORGANIC", "ADS", "REFERRAL", "PARTNER", "LANDING_PAGE", "WHATSAPP", "EVENT", "OTHER"]).default("OTHER"),
  interest: z.string().optional(),
});

export async function createLeadAction(formData: FormData) {
  const user = await requirePermission("lead.manage");
  const parsed = leadSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    source: formData.get("source") ?? "OTHER",
    interest: (formData.get("interest") as string) || undefined,
  });

  const lead = await db.lead.create({
    data: {
      tenantId: user.tenantId!,
      name: parsed.name,
      email: parsed.email || null,
      source: parsed.source,
      interest: parsed.interest,
    },
  });
  await writeAudit({ tenantId: user.tenantId, actorId: user.id, action: "lead.create", entity: "Lead", entityId: lead.id });
  revalidatePath("/firm/leads");
}

const STAGES = ["NEW", "SCREENING", "CONSULT_SCHEDULED", "CONSULT_DONE", "PROPOSAL_SENT", "ENGAGED", "ACTIVE_CASE", "LOST"] as const;

export async function moveLeadStageAction(formData: FormData) {
  const user = await requirePermission("lead.manage");
  const leadId = String(formData.get("leadId"));
  const stage = z.enum(STAGES).parse(formData.get("stage"));

  await db.lead.update({
    where: { id: leadId, tenantId: user.tenantId! },
    data: { stage },
  });
  await writeAudit({ tenantId: user.tenantId, actorId: user.id, action: "lead.move_stage", entity: "Lead", entityId: leadId, metadata: { stage } });
  revalidatePath("/firm/leads");
}
