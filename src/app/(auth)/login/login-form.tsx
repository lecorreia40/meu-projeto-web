"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Labels = { email: string; password: string; submit: string; invalid: string };

export function LoginForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <Card>
      <CardContent className="p-6">
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{labels.email}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{labels.password}</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state.error && <p className="text-sm text-rose-600">{labels.invalid}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? `${labels.submit}…` : labels.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
