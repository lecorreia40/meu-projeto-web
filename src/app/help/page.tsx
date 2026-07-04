import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { requireUser, portalHome } from "@/lib/permissions";
import { guideForRole } from "@/lib/orientation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Help and orientation - VisaOps" };

export default async function HelpPage() {
  const user = await requireUser();
  const guide = guideForRole(user.roleKey, user.isPlatformAdmin);
  const home = portalHome(user);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-brand-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight">VisaOps Help</span>
          </div>
          <Link href={home} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to my workspace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-6 py-8">
        <div>
          <Badge variant="brand">{guide.eyebrow}</Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Getting started as {guide.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{guide.who}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your first day, step by step</CardTitle>
            <CardDescription>The fastest path to getting value from your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Get the most out of it</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {guide.tips.map((tip, i) => (
                <li key={i} className="relative pl-5 text-sm text-slate-700">
                  <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader><CardTitle className="text-amber-800">Good to know</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-700">{guide.cannot}</p></CardContent>
        </Card>

        <p className="px-1 text-xs leading-relaxed text-slate-400">
          This platform organizes and tracks immigration processes. It does not provide legal advice.
          Immigration legal advice must come from a licensed attorney or accredited representative.
        </p>
      </main>
    </div>
  );
}
