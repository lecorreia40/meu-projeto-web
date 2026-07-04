import type { CaseStatus } from "@prisma/client";

/** Ordered pipeline used to compute progress. Terminal states map explicitly. */
const PIPELINE: CaseStatus[] = [
  "INTAKE_STARTED",
  "INTAKE_COMPLETE",
  "INITIAL_REVIEW",
  "PROPOSAL_SENT",
  "ENGAGEMENT_SIGNED",
  "DOCUMENT_COLLECTION",
  "EVIDENCE_REVIEW",
  "DRAFTING",
  "ATTORNEY_REVIEW",
  "CLIENT_REVIEW",
  "FILING_READY",
  "FILED",
  "RECEIPT_RECEIVED",
  "BIOMETRICS_INTERVIEW",
  "APPROVED",
];

export function caseProgress(status: CaseStatus): number {
  if (status === "APPROVED" || status === "CLOSED" || status === "POST_APPROVAL_MONITORING") return 100;
  if (status === "DENIED") return 100;
  const idx = PIPELINE.indexOf(status);
  if (idx < 0) return 60; // RFE_NOID and other side-states
  return Math.round(((idx + 1) / PIPELINE.length) * 100);
}

/** Plain-language status for the client portal - no legal jargon. */
export function clientFacingStatus(status: CaseStatus): string {
  switch (status) {
    case "INTAKE_STARTED":
    case "INTAKE_COMPLETE":
      return "Getting to know your case";
    case "INITIAL_REVIEW":
    case "PROPOSAL_SENT":
      return "Under initial review";
    case "ENGAGEMENT_SIGNED":
      return "Engagement confirmed";
    case "DOCUMENT_COLLECTION":
      return "Waiting for your documents";
    case "EVIDENCE_REVIEW":
    case "DRAFTING":
    case "ATTORNEY_REVIEW":
      return "In review by the attorney";
    case "CLIENT_REVIEW":
      return "Action needed: your review";
    case "FILING_READY":
      return "Ready for filing";
    case "FILED":
    case "RECEIPT_RECEIVED":
      return "Filed";
    case "BIOMETRICS_INTERVIEW":
      return "Appointment stage";
    case "RFE_NOID":
      return "Additional information requested";
    case "APPROVED":
      return "Approved";
    case "DENIED":
      return "Decision received";
    case "CLOSED":
      return "Closed";
    case "POST_APPROVAL_MONITORING":
      return "Approved - compliance monitoring";
    default:
      return "In progress";
  }
}

export const STATUS_COLORS: Record<string, string> = {
  INTAKE_STARTED: "bg-slate-100 text-slate-700",
  INTAKE_COMPLETE: "bg-slate-100 text-slate-700",
  INITIAL_REVIEW: "bg-sky-100 text-sky-800",
  PROPOSAL_SENT: "bg-sky-100 text-sky-800",
  ENGAGEMENT_SIGNED: "bg-indigo-100 text-indigo-800",
  DOCUMENT_COLLECTION: "bg-amber-100 text-amber-800",
  EVIDENCE_REVIEW: "bg-violet-100 text-violet-800",
  DRAFTING: "bg-violet-100 text-violet-800",
  ATTORNEY_REVIEW: "bg-purple-100 text-purple-800",
  CLIENT_REVIEW: "bg-orange-100 text-orange-800",
  FILING_READY: "bg-teal-100 text-teal-800",
  FILED: "bg-blue-100 text-blue-800",
  RECEIPT_RECEIVED: "bg-blue-100 text-blue-800",
  BIOMETRICS_INTERVIEW: "bg-cyan-100 text-cyan-800",
  RFE_NOID: "bg-red-100 text-red-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  DENIED: "bg-rose-100 text-rose-800",
  CLOSED: "bg-slate-200 text-slate-600",
  POST_APPROVAL_MONITORING: "bg-emerald-50 text-emerald-700",
};
