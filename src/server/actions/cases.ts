"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requirePermission, canAccessCase, requireUser, can } from "@/lib/permissions";
import type { CaseStatus } from "@prisma/client";

const createCaseSchema = z.object({
  clientId: z.string().min(1),
  visaCategoryId: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
});

export async function createCaseAction(formData: FormData) {
  const user = await requirePermission("case.create");
  const parsed = createCaseSchema.parse({
    clientId: formData.get("clientId"),
    visaCategoryId: formData.get("visaCategoryId"),
    priority: formData.get("priority") ?? "NORMAL",
  });

  // Client must belong to the same tenant (ABAC)
  const client = await db.client.findFirst({
    where: { id: parsed.clientId, tenantId: user.tenantId ?? "-", deletedAt: null },
  });
  if (!client) throw new Error("Client not found in this workspace");

  const count = await db.case.count({ where: { tenantId: user.tenantId! } });
  const caseNumber = `CASE-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const kase = await db.case.create({
    data: {
      tenantId: user.tenantId!,
      clientId: client.id,
      visaCategoryId: parsed.visaCategoryId,
      caseNumberInternal: caseNumber,
      priority: parsed.priority,
      applicants: { create: [{ fullName: client.fullName, kind: "PRINCIPAL" }] },
      events: {
        create: [{ actorId: user.id, kind: "STATUS_CHANGE", title: "Case opened", detail: "Intake started" }],
      },
    },
  });

  // Checklist engine: instantiate items from the visa category's requirements
  const requirements = await db.documentRequirement.findMany({
    where: { visaCategoryId: parsed.visaCategoryId },
    orderBy: { sortOrder: "asc" },
  });
  if (requirements.length > 0) {
    await db.checklist.create({
      data: {
        tenantId: user.tenantId!,
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

  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "case.create",
    entity: "Case",
    entityId: kase.id,
    metadata: { caseNumber },
  });

  revalidatePath("/firm/cases");
  redirect(`/firm/cases/${kase.id}`);
}

const VALID_STATUSES = [
  "INTAKE_STARTED", "INTAKE_COMPLETE", "INITIAL_REVIEW", "PROPOSAL_SENT", "ENGAGEMENT_SIGNED",
  "DOCUMENT_COLLECTION", "EVIDENCE_REVIEW", "DRAFTING", "ATTORNEY_REVIEW", "CLIENT_REVIEW",
  "FILING_READY", "FILED", "RECEIPT_RECEIVED", "BIOMETRICS_INTERVIEW", "RFE_NOID",
  "APPROVED", "DENIED", "CLOSED", "POST_APPROVAL_MONITORING",
] as const;

// Statuses that require an attorney approval gate before entry
const GATED_STATUSES: Partial<Record<CaseStatus, string>> = {
  FILING_READY: "FILING_READY",
  FILED: "FILING_READY",
};

export async function changeCaseStatusAction(formData: FormData) {
  const user = await requirePermission("case.change_status");
  const caseId = String(formData.get("caseId"));
  const status = z.enum(VALID_STATUSES).parse(formData.get("status"));

  if (!(await canAccessCase(user, caseId))) throw new Error("Forbidden");

  // Approval gate: FILING_READY / FILED require an approved attorney review
  const gate = GATED_STATUSES[status];
  if (gate) {
    const approval = await db.attorneyReview.findFirst({
      where: { caseId, gate: "FILING_READY", decision: "APPROVED" },
    });
    if (!approval && !can(user, "attorney_review.approve")) {
      throw new Error("This transition requires attorney approval (filing-ready gate).");
    }
    if (!approval && can(user, "attorney_review.approve")) {
      // The attorney moving the case IS the approval - record it
      await db.attorneyReview.create({
        data: {
          tenantId: user.tenantId!,
          caseId,
          reviewerId: user.id,
          gate: "FILING_READY",
          decision: "APPROVED",
          comment: `Approved by ${user.name} during status change`,
        },
      });
    }
  }

  const updated = await db.case.update({
    where: { id: caseId },
    data: {
      status,
      ...(status === "FILED" ? { filedAt: new Date() } : {}),
      ...(status === "APPROVED" || status === "DENIED" ? { decisionAt: new Date() } : {}),
      ...(status === "CLOSED" ? { closedAt: new Date() } : {}),
      events: {
        create: [{
          actorId: user.id,
          kind: "STATUS_CHANGE",
          title: `Status changed to ${status.toLowerCase().replace(/_/g, " ")}`,
        }],
      },
    },
  });

  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "case.change_status",
    entity: "Case",
    entityId: updated.id,
    metadata: { status },
  });

  revalidatePath(`/firm/cases/${caseId}`);
}

export async function addLegalNoteAction(formData: FormData) {
  const user = await requirePermission("legal_note.create");
  const caseId = String(formData.get("caseId"));
  const body = z.string().min(1).parse(formData.get("body"));
  const visibility = formData.get("visibility") === "ATTORNEY_ONLY" ? "ATTORNEY_ONLY" : "LEGAL_TEAM";

  if (!(await canAccessCase(user, caseId))) throw new Error("Forbidden");

  await db.legalNote.create({
    data: { tenantId: user.tenantId!, caseId, authorId: user.id, body, visibility },
  });
  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "legal_note.create",
    entity: "LegalNote",
    metadata: { caseId, visibility },
  });
  revalidatePath(`/firm/cases/${caseId}`);
}

export async function recordAttorneyReviewAction(formData: FormData) {
  const user = await requirePermission("attorney_review.approve");
  const caseId = String(formData.get("caseId"));
  const gate = z
    .enum(["INTAKE_COMPLETE", "LEGAL_STRATEGY", "DOCUMENT_COMPLETE", "PETITION_DRAFT", "FILING_READY", "RFE_RESPONSE", "POST_FILING"])
    .parse(formData.get("gate"));
  const decision = z.enum(["APPROVED", "REJECTED", "NEEDS_CHANGES"]).parse(formData.get("decision"));
  const comment = (formData.get("comment") as string) || null;

  if (!(await canAccessCase(user, caseId))) throw new Error("Forbidden");

  await db.attorneyReview.create({
    data: { tenantId: user.tenantId!, caseId, reviewerId: user.id, gate, decision, comment },
  });
  await db.caseEvent.create({
    data: {
      caseId,
      actorId: user.id,
      kind: "REVIEW_DECISION",
      title: `Attorney review: ${gate.toLowerCase().replace(/_/g, " ")} - ${decision.toLowerCase()}`,
      clientVisible: false,
    },
  });
  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "attorney_review.record",
    entity: "AttorneyReview",
    metadata: { caseId, gate, decision },
  });
  revalidatePath(`/firm/cases/${caseId}`);
}

/** Read a case with full workspace data, permission-scoped. Audited. */
export async function getCaseWorkspace(caseId: string) {
  const user = await requireUser();
  if (!(await canAccessCase(user, caseId))) return null;

  const kase = await db.case.findFirst({
    where: { id: caseId, deletedAt: null },
    include: {
      client: true,
      visaCategory: true,
      company: true,
      attorney: { select: { id: true, name: true } },
      paralegal: { select: { id: true, name: true } },
      applicants: true,
      checklists: { include: { items: { orderBy: { sortOrder: "asc" }, include: { document: true } } } },
      documents: { where: { deletedAt: null }, include: { documentType: true, owner: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      tasks: { include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      threads: { include: { messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } } } },
      events: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      riskFlags: { where: { resolvedAt: null } },
      attorneyReviews: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { name: true } } } },
      invoices: { include: { payments: true } },
      complianceEvents: { orderBy: { dueAt: "asc" } },
    },
  });
  return { user, kase };
}
