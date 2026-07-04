/**
 * i18n structure: EN is the source of truth; PT and ES override.
 * Client-facing copy uses plain language (never legal jargon).
 */
export type Locale = "en" | "pt" | "es";

const en = {
  appName: "VisaOps",
  login: {
    title: "Sign in",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    invalid: "Invalid email or password.",
  },
  nav: {
    dashboard: "Dashboard",
    leads: "Leads",
    clients: "Clients",
    cases: "Cases",
    tasks: "Tasks",
    documents: "Documents",
    messages: "Messages",
    billing: "Billing",
    reports: "Reports",
    settings: "Settings",
    myCase: "My Case",
    timeline: "Timeline",
    payments: "Payments",
    profile: "Profile",
    help: "Help",
    assignedTasks: "Assigned Tasks",
    sharedDocuments: "Documents Shared With Me",
    invoices: "Invoices",
    tenants: "Tenants",
    users: "Users",
    visaCategories: "Visa Categories",
    auditLog: "Audit Log",
    compliance: "Compliance",
    partners: "Partners",
    intake: "Intake",
    signOut: "Sign out",
  },
  clientStatus: {
    waitingDocuments: "Waiting for your documents",
    inAttorneyReview: "In review by the attorney",
    filingReady: "Ready for filing",
    filed: "Filed",
    waitingResponse: "Waiting for a response",
    actionNeeded: "Action needed",
  },
  caseCard: {
    stage: "You are at stage",
    progress: "Progress",
    nextAction: "Next action",
    deadline: "Deadline",
    responsible: "Currently responsible",
    lastUpdate: "Last update",
  },
  common: {
    signOut: "Sign out",
    backToWorkspace: "Back to my workspace",
    language: "Language",
  },
  portalLabel: {
    firm: "Law Firm Portal",
    client: "Client Portal",
    partner: "Partner Portal",
    admin: "Platform Admin",
  },
  landing: {
    badge: "Visa Lifecycle Management Platform",
    title: "The operating system for immigration practices",
    subtitle:
      "Reduce operational chaos and turn every case into an auditable, secure and clear workflow, for clients, attorneys and partners. Before, during and after the visa.",
    ctaStart: "Start free assessment",
    ctaFirm: "Firm portal",
    signIn: "Sign in",
    note: "VisaOps organizes, automates, educates and tracks. It does not replace your attorney: immigration legal advice must come from a licensed attorney or accredited representative.",
    f1t: "CRM and Intake",
    f1b: "Lead pipeline, smart intake wizard with conditional questions and readiness scoring, reviewed by an attorney before any recommendation.",
    f2t: "Case Workspace",
    f2b: "Every case as a controlled operation: status pipeline, team, deadlines, risks, timeline and audit trail.",
    f3t: "Document Vault",
    f3b: "Secure uploads, review and approval workflow, versioning, sensitivity levels and locked records after filing.",
    f4t: "Attorney Gates",
    f4b: "Nothing final leaves the platform without attorney approval. Approval gates at every critical stage.",
    f5t: "Post-Approval Compliance",
    f5b: "Renewal alerts, status and I-94 expirations, investment monitoring and corporate compliance calendar.",
    f6t: "Security by Design",
    f6b: "Multi-tenant isolation, RBAC and ABAC permissions, immutable audit log for every sensitive action.",
  },
  disclaimer:
    "This platform organizes and tracks your process. It does not provide legal advice - immigration legal advice must come from a licensed attorney or accredited representative.",
};

