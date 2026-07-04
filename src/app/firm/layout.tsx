import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isClientRole, isPartnerRole } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { NavItem } from "@/components/sidebar-nav";

export default async function FirmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (isClientRole(user) || isPartnerRole(user)) redirect(portalHome(user));

  const locale = await getLocale();
  const t = getDictionary(locale);
  const nav: NavItem[] = [
    { href: "/firm", label: t.nav.dashboard, icon: "dashboard" },
    { href: "/firm/leads", label: t.nav.leads, icon: "leads" },
    { href: "/firm/clients", label: t.nav.clients, icon: "users" },
    { href: "/firm/cases", label: t.nav.cases, icon: "cases" },
    { href: "/firm/tasks", label: t.nav.tasks, icon: "tasks" },
    { href: "/firm/documents", label: t.nav.documents, icon: "documents" },
    { href: "/firm/partners", label: t.nav.partners, icon: "partners" },
    { href: "/firm/billing", label: t.nav.billing, icon: "billing" },
    { href: "/firm/compliance", label: t.nav.compliance, icon: "compliance" },
    { href: "/help", label: t.nav.help, icon: "briefcase" },
  ];

  return (
    <AppShell
      user={user}
      nav={nav}
      portalLabel={t.portalLabel.firm}
      locale={locale}
      signOutLabel={t.common.signOut}
      disclaimer={t.disclaimer}
    >
      {children}
    </AppShell>
  );
}
