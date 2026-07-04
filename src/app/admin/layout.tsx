import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome } from "@/lib/permissions";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { NavItem } from "@/components/sidebar-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.isPlatformAdmin && user.roleKey !== "super_admin") redirect(portalHome(user));

  const locale = await getLocale();
  const t = getDictionary(locale);
  const nav: NavItem[] = [
    { href: "/admin", label: t.nav.dashboard, icon: "dashboard" },
    { href: "/admin/tenants", label: t.nav.tenants, icon: "tenants" },
    { href: "/admin/users", label: t.nav.users, icon: "users" },
    { href: "/admin/visa-categories", label: t.nav.visaCategories, icon: "shield" },
    { href: "/admin/audit", label: t.nav.auditLog, icon: "audit" },
    { href: "/help", label: t.nav.help, icon: "briefcase" },
  ];

  return (
    <AppShell
      user={user}
      nav={nav}
      portalLabel={t.portalLabel.admin}
      locale={locale}
      signOutLabel={t.common.signOut}
      disclaimer={t.disclaimer}
    >
      {children}
    </AppShell>
  );
}