type Dict = typeof en;
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const pt: DeepPartial<Dict> = {
  login: {
    title: "Entrar",
    email: "E-mail",
    password: "Senha",
    submit: "Entrar",
    invalid: "E-mail ou senha inválidos.",
  },
  nav: {
    dashboard: "Painel",
    leads: "Leads",
    clients: "Clientes",
    cases: "Casos",
    tasks: "Tarefas",
    documents: "Documentos",
    messages: "Mensagens",
    billing: "Cobrança",
    reports: "Relatórios",
    settings: "Configurações",
    myCase: "Meu Caso",
    timeline: "Linha do Tempo",
    payments: "Pagamentos",
    profile: "Perfil",
    help: "Ajuda",
    assignedTasks: "Tarefas Atribuídas",
    sharedDocuments: "Documentos Compartilhados",
    invoices: "Faturas",
    tenants: "Tenants",
    users: "Usuários",
    visaCategories: "Categorias de Visto",
    auditLog: "Log de Auditoria",
    compliance: "Compliance",
    partners: "Parceiros",
    intake: "Triagem",
    signOut: "Sair",
  },
  clientStatus: {
    waitingDocuments: "Aguardando seus documentos",
    inAttorneyReview: "Em revisão pelo advogado",
    filingReady: "Pronto para protocolo",
    filed: "Protocolado",
    waitingResponse: "Aguardando resposta",
    actionNeeded: "Ação necessária",
  },
  caseCard: {
    stage: "Você está na etapa",
    progress: "Progresso",
    nextAction: "Próxima ação",
    deadline: "Prazo",
    responsible: "Responsável atual",
    lastUpdate: "Última atualização",
  },
  common: {
    signOut: "Sair",
    backToWorkspace: "Voltar ao meu espaço",
    language: "Idioma",
  },
  portalLabel: {
    firm: "Portal do Escritório",
    client: "Portal do Cliente",
    partner: "Portal do Parceiro",
    admin: "Admin da Plataforma",
  },
  landing: {
    badge: "Plataforma de Gestão do Ciclo de Vistos",
    title: "O sistema operacional para escritórios de imigração",
    subtitle:
      "Reduza o caos operacional e transforme cada caso em um fluxo auditável, seguro e claro, para clientes, advogados e parceiros. Antes, durante e depois do visto.",
    ctaStart: "Fazer diagnóstico gratuito",
    ctaFirm: "Portal do escritório",
    signIn: "Entrar",
    note: "O VisaOps organiza, automatiza, educa e acompanha. Ele não substitui o advogado: orientação jurídica de imigração deve vir de advogado licenciado ou representante credenciado.",
    f1t: "CRM e Triagem",
    f1b: "Funil de leads, wizard de diagnóstico com perguntas condicionais e score de prontidão, revisado por um advogado antes de qualquer recomendação.",
    f2t: "Área do Caso",
    f2b: "Cada caso como operação controlada: pipeline de status, equipe, prazos, riscos, linha do tempo e trilha de auditoria.",
    f3t: "Cofre de Documentos",
    f3b: "Uploads seguros, fluxo de revisão e aprovação, versionamento, níveis de sensibilidade e bloqueio após o protocolo.",
    f4t: "Gates do Advogado",
    f4b: "Nada final sai da plataforma sem aprovação do advogado. Gates de aprovação em cada etapa crítica.",
    f5t: "Compliance Pós-Aprovação",
    f5b: "Alertas de renovação, vencimentos de status e I-94, monitoramento de investimento e calendário de compliance da empresa.",
    f6t: "Segurança por Design",
    f6b: "Isolamento multi-tenant, permissões RBAC e ABAC, log de auditoria imutável para cada ação sensível.",
  },
  disclaimer:
    "Esta plataforma organiza e acompanha seu processo. Ela não fornece aconselhamento jurídico - orientação legal de imigração deve vir de advogado licenciado ou representante credenciado.",
};

