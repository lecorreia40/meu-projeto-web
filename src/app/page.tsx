import Link from "next/link";
import { ShieldCheck, FolderOpen, FileText, Users, CalendarClock, Lock, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function LandingPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const L = t.landing;

  const features = [
    { icon: Users, title: L.f1t, body: L.f1b },
    { icon: FolderOpen, title: L.f2t, body: L.f2b },
    { icon: FileText, title: L.f3t, body: L.f3b },
    { icon: Workflow, title: L.f4t, body: L.f4b },
    { icon: CalendarClock, title: L.f5t, body: L.f5b },
    { icon: Lock, title: L.f6t, body: L.f6b },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-brand-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">VisaOps</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link href="/login">
            <Button variant="secondary">{L.signIn}</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-14 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {L.badge}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{L.title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{L.subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/start">
            <Button size="lg">{L.ctaStartProcess}</Button>
          </Link>
          <Link href="/intake">
            <Button size="lg" variant="secondary">{L.ctaStart}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost">{L.ctaFirm}</Button>
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-slate-400">{L.note}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-6">
              <f.icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">{L.forWho}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { t: L.vFirmsT, b: L.vFirmsB },
              { t: L.vAgenciesT, b: L.vAgenciesB },
              { t: L.vIndividualsT, b: L.vIndividualsB },
            ].map((v) => (
              <Card key={v.t}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900">{v.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{v.b}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/start">
              <Button size="lg">{L.ctaStartProcess}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
