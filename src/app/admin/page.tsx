import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auditLabel } from "@/lib/audit-labels";
import { formatDate, humanize } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminOverview() {
  await requireUser();
  const a = getDictionary(await getLocale()).admin;

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
        <h1 className="text-xl font-bold tracking-tight">{a.overviewTitle}</h1>
        <p className="text-sm text-slate-500">{a.overviewSub}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={a.activeTenants} value={tenants} />
        <StatCard label={a.usersWord} value={users} />
        <StatCard label={a.casesWord} value={cases} />
        <StatCard label={a.documentsWord} value={documents} />
        <StatCard label={a.aiBlocked} value={aiBlocked} hint={a.aiGuardrail} />
      </div>

      <Card>
        <CardHeader><CardTitle>{a.recentActivity}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentAudit.map((log) => {
            const { label, tone } = auditLabel(log.action);
            return (
              <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Badge variant={tone}>{label}</Badge>
                  <span className="truncate text-slate-500">{humanize(log.entity)}</span>
                </div>
                <div className="whitespace-nowrap text-xs text-slate-500">
                  {log.actor?.name ?? "system"} · {formatDate(log.createdAt)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