const es: DeepPartial<Dict> = {
  login: {
    title: "Iniciar sesión",
    email: "Correo electrónico",
    password: "Contraseña",
    submit: "Iniciar sesión",
    invalid: "Correo o contraseña inválidos.",
  },
  nav: {
    dashboard: "Panel",
    leads: "Leads",
    clients: "Clientes",
    cases: "Casos",
    tasks: "Tareas",
    documents: "Documentos",
    messages: "Mensajes",
    billing: "Facturación",
    reports: "Informes",
    settings: "Configuración",
    myCase: "Mi Caso",
    timeline: "Cronología",
    payments: "Pagos",
    profile: "Perfil",
    help: "Ayuda",
    assignedTasks: "Tareas Asignadas",
    sharedDocuments: "Documentos Compartidos",
    invoices: "Facturas",
    tenants: "Tenants",
    users: "Usuarios",
    visaCategories: "Categorías de Visa",
    auditLog: "Registro de Auditoría",
    compliance: "Cumplimiento",
    partners: "Socios",
    intake: "Evaluación",
    signOut: "Cerrar sesión",
  },
  clientStatus: {
    waitingDocuments: "Esperando sus documentos",
    inAttorneyReview: "En revisión por el abogado",
    filingReady: "Listo para presentar",
    filed: "Presentado",
    waitingResponse: "Esperando respuesta",
    actionNeeded: "Acción necesaria",
  },
  caseCard: {
    stage: "Está en la etapa",
    progress: "Progreso",
    nextAction: "Próxima acción",
    deadline: "Plazo",
    responsible: "Responsable actual",
    lastUpdate: "Última actualización",
  },
  common: {
    signOut: "Cerrar sesión",
    backToWorkspace: "Volver a mi espacio",
    language: "Idioma",
  },
  portalLabel: {
    firm: "Portal del Despacho",
    client: "Portal del Cliente",
    partner: "Portal del Socio",
    admin: "Administración de la Plataforma",
  },
  landing: {
    badge: "Plataforma de Gestión del Ciclo de Visas",
    title: "El sistema operativo para despachos de inmigración",
    subtitle:
      "Reduzca el caos operativo y convierta cada caso en un flujo auditable, seguro y claro, para clientes, abogados y socios. Antes, durante y después de la visa.",
    ctaStart: "Hacer evaluación gratuita",
    ctaFirm: "Portal del despacho",
    signIn: "Iniciar sesión",
    note: "VisaOps organiza, automatiza, educa y da seguimiento. No reemplaza a su abogado: la asesoría legal de inmigración debe provenir de un abogado licenciado o representante acreditado.",
    f1t: "CRM y Evaluación",
    f1b: "Flujo de leads, asistente de evaluación con preguntas condicionales y puntaje de preparación, revisado por un abogado antes de cualquier recomendación.",
    f2t: "Área del Caso",
    f2b: "Cada caso como operación controlada: pipeline de estados, equipo, plazos, riesgos, cronología y registro de auditoría.",
    f3t: "Bóveda de Documentos",
    f3b: "Cargas seguras, flujo de revisión y aprobación, versionado, niveles de sensibilidad y bloqueo tras la presentación.",
    f4t: "Aprobaciones del Abogado",
    f4b: "Nada final sale de la plataforma sin aprobación del abogado. Puntos de aprobación en cada etapa crítica.",
    f5t: "Cumplimiento Post-Aprobación",
    f5b: "Alertas de renovación, vencimientos de estatus e I-94, monitoreo de inversión y calendario de cumplimiento corporativo.",
    f6t: "Seguridad por Diseño",
    f6b: "Aislamiento multi-tenant, permisos RBAC y ABAC, registro de auditoría inmutable para cada acción sensible.",
  },
  disclaimer:
    "Esta plataforma organiza y da seguimiento a su proceso. No brinda asesoría legal - la asesoría legal de inmigración debe provenir de un abogado licenciado o representante acreditado.",
};

function deepMerge<T extends object>(base: T, override: DeepPartial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(override)) {
    const bv = (base as Record<string, unknown>)[k];
    out[k] =
      v && typeof v === "object" && bv && typeof bv === "object"
        ? deepMerge(bv as object, v as object)
        : v;
  }
  return out as T;
}

const dictionaries: Record<Locale, Dict> = {
  en,
  pt: deepMerge(en, pt),
  es: deepMerge(en, es),
};

export function getDictionary(locale: string): Dict {
  return dictionaries[(locale as Locale) in dictionaries ? (locale as Locale) : "en"];
}
