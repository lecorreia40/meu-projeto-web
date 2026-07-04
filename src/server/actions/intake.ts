"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

/**
 * Public intake wizard submission.
 *
 * The output is a READINESS score (documentation/organization), never approval
 * odds, and any suggested routes are stored as DRAFT requiring attorney review
 * (EligibilityAssessment.reviewStatus) before they can be presented as
 * recommendations.
 */
const submitSchema = z.object({
  tenantSlug: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  answers: z.record(z.string(), z.unknown()),
});

type RouteSuggestion = { visaKey: string; rationale: string };

function scoreAndSuggest(answers: Record<string, unknown>): {
  score: number;
  outcome: "HIGH_FIT_FOR_LEGAL_REVIEW" | "POSSIBLE_ROUTE_TO_EVALUATE" | "INSUFFICIENT_DOCUMENTATION" | "REQUIRES_ATTORNEY_REVIEW" | "ELEVATED_RISK";
  routes: RouteSuggestion[];
} {
  let score = 40;
  const routes: RouteSuggestion[] = [];
  const val = (k: string) => answers[k];

  // Risk signals dominate: anything flagged goes straight to attorney review
  const risky = val("overstay") === true || val("deportation") === true || val("criminal_history") === true;
  const denied = val("prior_denials") === true;

  if (val("goal") === "Invest") {
    const capital = String(val("investment_capital") ?? "");
    if (capital === "$100k-$500k" || capital === "$500k-$1M") {
      routes.push({ visaKey: "E-2", rationale: "Investment capital in typical E-2 range (draft - attorney must confirm treaty eligibility)" });
      score += 20;
    }
    if (capital === "$500k-$1M" || capital === "Over $1M") {
      routes.push({ visaKey: "EB-5-DIRECT", rationale: "Capital may reach EB-5 thresholds (draft - attorney review required)" });
      score += 10;
    }
  }
  if (val("goal") === "Transfer my company" && val("owns_business") === true) {
    routes.push({ visaKey: "L-1A", rationale: "Existing company and transfer objective (draft)" });
    score += 20;
  }
  if (val("goal") === "Work" && val("has_sponsor") === true) {
    routes.push({ visaKey: "H-1B", rationale: "US sponsor present (draft)" });
    score += 15;
  }
  if (val("awards") === true) {
    routes.push({ visaKey: "O-1", rationale: "Recognition evidence reported (draft)" });
    routes.push({ visaKey: "EB-1A", rationale: "Recognition evidence reported (draft)" });
    score += 10;
  }
  if ((val("highest_degree") === "Master" || val("highest_degree") === "PhD" || val("highest_degree") === "MBA") && val("goal") === "Green card") {
    routes.push({ visaKey: "EB-2-NIW", rationale: "Advanced degree with permanent-residence objective (draft)" });
    score += 10;
  }
  if (val("goal") === "Study") {
    routes.push({ visaKey: "F-1", rationale: "Study objective (draft)" });
    score += 15;
  }
  if (val("goal") === "Visit") {
    routes.push({ visaKey: "B1-B2", rationale: "Visit objective (draft)" });
    score += 15;
  }

  score = Math.max(5, Math.min(95, score));

  if (risky) return { score: Math.min(score, 45), outcome: "ELEVATED_RISK", routes };
  if (denied) return { score: Math.min(score, 60), outcome: "REQUIRES_ATTORNEY_REVIEW", routes };
  if (routes.length === 0) return { score: Math.min(score, 50), outcome: "INSUFFICIENT_DOCUMENTATION", routes };
  if (score >= 65) return { score, outcome: "HIGH_FIT_FOR_LEGAL_REVIEW", routes };
  return { score, outcome: "POSSIBLE_ROUTE_TO_EVALUATE", routes };
}

export async function submitIntakeAction(payload: {
  tenantSlug: string;
  name: string;
  email: string;
  answers: Record<string, unknown>;
}) {
  const parsed = submitSchema.parse(payload);

  const tenant = await db.tenant.findUnique({ where: { slug: parsed.tenantSlug } });
  if (!tenant) throw new Error("Workspace not found");

  const questions = await db.intakeQuestion.findMany({ where: { isActive: true } });
  const byKey = new Map(questions.map((q) => [q.key, q]));

  const form = await db.intakeForm.create({
    data: {
      tenantId: tenant.id,
      clientName: parsed.name,
      clientEmail: parsed.email,
      goal: String(parsed.answers["goal"] ?? ""),
      status: "SUBMITTED",
      answers: {
        create: Object.entries(parsed.answers)
          .filter(([key]) => byKey.has(key))
          .map(([key, value]) => ({
            questionId: byKey.get(key)!.id,
            value: value as never,
          })),
      },
    },
  });

  // Also create a lead in the firm's CRM
  await db.lead.create({
    data: {
      tenantId: tenant.id,
      name: parsed.name,
      email: parsed.email,
      source: "LANDING_PAGE",
      stage: "SCREENING",
      interest: String(parsed.answers["goal"] ?? "") || null,
    },
  });

  const { score, outcome, routes } = scoreAndSuggest(parsed.answers);

  await writeAudit({
    tenantId: tenant.id,
    action: "intake.submit",
    entity: "IntakeForm",
    entityId: form.id,
    metadata: { outcome, score },
  });

  return { formId: form.id, score, outcome, routes };
}

export async function getIntakeQuestions() {
  return db.intakeQuestion.findMany({
    where: { isActive: true, visaCategoryId: null },
    orderBy: { sortOrder: "asc" },
  });
}
