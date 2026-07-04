import { db } from "@/lib/db";
import { requireUser } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { humanize } from "@/lib/utils";

export default async function VisaCategoriesPage() {
  await requireUser();
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
        <h1 className="text-xl font-bold tracking-tight">Visa categories</h1>
        <p className="text-sm text-slate-500">
          The visa engine: categories, requirements and checklist rules live as configuration, not code.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category.key} · {category.name}
                <Badge>{category._count.cases} cases</Badge>
              </CardTitle>
              <CardDescription>{category.description} · Typical profile: {category.audience}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Document requirements ({category.documentRequirements.length})
              </div>
              <ul className="mt-2 space-y-1.5">
                {category.documentRequirements.map((req) => (
                  <li key={req.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{req.label}</span>
                    <span className="flex shrink-0 gap-1">
                      <Badge variant={req.necessity === "REQUIRED" ? "danger" : req.necessity === "CONDITIONAL" ? "warning" : "outline"}>
                        {humanize(req.necessity)}
                      </Badge>
                      {req.sensitivity === "RESTRICTED" && <Badge variant="warning">Restricted</Badge>}
                    </span>
                  </li>
                ))}
                {category.documentRequirements.length === 0 && (
                  <li className="text-sm text-slate-400">No requirements configured.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
