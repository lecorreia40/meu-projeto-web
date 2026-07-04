import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, humanize } from "@/lib/utils";

export default async function CompliancePage() {
  const user = await requirePermission("case.read");
  const events = await db.complianceEvent.findMany({
    where: { tenantId: user.tenantId!, status: { in: ["UPCOMING", "DUE_SOON", "OVERDUE"] } },
    include: { case: { select: { id: true, caseNumberInternal: true, client: { select: { fullName: true } } } } },
    orderBy: { dueAt: "asc" },
  });

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Compliance calendar</h1>
        <p className="text-sm text-slate-500">
          Post-approval monitoring: renewals, expirations, investment and corporate obligations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming obligations</CardTitle>
          <CardDescription>Recurring revenue lives here: keep clients compliant after approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 && <p className="text-sm text-slate-500">No open compliance events.</p>}
          {events.map((event) => {
            const overdue = event.dueAt.getTime() < now;
            const dueSoon = !overdue && event.dueAt.getTime() < now + 30 * 24 * 3600 * 1000;
            return (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-slate-500">
                    <Link href={`/firm/cases/${event.case.id}`} className="hover:underline">
                      {event.case.caseNumberInternal}
                    </Link>
                    {" · "}{event.case.client.fullName} · {humanize(event.kind)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{formatDate(event.dueAt)}</span>
                  <Badge variant={overdue ? "danger" : dueSoon ? "warning" : "info"}>
                    {overdue ? "Overdue" : dueSoon ? "Due soon" : "Upcoming"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
