import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { createClientAction } from "@/server/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function ClientsPage() {
  const user = await requirePermission("client.read");
  const locale = await getLocale();
  const f = getDictionary(locale).firm;
  const clients = await db.client.findMany({
    where: { tenantId: user.tenantId!, deletedAt: null },
    include: { cases: { where: { deletedAt: null }, include: { visaCategory: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{f.clientsTitle}</h1>
        <p className="text-sm text-slate-500">{clients.length} {f.clientsInWorkspace}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{f.newClient}</CardTitle></CardHeader>
        <CardContent>
          <form action={createClientAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input name="fullName" placeholder={f.namePh} required />
            <Input name="email" type="email" placeholder={f.emailPh} />
            <Input name="phone" placeholder={f.phonePh} />
            <Input name="nationality" placeholder={f.nationalityPh} />
            <Button type="submit">{f.addClient}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{f.thName}</TableHead>
                <TableHead>{f.thEmail}</TableHead>
                <TableHead>{f.thNationality}</TableHead>
                <TableHead>{f.thCases}</TableHead>
                <TableHead>{f.thSince}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.fullName}</TableCell>
                  <TableCell className="text-slate-500">{client.email ?? "-"}</TableCell>
                  <TableCell className="text-slate-500">{client.nationality ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.cases.length === 0 && <span className="text-slate-400">-</span>}
                      {client.cases.map((c) => (
                        <Link key={c.id} href={`/firm/cases/${c.id}`}>
                          <Badge variant="brand">{c.visaCategory.key}</Badge>
                        </Link>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">{formatDate(client.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
