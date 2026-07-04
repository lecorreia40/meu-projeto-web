"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { requireUser, canAccessCase, can, visibleMessageChannels, isPartnerRole, isClientRole } from "@/lib/permissions";

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "message.send")) throw new Error("Forbidden");

  const caseId = String(formData.get("caseId"));
  const body = z.string().min(1).max(10000).parse(formData.get("body"));
  const requestedChannel = (formData.get("channel") as string) || "OPERATIONAL";

  if (!(await canAccessCase(user, caseId))) throw new Error("Forbidden");

  // Channel gating: clients/partners can only write to channels they can read
  const allowed = visibleMessageChannels(user);
  const channel = allowed.includes(requestedChannel)
    ? requestedChannel
    : isPartnerRole(user)
      ? "PARTNER"
      : "OPERATIONAL";

  const kase = await db.case.findFirstOrThrow({ where: { id: caseId }, select: { tenantId: true } });

  let thread = await db.messageThread.findFirst({
    where: { caseId, channel: channel as never },
  });
  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        tenantId: kase.tenantId,
        caseId,
        subject: `${channel.toLowerCase()} thread`,
        channel: channel as never,
      },
    });
  }

  await db.message.create({ data: { threadId: thread.id, senderId: user.id, body } });
  await db.caseEvent.create({
    data: {
      caseId,
      actorId: user.id,
      kind: "MESSAGE_SENT",
      title: "New message",
      clientVisible: channel !== "INTERNAL",
    },
  });
  await writeAudit({
    tenantId: kase.tenantId,
    actorId: user.id,
    action: "message.send",
    entity: "Message",
    metadata: { caseId, channel },
  });

  revalidatePath(`/firm/cases/${caseId}`);
  revalidatePath("/client/messages");
  revalidatePath("/partner");
}
