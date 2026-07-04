import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/permissions";
import { createPlanAction, updatePlanAction, togglePlanAction, assignTenantPlanAction } from "@/server/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";

const INTERVALS = ["MONTHLY", "ANNUAL", "PER_USER", "CUSTOM"] as const;
const TENANT_PLANS = ["STARTER", "FIRM", "GROWTH", "ENTERPRISE", "WHITE_LABEL"] as const;

export default async function PlansPage() {
  await requirePlatformAdmin();
  const locale = await getLocale();
  const a = getDictionary(locale).admin;

  const [plans, tenants] = await Promise.all([
    db.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    db.tenant.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{a.plansTitle}</h1>
        <p className="text-sm text-slate-500">{a.plansSub}</p>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.length === 0 && <p className="text-sm text-slate-500">{a.noPlans}</p>}
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
          return (
            <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{plan.name}</span>
                  <Badge variant={plan.isActive ? "success" : "outline"}>{plan.isActive ? a.active : a.inactive}</Badge>
                </CardTitle>
                <CardDescription>{plan.description ?? plan.key}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">{formatMoney(Number(plan.priceMonthly), plan.currency)}</span>
                  <span className="text-sm text-slate-500">{a.perMonth}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {a.seatsLbl}: {plan.seats ?? a.unlimited} · {a.casesLimitLbl}: {plan.activeCasesLimit ?? a.unlimited}
                </div>
                <ul className="space-y-1 text-sm">
                  {features.map((ftr, i) => (
                    <li key={i} className="flex gap-2 text-slate-700">
                      <span className="text-emerald-600">✓</span>{ftr}
                    </li>
                  ))}
                </ul>

                <details className="rounded-lg border border-slate-100 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-slate-600">{a.editPlan}</summary>
                  <form action={updatePlanAction} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={plan.id} />
                    <Input name="name" defaultValue={plan.name} placeholder="Name" required />
                    <div className="flex gap-2">
                      <Input name="priceMonthly" type="number" step="0.01" defaultValue={String(plan.priceMonthly)} placeholder={a.price} required />
                      <Input name="currency" defaultValue={plan.currency} className="w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Input name="seats" type="number" defaultValue={plan.seats ?? undefined} placeholder={a.seatsLbl} />
                      <Input name="activeCasesLimit" type="number" defaultValue={plan.activeCasesLimit ?? undefined} placeholder={a.casesLimitLbl} />
                    </div>
                    <Select name="interval" defaultValue={plan.interval}>
                      {INTERVALS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </Select>
                    <Textarea name="features" defaultValue={features.join("\n")} placeholder={a.featuresLbl} />
                    <Textarea name="description" defaultValue={plan.description ?? ""} placeholder="Description" />
                    <div className="flex items-center gap-2">
                      <Button size="sm" type="submit">{a.saveChanges}</Button>
                    </div>
                  </form>
                  <form action={togglePlanAction} className="mt-2">
                    <input type="hidden" name="id" value={plan.id} />
                    <input type="hidden" name="isActive" value={plan.isActive ? "false" : "true"} />
                    <Button size="sm" variant={plan.isActive ? "ghost" : "secondary"} type="submit">
                      {plan.isActive ? a.deactivate : a.activate}
                    </Button>
                  </form>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* New plan */}
      <Card>
        <CardHeader>
          <CardTitle>{a.newPlan}</CardTitle>
          <CardDescription>{a.planKeyHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPlanAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input name="key" placeholder="Key (e.g. GROWTH)" required />
            <Input name="name" placeholder="Name" required />
            <div className="flex gap-2">
              <Input name="priceMonthly" type="number" step="0.01" placeholder={a.price} required />
              <Input name="currency" defaultValue="USD" className="w-24" />
            </div>
            <Select name="interval" defaultValue="MONTHLY">
              {INTERVALS.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            <Input name="seats" type="number" placeholder={a.seatsLbl} />
            <Input name="activeCasesLimit" type="number" placeholder={a.casesLimitLbl} />
            <Textarea name="features" placeholder={a.featuresLbl} className="sm:col-span-2 lg:col-span-2" />
            <Textarea name="description" placeholder="Description" className="lg:col-span-1" />
            <Button type="submit" className="lg:col-span-1">{a.addCategory}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Assign plan to tenant */}
      <Card>
        <CardHeader><CardTitle>{a.assignToTenant}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {tenants.map((tenant) => (
            <form key={tenant.id} action={assignTenantPlanAction} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{tenant.name}</div>
                <div className="text-xs text-slate-500">{tenant.slug} · {tEnum("plan", tenant.plan, locale)}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <Select name="plan" defaultValue={tenant.plan} className="h-8 w-40 text-xs">
                  {TENANT_PLANS.map((p) => <option key={p} value={p}>{tEnum("plan", p, locale)}</option>)}
                </Select>
                <Button size="sm" variant="secondary" type="submit">{a.assignBtn}</Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
