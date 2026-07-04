import { requireUser, partnerAssignments } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function PartnerDocumentsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const p = getDictionary(locale).partner;
  const assignments = await partnerAssignments(user);
  const caseIds = assignments.map((a) => a.case.id);

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
        <h1 className="text-xl font-bold tracking-tight">{p.sharedTitle}</h1>
        <p className="text-sm text-slate-500">{p.sharedSub}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{p.myDeliverables}</CardTitle>
          <CardDescription>{p.neverFullVault}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-slate-500">{p.noDocuments}</p>}
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
