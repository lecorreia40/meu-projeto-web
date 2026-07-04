import { requireUser } from "@/lib/permissions";
import { getMyCases } from "../data";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function ClientPaymentsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const c = getDictionary(locale).client;
  const cases = await getMyCases(user);
  const invoices = cases.flatMap((cs) => cs.invoices);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{c.paymentsTitle}</h1>
        <p className="text-sm text-slate-500">{c.paymentsSub}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>{c.invoices}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 && <p className="text-sm text-slate-500">{c.noInvoices}</p>}
          {invoices.map((invoice) => {
            const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
            const remaining = Number(invoice.amount) - paid;
            return (
              <div key={invoice.id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{invoice.number}</div>
                  <Badge variant={invoice.status === "PAID" ? "success" : "warning"}>{tEnum("invoiceStatus", invoice.status, locale)}</Badge>
                </div>
                <div className="mt-1 grid gap-2 text-sm sm:grid-cols-3">
                  <div><span className="text-xs text-slate-500">{c.total}</span><div>{formatMoney(Number(invoice.amount))}</div></div>
                  <div><span className="text-xs text-slate-500">{c.paid}</span><div>{formatMoney(paid)}</div></div>
                  <div><span className="text-xs text-slate-500">{c.remaining}</span><div className={remaining > 0 ? "text-amber-600" : ""}>{formatMoney(remaining)}</div></div>
                </div>
                <div className="mt-1 text-xs text-slate-500">{c.deadline}: {formatDate(invoice.dueAt)}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
