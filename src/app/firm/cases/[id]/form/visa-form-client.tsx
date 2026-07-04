"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VisaSection } from "@/lib/visa-forms";
import { validateVisaField } from "@/lib/visa-forms";
import { saveVisaFormAction } from "@/server/actions/visa-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export type VisaFormLabels = {
  save: string;
  saving: string;
  saved: string;
  progress: string;
  yes: string;
  no: string;
  fixErrors: string;
  vmsg: Record<string, string>; // required,email,number,format,invalid + templated min/max/minlen/maxlen
};

function msg(code: string, vmsg: Record<string, string>): string {
  const [base, param] = code.split(":");
  const tpl = vmsg[base] ?? code;
  return param ? tpl.replace("{n}", param) : tpl;
}

function isVisible(field: VisaSection["fields"][number], values: Record<string, unknown>): boolean {
  if (!field.dependsOn) return true;
  const dep = values[field.dependsOn];
  if (field.dependsValue != null) return String(dep) === field.dependsValue;
  return Boolean(dep);
}

export function VisaFormClient({
  caseId,
  sections,
  initial,
  labels,
}: {
  caseId: string;
  sections: VisaSection[];
  initial: Record<string, unknown>;
  labels: VisaFormLabels;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initial ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const allFields = useMemo(() => sections.flatMap((s) => s.fields), [sections]);
  const requiredVisible = allFields.filter((f) => f.required && isVisible(f, values));
  const filled = requiredVisible.filter((f) => {
    const v = values[f.key];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length;
  const progress = requiredVisible.length ? Math.round((filled / requiredVisible.length) * 100) : 100;

  function setField(key: string, value: unknown) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
    const field = allFields.find((f) => f.key === key)!;
    const err = validateVisaField(field, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err && err !== "required") next[key] = err;
      else delete next[key];
      return next;
    });
  }

  function submit() {
    // Validate visible, filled fields for format
    const next: Record<string, string> = {};
    for (const f of allFields) {
      if (!isVisible(f, values)) continue;
      const err = validateVisaField(f, values[f.key]);
      if (err && err !== "required") next[f.key] = err;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const res = await saveVisaFormAction(caseId, values);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else if (res.errors) {
        setErrors(res.errors);
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{labels.progress}</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm font-medium text-emerald-600">{labels.saved}</span>}
            <Button onClick={submit} disabled={pending}>
              {pending ? labels.saving : labels.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-rose-600">{labels.fixErrors}</p>
      )}

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {section.fields.filter((f) => isVisible(f, values)).map((field) => {
              const val = values[field.key];
              const err = errors[field.key];
              const id = `f_${field.key}`;
              return (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
                  <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-rose-500"> *</span>}
                  </Label>
                  {field.type === "boolean" ? (
                    <div className="flex gap-2">
                      {[{ v: "true", l: labels.yes }, { v: "false", l: labels.no }].map(({ v, l }) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={String(val) === v ? "default" : "secondary"}
                          onClick={() => setField(field.key, v)}
                        >
                          {l}
                        </Button>
                      ))}
                    </div>
                  ) : field.type === "select" ? (
                    <Select id={id} value={String(val ?? "")} onChange={(e) => setField(field.key, e.target.value)}>
                      <option value="">—</option>
                      {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea id={id} value={String(val ?? "")} onChange={(e) => setField(field.key, e.target.value)} />
                  ) : (
                    <Input
                      id={id}
                      type={field.type === "number" || field.type === "money" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                      value={String(val ?? "")}
                      onChange={(e) => setField(field.key, e.target.value)}
                    />
                  )}
                  {field.help && !err && <p className="text-xs text-slate-400">{field.help}</p>}
                  {field.patternHint && !err && field.pattern && <p className="text-xs text-slate-400">{field.patternHint}</p>}
                  {err && <p className="text-xs text-rose-600">{msg(err, labels.vmsg)}</p>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
