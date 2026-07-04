"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requireUser, canAccessCase, can } from "@/lib/permissions";
import { validateVisaForm, visaFormCompleteness } from "@/lib/visa-forms";

export type SaveVisaFormResult = {
  ok: boolean;
  errors?: Record<string, string>;
  completeness?: number;
};

/**
 * Save a case's per-visa form. Values that are present are validated for
 * format/range; on any error the save is rejected with per-field codes. Saving
 * partial progress is allowed (empty required fields do not block a save), but
 * the completeness score reflects how much is filled.
 */
export async function saveVisaFormAction(
  caseId: string,
  values: Record<string, unknown>
): Promise<SaveVisaFormResult> {
  const user = await requireUser();
  if (!can(user, "case.update") && !can(user, "document.upload")) {
    return { ok: false, errors: { _: "forbidden" } };
  }
  if (!(await canAccessCase(user, caseId))) return { ok: false, errors: { _: "forbidden" } };

  const kase = await db.case.findFirst({
    where: { id: caseId, deletedAt: null },
    select: { tenantId: true, visaCategory: { select: { key: true } } },
  });
  if (!kase) return { ok: false, errors: { _: "not_found" } };

  const visaKey = kase.visaCategory.key;

  // Validate only fields that carry a value (allow saving progress)
  const nonEmpty: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") nonEmpty[k] = v;
  }
  const allErrors = validateVisaForm(visaKey, values);
  // Keep only errors on fields the user actually filled (format errors), drop
  // "required" for empty fields so progress can be saved.
  const errors: Record<string, string> = {};
  for (const [k, code] of Object.entries(allErrors)) {
    if (code !== "required") errors[k] = code;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const completeness = visaFormCompleteness(visaKey, values);

  await db.case.update({
    where: { id: caseId },
    data: { formData: values as never },
  });
  await db.caseEvent.create({
    data: {
      caseId,
      actorId: user.id,
      kind: "OTHER",
      title: `Visa form updated (${Math.round(completeness * 100)}% complete)`,
      clientVisible: false,
    },
  });
  await writeAudit({
    tenantId: kase.tenantId,
    actorId: user.id,
    action: "case.form_update",
    entity: "Case",
    entityId: caseId,
    metadata: { visaKey, completeness },
  });

  revalidatePath(`/firm/cases/${caseId}/form`);
  revalidatePath(`/firm/cases/${caseId}`);
  return { ok: true, completeness };
}
