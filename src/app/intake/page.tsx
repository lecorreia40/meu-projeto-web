import { getIntakeQuestions } from "@/server/actions/intake";
import { IntakeWizard } from "./wizard";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Free Assessment - VisaOps" };

// Intake questions are configurable data, so render on demand (never prerender).
export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const questions = await getIntakeQuestions();
  const locale = await getLocale();
  const t = getDictionary(locale);
  const label = (q: { label: string; labelPt: string | null; labelEs: string | null }) =>
    locale === "pt" ? q.labelPt ?? q.label : locale === "es" ? q.labelEs ?? q.label : q.label;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-brand-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">VisaOps</span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-2xl font-bold tracking-tight">{t.intake.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.intake.subtitle}</p>
        <div className="mt-8">
          <IntakeWizard
            questions={questions.map((q) => ({
              key: q.key,
              block: q.block,
              label: label(q),
              fieldType: q.fieldType,
              options: (q.options as string[] | null) ?? null,
              required: q.required,
              dependsOnKey: q.dependsOnKey,
              dependsOnValue: q.dependsOnValue,
            }))}
            startLabel={t.start.create}
            labels={t.intake}
          />
        </div>
      </main>
    </div>
  );
}
