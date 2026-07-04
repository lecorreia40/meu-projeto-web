import "server-only";
import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth";

/** The client's own cases, fully scoped: only cases where they are the client. */
export async function getMyCases(user: CurrentUser) {
  return db.case.findMany({
    where: {
      tenantId: user.tenantId ?? "-",
      deletedAt: null,
      client: { userId: user.id },
    },
    include: {
      visaCategory: true,
      checklists: { include: { items: { orderBy: { sortOrder: "asc" } } } },
      tasks: { where: { assigneeId: user.id } },
      // Clients only ever see client-visible events
      events: { where: { clientVisible: true }, orderBy: { createdAt: "desc" } },
      threads: {
        where: { channel: { in: ["OPERATIONAL", "COMMERCIAL"] } },
        include: {
          messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        },
      },
      invoices: { include: { payments: true } },
      documents: { where: { deletedAt: null, ownerUserId: user.id } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
