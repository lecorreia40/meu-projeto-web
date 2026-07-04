/**
 * Locale-aware labels for the enum values shown in the UI (status badges,
 * dropdowns, chips). Falls back to a humanized English string for anything
 * not explicitly mapped.
 */
import { humanize } from "@/lib/utils";

type L = { en: string; pt: string; es: string };
type Loc = "en" | "pt" | "es";

const M: Record<string, Record<string, L>> = {
  caseStatus: {
    INTAKE_STARTED: { en: "Intake started", pt: "Intake iniciado", es: "Evaluación iniciada" },
    INTAKE_COMPLETE: { en: "Intake complete", pt: "Intake completo", es: "Evaluación completa" },
    INITIAL_REVIEW: { en: "Initial review", pt: "Revisão inicial", es: "Revisión inicial" },
    PROPOSAL_SENT: { en: "Proposal sent", pt: "Proposta enviada", es: "Propuesta enviada" },
    ENGAGEMENT_SIGNED: { en: "Engagement signed", pt: "Contrato assinado", es: "Contrato firmado" },
    DOCUMENT_COLLECTION: { en: "Document collection", pt: "Coleta de documentos", es: "Recolección de documentos" },
    EVIDENCE_REVIEW: { en: "Evidence review", pt: "Revisão de evidências", es: "Revisión de evidencia" },
    DRAFTING: { en: "Drafting", pt: "Elaboração", es: "Redacción" },
    ATTORNEY_REVIEW: { en: "Attorney review", pt: "Revisão do advogado", es: "Revisión del abogado" },
    CLIENT_REVIEW: { en: "Client review", pt: "Revisão do cliente", es: "Revisión del cliente" },
    FILING_READY: { en: "Filing ready", pt: "Pronto para protocolo", es: "Listo para presentar" },
    FILED: { en: "Filed", pt: "Protocolado", es: "Presentado" },
    RECEIPT_RECEIVED: { en: "Receipt received", pt: "Recibo recebido", es: "Recibo recibido" },
    BIOMETRICS_INTERVIEW: { en: "Biometrics / interview", pt: "Biometria / entrevista", es: "Biometría / entrevista" },
    RFE_NOID: { en: "RFE / NOID", pt: "RFE / NOID", es: "RFE / NOID" },
    APPROVED: { en: "Approved", pt: "Aprovado", es: "Aprobado" },
    DENIED: { en: "Denied", pt: "Negado", es: "Denegado" },
    CLOSED: { en: "Closed", pt: "Encerrado", es: "Cerrado" },
    POST_APPROVAL_MONITORING: { en: "Post-approval monitoring", pt: "Monitoramento pós-aprovação", es: "Monitoreo post-aprobación" },
  },
  riskLevel: {
    UNKNOWN: { en: "Unknown", pt: "Desconhecido", es: "Desconocido" },
    LOW: { en: "Low", pt: "Baixo", es: "Bajo" },
    MEDIUM: { en: "Medium", pt: "Médio", es: "Medio" },
    HIGH: { en: "High", pt: "Alto", es: "Alto" },
    CRITICAL: { en: "Critical", pt: "Crítico", es: "Crítico" },
  },
  taskStatus: {
    OPEN: { en: "Open", pt: "Aberta", es: "Abierta" },
    IN_PROGRESS: { en: "In progress", pt: "Em andamento", es: "En progreso" },
    BLOCKED: { en: "Blocked", pt: "Bloqueada", es: "Bloqueada" },
    DONE: { en: "Done", pt: "Concluída", es: "Completada" },
    CANCELLED: { en: "Cancelled", pt: "Cancelada", es: "Cancelada" },
  },
  checklistStatus: {
    PENDING: { en: "Pending", pt: "Pendente", es: "Pendiente" },
    UPLOADED: { en: "Uploaded", pt: "Enviado", es: "Cargado" },
    IN_REVIEW: { en: "In review", pt: "Em revisão", es: "En revisión" },
    APPROVED: { en: "Approved", pt: "Aprovado", es: "Aprobado" },
    REJECTED: { en: "Rejected", pt: "Rejeitado", es: "Rechazado" },
    WAIVED: { en: "Waived", pt: "Dispensado", es: "Exento" },
  },
  documentStatus: {
    PENDING_REVIEW: { en: "Pending review", pt: "Aguardando revisão", es: "Pendiente de revisión" },
    IN_REVIEW: { en: "In review", pt: "Em revisão", es: "En revisión" },
    APPROVED: { en: "Approved", pt: "Aprovado", es: "Aprobado" },
    REJECTED: { en: "Rejected", pt: "Rejeitado", es: "Rechazado" },
    EXPIRED: { en: "Expired", pt: "Vencido", es: "Vencido" },
    ARCHIVED: { en: "Archived", pt: "Arquivado", es: "Archivado" },
  },
  necessity: {
    REQUIRED: { en: "Required", pt: "Obrigatório", es: "Obligatorio" },
    OPTIONAL: { en: "Optional", pt: "Opcional", es: "Opcional" },
    CONDITIONAL: { en: "Conditional", pt: "Condicional", es: "Condicional" },
  },
  priority: {
    LOW: { en: "Low", pt: "Baixa", es: "Baja" },
    NORMAL: { en: "Normal", pt: "Normal", es: "Normal" },
    HIGH: { en: "High", pt: "Alta", es: "Alta" },
    CRITICAL: { en: "Critical", pt: "Crítica", es: "Crítica" },
  },
  leadStage: {
    NEW: { en: "New", pt: "Novo", es: "Nuevo" },
    SCREENING: { en: "Screening", pt: "Triagem", es: "Evaluación" },
    CONSULT_SCHEDULED: { en: "Consult scheduled", pt: "Consulta agendada", es: "Consulta agendada" },
    CONSULT_DONE: { en: "Consult done", pt: "Consulta feita", es: "Consulta realizada" },
    PROPOSAL_SENT: { en: "Proposal sent", pt: "Proposta enviada", es: "Propuesta enviada" },
    ENGAGED: { en: "Engaged", pt: "Contratado", es: "Contratado" },
    ACTIVE_CASE: { en: "Active case", pt: "Caso ativo", es: "Caso activo" },
    LOST: { en: "Lost", pt: "Perdido", es: "Perdido" },
  },
  leadSource: {
    ORGANIC: { en: "Organic", pt: "Orgânico", es: "Orgánico" },
    ADS: { en: "Ads", pt: "Anúncios", es: "Anuncios" },
    REFERRAL: { en: "Referral", pt: "Indicação", es: "Referido" },
    PARTNER: { en: "Partner", pt: "Parceiro", es: "Socio" },
    LANDING_PAGE: { en: "Landing page", pt: "Landing page", es: "Landing page" },
    WHATSAPP: { en: "WhatsApp", pt: "WhatsApp", es: "WhatsApp" },
    EVENT: { en: "Event", pt: "Evento", es: "Evento" },
    OTHER: { en: "Other", pt: "Outro", es: "Otro" },
  },
  invoiceStatus: {
    DRAFT: { en: "Draft", pt: "Rascunho", es: "Borrador" },
    OPEN: { en: "Open", pt: "Em aberto", es: "Abierta" },
    PAID: { en: "Paid", pt: "Paga", es: "Pagada" },
    PARTIAL: { en: "Partial", pt: "Parcial", es: "Parcial" },
    OVERDUE: { en: "Overdue", pt: "Vencida", es: "Vencida" },
    VOID: { en: "Void", pt: "Anulada", es: "Anulada" },
  },
  billingStatus: {
    PENDING: { en: "Pending", pt: "Pendente", es: "Pendiente" },
    PARTIAL: { en: "Partial", pt: "Parcial", es: "Parcial" },
    PAID: { en: "Paid", pt: "Pago", es: "Pagado" },
    OVERDUE: { en: "Overdue", pt: "Vencido", es: "Vencido" },
    NOT_APPLICABLE: { en: "Not applicable", pt: "Não aplicável", es: "No aplica" },
  },
  channel: {
    OPERATIONAL: { en: "Operational", pt: "Operacional", es: "Operativo" },
    COMMERCIAL: { en: "Commercial", pt: "Comercial", es: "Comercial" },
    LEGAL: { en: "Legal", pt: "Jurídico", es: "Legal" },
    INTERNAL: { en: "Internal", pt: "Interno", es: "Interno" },
    PARTNER: { en: "Partner", pt: "Parceiro", es: "Socio" },
  },
  sensitivity: {
    PUBLIC: { en: "Public", pt: "Público", es: "Público" },
    INTERNAL: { en: "Internal", pt: "Interno", es: "Interno" },
    CONFIDENTIAL: { en: "Confidential", pt: "Confidencial", es: "Confidencial" },
    RESTRICTED: { en: "Restricted", pt: "Restrito", es: "Restringido" },
  },
  complianceKind: {
    VISA_RENEWAL: { en: "Visa renewal", pt: "Renovação de visto", es: "Renovación de visa" },
    STATUS_EXPIRATION: { en: "Status expiration", pt: "Vencimento de status", es: "Vencimiento de estatus" },
    I94_EXPIRATION: { en: "I-94 expiration", pt: "Vencimento do I-94", es: "Vencimiento de I-94" },
    EAD_RENEWAL: { en: "EAD renewal", pt: "Renovação de EAD", es: "Renovación de EAD" },
    GREEN_CARD_CONDITION: { en: "Green card condition", pt: "Condição do green card", es: "Condición de green card" },
    ANNUAL_REPORT: { en: "Annual report", pt: "Relatório anual", es: "Informe anual" },
    TAX_FILING: { en: "Tax filing", pt: "Declaração de impostos", es: "Declaración de impuestos" },
    PAYROLL_REVIEW: { en: "Payroll review", pt: "Revisão de folha", es: "Revisión de nómina" },
    INVESTMENT_MONITORING: { en: "Investment monitoring", pt: "Monitoramento de investimento", es: "Monitoreo de inversión" },
    OTHER: { en: "Other", pt: "Outro", es: "Otro" },
  },
  plan: {
    STARTER: { en: "Starter", pt: "Starter", es: "Starter" },
    FIRM: { en: "Firm", pt: "Escritório", es: "Despacho" },
    GROWTH: { en: "Growth", pt: "Growth", es: "Growth" },
    ENTERPRISE: { en: "Enterprise", pt: "Enterprise", es: "Enterprise" },
    WHITE_LABEL: { en: "White label", pt: "White label", es: "White label" },
  },
};

export function tEnum(kind: string, value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const entry = M[kind]?.[value];
  if (!entry) return humanize(value);
  return entry[(locale as Loc) in entry ? (locale as Loc) : "en"];
}
