import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
        <div
          className={cn("mt-1 text-2xl font-bold tracking-tight", {
            "text-slate-900": tone === "default",
            "text-amber-600": tone === "warning",
            "text-rose-600": tone === "danger",
            "text-emerald-600": tone === "success",
          })}
        >
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
      </CardContent>
    </Card>
  );
}
