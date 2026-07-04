import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isPartnerRole } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { NavItem } from "@/components/sidebar-nav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!isPartnerRole(user)) redirect(portalHome(user));

  const locale = await getLocale();
  const t = getDictionary(locale);
  const nav: NavItem[] = [
    { href: "/partner", label: t.nav.assignedTasks, icon: "tasks" },
    { href: "/partner/documents", label: t.nav.sharedDocuments, icon: "documents" },
    { href: "/help", label: t.nav.help, icon: "briefcase" },
  ];

  return (
    <AppShell
      user={user}
      nav={nav}
      portalLabel={t.portalLabel.partner}
      locale={locale}
      signOutLabel={t.common.signOut}
      disclaimer={t.disclaimer}
    >
      {children}
    </AppShell>
  );
}
