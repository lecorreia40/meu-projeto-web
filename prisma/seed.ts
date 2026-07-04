/**
 * Seed: roles, permissions, visa categories, document types & requirements,
 * intake questions, and a demo tenant with users for every portal.
 *
 * Demo logins (password for all: "demo1234"):
 *   admin@visaops.dev     - Platform Super Admin
 *   owner@martinezlaw.dev - Law Firm Owner
 *   attorney@martinezlaw.dev - Attorney
 *   paralegal@martinezlaw.dev - Paralegal
 *   client@example.dev    - Client (Principal Applicant)
 *   partner@cpafirm.dev   - Partner (CPA)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Permission catalog
// ---------------------------------------------------------------------------
const PERMISSIONS: Array<{ key: string; description: string; scope?: "PLATFORM" | "TENANT" | "CASE" | "OWN" | "ASSIGNED" }> = [
  { key: "case.read", description: "Read cases" },
  { key: "case.read_own", description: "Read own cases", scope: "OWN" },
  { key: "case.create", description: "Create cases" },
  { key: "case.update", description: "Update cases" },
  { key: "case.assign", description: "Assign case team" },
  { key: "case.change_status", description: "Change case status" },
  { key: "client.read", description: "Read clients" },
  { key: "client.create", description: "Create clients" },
  { key: "client.update", description: "Update clients" },
  { key: "lead.read", description: "Read leads" },
  { key: "lead.manage", description: "Manage leads" },
  { key: "document.upload", description: "Upload documents" },
  { key: "document.read", description: "Read documents" },
  { key: "document.read_own", description: "Read own documents", scope: "OWN" },
  { key: "document.read_sensitive", description: "Read restricted-sensitivity documents" },
  { key: "document.approve", description: "Approve or reject documents" },
  { key: "document.suggest_review", description: "Suggest document review outcome" },
  { key: "checklist.edit", description: "Edit case checklists" },
  { key: "task.read", description: "Read tasks" },
  { key: "task.manage", description: "Create and update tasks" },
  { key: "message.send", description: "Send case messages" },
  { key: "message.read_internal", description: "Read internal-channel messages" },
  { key: "legal_note.read", description: "Read private legal notes" },
  { key: "legal_note.read_limited", description: "Read legal-team notes (not attorney-only)" },
  { key: "legal_note.create", description: "Create private legal notes" },
  { key: "legal_strategy.create", description: "Create/approve legal strategy" },
  { key: "attorney_review.approve", description: "Approve attorney review gates" },
  { key: "billing.read", description: "Read billing" },
  { key: "billing.read_own", description: "Read own invoices/payments", scope: "OWN" },
  { key: "billing.manage", description: "Manage billing" },
  { key: "partner.assign", description: "Invite/assign partners to cases" },
  { key: "user.remove", description: "Remove users from tenant" },
  { key: "dossier.export", description: "Export case dossier" },
  { key: "dossier.export_limited", description: "Export own limited dossier", scope: "OWN" },
  { key: "audit.read", description: "Read audit logs" },
  { key: "report.read", description: "Read firm reports" },
  { key: "tenant.manage", description: "Manage tenants", scope: "PLATFORM" },
  { key: "visa_config.manage", description: "Manage visa categories/requirements", scope: "PLATFORM" },
];

// Role -> permission keys (RBAC matrix; ABAC scoping happens in the app layer)
const ROLES: Array<{ key: string; name: string; description: string; permissions: string[] }> = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Platform-wide administration. Every action is audit-logged.",
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    key: "firm_owner",
    name: "Law Firm Owner",
    description: "Owns the firm tenant",
    permissions: [
      "case.read", "case.create", "case.update", "case.assign", "case.change_status",
      "client.read", "client.create", "client.update", "lead.read", "lead.manage",
      "document.upload", "document.read", "document.read_sensitive", "document.approve",
      "checklist.edit", "task.read", "task.manage", "message.send", "message.read_internal",
      "legal_note.read", "legal_note.create", "legal_strategy.create", "attorney_review.approve",
      "billing.read", "billing.manage", "partner.assign", "user.remove",
      "dossier.export", "audit.read", "report.read",
    ],
  },
  {
    key: "firm_admin",
    name: "Firm Admin",
    description: "Firm administrative management",
    permissions: [
      "case.read", "case.create", "case.update", "case.assign", "case.change_status",
      "client.read", "client.create", "client.update", "lead.read", "lead.manage",
      "document.upload", "document.read", "document.read_sensitive", "document.approve",
      "checklist.edit", "task.read", "task.manage", "message.send", "message.read_internal",
      "legal_note.read", "legal_note.create", "legal_strategy.create", "attorney_review.approve",
      "billing.read", "billing.manage", "partner.assign", "user.remove",
      "dossier.export", "report.read",
    ],
  },
  {
    key: "attorney",
    name: "Attorney",
    description: "Legally responsible for cases",
    permissions: [
      "case.read", "case.create", "case.update", "case.change_status",
      "client.read", "client.create", "client.update",
      "document.upload", "document.read", "document.read_sensitive", "document.approve",
      "checklist.edit", "task.read", "task.manage", "message.send", "message.read_internal",
      "legal_note.read", "legal_note.create", "legal_strategy.create", "attorney_review.approve",
      "billing.read", "partner.assign", "dossier.export", "report.read",
    ],
  },
  {
    key: "supervising_attorney",
    name: "Supervising Attorney",
    description: "Approves strategies, petitions and filings",
    permissions: [
      "case.read", "case.create", "case.update", "case.assign", "case.change_status",
      "client.read", "document.upload", "document.read", "document.read_sensitive", "document.approve",
      "checklist.edit", "task.read", "task.manage", "message.send", "message.read_internal",
      "legal_note.read", "legal_note.create", "legal_strategy.create", "attorney_review.approve",
      "billing.read", "partner.assign", "dossier.export", "report.read",
    ],
  },
  {
    key: "paralegal",
    name: "Paralegal",
    description: "Collects documents, organizes tasks, prepares drafts",
    permissions: [
      "case.read", "case.update", "case.change_status",
      "client.read", "client.create", "client.update",
      "document.upload", "document.read", "document.suggest_review",
      "checklist.edit", "task.read", "task.manage", "message.send", "message.read_internal",
      "legal_note.read_limited", "partner.assign", "dossier.export",
    ],
  },
  {
    key: "case_manager",
    name: "Case Manager",
    description: "Coordinates client, deadlines and partners",
    permissions: [
      "case.read", "case.update", "case.change_status", "client.read", "client.update",
      "document.upload", "document.read", "checklist.edit",
      "task.read", "task.manage", "message.send", "message.read_internal",
      "partner.assign", "dossier.export",
    ],
  },
  {
    key: "intake_specialist",
    name: "Intake Specialist",
    description: "Commercial screening",
    permissions: ["lead.read", "lead.manage", "client.read", "client.create", "task.read", "message.send"],
  },
  {
    key: "billing_manager",
    name: "Billing Manager",
    description: "Fees and collections",
    permissions: ["billing.read", "billing.manage", "client.read", "case.read", "report.read"],
  },
  {
    key: "auditor",
    name: "Read-only Auditor",
    description: "Views cases without editing",
    permissions: ["case.read", "client.read", "document.read", "task.read", "audit.read", "report.read"],
  },
  {
    key: "client",
    name: "Client",
    description: "Principal applicant / client portal user",
    permissions: [
      "case.read_own", "document.upload", "document.read_own",
      "task.read", "message.send", "billing.read_own", "dossier.export_limited",
    ],
  },
  {
    key: "partner",
    name: "Partner",
    description: "External partner; only sees explicitly assigned scope",
    permissions: ["task.read", "message.send", "document.upload", "billing.read_own"],
  },
];

// ---------------------------------------------------------------------------
// Visa categories
// ---------------------------------------------------------------------------
const VISA_CATEGORIES = [
  { key: "B1-B2", name: "B-1/B-2 Visitor", description: "Business or tourism visitor visa", audience: "Short business trips, tourism, family visits" },
  { key: "F-1", name: "F-1 Student", description: "Academic student visa", audience: "Students admitted to US schools" },
  { key: "J-1", name: "J-1 Exchange Visitor", description: "Exchange visitor programs", audience: "Trainees, interns, scholars, au pairs" },
  { key: "H-1B", name: "H-1B Specialty Occupation", description: "Specialty occupation worker", audience: "Professionals sponsored by US employers" },
  { key: "L-1A", name: "L-1A Intracompany Executive/Manager", description: "Intracompany transferee - executive or manager", audience: "Executives/managers transferring to a US entity" },
  { key: "L-1B", name: "L-1B Specialized Knowledge", description: "Intracompany transferee - specialized knowledge", audience: "Key employees with specialized knowledge" },
  { key: "E-2", name: "E-2 Treaty Investor", description: "Treaty investor visa", audience: "Investors from treaty countries operating a US business" },
  { key: "O-1", name: "O-1 Extraordinary Ability", description: "Individuals of extraordinary ability", audience: "Artists, scientists, athletes, business leaders" },
  { key: "EB-1A", name: "EB-1A Extraordinary Ability", description: "Employment-based first preference - extraordinary ability", audience: "Top-of-field professionals seeking permanent residence" },
  { key: "EB-1C", name: "EB-1C Multinational Manager", description: "Employment-based first preference - multinational manager/executive", audience: "Multinational executives moving permanently" },
  { key: "EB-2-NIW", name: "EB-2 NIW", description: "National Interest Waiver", audience: "Advanced-degree professionals whose work benefits the US" },
  { key: "EB-5-DIRECT", name: "EB-5 Direct", description: "Immigrant investor - direct investment", audience: "Investors creating jobs through their own enterprise" },
  { key: "EB-5-RC", name: "EB-5 Regional Center", description: "Immigrant investor - regional center", audience: "Investors in regional center projects" },
];

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------
const DOCUMENT_TYPES: Array<{ key: string; name: string; category: string }> = [
  { key: "passport", name: "Passport", category: "IDENTITY" },
  { key: "birth_certificate", name: "Birth Certificate", category: "IDENTITY" },
  { key: "marriage_certificate", name: "Marriage Certificate", category: "IDENTITY" },
  { key: "prior_visas", name: "Prior Visas", category: "IMMIGRATION" },
  { key: "i94", name: "I-94 Record", category: "IMMIGRATION" },
  { key: "uscis_notices", name: "USCIS Notices / Receipts", category: "IMMIGRATION" },
  { key: "diploma", name: "Diploma", category: "EDUCATION" },
  { key: "transcripts", name: "Academic Transcripts", category: "EDUCATION" },
  { key: "cv", name: "Curriculum Vitae", category: "EMPLOYMENT" },
  { key: "employment_letter", name: "Employment Verification Letter", category: "EMPLOYMENT" },
  { key: "paystubs", name: "Pay Stubs", category: "EMPLOYMENT" },
  { key: "org_chart", name: "Organizational Chart", category: "COMPANY" },
  { key: "articles_of_organization", name: "Articles of Organization", category: "COMPANY" },
  { key: "ein_letter", name: "EIN Letter", category: "COMPANY" },
  { key: "company_tax_returns", name: "Company Tax Returns", category: "COMPANY" },
  { key: "bank_statements", name: "Bank Statements", category: "FINANCIAL" },
  { key: "source_of_funds", name: "Source of Funds Evidence", category: "FINANCIAL" },
  { key: "personal_tax_returns", name: "Personal Tax Returns", category: "FINANCIAL" },
  { key: "awards_media", name: "Awards / Media Coverage", category: "EVIDENCE" },
  { key: "recommendation_letters", name: "Recommendation Letters", category: "EVIDENCE" },
  { key: "publications", name: "Publications / Citations", category: "EVIDENCE" },
  { key: "business_plan", name: "Business Plan", category: "INVESTMENT" },
  { key: "wire_transfers", name: "Wire Transfer Records", category: "INVESTMENT" },
  { key: "lease_agreement", name: "Lease Agreement", category: "INVESTMENT" },
  { key: "payroll_records", name: "Payroll Records", category: "INVESTMENT" },
  { key: "dependent_documents", name: "Dependent Documents", category: "FAMILY" },
  { key: "engagement_letter", name: "Engagement Letter", category: "LEGAL" },
  { key: "declarations", name: "Declarations / Affidavits", category: "LEGAL" },
];

// visaKey -> requirements
const REQUIREMENTS: Record<string, Array<{ doc: string; label: string; necessity?: "REQUIRED" | "OPTIONAL" | "CONDITIONAL"; owner?: string; condition?: string; sensitivity?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED"; guidance?: string }>> = {
  "B1-B2": [
    { doc: "passport", label: "Valid passport (6+ months)" },
    { doc: "bank_statements", label: "Proof of funds for the trip", sensitivity: "RESTRICTED" },
    { doc: "employment_letter", label: "Employment / ties evidence", necessity: "OPTIONAL" },
  ],
  "F-1": [
    { doc: "passport", label: "Valid passport" },
    { doc: "transcripts", label: "Academic transcripts" },
    { doc: "bank_statements", label: "Financial support evidence", sensitivity: "RESTRICTED" },
  ],
  "H-1B": [
    { doc: "passport", label: "Valid passport" },
    { doc: "diploma", label: "Degree / diploma" },
    { doc: "cv", label: "Updated CV" },
    { doc: "employment_letter", label: "Employer support letter", owner: "client_company" },
    { doc: "paystubs", label: "Recent pay stubs", necessity: "CONDITIONAL", condition: "currently_employed_in_us=true" },
  ],
  "L-1A": [
    { doc: "passport", label: "Valid passport" },
    { doc: "org_chart", label: "Foreign company organizational chart", owner: "client_company", condition: "applicant_role=executive OR managerial", sensitivity: "CONFIDENTIAL" },
    { doc: "employment_letter", label: "Employment verification (1+ year abroad)", owner: "client_company" },
    { doc: "articles_of_organization", label: "US entity formation documents", owner: "client_company" },
    { doc: "company_tax_returns", label: "Company tax returns", owner: "client_company", sensitivity: "RESTRICTED" },
    { doc: "business_plan", label: "US operations plan", necessity: "CONDITIONAL", condition: "new_office=true", owner: "partner" },
  ],
  "L-1B": [
    { doc: "passport", label: "Valid passport" },
    { doc: "employment_letter", label: "Specialized knowledge evidence", owner: "client_company" },
    { doc: "org_chart", label: "Organizational chart", owner: "client_company", necessity: "OPTIONAL" },
  ],
  "E-2": [
    { doc: "passport", label: "Valid passport (treaty country)" },
    { doc: "source_of_funds", label: "Source of funds documentation", sensitivity: "RESTRICTED" },
    { doc: "wire_transfers", label: "Investment wire transfers", sensitivity: "RESTRICTED" },
    { doc: "business_plan", label: "5-year business plan", owner: "partner" },
    { doc: "articles_of_organization", label: "US company formation documents", owner: "client_company" },
    { doc: "lease_agreement", label: "Commercial lease", necessity: "CONDITIONAL", condition: "physical_location=true" },
    { doc: "payroll_records", label: "Payroll records", necessity: "CONDITIONAL", condition: "existing_operation=true" },
  ],
  "O-1": [
    { doc: "passport", label: "Valid passport" },
    { doc: "cv", label: "Updated CV" },
    { doc: "awards_media", label: "Awards and media coverage", sensitivity: "INTERNAL" },
    { doc: "recommendation_letters", label: "Expert recommendation letters" },
    { doc: "publications", label: "Publications / citations", necessity: "OPTIONAL" },
  ],
  "EB-1A": [
    { doc: "passport", label: "Valid passport" },
    { doc: "cv", label: "Updated CV" },
    { doc: "awards_media", label: "Major awards / recognition evidence" },
    { doc: "recommendation_letters", label: "Expert letters" },
    { doc: "publications", label: "Publications and citation record" },
  ],
  "EB-1C": [
    { doc: "passport", label: "Valid passport" },
    { doc: "org_chart", label: "Multinational organizational charts", owner: "client_company" },
    { doc: "employment_letter", label: "Managerial capacity evidence", owner: "client_company" },
    { doc: "company_tax_returns", label: "US entity tax returns", owner: "client_company", sensitivity: "RESTRICTED" },
  ],
  "EB-2-NIW": [
    { doc: "passport", label: "Valid passport" },
    { doc: "diploma", label: "Advanced degree evidence" },
    { doc: "cv", label: "Updated CV" },
    { doc: "recommendation_letters", label: "Letters on national importance" },
    { doc: "publications", label: "Publications / impact evidence", necessity: "OPTIONAL" },
  ],
  "EB-5-DIRECT": [
    { doc: "passport", label: "Valid passport" },
    { doc: "source_of_funds", label: "Lawful source of funds trail", sensitivity: "RESTRICTED" },
    { doc: "wire_transfers", label: "Capital transfer evidence", sensitivity: "RESTRICTED" },
    { doc: "business_plan", label: "Job-creating business plan", owner: "partner" },
    { doc: "payroll_records", label: "Job creation / payroll evidence", necessity: "CONDITIONAL", condition: "operational=true" },
  ],
  "EB-5-RC": [
    { doc: "passport", label: "Valid passport" },
    { doc: "source_of_funds", label: "Lawful source of funds trail", sensitivity: "RESTRICTED" },
    { doc: "wire_transfers", label: "Capital transfer to project escrow", sensitivity: "RESTRICTED" },
  ],
  "J-1": [
    { doc: "passport", label: "Valid passport" },
    { doc: "transcripts", label: "Program qualification evidence", necessity: "OPTIONAL" },
  ],
};

// ---------------------------------------------------------------------------
// Intake questions (generic blocks + conditionals)
// ---------------------------------------------------------------------------
const INTAKE_QUESTIONS: Array<{
  key: string; block: string; label: string; labelPt: string; labelEs: string;
  fieldType?: "TEXT" | "TEXTAREA" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "COUNTRY";
  options?: string[]; required?: boolean; dependsOnKey?: string; dependsOnValue?: string; sortOrder: number;
}> = [
  // Identity
  { key: "full_name", block: "identity", label: "Full legal name", labelPt: "Nome completo", labelEs: "Nombre legal completo", required: true, sortOrder: 1 },
  { key: "nationality", block: "identity", label: "Nationality", labelPt: "Nacionalidade", labelEs: "Nacionalidad", fieldType: "COUNTRY", required: true, sortOrder: 2 },
  { key: "second_citizenship", block: "identity", label: "Do you hold a second citizenship?", labelPt: "Possui segunda cidadania?", labelEs: "¿Tiene una segunda ciudadanía?", fieldType: "BOOLEAN", sortOrder: 3 },
  { key: "second_citizenship_country", block: "identity", label: "Which country?", labelPt: "Qual país?", labelEs: "¿Qué país?", fieldType: "COUNTRY", dependsOnKey: "second_citizenship", dependsOnValue: "true", sortOrder: 4 },
  { key: "country_of_residence", block: "identity", label: "Country of residence", labelPt: "País de residência", labelEs: "País de residencia", fieldType: "COUNTRY", required: true, sortOrder: 5 },
  // Goal
  { key: "goal", block: "goal", label: "Main objective", labelPt: "Objetivo principal", labelEs: "Objetivo principal", fieldType: "SELECT", options: ["Visit", "Study", "Work", "Invest", "Transfer my company", "Green card"], required: true, sortOrder: 10 },
  { key: "timeline", block: "goal", label: "Desired timeline", labelPt: "Prazo desejado", labelEs: "Plazo deseado", fieldType: "SELECT", options: ["ASAP", "3-6 months", "6-12 months", "1+ year"], sortOrder: 11 },
  // Immigration history
  { key: "prior_us_visas", block: "history", label: "Have you held US visas before?", labelPt: "Já teve vistos americanos?", labelEs: "¿Ha tenido visas de EE.UU. antes?", fieldType: "BOOLEAN", required: true, sortOrder: 20 },
  { key: "prior_denials", block: "history", label: "Any prior visa denials?", labelPt: "Alguma negativa de visto anterior?", labelEs: "¿Alguna denegación de visa anterior?", fieldType: "BOOLEAN", required: true, sortOrder: 21 },
  { key: "prior_denial_details", block: "history", label: "Describe the denial(s)", labelPt: "Descreva a(s) negativa(s)", labelEs: "Describa la(s) denegación(es)", fieldType: "TEXTAREA", dependsOnKey: "prior_denials", dependsOnValue: "true", sortOrder: 22 },
  { key: "overstay", block: "history", label: "Have you ever overstayed a visa?", labelPt: "Já permaneceu além do prazo do visto?", labelEs: "¿Alguna vez se quedó más tiempo del permitido?", fieldType: "BOOLEAN", required: true, sortOrder: 23 },
  { key: "deportation", block: "history", label: "Any removal/deportation proceedings?", labelPt: "Algum processo de deportação/remoção?", labelEs: "¿Algún proceso de deportación?", fieldType: "BOOLEAN", required: true, sortOrder: 24 },
  // Family
  { key: "marital_status", block: "family", label: "Marital status", labelPt: "Estado civil", labelEs: "Estado civil", fieldType: "SELECT", options: ["Single", "Married", "Divorced", "Widowed"], sortOrder: 30 },
  { key: "dependents_count", block: "family", label: "Number of dependents", labelPt: "Número de dependentes", labelEs: "Número de dependientes", fieldType: "NUMBER", sortOrder: 31 },
  // Education
  { key: "highest_degree", block: "education", label: "Highest degree obtained", labelPt: "Maior grau de formação", labelEs: "Título más alto obtenido", fieldType: "SELECT", options: ["High school", "Bachelor", "Master", "MBA", "PhD", "Other"], sortOrder: 40 },
  { key: "years_experience", block: "education", label: "Years of professional experience", labelPt: "Anos de experiência profissional", labelEs: "Años de experiencia profesional", fieldType: "NUMBER", sortOrder: 41 },
  // Business
  { key: "owns_business", block: "business", label: "Do you own a business?", labelPt: "Possui empresa?", labelEs: "¿Es dueño de una empresa?", fieldType: "BOOLEAN", sortOrder: 50 },
  { key: "business_revenue", block: "business", label: "Annual revenue (USD)", labelPt: "Faturamento anual (USD)", labelEs: "Ingresos anuales (USD)", fieldType: "NUMBER", dependsOnKey: "owns_business", dependsOnValue: "true", sortOrder: 51 },
  { key: "business_employees", block: "business", label: "Number of employees", labelPt: "Número de funcionários", labelEs: "Número de empleados", fieldType: "NUMBER", dependsOnKey: "owns_business", dependsOnValue: "true", sortOrder: 52 },
  // Investment
  { key: "investment_capital", block: "investment", label: "Capital available to invest (USD)", labelPt: "Capital disponível para investir (USD)", labelEs: "Capital disponible para invertir (USD)", fieldType: "SELECT", options: ["None", "Under $100k", "$100k-$500k", "$500k-$1M", "Over $1M"], sortOrder: 60 },
  { key: "funds_source", block: "investment", label: "Primary source of funds", labelPt: "Origem principal dos fundos", labelEs: "Fuente principal de los fondos", fieldType: "SELECT", options: ["Business income", "Salary/savings", "Sale of assets", "Inheritance/gift", "Investments", "Other"], dependsOnKey: "investment_capital", dependsOnValue: "!None", sortOrder: 61 },
  // Recognition
  { key: "awards", block: "recognition", label: "Awards, media coverage or publications?", labelPt: "Prêmios, mídia ou publicações?", labelEs: "¿Premios, cobertura mediática o publicaciones?", fieldType: "BOOLEAN", sortOrder: 70 },
  { key: "awards_details", block: "recognition", label: "Briefly describe your recognition", labelPt: "Descreva brevemente seu reconhecimento", labelEs: "Describa brevemente su reconocimiento", fieldType: "TEXTAREA", dependsOnKey: "awards", dependsOnValue: "true", sortOrder: 71 },
  // Employer
  { key: "has_sponsor", block: "employer", label: "Do you have a US employer/sponsor?", labelPt: "Possui empregador/patrocinador nos EUA?", labelEs: "¿Tiene un empleador/patrocinador en EE.UU.?", fieldType: "BOOLEAN", sortOrder: 80 },
  { key: "sponsor_details", block: "employer", label: "Sponsor company and role", labelPt: "Empresa patrocinadora e cargo", labelEs: "Empresa patrocinadora y cargo", fieldType: "TEXTAREA", dependsOnKey: "has_sponsor", dependsOnValue: "true", sortOrder: 81 },
  // Risk
  { key: "criminal_history", block: "risk", label: "Any criminal history (arrests, charges, convictions)?", labelPt: "Histórico criminal (prisões, acusações, condenações)?", labelEs: "¿Antecedentes penales (arrestos, cargos, condenas)?", fieldType: "BOOLEAN", required: true, sortOrder: 90 },
  { key: "criminal_details", block: "risk", label: "Describe (confidential)", labelPt: "Descreva (confidencial)", labelEs: "Describa (confidencial)", fieldType: "TEXTAREA", dependsOnKey: "criminal_history", dependsOnValue: "true", sortOrder: 91 },
];

async function main() {
  console.log("Seeding permissions and roles...");
  const permByKey = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const rec = await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: { key: p.key, description: p.description, scope: (p.scope ?? "TENANT") as never },
    });
    permByKey.set(p.key, rec.id);
  }

  const roleByKey = new Map<string, string>();
  for (const r of ROLES) {
    const rec = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description },
      create: { key: r.key, name: r.name, description: r.description },
    });
    roleByKey.set(r.key, rec.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: rec.id } });
    await prisma.rolePermission.createMany({
      data: r.permissions.map((pk) => ({ roleId: rec.id, permissionId: permByKey.get(pk)! })),
    });
  }

  console.log("Seeding visa categories...");
  const visaByKey = new Map<string, string>();
  for (const v of VISA_CATEGORIES) {
    const rec = await prisma.visaCategory.upsert({
      where: { key: v.key },
      update: { name: v.name, description: v.description, audience: v.audience },
      create: v,
    });
    visaByKey.set(v.key, rec.id);
  }

  console.log("Seeding document types and requirements...");
  const docTypeByKey = new Map<string, string>();
  for (const d of DOCUMENT_TYPES) {
    const rec = await prisma.documentType.upsert({
      where: { key: d.key },
      update: { name: d.name },
      create: { key: d.key, name: d.name, category: d.category as never },
    });
    docTypeByKey.set(d.key, rec.id);
  }
  for (const [visaKey, reqs] of Object.entries(REQUIREMENTS)) {
    const visaCategoryId = visaByKey.get(visaKey)!;
    await prisma.documentRequirement.deleteMany({ where: { visaCategoryId, checklistItems: { none: {} } } });
    let order = 0;
    for (const r of reqs) {
      await prisma.documentRequirement.create({
        data: {
          visaCategoryId,
          documentTypeId: docTypeByKey.get(r.doc)!,
          label: r.label,
          necessity: (r.necessity ?? "REQUIRED") as never,
          ownerRole: r.owner ?? "client",
          condition: r.condition,
          sensitivity: (r.sensitivity ?? "CONFIDENTIAL") as never,
          guidance: r.guidance,
          approvedByAttorney: true,
          sortOrder: order++,
        },
      });
    }
  }

  console.log("Seeding intake questions...");
  for (const q of INTAKE_QUESTIONS) {
    await prisma.intakeQuestion.upsert({
      where: { key: q.key },
      update: { label: q.label, labelPt: q.labelPt, labelEs: q.labelEs, sortOrder: q.sortOrder },
      create: {
        key: q.key,
        block: q.block,
        label: q.label,
        labelPt: q.labelPt,
        labelEs: q.labelEs,
        fieldType: (q.fieldType ?? "TEXT") as never,
        options: q.options ?? undefined,
        required: q.required ?? false,
        dependsOnKey: q.dependsOnKey,
        dependsOnValue: q.dependsOnValue,
        sortOrder: q.sortOrder,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Demo tenant + users
  // -------------------------------------------------------------------------
  console.log("Seeding demo tenant and users...");
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "martinez-immigration" },
    update: {},
    create: { name: "Martinez Immigration Law", slug: "martinez-immigration", plan: "FIRM" },
  });

  const org = await prisma.organization.findFirst({ where: { tenantId: tenant.id } }) ??
    await prisma.organization.create({
      data: { tenantId: tenant.id, name: "Martinez Immigration Law", kind: "LAW_FIRM" },
    });

  async function upsertUser(email: string, name: string, extra: Partial<{ isPlatformAdmin: boolean; locale: string }> = {}) {
    return prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, passwordHash, ...extra },
    });
  }

  const admin = await upsertUser("admin@visaops.dev", "Platform Admin", { isPlatformAdmin: true });
  const owner = await upsertUser("owner@martinezlaw.dev", "Ana Martinez");
  const attorney = await upsertUser("attorney@martinezlaw.dev", "David Chen");
  const paralegal = await upsertUser("paralegal@martinezlaw.dev", "Sofia Reyes");
  const clientUser = await upsertUser("client@example.dev", "Lucas Ferreira", { locale: "pt" });
  const partnerUser = await upsertUser("partner@cpafirm.dev", "Emily Ross, CPA");

  async function member(userId: string, roleKey: string) {
    await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId } },
      update: { roleId: roleByKey.get(roleKey)! },
      create: { tenantId: tenant.id, organizationId: org.id, userId, roleId: roleByKey.get(roleKey)! },
    });
  }
  await member(admin.id, "super_admin");
  await member(owner.id, "firm_owner");
  await member(attorney.id, "attorney");
  await member(paralegal.id, "paralegal");
  await member(clientUser.id, "client");
  await member(partnerUser.id, "partner");

  // Demo client / company / case
  const client = await prisma.client.findFirst({ where: { tenantId: tenant.id, email: "client@example.dev" } }) ??
    await prisma.client.create({
      data: {
        tenantId: tenant.id,
        userId: clientUser.id,
        fullName: "Lucas Ferreira",
        email: "client@example.dev",
        nationality: "Brazil",
        countryOfResidence: "Brazil",
        profile: { create: { data: { identity: { nationality: "Brazil" } } } },
      },
    });

  const company = await prisma.company.findFirst({ where: { tenantId: tenant.id, name: "Ferreira Tech LLC" } }) ??
    await prisma.company.create({
      data: { tenantId: tenant.id, clientId: client.id, name: "Ferreira Tech LLC", country: "US", role: "US_ENTITY" },
    });

  const existingCase = await prisma.case.findFirst({ where: { tenantId: tenant.id } });
  if (!existingCase) {
    const e2 = visaByKey.get("E-2")!;
    const kase = await prisma.case.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        visaCategoryId: e2,
        companyId: company.id,
        caseNumberInternal: "MIL-2026-0001",
        status: "DOCUMENT_COLLECTION",
        priority: "HIGH",
        attorneyId: attorney.id,
        paralegalId: paralegal.id,
        nextAction: "Collect source-of-funds documentation",
        nextDeadlineAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        riskLevel: "LOW",
        applicants: {
          create: [{ fullName: "Lucas Ferreira", kind: "PRINCIPAL" }],
        },
      },
    });

    // Checklist generated from E-2 requirements
    const reqs = await prisma.documentRequirement.findMany({ where: { visaCategoryId: e2 }, orderBy: { sortOrder: "asc" } });
    await prisma.checklist.create({
      data: {
        tenantId: tenant.id,
        caseId: kase.id,
        name: "E-2 Document Checklist",
        items: {
          create: reqs.map((r, i) => ({
            requirementId: r.id,
            label: r.label,
            necessity: r.necessity,
            ownerRole: r.ownerRole,
            status: i === 0 ? "APPROVED" : "PENDING",
            sortOrder: r.sortOrder,
          })),
        },
      },
    });

    await prisma.task.createMany({
      data: [
        { tenantId: tenant.id, caseId: kase.id, title: "Upload wire transfer records", assigneeId: clientUser.id, creatorId: paralegal.id, status: "OPEN", priority: "HIGH", dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        { tenantId: tenant.id, caseId: kase.id, title: "Review source of funds narrative", assigneeId: attorney.id, creatorId: paralegal.id, status: "OPEN", priority: "NORMAL" },
        { tenantId: tenant.id, caseId: kase.id, title: "Prepare document index", assigneeId: paralegal.id, creatorId: attorney.id, status: "IN_PROGRESS", priority: "NORMAL" },
      ],
    });

    const thread = await prisma.messageThread.create({
      data: { tenantId: tenant.id, caseId: kase.id, subject: "E-2 case - document collection", channel: "OPERATIONAL" },
    });
    await prisma.message.createMany({
      data: [
        { threadId: thread.id, senderId: paralegal.id, body: "Hi Lucas! We opened your document checklist. Please start with your passport and bank statements." },
        { threadId: thread.id, senderId: clientUser.id, body: "Thanks Sofia! Passport uploaded. Working on the bank statements this week." },
      ],
    });

    await prisma.legalNote.create({
      data: {
        tenantId: tenant.id,
        caseId: kase.id,
        authorId: attorney.id,
        body: "Source of funds includes proceeds from a 2023 company sale - need the sale agreement and tax treatment before drafting. Marginality risk is low.",
        visibility: "LEGAL_TEAM",
      },
    });

    await prisma.caseEvent.createMany({
      data: [
        { caseId: kase.id, actorId: attorney.id, kind: "STATUS_CHANGE", title: "Case opened", detail: "E-2 strategy engaged" },
        { caseId: kase.id, actorId: paralegal.id, kind: "STATUS_CHANGE", title: "Document collection started", detail: "Checklist shared with client" },
        { caseId: kase.id, actorId: clientUser.id, kind: "DOCUMENT_UPLOADED", title: "Passport uploaded" },
      ],
    });

    await prisma.partner.create({
      data: {
        tenantId: tenant.id,
        userId: partnerUser.id,
        name: "Ross & Co CPAs",
        kind: "CPA_ACCOUNTANT",
        email: "partner@cpafirm.dev",
        assignments: {
          create: [{
            caseId: kase.id,
            scope: "Source of funds CPA report",
            tasks: {
              create: [{
                tenantId: tenant.id,
                caseId: kase.id,
                title: "Prepare source-of-funds CPA report",
                assigneeId: partnerUser.id,
                creatorId: attorney.id,
                status: "OPEN",
                priority: "HIGH",
                dueAt: new Date(Date.now() + 10 * 24 * 3600 * 1000),
              }],
            },
          }],
        },
      },
    });

    await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        caseId: kase.id,
        number: "INV-2026-0001",
        amount: 8500,
        status: "PARTIAL",
        dueAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        payments: { create: [{ amount: 4250, method: "stripe", reference: "pi_demo_001" }] },
      },
    });

    await prisma.lead.createMany({
      data: [
        { tenantId: tenant.id, name: "Maria Santos", email: "maria@example.com", source: "LANDING_PAGE", interest: "EB-2-NIW", stage: "SCREENING", score: 72, estimatedValue: 12000 },
        { tenantId: tenant.id, name: "Chen Wei", email: "chen@example.com", source: "REFERRAL", interest: "EB-5-DIRECT", stage: "CONSULT_SCHEDULED", score: 88, estimatedValue: 25000 },
        { tenantId: tenant.id, name: "Ahmed Hassan", email: "ahmed@example.com", source: "ADS", interest: "L-1A", stage: "NEW", score: 45, estimatedValue: 15000 },
      ],
    });

    await prisma.complianceEvent.createMany({
      data: [
        { tenantId: tenant.id, caseId: kase.id, kind: "INVESTMENT_MONITORING", title: "Quarterly investment activity review", dueAt: new Date(Date.now() + 60 * 24 * 3600 * 1000) },
        { tenantId: tenant.id, caseId: kase.id, kind: "ANNUAL_REPORT", title: "Florida annual report filing", dueAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Demo logins (password: demo1234):");
  console.log("  admin@visaops.dev / owner@martinezlaw.dev / attorney@martinezlaw.dev");
  console.log("  paralegal@martinezlaw.dev / client@example.dev / partner@cpafirm.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
