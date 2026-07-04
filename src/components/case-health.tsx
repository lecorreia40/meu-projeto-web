import { computeCaseHealth, type HealthInput, HEALTH_BADGE_CLASS, HEALTH_TONE_CLASS } from "@/lib/case-health";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Labels = {
  title: string;
  sub: string;
  band: { good: string; warning: string; critical: string };
  factor: { form: string; checklist: string; documents: string; risk: string; deadline: string };
};

const FACTOR_KEYS = ["form", "checklist", "documents", "risk", "deadline"] as const;

/** Compact score chip for tables/lists. */
export function HealthChip({ input }: { input: HealthInput }) {
  const { score, band } = computeCaseHealth(input);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums", HEALTH_BADGE_CLASS[band])}>
      {score}
    </span>
  );
}

/** Full readiness breakdown card for the case workspace. */
export function CaseHealthCard({ input, labels }: { input: HealthInput; labels: Labels }) {
  const { score, band, factors } = computeCaseHealth(input);
  const bandLabel = labels.band[band];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{labels.title}</div>
          <p className="mt-0.5 text-xs text-slate-500">{labels.sub}</p>
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-bold tabular-nums leading-none", HEALTH_TONE_CLASS[band])}>{score}</div>
          <div className={cn("mt-1 text-xs font-medium", HEALTH_TONE_CLASS[band])}>{bandLabel}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {factors.map((f) => {
          const key = f.key as (typeof FACTOR_KEYS)[number];
          return (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-600">{labels.factor[key]}</span>
                <span className="tabular-nums text-slate-400">{f.pct}%</span>
              </div>
              <Progress value={f.pct} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
