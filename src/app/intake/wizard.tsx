"use client";

import { useMemo, useState, useTransition } from "react";
import { submitIntakeAction } from "@/server/actions/intake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { humanize } from "@/lib/utils";

type Question = {
  key: string;
  block: string;
  label: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  dependsOnKey: string | null;
  dependsOnValue: string | null;
};

type Result = {
  score: number;
  outcome: string;
  routes: Array<{ visaKey: string; rationale: string }>;
};

export type IntakeLabels = {
  contact: string; fullName: string; email: string;
  continue: string; back: string; review: string;
  submit: string; submitting: string; select: string;
  scoreLabel: string; scoreNote: string; pathsTitle: string; draftsNote: string;
  nothingBlock: string; errorGeneric: string; yes: string; no: string;
  outHigh: string; outPossible: string; outInsufficient: string; outAttorney: string; outRisk: string;
  bIdentity: string; bGoal: string; bHistory: string; bFamily: string; bEducation: string;
  bBusiness: string; bInvestment: string; bRecognition: string; bEmployer: string; bRisk: string;
};

const BLOCK_ORDER = ["identity", "goal", "history", "family", "education", "business", "investment", "recognition", "employer", "risk"];

/** Conditional visibility: dependsOnValue "!X" means "answered and not X". */
function isVisible(q: Question, answers: Record<string, unknown>): boolean {
  if (!q.dependsOnKey || !q.dependsOnValue) return true;
  const answer = answers[q.dependsOnKey];
  if (q.dependsOnValue.startsWith("!")) {
    const excluded = q.dependsOnValue.slice(1);
    return answer != null && String(answer) !== excluded && String(answer) !== "";
  }
  return String(answer) === q.dependsOnValue;
}

export function IntakeWizard({
  questions,
  startLabel,
  labels,
}: {
  questions: Question[];
  startLabel: string;
  labels: IntakeLabels;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [contact, setContact] = useState({ name: "", email: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blockTitle: Record<string, string> = {
    identity: labels.bIdentity, goal: labels.bGoal, history: labels.bHistory, family: labels.bFamily,
    education: labels.bEducation, business: labels.bBusiness, investment: labels.bInvestment,
    recognition: labels.bRecognition, employer: labels.bEmployer, risk: labels.bRisk,
  };
  const outcomeCopy: Record<string, { title: string; tone: string }> = {
    HIGH_FIT_FOR_LEGAL_REVIEW: { title: labels.outHigh, tone: "text-emerald-700" },
    POSSIBLE_ROUTE_TO_EVALUATE: { title: labels.outPossible, tone: "text-sky-700" },
    INSUFFICIENT_DOCUMENTATION: { title: labels.outInsufficient, tone: "text-amber-700" },
    REQUIRES_ATTORNEY_REVIEW: { title: labels.outAttorney, tone: "text-amber-700" },
    ELEVATED_RISK: { title: labels.outRisk, tone: "text-rose-700" },
  };

  const blocks = useMemo(() => BLOCK_ORDER.filter((b) => questions.some((q) => q.block === b)), [questions]);
  const totalSteps = blocks.length + 2;
  const progress = Math.round((step / (totalSteps - 1)) * 100);

  function setAnswer(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await submitIntakeAction({
          tenantSlug: "martinez-immigration",
          name: contact.name,
          email: contact.email,
          answers,
        });
        setResult(res);
      } catch {
        setError(labels.errorGeneric);
      }
    });
  }

  if (result) {
    const copy = outcomeCopy[result.outcome] ?? outcomeCopy.REQUIRES_ATTORNEY_REVIEW;
    return (
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className={`text-lg font-bold ${copy.tone}`}>{copy.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {labels.scoreLabel}: <span className="font-semibold">{result.score}/100</span> ({labels.scoreNote}).
            </p>
            <Progress value={result.score} className="mt-3" />
          </div>

          {result.routes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{labels.pathsTitle}</h3>
              <ul className="mt-2 space-y-2">
                {result.routes.map((route) => (
                  <li key={route.visaKey + route.rationale} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <span className="font-semibold text-brand-700">{route.visaKey}</span>
                    <span className="text-slate-600"> · {route.rationale}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a href={`/start${result.routes[0] ? `?visa=${result.routes[0].visaKey}` : ""}`} className="block">
            <Button className="w-full">{startLabel}</Button>
          </a>

          <div className="rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
            {labels.draftsNote}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 0: contact
  if (step === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <Progress value={progress} />
          <h2 className="text-base font-semibold">{labels.contact}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">{labels.fullName}</Label>
            <Input id="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{labels.email}</Label>
            <Input id="email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(1)}
              disabled={contact.name.trim().length < 2 || !contact.email.includes("@")}
            >
              {labels.continue}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Review step
  if (step === totalSteps - 1) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <Progress value={progress} />
          <h2 className="text-base font-semibold">{labels.review}</h2>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-3 text-sm">
            {questions.filter((q) => isVisible(q, answers) && answers[q.key] != null && answers[q.key] !== "").map((q) => (
              <div key={q.key} className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">{q.label}</span>
                <span className="font-medium">{String(answers[q.key])}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(step - 1)}>{labels.back}</Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? labels.submitting : labels.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const block = blocks[step - 1];
  const blockQuestions = questions.filter((q) => q.block === block && isVisible(q, answers));
  const missingRequired = blockQuestions.some(
    (q) => q.required && (answers[q.key] == null || answers[q.key] === "")
  );

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <Progress value={progress} />
        <h2 className="text-base font-semibold">{blockTitle[block] ?? humanize(block)}</h2>
        <div className="space-y-4">
          {blockQuestions.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label htmlFor={q.key}>
                {q.label}
                {q.required && <span className="text-rose-500"> *</span>}
              </Label>
              {q.fieldType === "BOOLEAN" ? (
                <div className="flex gap-2">
                  {[{ v: true, label: labels.yes }, { v: false, label: labels.no }].map(({ v, label }) => (
                    <Button
                      key={label}
                      type="button"
                      variant={answers[q.key] === v ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setAnswer(q.key, v)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              ) : q.fieldType === "SELECT" ? (
                <Select
                  id={q.key}
                  value={String(answers[q.key] ?? "")}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                >
                  <option value="">{labels.select}</option>
                  {(q.options ?? []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              ) : q.fieldType === "TEXTAREA" ? (
                <Textarea
                  id={q.key}
                  value={String(answers[q.key] ?? "")}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                />
              ) : q.fieldType === "NUMBER" ? (
                <Input
                  id={q.key}
                  type="number"
                  value={String(answers[q.key] ?? "")}
                  onChange={(e) => setAnswer(q.key, e.target.value === "" ? "" : Number(e.target.value))}
                />
              ) : (
                <Input
                  id={q.key}
                  value={String(answers[q.key] ?? "")}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {blockQuestions.length === 0 && (
            <p className="text-sm text-slate-500">{labels.nothingBlock}</p>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setStep(step - 1)}>{labels.back}</Button>
          <Button onClick={() => setStep(step + 1)} disabled={missingRequired}>{labels.continue}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
