import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/language-switcher";
import { StartForm } from "./start-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Start your process - VisaOps" };

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ visa?: string }>;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const categories = await db.visaCategory.findMany({
    where: { isActive: true },
    orderBy: { key: "asc" },
    select: { id: true, key: true, name: true },
  });
  const sp = await searchParams;
  const preselect = categories.find((c) => c.key === sp?.visa)?.id ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">VisaOps</span>
        </Link>
        <LanguageSwitcher locale={locale} />
      </header>
      <main className="mx-auto max-w-md px-6 pb-16">
        <h1 className="text-2xl font-bold tracking-tight">{t.start.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.start.subtitle}</p>
        <div className="mt-6">
          <StartForm categories={categories} preselect={preselect} labels={t.start} />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t.start.haveAccount}{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">{t.start.signIn}</Link>
        </p>
      </main>
    </div>
  );
}
