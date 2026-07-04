import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { completeTaskAction } from "@/server/actions/tasks";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function ClientTasksPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const c = getDictionary(locale).client;
  const tasks = await db.task.findMany({
    where: { tenantId: user.tenantId ?? "-", assigneeId: user.id },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{c.tasksTitle}</h1>
        <p className="text-sm text-slate-500">{c.tasksSub}</p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          {tasks.length === 0 && <p className="text-sm text-slate-500">{c.nothingToDo}</p>}
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-xs text-slate-500">{c.deadline}: {formatDate(task.dueAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <TaskStatusBadge status={task.status} />
                {task.status !== "DONE" && task.status !== "CANCELLED" && (
                  <form action={completeTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button size="sm" variant="secondary" type="submit">{getDictionary(locale).ui.markDone}</Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
