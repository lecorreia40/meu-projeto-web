import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { createLeadAction, moveLeadStageAction } from "@/server/actions/leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";

const PIPELINE = ["NEW", "SCREENING", "CONSULT_SCHEDULED", "CONSULT_DONE", "PROPOSAL_SENT", "ENGAGED", "ACTIVE_CASE", "LOST"] as const;
const SOURCES = ["ORGANIC", "ADS", "REFERRAL", "PARTNER", "LANDING_PAGE", "WHATSAPP", "EVENT", "OTHER"] as const;

export default async function LeadsPage() {
  const user = await requirePermission("lead.read");
  const locale = await getLocale();
  const f = getDictionary(locale).firm;
  const leads = await db.lead.findMany({
    where: { tenantId: user.tenantId! },
    orderBy: { createdAt: "desc" },
  });
  const visaCategories = await db.visaCategory.findMany({ where: { isActive: true } });

  const byStage = new Map<string, typeof leads>();
  for (const stage of PIPELINE) byStage.set(stage, []);
  for (const lead of leads) byStage.get(lead.stage)?.push(lead);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{f.leadsTitle}</h1>
          <p className="text-sm text-slate-500">{f.leadsSub}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{f.newLead}</CardTitle></CardHeader>
        <CardContent>
          <form action={createLeadAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input name="name" placeholder={f.namePh} required />
            <Input name="email" type="email" placeholder={f.emailPh} />
            <Select name="source" defaultValue="ORGANIC">
              {SOURCES.map((s) => <option key={s} value={s}>{tEnum("leadSource", s, locale)}</option>)}
            </Select>
            <Select name="interest" defaultValue="">
              <option value="">{f.interestPh}</option>
              {visaCategories.map((v) => <option key={v.key} value={v.key}>{v.key}</option>)}
            </Select>
            <Button type="submit">{f.addLead}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PIPELINE.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <Card key={stage} className="min-h-[120px]">
              <CardHeader className="pb-1">
                <CardTitle className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                  {tEnum("leadStage", stage, locale)}
                  <Badge>{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{lead.name}</div>
                        <div className="text-xs text-slate-500">
                          {lead.interest ?? "-"} · {tEnum("leadSource", lead.source, locale)}
                          {lead.score != null && ` · ${f.score} ${lead.score}`}
                        </div>
                      </div>
                    </div>
                    <form action={moveLeadStageAction} className="mt-2 flex gap-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <Select name="stage" defaultValue={lead.stage} className="h-7 text-xs">
                        {PIPELINE.map((s) => <option key={s} value={s}>{tEnum("leadStage", s, locale)}</option>)}
                      </Select>
                      <Button size="sm" variant="secondary" type="submit">{f.move}</Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
