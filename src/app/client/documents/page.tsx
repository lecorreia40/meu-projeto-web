import { requireUser } from "@/lib/permissions";
import { getMyCases } from "../data";
import { uploadDocumentAction } from "@/server/actions/documents";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChecklistStatusBadge, DocumentStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function ClientDocumentsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const c = t.client;
  const cases = await getMyCases(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{c.documentsTitle}</h1>
        <p className="text-sm text-slate-500">{c.documentsSub}</p>
      </div>

      {cases.map((kase) => {
        const checklist = kase.checklists[0];
        return (
          <div key={kase.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{c.requestedDocs} · {kase.visaCategory.key}</CardTitle>
                <CardDescription>{c.fileHint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist?.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChecklistStatusBadge status={item.status} />
                    </div>
                    {item.comment && <p className="mt-1 text-xs text-rose-600">{item.comment}</p>}
                    {item.status !== "APPROVED" && item.status !== "WAIVED" && (
                      <form action={uploadDocumentAction} className="mt-2 flex items-center gap-2">
                        <input type="hidden" name="caseId" value={kase.id} />
                        <input type="hidden" name="checklistItemId" value={item.id} />
                        <Input name="file" type="file" className="h-8 text-xs" required />
                        <Button size="sm" variant="secondary" type="submit">{t.ui.upload}</Button>
                      </form>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{c.myUploads}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {kase.documents.length === 0 && <p className="text-sm text-slate-500">{c.noUploads}</p>}
                {kase.documents.map((doc) => (
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
      })}
    </div>
  );
}
