/**
 * Per-case health / readiness score.
 *
 * A weighted composite (0..100) of the operational signals a firm cares about:
 * how complete the visa form is, how far the document checklist has progressed,
 * document quality, open risk flags, and deadline pressure. It is computed live
 * from existing case data (no stored column) and is distinct from the manually
 * set RiskLevel.
 *
 * The score is an operational readiness indicator, NOT a prediction of approval.
 */
import { visaFormCompleteness } from "@/lib/visa-forms";

export type HealthBand = "good" | "warning" | "critical";

export type HealthFactor = {
  key: string;
  pct: number; // 0..100 contribution health for this factor
  weight: number;
  tone: HealthBand;
};

export type CaseHealth = {
  score: number; // 0..100
  band: HealthBand;
  factors: HealthFactor[];
};

export type HealthInput = {
  visaKey: string;
  formData: Record<string, unknown> | null | undefined;
  checklistStatuses: string[]; // ChecklistItemStatus values
  documentStatuses: string[]; // DocumentStatus values
  openRiskFlags: { severity: string }[];
  nextDeadlineAt: Date | string | null | undefined;
  status: string; // CaseStatus
};

const RISK_WEIGHT: Record<string, number> = {
  UNKNOWN: 0.1,
  LOW: 0.15,
  MEDIUM: 0.35,
  HIGH: 0.6,
  CRITICAL: 1,
};

function bandFor(pct: number): HealthBand {
  if (pct >= 75) return "good";
  if (pct >= 50) return "warning";
  return "critical";
}

export function computeCaseHealth(input: HealthInput): CaseHealth {
  // 1) Visa form completeness
  const form = visaFormCompleteness(input.visaKey, input.formData ?? {}) * 100;

  // 2) Checklist progress: approved / total (waived counts as done)
  const totalItems = input.checklistStatuses.length;
  const doneItems = input.checklistStatuses.filter((s) => s === "APPROVED" || s === "WAIVED").length;
  const checklist = totalItems === 0 ? 0 : (doneItems / totalItems) * 100;

  // 3) Document quality: penalize rejected; reward approved among reviewed
  const docs = input.documentStatuses;
  const rejected = docs.filter((s) => s === "REJECTED" || s === "EXPIRED").length;
  const docQuality = docs.length === 0 ? 60 : Math.max(0, 100 - (rejected / docs.length) * 100);

  // 4) Risk: subtract accumulated severity of open flags
  const riskLoad = Math.min(1, input.openRiskFlags.reduce((sum, f) => sum + (RISK_WEIGHT[f.severity] ?? 0.2), 0));
  const risk = (1 - riskLoad) * 100;

  // 5) Deadline pressure
  let deadline = 100;
  if (input.nextDeadlineAt && !["APPROVED", "CLOSED", "DENIED"].includes(input.status)) {
    const days = (new Date(input.nextDeadlineAt).getTime() - Date.now()) / 86400000;
    if (days < 0) deadline = 20; // overdue
    else if (days < 3) deadline = 45;
    else if (days < 7) deadline = 65;
    else if (days < 14) deadline = 85;
  }

  const factors: HealthFactor[] = [
    { key: "form", pct: Math.round(form), weight: 25, tone: bandFor(form) },
    { key: "checklist", pct: Math.round(checklist), weight: 30, tone: bandFor(checklist) },
    { key: "documents", pct: Math.round(docQuality), weight: 15, tone: bandFor(docQuality) },
    { key: "risk", pct: Math.round(risk), weight: 15, tone: bandFor(risk) },
    { key: "deadline", pct: Math.round(deadline), weight: 15, tone: bandFor(deadline) },
  ];

  const weightSum = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(factors.reduce((s, f) => s + f.pct * f.weight, 0) / weightSum);

  return { score, band: bandFor(score), factors };
}

export const HEALTH_TONE_CLASS: Record<HealthBand, string> = {
  good: "text-emerald-600",
  warning: "text-amber-600",
  critical: "text-rose-600",
};

export const HEALTH_BADGE_CLASS: Record<HealthBand, string> = {
  good: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-rose-100 text-rose-800",
};
