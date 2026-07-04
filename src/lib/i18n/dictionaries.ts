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
