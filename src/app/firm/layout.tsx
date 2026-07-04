import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isClientRole, isPartnerRole } from "@/lib/permissions";
import type { NavItem } from "@/components/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/firm", label: "Dashboard", icon: "dashboard" },
  { href: "/firm/leads", label: "Leads", icon: "leads" },
  { href: "/firm/clients", label: "Clients", icon: "users" },
  { href: "/firm/cases", label: "Cases", icon: "cases" },
  { href: "/firm/tasks", label: "Tasks", icon: "tasks" },
  { href: "/firm/documents", label: "Documents", icon: "documents" },
  { href: "/firm/partners", label: "Partners", icon: "partners" },
  { href: "/firm/billing", label: "Billing", icon: "billing" },
  { href: "/firm/compliance", label: "Compliance", icon: "compliance" },
];

export default async function FirmLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (isClientRole(user) || isPartnerRole(user)) redirect(portalHome(user));

  return (
    <AppShell user={user} nav={NAV} portalLabel="Law Firm Portal">
      {children}
    </AppShell>
  );
}
