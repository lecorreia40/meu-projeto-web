"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requireUser, requirePermission, canAccessCase, can, isPartnerRole } from "@/lib/permissions";

const taskSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().min(2),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
});

export async function createTaskAction(formData: FormData) {
  const user = await requirePermission("task.manage");
  const parsed = taskSchema.parse({
    caseId: formData.get("caseId"),
    title: formData.get("title"),
    assigneeId: (formData.get("assigneeId") as string) || undefined,
    dueAt: (formData.get("dueAt") as string) || undefined,
    priority: formData.get("priority") ?? "NORMAL",
  });
  if (!(await canAccessCase(user, parsed.caseId))) throw new Error("Forbidden");

  const task = await db.task.create({
    data: {
      tenantId: user.tenantId!,
      caseId: parsed.caseId,
      title: parsed.title,
      assigneeId: parsed.assigneeId,
      creatorId: user.id,
      priority: parsed.priority,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : undefined,
    },
  });
  await db.caseEvent.create({
    data: { caseId: parsed.caseId, actorId: user.id, kind: "TASK_CREATED", title: `Task created: ${parsed.title}` },
  });
  await writeAudit({ tenantId: user.tenantId, actorId: user.id, action: "task.create", entity: "Task", entityId: task.id });
  revalidatePath(`/firm/cases/${parsed.caseId}`);
  revalidatePath("/firm/tasks");
}

export async function completeTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId"));

  const task = await db.task.findFirst({
    where: { id: taskId, tenantId: user.tenantId ?? "-" },
  });
  if (!task) throw new Error("Task not found");

  // Assignees can complete their own tasks; otherwise task.manage is required.
  // Partners can ONLY touch tasks assigned to them (their whole scope).
  const isAssignee = task.assigneeId === user.id;
  if (!isAssignee && (!can(user, "task.manage") || isPartnerRole(user))) {
    throw new Error("Forbidden");
  }

  await db.task.update({
    where: { id: taskId },
    data: { status: "DONE", completedAt: new Date() },
  });
  if (task.caseId) {
    await db.caseEvent.create({
      data: { caseId: task.caseId, actorId: user.id, kind: "TASK_COMPLETED", title: `Task completed: ${task.title}` },
    });
  }
  await writeAudit({ tenantId: user.tenantId, actorId: user.id, action: "task.complete", entity: "Task", entityId: taskId });

  revalidatePath("/firm/tasks");
  revalidatePath("/client/tasks");
  revalidatePath("/partner");
  if (task.caseId) revalidatePath(`/firm/cases/${task.caseId}`);
}
