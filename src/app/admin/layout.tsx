import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome } from "@/lib/permissions";
import type { NavItem } from "@/components/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/tenants", label: "Tenants", icon: "tenants" },
  { href: "/admin/visa-categories", label: "Visa Categories", icon: "shield" },
  { href: "/admin/audit", label: "Audit Log", icon: "audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.isPlatformAdmin && user.roleKey !== "super_admin") redirect(portalHome(user));

  return (
    <AppShell user={user} nav={NAV} portalLabel="Platform Admin">
      {children}
    </AppShell>
  );
}
