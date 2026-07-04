import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, canAccessCase } from "@/lib/permissions";
import { getVisaForm } from "@/lib/visa-forms";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { VisaFormClient } from "./visa-form-client";

export default async function CaseFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!(await canAccessCase(user, id))) notFound();

  const kase = await db.case.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, caseNumberInternal: true, formData: true, visaCategory: { select: { key: true, name: true } } },
  });
  if (!kase) notFound();

  const f = getDictionary(await getLocale()).firm;
  const sections = getVisaForm(kase.visaCategory.key);
  const initial = (kase.formData as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/firm/cases/${kase.id}`} className="text-xs text-brand-700 hover:underline">← {kase.caseNumberInternal}</Link>
        <h1 className="mt-1 text-xl font-bold tracking-tight">{f.visaForm} · {kase.visaCategory.name}</h1>
        <p className="text-sm text-slate-500">{f.visaFormSub}</p>
      </div>

      <VisaFormClient
        caseId={kase.id}
        sections={sections}
        initial={initial}
        labels={{
          save: f.formSave,
          saving: f.formSaving,
          saved: f.formSaved,
          progress: f.formProgress,
          yes: f.yes,
          no: f.no,
          fixErrors: f.formFixErrors,
          vmsg: {
            required: f.vmRequired,
            email: f.vmEmail,
            number: f.vmNumber,
            format: f.vmFormat,
            invalid: f.vmInvalid,
            min: f.vmMin,
            max: f.vmMax,
            minlen: f.vmMinlen,
            maxlen: f.vmMaxlen,
          },
        }}
      />
    </div>
  );
}
