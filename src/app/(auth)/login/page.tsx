import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 text-brand-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VisaOps</h1>
          <p className="text-sm text-slate-500">{t.login.title}</p>
        </div>
        <LoginForm
          labels={{
            email: t.login.email,
            password: t.login.password,
            submit: t.login.submit,
            invalid: t.login.invalid,
          }}
        />
      </div>
    </div>
  );
}
