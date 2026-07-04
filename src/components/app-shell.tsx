import { ShieldCheck } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { logoutAction } from "@/app/(auth)/actions";

export function AppShell({
  user,
  nav,
  portalLabel,
  locale,
  signOutLabel,
  disclaimer,
  children,
}: {
  user: CurrentUser;
  nav: NavItem[];
  portalLabel: string;
  locale: string;
  signOutLabel: string;
  disclaimer: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) / topbar (mobile) */}
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 text-brand-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">VisaOps</div>
            <div className="text-[11px] text-slate-500">{portalLabel}</div>
          </div>
        </div>
        <SidebarNav items={nav} />
        <div className="mt-auto hidden border-t border-slate-100 px-5 py-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-slate-500">{user.roleName ?? "-"}</div>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button className="text-xs text-slate-500 hover:text-slate-800" type="submit">
              {signOutLabel}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur">
          <div className="text-sm text-slate-500">{user.tenantName ?? "Platform"}</div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <form action={logoutAction} className="lg:hidden">
              <button className="text-xs text-slate-500" type="submit">{signOutLabel}</button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 pb-6 text-[11px] leading-relaxed text-slate-400">
          {disclaimer}
        </footer>
      </div>
    </div>
  );
}
