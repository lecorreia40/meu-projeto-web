"use client";

import { useActionState } from "react";
import { selfServeSignupAction, type SelfServeState } from "@/server/actions/self-serve";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type StartLabels = {
  name: string;
  email: string;
  password: string;
  visa: string;
  choose: string;
  create: string;
  disclaimer: string;
  errInvalid: string;
  errEmailTaken: string;
  errUnavailable: string;
};

export function StartForm({
  categories,
  preselect,
  labels,
}: {
  categories: { id: string; key: string; name: string }[];
  preselect: string;
  labels: StartLabels;
}) {
  const [state, action, pending] = useActionState<SelfServeState, FormData>(selfServeSignupAction, {});

  const errorText =
    state.error === "email_taken"
      ? labels.errEmailTaken
      : state.error === "unavailable"
        ? labels.errUnavailable
        : state.error
          ? labels.errInvalid
          : null;

  return (
    <Card>
      <CardContent className="p-6">
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{labels.name}</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{labels.email}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{labels.password}</Label>
            <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visaCategoryId">{labels.visa}</Label>
            <Select id="visaCategoryId" name="visaCategoryId" required defaultValue={preselect}>
              <option value="" disabled>{labels.choose}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.key} - {c.name}</option>
              ))}
            </Select>
          </div>
          {errorText && <p className="text-sm text-rose-600">{errorText}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {labels.create}
          </Button>
          <p className="text-xs leading-relaxed text-slate-400">{labels.disclaimer}</p>
        </form>
      </CardContent>
    </Card>
  );
}
