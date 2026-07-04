import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/permissions";
import { createVisaCategoryAction, updateVisaCategoryAction, toggleVisaCategoryAction } from "@/server/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";

export default async function VisaCategoriesPage() {
  await requirePlatformAdmin();
  const locale = await getLocale();
  const a = getDictionary(locale).admin;
  const categories = await db.visaCategory.findMany({
    include: {
      documentRequirements: { include: { documentType: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { cases: true } },
    },
    orderBy: { key: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{a.visaTitle}</h1>
        <p className="text-sm text-slate-500">{a.visaSub}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{a.newVisaCategory}</CardTitle>
          <CardDescription>The key is used internally and on the public pages. Use a short code like O-1 or EB-2-NIW.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createVisaCategoryAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input name="key" placeholder="Key (e.g. TN)" required />
            <Input name="name" placeholder="Name" required className="lg:col-span-1" />
            <Input name="audience" placeholder="Typical profile" className="lg:col-span-2" />
            <Textarea name="description" placeholder="Public description" className="sm:col-span-2 lg:col-span-3" />
            <Button type="submit" className="lg:col-span-1">{a.addCategory}</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id} className={category.isActive ? "" : "opacity-60"}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{category.key} · {category.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge>{category._count.cases} {a.casesWord}</Badge>
                  <Badge variant={category.isActive ? "success" : "outline"}>{category.isActive ? a.active : a.inactive}</Badge>
                </span>
              </CardTitle>
              <CardDescription>{category.description ?? a.noDescription}{category.audience ? ` · ${category.audience}` : ""}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {a.requirements} ({category.documentRequirements.length})
              </div>
              <ul className="space-y-1.5">
                {category.documentRequirements.map((req) => (
                  <li key={req.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{req.label}</span>
                    <span className="flex shrink-0 gap-1">
                      <Badge variant={req.necessity === "REQUIRED" ? "danger" : req.necessity === "CONDITIONAL" ? "warning" : "outline"}>
                        {tEnum("necessity", req.necessity, locale)}
                      </Badge>
                      {req.sensitivity === "RESTRICTED" && <Badge variant="warning">{a.restricted}</Badge>}
                    </span>
                  </li>
                ))}
                {category.documentRequirements.length === 0 && (
                  <li className="text-sm text-slate-400">{a.noRequirements}</li>
                )}
              </ul>

              <details className="rounded-lg border border-slate-100 p-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-600">{a.editCategory}</summary>
                <form action={updateVisaCategoryAction} className="mt-3 space-y-2">
                  <input type="hidden" name="id" value={category.id} />
                  <Input name="name" defaultValue={category.name} placeholder="Name" required />
                  <Input name="audience" defaultValue={category.audience ?? ""} placeholder="Typical profile" />
                  <Textarea name="description" defaultValue={category.description ?? ""} placeholder="Description" />
                  <div className="flex items-center gap-2">
                    <Button size="sm" type="submit">{a.saveChanges}</Button>
                  </div>
                </form>
                <form action={toggleVisaCategoryAction} className="mt-2">
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="isActive" value={category.isActive ? "false" : "true"} />
                  <Button size="sm" variant={category.isActive ? "ghost" : "secondary"} type="submit">
                    {category.isActive ? a.deactivate : a.activate}
                  </Button>
                </form>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
