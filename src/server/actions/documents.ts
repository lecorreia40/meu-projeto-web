"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { storeFile } from "@/lib/storage";
import { requireUser, requirePermission, canAccessCase, can } from "@/lib/permissions";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

export async function uploadDocumentAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "document.upload")) throw new Error("Forbidden");

  const caseId = String(formData.get("caseId"));
  const checklistItemId = (formData.get("checklistItemId") as string) || null;
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 20MB)");
  if (!ALLOWED_MIME.has(file.type)) throw new Error("File type not allowed");

  if (!(await canAccessCase(user, caseId))) throw new Error("Forbidden");

  const kase = await db.case.findFirstOrThrow({
    where: { id: caseId },
    select: { tenantId: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeFile(buffer, file.name);

  // If replacing a document on the same checklist item, bump the version chain
  const previous = checklistItemId
    ? (await db.checklistItem.findUnique({ where: { id: checklistItemId }, select: { documentId: true } }))?.documentId ?? null
    : null;
  const prevDoc = previous ? await db.document.findUnique({ where: { id: previous } }) : null;

  const requirement = checklistItemId
    ? await db.checklistItem.findUnique({
        where: { id: checklistItemId },
        include: { requirement: true },
      })
    : null;

  const document = await db.document.create({
    data: {
      tenantId: kase.tenantId,
      caseId,
      ownerUserId: user.id,
      documentTypeId: requirement?.requirement?.documentTypeId,
      filename: file.name,
      fileUrl: stored.key,
      fileHash: stored.hash,
      mimeType: file.type,
      size: stored.size,
      sensitivity: requirement?.requirement?.sensitivity ?? "CONFIDENTIAL",
      version: (prevDoc?.version ?? 0) + 1,
      previousVersionId: previous,
    },
  });

  if (checklistItemId) {
    await db.checklistItem.update({
      where: { id: checklistItemId },
      data: { documentId: document.id, status: "UPLOADED" },
    });
  }

  await db.caseEvent.create({
    data: { caseId, actorId: user.id, kind: "DOCUMENT_UPLOADED", title: `Document uploaded: ${file.name}` },
  });
  await writeAudit({
    tenantId: kase.tenantId,
    actorId: user.id,
    action: "document.upload",
    entity: "Document",
    entityId: document.id,
    metadata: { caseId, filename: file.name, size: stored.size },
  });

  revalidatePath(`/firm/cases/${caseId}`);
  revalidatePath("/client");
  revalidatePath("/partner");
}

export async function reviewDocumentAction(formData: FormData) {
  const user = await requirePermission("document.approve");
  const documentId = String(formData.get("documentId"));
  const decision = z.enum(["APPROVED", "REJECTED", "NEEDS_CHANGES"]).parse(formData.get("decision"));
  const comment = (formData.get("comment") as string) || null;

  const document = await db.document.findFirst({
    where: { id: documentId, tenantId: user.tenantId ?? "-", deletedAt: null },
  });
  if (!document) throw new Error("Document not found");
  if (document.lockedAt) throw new Error("Document is locked after filing");

  await db.$transaction([
    db.documentReview.create({
      data: { documentId, reviewerId: user.id, decision, comment },
    }),
    db.document.update({
      where: { id: documentId },
      data: {
        status: decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "IN_REVIEW",
        rejectionReason: decision === "REJECTED" ? comment : null,
        reviews: undefined,
      },
    }),
    db.checklistItem.updateMany({
      where: { documentId },
      data: { status: decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "IN_REVIEW" },
    }),
  ]);

  if (document.caseId) {
    await db.caseEvent.create({
      data: {
        caseId: document.caseId,
        actorId: user.id,
        kind: "DOCUMENT_REVIEWED",
        title: `Document ${decision.toLowerCase().replace("_", " ")}: ${document.filename}`,
      },
    });
  }
  await writeAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "document.review",
    entity: "Document",
    entityId: documentId,
    metadata: { decision },
  });

  if (document.caseId) revalidatePath(`/firm/cases/${document.caseId}`);
  revalidatePath("/firm/documents");
}
