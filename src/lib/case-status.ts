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

type Loc = "en" | "pt" | "es";

const CLIENT_STATUS: Record<string, { en: string; pt: string; es: string }> = {
  GETTING_TO_KNOW: { en: "Getting to know your case", pt: "Conhecendo seu caso", es: "Conociendo su caso" },
  INITIAL_REVIEW: { en: "Under initial review", pt: "Em revisão inicial", es: "En revisión inicial" },
  ENGAGEMENT: { en: "Engagement confirmed", pt: "Contrato confirmado", es: "Contrato confirmado" },
  WAITING_DOCS: { en: "Waiting for your documents", pt: "Aguardando seus documentos", es: "Esperando sus documentos" },
  IN_ATTORNEY_REVIEW: { en: "In review by the attorney", pt: "Em revisão pelo advogado", es: "En revisión por el abogado" },
  CLIENT_REVIEW: { en: "Action needed: your review", pt: "Ação necessária: sua revisão", es: "Acción necesaria: su revisión" },
  FILING_READY: { en: "Ready for filing", pt: "Pronto para protocolo", es: "Listo para presentar" },
  FILED: { en: "Filed", pt: "Protocolado", es: "Presentado" },
  APPOINTMENT: { en: "Appointment stage", pt: "Etapa de agendamento", es: "Etapa de cita" },
  RFE: { en: "Additional information requested", pt: "Informação adicional solicitada", es: "Información adicional solicitada" },
  APPROVED: { en: "Approved", pt: "Aprovado", es: "Aprobado" },
  DENIED: { en: "Decision received", pt: "Decisão recebida", es: "Decisión recibida" },
  CLOSED: { en: "Closed", pt: "Encerrado", es: "Cerrado" },
  MONITORING: { en: "Approved - compliance monitoring", pt: "Aprovado - monitoramento de compliance", es: "Aprobado - monitoreo de cumplimiento" },
  IN_PROGRESS: { en: "In progress", pt: "Em andamento", es: "En progreso" },
};

function clientKey(status: CaseStatus): string {
  switch (status) {
    case "INTAKE_STARTED":
    case "INTAKE_COMPLETE": return "GETTING_TO_KNOW";
    case "INITIAL_REVIEW":
    case "PROPOSAL_SENT": return "INITIAL_REVIEW";
    case "ENGAGEMENT_SIGNED": return "ENGAGEMENT";
    case "DOCUMENT_COLLECTION": return "WAITING_DOCS";
    case "EVIDENCE_REVIEW":
    case "DRAFTING":
    case "ATTORNEY_REVIEW": return "IN_ATTORNEY_REVIEW";
    case "CLIENT_REVIEW": return "CLIENT_REVIEW";
    case "FILING_READY": return "FILING_READY";
    case "FILED":
    case "RECEIPT_RECEIVED": return "FILED";
    case "BIOMETRICS_INTERVIEW": return "APPOINTMENT";
    case "RFE_NOID": return "RFE";
    case "APPROVED": return "APPROVED";
    case "DENIED": return "DENIED";
    case "CLOSED": return "CLOSED";
    case "POST_APPROVAL_MONITORING": return "MONITORING";
    default: return "IN_PROGRESS";
  }
}

/** Plain-language status for the client portal, localized. No legal jargon. */
export function clientFacingStatus(status: CaseStatus, locale: string = "en"): string {
  const entry = CLIENT_STATUS[clientKey(status)];
  return entry[(locale as Loc) in entry ? (locale as Loc) : "en"];
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
