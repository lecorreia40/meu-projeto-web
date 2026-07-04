/**
 * AI guardrails.
 *
 * The AI layer is an operational assistant, never an automatic lawyer:
 *  - Legal-advice questions are refused with a standard redirect message.
 *  - Every interaction (including blocked ones) is stored in AIInteraction.
 *  - Route suggestions are created as DRAFT and only become visible as
 *    recommendations after an attorney review (ReviewStatus).
 *  - The AI never changes case status, never sends final documents, and never
 *    promises outcomes - those paths simply don't exist in this module.
 */
import "server-only";
import { db } from "@/lib/db";

export const LEGAL_ADVICE_REDIRECT =
  "This point requires review by an authorized attorney. I can organize your information and prepare a summary for legal analysis.";

/** Patterns that indicate a request for individualized legal advice or evasion. */
const BLOCKED_PATTERNS: RegExp[] = [
  /which visa should i (apply|choose|get)/i,
  /guarantee.*(approval|visa)/i,
  /(can|may) i work (on|with) (a )?b1|b2/i,
  /what should i (answer|say|respond) to (the )?uscis/i,
  /how (do|can) i hide/i,
  /conceal.*(overstay|denial|record|problem)/i,
  /fill (out|in).*(final|legal) response/i,
  /qual visto devo/i,
  /garantia de aprova/i,
  /como ocultar/i,
];

export function isBlockedRequest(prompt: string): boolean {
  return BLOCKED_PATTERNS.some((re) => re.test(prompt));
}

export type AIRequest = {
  tenantId: string;
  userId?: string;
  caseId?: string;
  kind:
    | "DOCUMENT_SUMMARY"
    | "DATA_EXTRACTION"
    | "CHECKLIST_SUGGESTION"
    | "MESSAGE_DRAFT"
    | "CASE_SUMMARY"
    | "INCONSISTENCY_CHECK"
    | "TRANSLATION"
    | "ROUTE_SUGGESTION"
    | "OTHER";
  prompt: string;
};

/**
 * Gate + log an AI interaction. Callers plug the actual model call in
 * `generate`; this wrapper guarantees guardrails and auditability around it.
 */
export async function runGuardedAI(
  req: AIRequest,
  generate: (prompt: string) => Promise<string>
): Promise<{ blocked: boolean; response: string; interactionId: string }> {
  if (isBlockedRequest(req.prompt)) {
    const interaction = await db.aIInteraction.create({
      data: {
        tenantId: req.tenantId,
        userId: req.userId,
        caseId: req.caseId,
        kind: "BLOCKED_REQUEST",
        prompt: req.prompt,
        response: LEGAL_ADVICE_REDIRECT,
        blocked: true,
      },
    });
    return { blocked: true, response: LEGAL_ADVICE_REDIRECT, interactionId: interaction.id };
  }

  const response = await generate(req.prompt);
  const interaction = await db.aIInteraction.create({
    data: {
      tenantId: req.tenantId,
      userId: req.userId,
      caseId: req.caseId,
      kind: req.kind,
      prompt: req.prompt,
      response,
      // Route suggestions require attorney review before leaving DRAFT
      reviewStatus: "DRAFT",
    },
  });
  return { blocked: false, response, interactionId: interaction.id };
}
