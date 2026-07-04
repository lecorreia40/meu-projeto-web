import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUser, portalHome, isClientRole } from "@/lib/permissions";
import type { NavItem } from "@/components/sidebar-nav";

const NAV: NavItem[] = [
  { href: "/client", label: "My Case", icon: "briefcase" },
  { href: "/client/tasks", label: "Tasks", icon: "tasks" },
  { href: "/client/documents", label: "Documents", icon: "documents" },
  { href: "/client/messages", label: "Messages", icon: "messages" },
  { href: "/client/payments", label: "Payments", icon: "billing" },
  { href: "/client/timeline", label: "Timeline", icon: "timeline" },
  { href: "/help", label: "Help", icon: "briefcase" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!isClientRole(user)) redirect(portalHome(user));

  return (
    <AppShell user={user} nav={NAV} portalLabel="Client Portal">
      {children}
    </AppShell>
  );
}
