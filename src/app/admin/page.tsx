import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AdminOverview() {
  await requireUser();

  const [tenants, users, cases, documents, aiBlocked, recentAudit] = await Promise.all([
    db.tenant.count({ where: { isActive: true } }),
    db.user.count({ where: { deletedAt: null } }),
    db.case.count({ where: { deletedAt: null } }),
    db.document.count({ where: { deletedAt: null } }),
    db.aIInteraction.count({ where: { blocked: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Platform overview</h1>
        <p className="text-sm text-slate-500">Cross-tenant administration. Every access here is audited.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active tenants" value={tenants} />
        <StatCard label="Users" value={users} />
        <StatCard label="Cases" value={cases} />
        <StatCard label="Documents" value={documents} />
        <StatCard label="AI requests blocked" value={aiBlocked} hint="Legal-advice guardrail" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent audit activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentAudit.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
              <div>
                <span className="font-medium">{log.action}</span>
                <span className="text-slate-500"> · {log.entity}{log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}</span>
              </div>
              <div className="text-xs text-slate-500">
                {log.actor?.name ?? "system"} · {formatDate(log.createdAt)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
