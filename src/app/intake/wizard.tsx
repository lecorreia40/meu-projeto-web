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

const BLOCK_ORDER = ["identity", "goal", "history", "family", "education", "business", "investment", "recognition", "employer", "risk"];
const BLOCK_TITLES: Record<string, string> = {
  identity: "About you",
  goal: "Your objective",
  history: "Immigration history",
  family: "Family",
  education: "Education & experience",
  business: "Business",
  investment: "Investment",
  recognition: "Recognition",
  employer: "Employer / sponsor",
  risk: "Background",
};

const OUTCOME_COPY: Record<string, { title: string; tone: string }> = {
  HIGH_FIT_FOR_LEGAL_REVIEW: { title: "High fit for legal review", tone: "text-emerald-700" },
  POSSIBLE_ROUTE_TO_EVALUATE: { title: "Possible path to evaluate", tone: "text-sky-700" },
  INSUFFICIENT_DOCUMENTATION: { title: "More information needed", tone: "text-amber-700" },
  REQUIRES_ATTORNEY_REVIEW: { title: "Requires attorney review", tone: "text-amber-700" },
  ELEVATED_RISK: { title: "Elevated risk: attorney review required", tone: "text-rose-700" },
};

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

export function IntakeWizard({ questions, startLabel }: { questions: Question[]; startLabel: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [contact, setContact] = useState({ name: "", email: "" });
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blocks = useMemo(() => {
    const present = BLOCK_ORDER.filter((b) => questions.some((q) => q.block === b));
    return present;
  }, [questions]);

  // steps: contact info (0), one per block, review (last)
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
        setError("Something went wrong. Please review your answers and try again.");
      }
    });
  }

  if (result) {
    const copy = OUTCOME_COPY[result.outcome] ?? OUTCOME_COPY.REQUIRES_ATTORNEY_REVIEW;
    return (
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className={`text-lg font-bold ${copy.tone}`}>{copy.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Readiness score: <span className="font-semibold">{result.score}/100</span> (how organized
              your information is, not a probability of approval).
            </p>
            <Progress value={result.score} className="mt-3" />
          </div>

          {result.routes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Paths an attorney could evaluate</h3>
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
            These suggestions are drafts for legal analysis, not a legal opinion or a promise of
            eligibility. A licensed immigration attorney must review your full history before any
            path is recommended. Your answers were shared with the firm and someone will contact
            you to schedule a consultation.
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
          <h2 className="text-base font-semibold">Contact information</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(1)}
              disabled={contact.name.trim().length < 2 || !contact.email.includes("@")}
            >
              Continue
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
          <h2 className="text-base font-semibold">Review and submit</h2>
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
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Submitting…" : "Submit assessment"}
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
        <h2 className="text-base font-semibold">{BLOCK_TITLES[block] ?? humanize(block)}</h2>
        <div className="space-y-4">
          {blockQuestions.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label htmlFor={q.key}>
                {q.label}
                {q.required && <span className="text-rose-500"> *</span>}
              </Label>
              {q.fieldType === "BOOLEAN" ? (
                <div className="flex gap-2">
                  {[{ v: true, label: "Yes" }, { v: false, label: "No" }].map(({ v, label }) => (
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
                  <option value="">Select…</option>
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
            <p className="text-sm text-slate-500">Nothing to answer in this section based on your previous answers.</p>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>
          <Button onClick={() => setStep(step + 1)} disabled={missingRequired}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
