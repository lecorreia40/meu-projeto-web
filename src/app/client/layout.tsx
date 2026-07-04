import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isClientRole } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { NavItem } from "@/components/sidebar-nav";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!isClientRole(user)) redirect(portalHome(user));

  const locale = await getLocale();
  const t = getDictionary(locale);
  const nav: NavItem[] = [
    { href: "/client", label: t.nav.myCase, icon: "briefcase" },
    { href: "/client/tasks", label: t.nav.tasks, icon: "tasks" },
    { href: "/client/documents", label: t.nav.documents, icon: "documents" },
    { href: "/client/messages", label: t.nav.messages, icon: "messages" },
    { href: "/client/payments", label: t.nav.payments, icon: "billing" },
    { href: "/client/timeline", label: t.nav.timeline, icon: "timeline" },
    { href: "/help", label: t.nav.help, icon: "briefcase" },
  ];

  return (
    <AppShell
      user={user}
      nav={nav}
      portalLabel={t.portalLabel.client}
      locale={locale}
      signOutLabel={t.common.signOut}
      disclaimer={t.disclaimer}
    >
      {children}
    </AppShell>
  );
}
