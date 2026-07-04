import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isPartnerRole } from "@/lib/permissions";
import type { NavItem } from "@/components/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/partner", label: "Assigned Tasks", icon: "tasks" },
  { href: "/partner/documents", label: "Shared Documents", icon: "documents" },
];

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!isPartnerRole(user)) redirect(portalHome(user));

  return (
    <AppShell user={user} nav={NAV} portalLabel="Partner Portal">
      {children}
    </AppShell>
  );
}
