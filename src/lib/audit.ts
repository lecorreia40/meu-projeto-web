/**
 * Append-only audit trail. Every sensitive read, download, change and deletion
 * must call writeAudit. Records are never updated or deleted by the app.
 */
import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export type AuditEntry = {
  tenantId?: string | null;
  actorId?: string | null;
  action: string; // e.g. "document.download", "legal_note.read", "case.update"
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    userAgent = h.get("user-agent");
  } catch {
    // outside a request context (seed scripts, jobs)
  }

  try {
    await db.auditLog.create({
      data: {
        tenantId: entry.tenantId ?? undefined,
        actorId: entry.actorId ?? undefined,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? undefined,
        metadata: (entry.metadata ?? undefined) as never,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // Auditing must never take the request down, but the failure is loud in logs
    console.error("[audit] failed to write audit log", entry.action, err);
  }
}
