import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { formatDate, formatMoney, humanize } from "@/lib/utils";

export default async function BillingPage() {
  const user = await requirePermission("billing.read");
  const invoices = await db.invoice.findMany({
    where: { tenantId: user.tenantId! },
    include: { payments: true, case: { select: { caseNumberInternal: true, client: { select: { fullName: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const total = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const received = invoices.reduce((s, i) => s + i.payments.reduce((p, x) => p + Number(x.amount), 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-slate-500">Invoices and payments across cases.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Invoiced" value={formatMoney(total)} />
        <StatCard label="Received" value={formatMoney(received)} tone="success" />
        <StatCard label="Outstanding" value={formatMoney(total - received)} tone={total - received > 0 ? "warning" : "default"} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Case</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.case?.caseNumberInternal ?? "-"}</TableCell>
                    <TableCell>{invoice.case?.client.fullName ?? "-"}</TableCell>
                    <TableCell>{formatMoney(Number(invoice.amount), invoice.currency)}</TableCell>
                    <TableCell>{formatMoney(paid, invoice.currency)}</TableCell>
                    <TableCell className="text-slate-500">{formatDate(invoice.dueAt)}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                        {humanize(invoice.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
