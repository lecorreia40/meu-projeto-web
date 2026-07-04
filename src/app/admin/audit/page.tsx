import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditLabel } from "@/lib/audit-labels";

export default async function AuditLogPage() {
  await requireUser();
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } }, tenant: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Audit log</h1>
        <p className="text-sm text-slate-500">
          Append-only trail of sensitive actions: reads, downloads, changes and denials. Last 200 entries.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">
                    {log.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </TableCell>
                  <TableCell className="text-xs">{log.actor?.email ?? "system"}</TableCell>
                  <TableCell className="text-xs text-slate-500">{log.tenant?.name ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Badge variant={auditLabel(log.action).tone} className="w-fit">{auditLabel(log.action).label}</Badge>
                      <span className="font-mono text-[10px] text-slate-400">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {log.entity}{log.entityId ? ` (${log.entityId.slice(0, 10)})` : ""}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{log.ip ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
