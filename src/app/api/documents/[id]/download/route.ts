/**
 * Audited document download. No public URLs exist - every download passes
 * through this permission check and writes an AuditLog row.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canReadDocument } from "@/lib/permissions";
import { writeAudit } from "@/lib/audit";
import { retrieveFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowed = await canReadDocument(user, id);
  if (!allowed) {
    await writeAudit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "document.download_denied",
      entity: "Document",
      entityId: id,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const document = await db.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await writeAudit({
    tenantId: document.tenantId,
    actorId: user.id,
    action: "document.download",
    entity: "Document",
    entityId: id,
    metadata: { filename: document.filename, sensitivity: document.sensitivity },
  });

  try {
    const buffer = await retrieveFile(document.fileUrl);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
