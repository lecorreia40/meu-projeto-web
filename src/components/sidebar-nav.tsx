"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, FileText, MessageSquare,
  CreditCard, Settings, Briefcase, Clock, UserPlus, Shield, Landmark, ScrollText,
  CalendarClock, Handshake, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  cases: FolderOpen,
  tasks: CheckSquare,
  documents: FileText,
  messages: MessageSquare,
  billing: CreditCard,
  settings: Settings,
  briefcase: Briefcase,
  timeline: Clock,
  leads: UserPlus,
  shield: Shield,
  tenants: Landmark,
  audit: ScrollText,
  compliance: CalendarClock,
  partners: Handshake,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active =
          pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
