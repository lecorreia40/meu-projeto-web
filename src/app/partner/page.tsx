import { requireUser, partnerAssignments } from "@/lib/permissions";
import { db } from "@/lib/db";
import { completeTaskAction } from "@/server/actions/tasks";
import { uploadDocumentAction } from "@/server/actions/documents";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function PartnerHome() {
  const user = await requireUser();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const p = t.partner;
  const assignments = await partnerAssignments(user);
  const assignmentIds = assignments.map((a) => a.id);

  const tasks = await db.task.findMany({
    where: { partnerAssignmentId: { in: assignmentIds.length ? assignmentIds : ["-"] } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{p.assignedWork}</h1>
        <p className="text-sm text-slate-500">{p.assignedSub}</p>
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">{p.noAssignments}</CardContent>
        </Card>
      )}

      {assignments.map((assignment) => {
        const assignmentTasks = tasks.filter((tk) => tk.partnerAssignmentId === assignment.id);
        return (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {assignment.case.visaCategory.key} · {assignment.case.caseNumberInternal}
                <Badge variant="info">{assignment.scope}</Badge>
              </CardTitle>
              <CardDescription>
                {assignment.expiresAt ? `${p.accessExpires} ${formatDate(assignment.expiresAt)}` : p.activeAssignment}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignmentTasks.length === 0 && <p className="text-sm text-slate-500">{p.noOpenTasks}</p>}
              {assignmentTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="text-xs text-slate-500">{t.ui.due} {formatDate(task.dueAt)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      {task.status !== "DONE" && (
                        <form action={completeTaskAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <Button size="sm" variant="secondary" type="submit">{t.ui.done}</Button>
                        </form>
                      )}
                    </div>
                  </div>
                  {task.status !== "DONE" && (
                    <form action={uploadDocumentAction} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="caseId" value={assignment.case.id} />
                      <Input name="file" type="file" className="h-8 text-xs" required />
                      <Button size="sm" variant="ghost" type="submit">{p.uploadDeliverable}</Button>
                    </form>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
