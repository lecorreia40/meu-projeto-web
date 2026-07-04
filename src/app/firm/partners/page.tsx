import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { humanize, formatDate } from "@/lib/utils";

export default async function PartnersPage() {
  const user = await requirePermission("partner.assign");
  const partners = await db.partner.findMany({
    where: { tenantId: user.tenantId! },
    include: {
      assignments: {
        include: { case: { select: { caseNumberInternal: true } }, tasks: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Partners</h1>
        <p className="text-sm text-slate-500">
          External partners see only their explicitly assigned scope, never the full case.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {partners.map((partner) => (
          <Card key={partner.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {partner.name}
                <Badge variant={partner.isActive ? "success" : "outline"}>
                  {partner.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{humanize(partner.kind)} · {partner.email ?? "-"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {partner.assignments.length === 0 && (
                <p className="text-sm text-slate-500">No assignments.</p>
              )}
              {partner.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{assignment.case.caseNumberInternal}</div>
                    <Badge variant={assignment.status === "ACTIVE" ? "info" : "outline"}>
                      {humanize(assignment.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    Scope: {assignment.scope} · {assignment.tasks.length} task(s)
                    {assignment.expiresAt ? ` · expires ${formatDate(assignment.expiresAt)}` : ""}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
