import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";

export default async function TenantsPage() {
  await requireUser();
  const locale = await getLocale();
  const a = getDictionary(locale).admin;
  const tenants = await db.tenant.findMany({
    include: { _count: { select: { memberships: true, cases: true, documents: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{a.tenantsTitle}</h1>
        <p className="text-sm text-slate-500">{a.tenantsSub}</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{a.tenantsTitle}</TableHead>
                <TableHead>{a.thSlug}</TableHead>
                <TableHead>{a.thPlan}</TableHead>
                <TableHead>{a.usersWord}</TableHead>
                <TableHead>{a.casesWord}</TableHead>
                <TableHead>{a.documentsWord}</TableHead>
                <TableHead>{a.thCreated}</TableHead>
                <TableHead>{a.thStatusCol}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell className="text-slate-500">{tenant.slug}</TableCell>
                  <TableCell><Badge variant="brand">{tEnum("plan", tenant.plan, locale)}</Badge></TableCell>
                  <TableCell>{tenant._count.memberships}</TableCell>
                  <TableCell>{tenant._count.cases}</TableCell>
                  <TableCell>{tenant._count.documents}</TableCell>
                  <TableCell className="text-slate-500">{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? "success" : "danger"}>
                      {tenant.isActive ? a.active : a.inactive}
                    </Badge>
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
