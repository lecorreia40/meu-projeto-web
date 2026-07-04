import { requireUser } from "@/lib/permissions";
import { getMyCases } from "./data";
import { caseProgress, clientFacingStatus } from "@/lib/case-status";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChecklistStatusBadge } from "@/components/status-badge";

export default async function ClientHome() {
  const user = await requireUser();
  const cases = await getMyCases(user);

  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-slate-500">
          No case is linked to your account yet. Your law firm will invite you when your case opens.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Case</h1>
        <p className="text-sm text-slate-500">Hello, {user.name.split(" ")[0]}. Here is where your process stands.</p>
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
                <CardDescription>Case {kase.caseNumberInternal}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      You are at stage: <span className="text-brand-700">{clientFacingStatus(kase.status)}</span>
                    </span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs text-slate-500">Next action</div>
                    <div className="font-medium">
                      {pendingItems.length > 0
                        ? `Send: ${pendingItems[0].label}`
                        : kase.nextAction ?? "No action needed from you"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Deadline</div>
                    <div className="font-medium">{formatDate(kase.nextDeadlineAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Currently responsible</div>
                    <div className="font-medium">
                      {pendingItems.length > 0 || myOpenTasks.length > 0 ? "You" : "Your legal team"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Last update</div>
                    <div className="font-medium">{lastEvent ? lastEvent.title : "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents to send</CardTitle>
                <CardDescription>Upload each item on the Documents page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {checklist?.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-sm">{item.label}</span>
                    <ChecklistStatusBadge status={item.status} />
                  </div>
                ))}
                {(!checklist || checklist.items.length === 0) && (
                  <p className="text-sm text-slate-500">Your document list will appear here.</p>
                )}
              </CardContent>
            </Card>

            {myOpenTasks.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Action needed</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myOpenTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                      <span className="text-sm font-medium">{task.title}</span>
                      <Badge variant="warning">due {formatDate(task.dueAt)}</Badge>
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
