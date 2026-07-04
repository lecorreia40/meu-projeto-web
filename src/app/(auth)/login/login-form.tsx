"use client";

import { useActionState, useRef } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Labels = { email: string; password: string; submit: string; invalid: string };

const DEMO_PASSWORD = "demo1234";
const DEMO_ACCOUNTS: Array<{ email: string; role: string }> = [
  { email: "owner@martinezlaw.dev", role: "Firm owner" },
  { email: "attorney@martinezlaw.dev", role: "Attorney" },
  { email: "paralegal@martinezlaw.dev", role: "Paralegal" },
  { email: "client@example.dev", role: "Client" },
  { email: "partner@cpafirm.dev", role: "Partner" },
  { email: "admin@visaops.dev", role: "Admin" },
];

export function LoginForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillAndSubmit(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <form ref={formRef} action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{labels.email}</Label>
              <Input ref={emailRef} id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{labels.password}</Label>
              <Input ref={passwordRef} id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state.error && <p className="text-sm text-rose-600">{labels.invalid}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? `${labels.submit}…` : labels.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p className="mb-2 font-semibold text-slate-600">Demo accounts (password: {DEMO_PASSWORD})</p>
        <p className="mb-2 text-slate-400">Click an account to sign in instantly.</p>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillAndSubmit(account.email)}
              disabled={pending}
              className="flex flex-col items-start rounded-md border border-slate-200 px-2.5 py-1.5 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="font-medium text-slate-700">{account.role}</span>
              <span className="text-slate-400">{account.email}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
