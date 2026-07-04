import { requireUser } from "@/lib/permissions";
import { db } from "@/lib/db";
import { completeTaskAction } from "@/server/actions/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function ClientTasksPage() {
  const user = await requireUser();
  const tasks = await db.task.findMany({
    where: { tenantId: user.tenantId ?? "-", assigneeId: user.id },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-slate-500">Things your legal team asked you to do.</p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          {tasks.length === 0 && <p className="text-sm text-slate-500">Nothing to do right now.</p>}
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <div className="text-sm font-medium">{task.title}</div>
                <div className="text-xs text-slate-500">Due {formatDate(task.dueAt)}</div>
              </div>
              <div className="flex items-center gap-2">
                <TaskStatusBadge status={task.status} />
                {task.status !== "DONE" && task.status !== "CANCELLED" && (
                  <form action={completeTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button size="sm" variant="secondary" type="submit">Mark done</Button>
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
