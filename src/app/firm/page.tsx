import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseStatusBadge, RiskBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function FirmDashboard() {
  const user = await requirePermission("case.read");
  const tenantId = user.tenantId!;
  const soon = new Date(Date.now() + 14 * 24 * 3600 * 1000);

  const [newLeads, activeCases, pendingReviewDocs, openTasks, deadlines, highRisk] =
    await Promise.all([
      db.lead.count({ where: { tenantId, stage: { in: ["NEW", "SCREENING"] } } }),
      db.case.count({ where: { tenantId, deletedAt: null, status: { notIn: ["CLOSED", "DENIED"] } } }),
      db.document.count({ where: { tenantId, deletedAt: null, status: "PENDING_REVIEW" } }),
      db.task.count({ where: { tenantId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.case.findMany({
        where: { tenantId, deletedAt: null, nextDeadlineAt: { lte: soon, gte: new Date() } },
        include: { client: true, visaCategory: true },
        orderBy: { nextDeadlineAt: "asc" },
        take: 5,
      }),
      db.case.findMany({
        where: { tenantId, deletedAt: null, riskLevel: { in: ["HIGH", "CRITICAL"] }, status: { notIn: ["CLOSED"] } },
        include: { client: true, visaCategory: true },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {user.name.split(" ")[0]}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New leads" value={newLeads} hint="Awaiting screening" />
        <StatCard label="Active cases" value={activeCases} />
        <StatCard label="Docs awaiting review" value={pendingReviewDocs} tone={pendingReviewDocs > 0 ? "warning" : "default"} />
        <StatCard label="Open tasks" value={openTasks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines (14 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deadlines.length === 0 && <p className="text-sm text-slate-500">No deadlines in the next two weeks.</p>}
            {deadlines.map((c) => (
              <Link key={c.id} href={`/firm/cases/${c.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{c.client.fullName} · {c.visaCategory.key}</div>
                  <div className="text-xs text-slate-500">{c.nextAction ?? c.caseNumberInternal}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-amber-600">{formatDate(c.nextDeadlineAt)}</div>
                  <CaseStatusBadge status={c.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-risk cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highRisk.length === 0 && <p className="text-sm text-slate-500">No high-risk cases. Good.</p>}
            {highRisk.map((c) => (
              <Link key={c.id} href={`/firm/cases/${c.id}`} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium">{c.client.fullName} · {c.visaCategory.key}</div>
                  <div className="text-xs text-slate-500">{c.caseNumberInternal}</div>
                </div>
                <RiskBadge level={c.riskLevel} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
