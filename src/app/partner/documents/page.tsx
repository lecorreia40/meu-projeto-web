import { requireUser, partnerAssignments } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function PartnerDocumentsPage() {
  const user = await requireUser();
  const assignments = await partnerAssignments(user);
  const caseIds = assignments.map((a) => a.case.id);

  // Only the partner's own uploads on assigned cases: never the case's full vault
  const documents = await db.document.findMany({
    where: {
      caseId: { in: caseIds.length ? caseIds : ["-"] },
      ownerUserId: user.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Documents shared with me</h1>
        <p className="text-sm text-slate-500">Deliverables you uploaded within your assignment scope.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My deliverables</CardTitle>
          <CardDescription>You never see the full case vault, only your own scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <a href={`/api/documents/${doc.id}/download`} className="text-sm font-medium text-brand-700 hover:underline">
                  {doc.filename}
                </a>
                <div className="text-xs text-slate-500">v{doc.version} · {formatDate(doc.createdAt)}</div>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
