import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { reviewDocumentAction } from "@/server/actions/documents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DocumentStatusBadge } from "@/components/status-badge";
import { formatDate, humanize } from "@/lib/utils";

export default async function FirmDocumentsPage() {
  const user = await requirePermission("document.read");
  const documents = await db.document.findMany({
    where: { tenantId: user.tenantId!, deletedAt: null },
    include: {
      documentType: true,
      owner: { select: { name: true } },
      case: { select: { id: true, caseNumberInternal: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const pending = documents.filter((d) => d.status === "PENDING_REVIEW" || d.status === "IN_REVIEW");
  const rest = documents.filter((d) => !pending.includes(d));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-slate-500">{pending.length} awaiting review.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>Documents pending review across all cases.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-slate-500">Nothing to review.</p>}
          {pending.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <a href={`/api/documents/${doc.id}/download`} className="text-sm font-medium text-brand-700 hover:underline">{doc.filename}</a>
                  <div className="text-xs text-slate-500">
                    {doc.case && (
                      <Link href={`/firm/cases/${doc.case.id}`} className="hover:underline">{doc.case.caseNumberInternal}</Link>
                    )}
                    {" · "}{doc.documentType?.name ?? "Uncategorized"} · {humanize(doc.sensitivity)} · by {doc.owner?.name ?? "-"} · {formatDate(doc.createdAt)}
                  </div>
                </div>
                <DocumentStatusBadge status={doc.status} />
              </div>
              <form action={reviewDocumentAction} className="mt-2 flex flex-wrap items-center gap-2">
                <input type="hidden" name="documentId" value={doc.id} />
                <Input name="comment" placeholder="Comment" className="h-8 w-56 text-xs" />
                <Select name="decision" defaultValue="APPROVED" className="h-8 w-40 text-xs">
                  <option value="APPROVED">Approve</option>
                  <option value="NEEDS_CHANGES">Needs changes</option>
                  <option value="REJECTED">Reject</option>
                </Select>
                <Button size="sm" variant="secondary" type="submit">Submit review</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All documents</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rest.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3">
              <div>
                <a href={`/api/documents/${doc.id}/download`} className="text-sm font-medium text-brand-700 hover:underline">{doc.filename}</a>
                <div className="text-xs text-slate-500">
                  {doc.case?.caseNumberInternal ?? "-"} · v{doc.version} · {formatDate(doc.createdAt)}
                </div>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
