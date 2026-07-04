import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { title: "Sign in - VisaOps" };

export default async function LoginPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VisaOps</h1>
          <p className="text-sm text-slate-500">{t.login.title}</p>
          <LanguageSwitcher locale={locale} className="mt-1" />
        </div>
        <LoginForm
          labels={{
            email: t.login.email,
            password: t.login.password,
            submit: t.login.submit,
            invalid: t.login.invalid,
          }}
        />
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
          <p className="mb-1 font-semibold text-slate-600">Demo accounts (password: demo1234)</p>
          <p>owner@martinezlaw.dev · attorney@martinezlaw.dev · paralegal@martinezlaw.dev</p>
          <p>client@example.dev · partner@cpafirm.dev · admin@visaops.dev</p>
        </div>
      </div>
    </div>
  );
}
