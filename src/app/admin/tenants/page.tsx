import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, humanize } from "@/lib/utils";

export default async function TenantsPage() {
  await requireUser();
  const tenants = await db.tenant.findMany({
    include: { _count: { select: { memberships: true, cases: true, documents: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Tenants</h1>
        <p className="text-sm text-slate-500">All firm workspaces on the platform. Data is fully isolated per tenant.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell className="text-slate-500">{tenant.slug}</TableCell>
                  <TableCell><Badge variant="brand">{humanize(tenant.plan)}</Badge></TableCell>
                  <TableCell>{tenant._count.memberships}</TableCell>
                  <TableCell>{tenant._count.cases}</TableCell>
                  <TableCell>{tenant._count.documents}</TableCell>
                  <TableCell className="text-slate-500">{formatDate(tenant.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? "success" : "danger"}>
                      {tenant.isActive ? "Active" : "Inactive"}
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
