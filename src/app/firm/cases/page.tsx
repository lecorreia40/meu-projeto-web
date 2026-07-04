import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { createCaseAction } from "@/server/actions/cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CaseStatusBadge, RiskBadge } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { caseProgress } from "@/lib/case-status";
import { formatDate } from "@/lib/utils";

export default async function CasesPage() {
  const user = await requirePermission("case.read");
  const tenantId = user.tenantId!;

  const [cases, clients, visaCategories] = await Promise.all([
    db.case.findMany({
      where: { tenantId, deletedAt: null },
      include: { client: true, visaCategory: true, attorney: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.client.findMany({ where: { tenantId, deletedAt: null }, orderBy: { fullName: "asc" } }),
    db.visaCategory.findMany({ where: { isActive: true }, orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Cases</h1>
        <p className="text-sm text-slate-500">{cases.length} cases in this workspace.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Open new case</CardTitle></CardHeader>
        <CardContent>
          <form action={createCaseAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select name="clientId" required defaultValue="">
              <option value="" disabled>Client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </Select>
            <Select name="visaCategoryId" required defaultValue="">
              <option value="" disabled>Visa category…</option>
              {visaCategories.map((v) => <option key={v.id} value={v.id}>{v.key} - {v.name}</option>)}
            </Select>
            <Select name="priority" defaultValue="NORMAL">
              {["LOW", "NORMAL", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Button type="submit">Open case (checklist auto-generated)</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Visa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Attorney</TableHead>
                <TableHead>Next deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/firm/cases/${c.id}`} className="font-medium text-brand-700 hover:underline">
                      {c.caseNumberInternal}
                    </Link>
                  </TableCell>
                  <TableCell>{c.client.fullName}</TableCell>
                  <TableCell>{c.visaCategory.key}</TableCell>
                  <TableCell><CaseStatusBadge status={c.status} /></TableCell>
                  <TableCell className="w-32"><Progress value={caseProgress(c.status)} /></TableCell>
                  <TableCell><RiskBadge level={c.riskLevel} /></TableCell>
                  <TableCell className="text-slate-500">{c.attorney?.name ?? "-"}</TableCell>
                  <TableCell className="text-slate-500">{formatDate(c.nextDeadlineAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
