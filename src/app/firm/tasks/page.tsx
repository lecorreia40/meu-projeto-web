import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { completeTaskAction } from "@/server/actions/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";

export default async function FirmTasksPage() {
  const user = await requirePermission("task.read");
  const locale = await getLocale();
  const t = getDictionary(locale);
  const f = t.firm;
  const tasks = await db.task.findMany({
    where: { tenantId: user.tenantId! },
    include: {
      assignee: { select: { name: true } },
      case: { select: { id: true, caseNumberInternal: true } },
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{f.tasksTitle}</h1>
        <p className="text-sm text-slate-500">{f.tasksSub}</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.thTask}</TableHead>
                <TableHead>{f.thCase}</TableHead>
                <TableHead>{f.thAssignee}</TableHead>
                <TableHead>{f.thPriority}</TableHead>
                <TableHead>{f.thDue}</TableHead>
                <TableHead>{f.thStatus}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.case ? (
                      <Link href={`/firm/cases/${task.case.id}`} className="text-brand-700 hover:underline">
                        {task.case.caseNumberInternal}
                      </Link>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-slate-500">{task.assignee?.name ?? f.unassigned}</TableCell>
                  <TableCell><Badge variant={task.priority === "HIGH" || task.priority === "CRITICAL" ? "danger" : "default"}>{tEnum("priority", task.priority, locale)}</Badge></TableCell>
                  <TableCell className="text-slate-500">{formatDate(task.dueAt)}</TableCell>
                  <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                  <TableCell>
                    {task.status !== "DONE" && task.status !== "CANCELLED" && (
                      <form action={completeTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button size="sm" variant="ghost" type="submit">{t.ui.done}</Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
