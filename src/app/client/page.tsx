import { requireUser } from "@/lib/permissions";
import { getMyCases } from "./data";
import { caseProgress, clientFacingStatus } from "@/lib/case-status";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChecklistStatusBadge } from "@/components/status-badge";

export default async function ClientHome() {
  const user = await requireUser();
  const locale = await getLocale();
  const c = getDictionary(locale).client;
  const cases = await getMyCases(user);

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-500">{c.noCase}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{c.myCase}</h1>
        <p className="text-sm text-slate-500">{c.greeting}, {user.name.split(" ")[0]}. {c.standsIntro}</p>
      </div>

      {cases.map((kase) => {
        const checklist = kase.checklists[0];
        const pendingItems = checklist?.items.filter((i) => i.status === "PENDING" || i.status === "REJECTED") ?? [];
        const myOpenTasks = kase.tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
        const lastEvent = kase.events[0];
        const progress = caseProgress(kase.status);

        return (
          <div key={kase.id} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{kase.visaCategory.name}</CardTitle>
                <CardDescription>{c.caseLabel} {kase.caseNumberInternal}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {c.youAreAtStage}: <span className="text-brand-700">{clientFacingStatus(kase.status, locale)}</span>
                    </span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs text-slate-500">{c.nextAction}</div>
                    <div className="font-medium">
                      {pendingItems.length > 0
                        ? `${c.sendPrefix}: ${pendingItems[0].label}`
                        : kase.nextAction ?? c.noActionFromYou}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{c.deadline}</div>
                    <div className="font-medium">{formatDate(kase.nextDeadlineAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{c.responsible}</div>
                    <div className="font-medium">
                      {pendingItems.length > 0 || myOpenTasks.length > 0 ? c.you : c.yourTeam}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">{c.lastUpdate}</div>
                    <div className="font-medium">{lastEvent ? lastEvent.title : "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{c.documentsToSend}</CardTitle>
                <CardDescription>{c.uploadOnDocs}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist?.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-sm">{item.label}</span>
                    <ChecklistStatusBadge status={item.status} />
                  </div>
                ))}
                {(!checklist || checklist.items.length === 0) && (
                  <p className="text-sm text-slate-500">{c.docListWillAppear}</p>
                )}
              </CardContent>
            </Card>

            {myOpenTasks.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{c.actionNeeded}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myOpenTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="warning">{getDictionary(locale).ui.due} {formatDate(task.dueAt)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
