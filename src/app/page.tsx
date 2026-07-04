import Link from "next/link";
import { ShieldCheck, FolderOpen, FileText, Users, CalendarClock, Lock, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  { icon: Users, title: "CRM & Intake", body: "Lead pipeline, smart intake wizard with conditional questions and readiness scoring - reviewed by an attorney before any recommendation." },
  { icon: FolderOpen, title: "Case Workspace", body: "Every case as a controlled operation: status pipeline, team, deadlines, risks, timeline and audit trail." },
  { icon: FileText, title: "Document Vault", body: "Secure uploads, review and approval workflow, versioning, sensitivity levels and locked records after filing." },
  { icon: Workflow, title: "Attorney Gates", body: "Nothing final leaves the platform without attorney approval. Approval gates at every critical stage." },
  { icon: CalendarClock, title: "Post-Approval Compliance", body: "Renewal alerts, I-94 and status expirations, investment monitoring and corporate compliance calendar." },
  { icon: Lock, title: "Security by Design", body: "Multi-tenant isolation, RBAC + ABAC permissions, immutable audit log for every sensitive action." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">VisaOps</span>
        </div>
        <Link href="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-16 pt-14 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Visa Lifecycle Management Platform
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          The operating system for immigration practices
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Reduce operational chaos and turn every case into an auditable, secure and clear
          workflow - for clients, attorneys and partners. Before, during and after the visa.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/intake">
            <Button size="lg">Start free assessment</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">Firm portal</Button>
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-slate-400">
          VisaOps organizes, automates, educates and tracks. It does not replace your attorney:
          immigration legal advice must come from a licensed attorney or accredited representative.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-6">
              <f.icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
