-- VisaOps: configuracao completa do banco (schema + dados de demonstracao)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- Cria todas as tabelas e ja insere os 6 usuarios demo (senha: demo1234),
-- as 13 categorias de visto, os requisitos de documento e um caso de exemplo.

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: AIInteractionKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AIInteractionKind" AS ENUM (
    'DOCUMENT_SUMMARY',
    'DATA_EXTRACTION',
    'CHECKLIST_SUGGESTION',
    'MESSAGE_DRAFT',
    'CASE_SUMMARY',
    'INCONSISTENCY_CHECK',
    'TRANSLATION',
    'ROUTE_SUGGESTION',
    'BLOCKED_REQUEST',
    'OTHER'
);


--
-- Name: ApplicantKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApplicantKind" AS ENUM (
    'PRINCIPAL',
    'SPOUSE',
    'DEPENDENT'
);


--
-- Name: ApprovalGate; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ApprovalGate" AS ENUM (
    'INTAKE_COMPLETE',
    'LEGAL_STRATEGY',
    'DOCUMENT_COMPLETE',
    'PETITION_DRAFT',
    'FILING_READY',
    'RFE_RESPONSE',
    'POST_FILING'
);


--
-- Name: AssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssignmentStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: BillingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BillingStatus" AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'NOT_APPLICABLE'
);


--
-- Name: CaseEventKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CaseEventKind" AS ENUM (
    'STATUS_CHANGE',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_REVIEWED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'MESSAGE_SENT',
    'NOTE_ADDED',
    'REVIEW_DECISION',
    'PAYMENT',
    'FILING',
    'OFFICIAL_STATUS',
    'RFE_NOID',
    'OTHER'
);


--
-- Name: CasePriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CasePriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'CRITICAL'
);


--
-- Name: CaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CaseStatus" AS ENUM (
    'INTAKE_STARTED',
    'INTAKE_COMPLETE',
    'INITIAL_REVIEW',
    'PROPOSAL_SENT',
    'ENGAGEMENT_SIGNED',
    'DOCUMENT_COLLECTION',
    'EVIDENCE_REVIEW',
    'DRAFTING',
    'ATTORNEY_REVIEW',
    'CLIENT_REVIEW',
    'FILING_READY',
    'FILED',
    'RECEIPT_RECEIVED',
    'BIOMETRICS_INTERVIEW',
    'RFE_NOID',
    'APPROVED',
    'DENIED',
    'CLOSED',
    'POST_APPROVAL_MONITORING'
);


--
-- Name: ChecklistItemStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChecklistItemStatus" AS ENUM (
    'PENDING',
    'UPLOADED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'WAIVED'
);


--
-- Name: CompanyRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CompanyRole" AS ENUM (
    'SPONSOR',
    'FOREIGN_ENTITY',
    'US_ENTITY',
    'INVESTMENT_TARGET',
    'OTHER'
);


--
-- Name: ComplianceKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComplianceKind" AS ENUM (
    'VISA_RENEWAL',
    'STATUS_EXPIRATION',
    'I94_EXPIRATION',
    'EAD_RENEWAL',
    'GREEN_CARD_CONDITION',
    'ANNUAL_REPORT',
    'TAX_FILING',
    'PAYROLL_REVIEW',
    'INVESTMENT_MONITORING',
    'OTHER'
);


--
-- Name: ComplianceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComplianceStatus" AS ENUM (
    'UPCOMING',
    'DUE_SOON',
    'OVERDUE',
    'COMPLETED',
    'WAIVED'
);


--
-- Name: DependentRelationship; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DependentRelationship" AS ENUM (
    'SPOUSE',
    'CHILD',
    'PARENT',
    'OTHER'
);


--
-- Name: DocumentCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentCategory" AS ENUM (
    'IDENTITY',
    'IMMIGRATION',
    'EDUCATION',
    'EMPLOYMENT',
    'COMPANY',
    'FINANCIAL',
    'EVIDENCE',
    'INVESTMENT',
    'FAMILY',
    'LEGAL',
    'OTHER'
);


--
-- Name: DocumentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentStatus" AS ENUM (
    'PENDING_REVIEW',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
    'ARCHIVED'
);


--
-- Name: EligibilityOutcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EligibilityOutcome" AS ENUM (
    'HIGH_FIT_FOR_LEGAL_REVIEW',
    'POSSIBLE_ROUTE_TO_EVALUATE',
    'INSUFFICIENT_DOCUMENTATION',
    'REQUIRES_ATTORNEY_REVIEW',
    'ELEVATED_RISK'
);


--
-- Name: IntakeFieldType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntakeFieldType" AS ENUM (
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'DATE',
    'BOOLEAN',
    'SELECT',
    'MULTISELECT',
    'COUNTRY'
);


--
-- Name: IntakeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntakeStatus" AS ENUM (
    'IN_PROGRESS',
    'SUBMITTED',
    'UNDER_REVIEW',
    'CONVERTED',
    'ARCHIVED'
);


--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'DRAFT',
    'OPEN',
    'PAID',
    'PARTIAL',
    'OVERDUE',
    'VOID'
);


--
-- Name: LeadSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeadSource" AS ENUM (
    'ORGANIC',
    'ADS',
    'REFERRAL',
    'PARTNER',
    'LANDING_PAGE',
    'WHATSAPP',
    'EVENT',
    'OTHER'
);


--
-- Name: LeadStage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeadStage" AS ENUM (
    'NEW',
    'SCREENING',
    'CONSULT_SCHEDULED',
    'CONSULT_DONE',
    'PROPOSAL_SENT',
    'ENGAGED',
    'ACTIVE_CASE',
    'LOST'
);


--
-- Name: LegalNoteVisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LegalNoteVisibility" AS ENUM (
    'ATTORNEY_ONLY',
    'LEGAL_TEAM'
);


--
-- Name: MessageChannel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageChannel" AS ENUM (
    'OPERATIONAL',
    'COMMERCIAL',
    'LEGAL',
    'INTERNAL',
    'PARTNER'
);


--
-- Name: OrganizationKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrganizationKind" AS ENUM (
    'LAW_FIRM',
    'CONSULTANCY',
    'PARTNER_FIRM',
    'PLATFORM'
);


--
-- Name: PartnerKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PartnerKind" AS ENUM (
    'CPA_ACCOUNTANT',
    'BUSINESS_PLAN_WRITER',
    'TRANSLATOR',
    'VALUATION',
    'REAL_ESTATE',
    'FRANCHISE',
    'EB5_PROJECT',
    'COMPLIANCE',
    'RELOCATION',
    'DOCUMENT_COLLECTOR',
    'NOTARY_APOSTILLE',
    'OTHER'
);


--
-- Name: PermissionScope; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PermissionScope" AS ENUM (
    'PLATFORM',
    'TENANT',
    'CASE',
    'OWN',
    'ASSIGNED'
);


--
-- Name: RequirementNecessity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RequirementNecessity" AS ENUM (
    'REQUIRED',
    'OPTIONAL',
    'CONDITIONAL'
);


--
-- Name: ReviewDecision; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReviewDecision" AS ENUM (
    'APPROVED',
    'REJECTED',
    'NEEDS_CHANGES'
);


--
-- Name: ReviewStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReviewStatus" AS ENUM (
    'DRAFT',
    'ATTORNEY_REVIEWED',
    'APPROVED',
    'REJECTED'
);


--
-- Name: RiskFlagKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RiskFlagKind" AS ENUM (
    'OVERSTAY',
    'PRIOR_DENIAL',
    'DEPORTATION',
    'CRIMINAL_HISTORY',
    'INADMISSIBILITY',
    'FRAUD_INDICATOR',
    'DOCUMENT_INCONSISTENCY',
    'MISSING_EVIDENCE',
    'DEADLINE_RISK',
    'OTHER'
);


--
-- Name: RiskLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RiskLevel" AS ENUM (
    'UNKNOWN',
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: SensitivityLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SensitivityLevel" AS ENUM (
    'PUBLIC',
    'INTERNAL',
    'CONFIDENTIAL',
    'RESTRICTED'
);


--
-- Name: SignatureStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SignatureStatus" AS ENUM (
    'DRAFT',
    'SENT',
    'SIGNED',
    'DECLINED',
    'VOIDED'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'BLOCKED',
    'DONE',
    'CANCELLED'
);


--
-- Name: TemplateKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TemplateKind" AS ENUM (
    'MESSAGE',
    'EMAIL',
    'DOCUMENT',
    'CHECKLIST_GUIDANCE',
    'LANDING_CONTENT'
);


--
-- Name: TenantPlan; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TenantPlan" AS ENUM (
    'STARTER',
    'FIRM',
    'GROWTH',
    'ENTERPRISE',
    'WHITE_LABEL'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AIInteraction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AIInteraction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text,
    "caseId" text,
    kind public."AIInteractionKind" NOT NULL,
    prompt text NOT NULL,
    response text NOT NULL,
    "reviewStatus" public."ReviewStatus" DEFAULT 'DRAFT'::public."ReviewStatus" NOT NULL,
    blocked boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AttorneyReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttorneyReview" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    "reviewerId" text NOT NULL,
    gate public."ApprovalGate" NOT NULL,
    decision public."ReviewDecision" NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "tenantId" text,
    "actorId" text,
    action text NOT NULL,
    entity text NOT NULL,
    "entityId" text,
    metadata jsonb,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Case; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Case" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "clientId" text NOT NULL,
    "visaCategoryId" text NOT NULL,
    "companyId" text,
    "caseNumberInternal" text NOT NULL,
    "externalReceiptNumber" text,
    "externalCaseNumber" text,
    status public."CaseStatus" DEFAULT 'INTAKE_STARTED'::public."CaseStatus" NOT NULL,
    priority public."CasePriority" DEFAULT 'NORMAL'::public."CasePriority" NOT NULL,
    "strategySummary" text,
    "strategyStatus" public."ReviewStatus" DEFAULT 'DRAFT'::public."ReviewStatus" NOT NULL,
    "attorneyId" text,
    "paralegalId" text,
    "caseManagerId" text,
    "openedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "filedAt" timestamp(3) without time zone,
    "decisionAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "nextDeadlineAt" timestamp(3) without time zone,
    "nextAction" text,
    "riskLevel" public."RiskLevel" DEFAULT 'UNKNOWN'::public."RiskLevel" NOT NULL,
    "billingStatus" public."BillingStatus" DEFAULT 'PENDING'::public."BillingStatus" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CaseApplicant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CaseApplicant" (
    id text NOT NULL,
    "caseId" text NOT NULL,
    "dependentId" text,
    "fullName" text NOT NULL,
    kind public."ApplicantKind" DEFAULT 'PRINCIPAL'::public."ApplicantKind" NOT NULL
);


--
-- Name: CaseEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CaseEvent" (
    id text NOT NULL,
    "caseId" text NOT NULL,
    "actorId" text,
    kind public."CaseEventKind" NOT NULL,
    title text NOT NULL,
    detail text,
    "clientVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Checklist" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChecklistItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChecklistItem" (
    id text NOT NULL,
    "checklistId" text NOT NULL,
    "requirementId" text,
    "documentId" text,
    label text NOT NULL,
    necessity public."RequirementNecessity" DEFAULT 'REQUIRED'::public."RequirementNecessity" NOT NULL,
    "ownerRole" text DEFAULT 'client'::text NOT NULL,
    status public."ChecklistItemStatus" DEFAULT 'PENDING'::public."ChecklistItemStatus" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    comment text,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: Client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Client" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text,
    "fullName" text NOT NULL,
    email text,
    phone text,
    nationality text,
    "countryOfResidence" text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ClientProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClientProfile" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "clientId" text,
    name text NOT NULL,
    country text,
    ein text,
    role public."CompanyRole" DEFAULT 'SPONSOR'::public."CompanyRole" NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ComplianceEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ComplianceEvent" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    kind public."ComplianceKind" NOT NULL,
    title text NOT NULL,
    "dueAt" timestamp(3) without time zone NOT NULL,
    status public."ComplianceStatus" DEFAULT 'UPCOMING'::public."ComplianceStatus" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ContentVersion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContentVersion" (
    id text NOT NULL,
    "templateId" text NOT NULL,
    version integer NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Dependent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Dependent" (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "fullName" text NOT NULL,
    relationship public."DependentRelationship" NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    nationality text
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text,
    "ownerUserId" text,
    "documentTypeId" text,
    filename text NOT NULL,
    "fileUrl" text NOT NULL,
    "fileHash" text,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    status public."DocumentStatus" DEFAULT 'PENDING_REVIEW'::public."DocumentStatus" NOT NULL,
    sensitivity public."SensitivityLevel" DEFAULT 'CONFIDENTIAL'::public."SensitivityLevel" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "rejectionReason" text,
    version integer DEFAULT 1 NOT NULL,
    "previousVersionId" text,
    "lockedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DocumentRequirement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocumentRequirement" (
    id text NOT NULL,
    "visaCategoryId" text NOT NULL,
    "documentTypeId" text NOT NULL,
    label text NOT NULL,
    necessity public."RequirementNecessity" DEFAULT 'REQUIRED'::public."RequirementNecessity" NOT NULL,
    "ownerRole" text NOT NULL,
    "reviewerRole" text DEFAULT 'attorney'::text NOT NULL,
    condition text,
    sensitivity public."SensitivityLevel" DEFAULT 'CONFIDENTIAL'::public."SensitivityLevel" NOT NULL,
    guidance text,
    "ruleVersion" integer DEFAULT 1 NOT NULL,
    "approvedByAttorney" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL
);


--
-- Name: DocumentReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocumentReview" (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "reviewerId" text NOT NULL,
    decision public."ReviewDecision" NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DocumentType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocumentType" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    category public."DocumentCategory" DEFAULT 'OTHER'::public."DocumentCategory" NOT NULL
);


--
-- Name: EligibilityAssessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EligibilityAssessment" (
    id text NOT NULL,
    "caseId" text NOT NULL,
    "readinessScore" integer NOT NULL,
    outcome public."EligibilityOutcome" NOT NULL,
    "suggestedRoutes" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "reviewStatus" public."ReviewStatus" DEFAULT 'DRAFT'::public."ReviewStatus" NOT NULL,
    "reviewedById" text,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: EngagementLetter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EngagementLetter" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    title text NOT NULL,
    status public."SignatureStatus" DEFAULT 'DRAFT'::public."SignatureStatus" NOT NULL,
    "signedAt" timestamp(3) without time zone,
    "documentUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: IntakeAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IntakeAnswer" (
    id text NOT NULL,
    "formId" text NOT NULL,
    "questionId" text NOT NULL,
    value jsonb NOT NULL
);


--
-- Name: IntakeForm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IntakeForm" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text,
    "clientName" text,
    "clientEmail" text,
    goal text,
    status public."IntakeStatus" DEFAULT 'IN_PROGRESS'::public."IntakeStatus" NOT NULL,
    "currentStep" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: IntakeQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IntakeQuestion" (
    id text NOT NULL,
    "visaCategoryId" text,
    block text NOT NULL,
    key text NOT NULL,
    label text NOT NULL,
    "labelPt" text,
    "labelEs" text,
    "fieldType" public."IntakeFieldType" DEFAULT 'TEXT'::public."IntakeFieldType" NOT NULL,
    options jsonb,
    required boolean DEFAULT false NOT NULL,
    "dependsOnKey" text,
    "dependsOnValue" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text,
    number text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'OPEN'::public."InvoiceStatus" NOT NULL,
    "dueAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    source public."LeadSource" DEFAULT 'ORGANIC'::public."LeadSource" NOT NULL,
    interest text,
    "estimatedValue" numeric(12,2),
    stage public."LeadStage" DEFAULT 'NEW'::public."LeadStage" NOT NULL,
    score integer,
    notes text,
    "assignedToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LegalNote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LegalNote" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    visibility public."LegalNoteVisibility" DEFAULT 'LEGAL_TEAM'::public."LegalNoteVisibility" NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Membership" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "organizationId" text,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "threadId" text NOT NULL,
    "senderId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MessageThread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MessageThread" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text,
    subject text NOT NULL,
    channel public."MessageChannel" DEFAULT 'OPERATIONAL'::public."MessageChannel" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    body text,
    href text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    kind public."OrganizationKind" DEFAULT 'LAW_FIRM'::public."OrganizationKind" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Partner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Partner" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text,
    name text NOT NULL,
    kind public."PartnerKind" NOT NULL,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PartnerAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PartnerAssignment" (
    id text NOT NULL,
    "partnerId" text NOT NULL,
    "caseId" text NOT NULL,
    scope text NOT NULL,
    status public."AssignmentStatus" DEFAULT 'ACTIVE'::public."AssignmentStatus" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    method text DEFAULT 'stripe'::text NOT NULL,
    reference text,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    key text NOT NULL,
    description text NOT NULL,
    scope public."PermissionScope" DEFAULT 'TENANT'::public."PermissionScope" NOT NULL
);


--
-- Name: RiskFlag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RiskFlag" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text NOT NULL,
    kind public."RiskFlagKind" NOT NULL,
    severity public."RiskLevel" DEFAULT 'MEDIUM'::public."RiskLevel" NOT NULL,
    note text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT true NOT NULL
);


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    plan public."TenantPlan" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    seats integer DEFAULT 1 NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endsAt" timestamp(3) without time zone
);


--
-- Name: Task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "caseId" text,
    title text NOT NULL,
    description text,
    status public."TaskStatus" DEFAULT 'OPEN'::public."TaskStatus" NOT NULL,
    priority public."CasePriority" DEFAULT 'NORMAL'::public."CasePriority" NOT NULL,
    "assigneeId" text,
    "creatorId" text,
    "partnerAssignmentId" text,
    "dueAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TaskComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TaskComment" (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Template; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Template" (
    id text NOT NULL,
    "tenantId" text,
    key text NOT NULL,
    name text NOT NULL,
    kind public."TemplateKind" DEFAULT 'MESSAGE'::public."TemplateKind" NOT NULL,
    locale text DEFAULT 'en'::text NOT NULL,
    body text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    plan public."TenantPlan" DEFAULT 'STARTER'::public."TenantPlan" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "retentionDays" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    phone text,
    locale text DEFAULT 'en'::text NOT NULL,
    "mfaSecret" text,
    "mfaEnabled" boolean DEFAULT false NOT NULL,
    "isPlatformAdmin" boolean DEFAULT false NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VisaCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VisaCategory" (
    id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    audience text,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLegalReviewAt" timestamp(3) without time zone,
    "reviewedByName" text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AIInteraction; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AttorneyReview; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Case; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Case" (id, "tenantId", "clientId", "visaCategoryId", "companyId", "caseNumberInternal", "externalReceiptNumber", "externalCaseNumber", status, priority, "strategySummary", "strategyStatus", "attorneyId", "paralegalId", "caseManagerId", "openedAt", "filedAt", "decisionAt", "closedAt", "nextDeadlineAt", "nextAction", "riskLevel", "billingStatus", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsx200757d5ew7umhv88', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnswn00707d5eiefnzhyi', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnswv00737d5em8wzdqqr', 'MIL-2026-0001', NULL, NULL, 'DOCUMENT_COLLECTION', 'HIGH', NULL, 'DRAFT', 'cmr6fnsvr006j7d5e8v0qseek', 'cmr6fnsvu006k7d5ew40t91ny', NULL, '2026-07-04 14:03:55.047', NULL, NULL, NULL, '2026-07-18 14:03:55.045', 'Collect source-of-funds documentation', 'LOW', 'PENDING', NULL, '2026-07-04 14:03:55.047', '2026-07-04 14:03:55.047');


--
-- Data for Name: CaseApplicant; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CaseApplicant" (id, "caseId", "dependentId", "fullName", kind) VALUES ('cmr6fnsx300767d5e6ls4duqm', 'cmr6fnsx200757d5ew7umhv88', NULL, 'Lucas Ferreira', 'PRINCIPAL');


--
-- Data for Name: CaseEvent; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CaseEvent" (id, "caseId", "actorId", kind, title, detail, "clientVisible", "createdAt") VALUES ('cmr6fnsy2007q7d5e7l81n8tu', 'cmr6fnsx200757d5ew7umhv88', 'cmr6fnsvr006j7d5e8v0qseek', 'STATUS_CHANGE', 'Case opened', 'E-2 strategy engaged', true, '2026-07-04 14:03:55.082');
INSERT INTO public."CaseEvent" (id, "caseId", "actorId", kind, title, detail, "clientVisible", "createdAt") VALUES ('cmr6fnsy2007r7d5esb4d5021', 'cmr6fnsx200757d5ew7umhv88', 'cmr6fnsvu006k7d5ew40t91ny', 'STATUS_CHANGE', 'Document collection started', 'Checklist shared with client', true, '2026-07-04 14:03:55.082');
INSERT INTO public."CaseEvent" (id, "caseId", "actorId", kind, title, detail, "clientVisible", "createdAt") VALUES ('cmr6fnsy2007s7d5e2xbg2hhh', 'cmr6fnsx200757d5ew7umhv88', 'cmr6fnsvw006l7d5eesf8gnq6', 'DOCUMENT_UPLOADED', 'Passport uploaded', NULL, true, '2026-07-04 14:03:55.082');


--
-- Data for Name: Checklist; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Checklist" (id, "tenantId", "caseId", name, "createdAt") VALUES ('cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'E-2 Document Checklist', '2026-07-04 14:03:55.057');


--
-- Data for Name: ChecklistItem; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007a7d5easb0ascr', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsmu003o7d5et717jrzq', NULL, 'Valid passport (treaty country)', 'REQUIRED', 'client', 'APPROVED', NULL, NULL, 0);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007b7d5emn4g7ei3', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsmw003q7d5e3u08cm86', NULL, 'Source of funds documentation', 'REQUIRED', 'client', 'PENDING', NULL, NULL, 1);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007c7d5ekdmxza9e', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsn1003s7d5edph52ojb', NULL, 'Investment wire transfers', 'REQUIRED', 'client', 'PENDING', NULL, NULL, 2);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007d7d5evl79t3r5', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsn4003u7d5e31j4pex4', NULL, '5-year business plan', 'REQUIRED', 'partner', 'PENDING', NULL, NULL, 3);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007e7d5e9k4zcayf', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsn6003w7d5emic0yxmz', NULL, 'US company formation documents', 'REQUIRED', 'client_company', 'PENDING', NULL, NULL, 4);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007f7d5ew443h0an', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsn9003y7d5e5auze5xp', NULL, 'Commercial lease', 'CONDITIONAL', 'client', 'PENDING', NULL, NULL, 5);
INSERT INTO public."ChecklistItem" (id, "checklistId", "requirementId", "documentId", label, necessity, "ownerRole", status, "dueAt", comment, "sortOrder") VALUES ('cmr6fnsxd007g7d5eubq5qv46', 'cmr6fnsxd00787d5edgo0x6wu', 'cmr6fnsnm00407d5e1j7s5p6r', NULL, 'Payroll records', 'CONDITIONAL', 'client', 'PENDING', NULL, NULL, 6);


--
-- Data for Name: Client; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Client" (id, "tenantId", "userId", "fullName", email, phone, nationality, "countryOfResidence", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnswn00707d5eiefnzhyi', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvw006l7d5eesf8gnq6', 'Lucas Ferreira', 'client@example.dev', NULL, 'Brazil', 'Brazil', NULL, '2026-07-04 14:03:55.032', '2026-07-04 14:03:55.032');


--
-- Data for Name: ClientProfile; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ClientProfile" (id, "clientId", data, "updatedAt") VALUES ('cmr6fnswn00717d5ej4j3k1wb', 'cmr6fnswn00707d5eiefnzhyi', '{"identity": {"nationality": "Brazil"}}', '2026-07-04 14:03:55.032');


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Company" (id, "tenantId", "clientId", name, country, ein, role, data, "createdAt") VALUES ('cmr6fnswv00737d5em8wzdqqr', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnswn00707d5eiefnzhyi', 'Ferreira Tech LLC', 'US', NULL, 'US_ENTITY', '{}', '2026-07-04 14:03:55.04');


--
-- Data for Name: ComplianceEvent; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ComplianceEvent" (id, "tenantId", "caseId", kind, title, "dueAt", status, note, "createdAt") VALUES ('cmr6fnsyo00857d5eiladctik', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'INVESTMENT_MONITORING', 'Quarterly investment activity review', '2026-09-02 14:03:55.104', 'UPCOMING', NULL, '2026-07-04 14:03:55.105');
INSERT INTO public."ComplianceEvent" (id, "tenantId", "caseId", kind, title, "dueAt", status, note, "createdAt") VALUES ('cmr6fnsyo00867d5eypqrt4b6', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'ANNUAL_REPORT', 'Florida annual report filing', '2026-10-02 14:03:55.104', 'UPCOMING', NULL, '2026-07-04 14:03:55.105');


--
-- Data for Name: ContentVersion; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Dependent; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: DocumentRequirement; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsl4002k7d5e157xs3l8', 'cmr6fnshz001e7d5e2pk7xg6p', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport (6+ months)', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsl8002m7d5e65we3m8d', 'cmr6fnshz001e7d5e2pk7xg6p', 'cmr6fnsk500267d5e9foq4bcc', 'Proof of funds for the trip', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslb002o7d5e59t36rpf', 'cmr6fnshz001e7d5e2pk7xg6p', 'cmr6fnsjn00207d5e70i8w0pq', 'Employment / ties evidence', 'OPTIONAL', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslf002q7d5e15cdp8uy', 'cmr6fnsi3001f7d5eu100t9sc', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsli002s7d5eh719m73y', 'cmr6fnsi3001f7d5eu100t9sc', 'cmr6fnsjj001y7d5et8i88ufh', 'Academic transcripts', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsll002u7d5erx1dkhul', 'cmr6fnsi3001f7d5eu100t9sc', 'cmr6fnsk500267d5e9foq4bcc', 'Financial support evidence', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslp002w7d5evfg1jw06', 'cmr6fnsi9001h7d5eaz6szv3d', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsls002y7d5e06st1l4w', 'cmr6fnsi9001h7d5eaz6szv3d', 'cmr6fnsjg001x7d5evegnpimi', 'Degree / diploma', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslu00307d5e9ewfkbze', 'cmr6fnsi9001h7d5eaz6szv3d', 'cmr6fnsjl001z7d5e2acpx83p', 'Updated CV', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslx00327d5em3x2kpxx', 'cmr6fnsi9001h7d5eaz6szv3d', 'cmr6fnsjn00207d5e70i8w0pq', 'Employer support letter', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnslz00347d5e01xs1dyc', 'cmr6fnsi9001h7d5eaz6szv3d', 'cmr6fnsjr00217d5e99vwdi74', 'Recent pay stubs', 'CONDITIONAL', 'client', 'attorney', 'currently_employed_in_us=true', 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsm400367d5e4j98t4ra', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsm600387d5euyh4rp1x', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnsju00227d5ejtkhstgu', 'Foreign company organizational chart', 'REQUIRED', 'client_company', 'attorney', 'applicant_role=executive OR managerial', 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsm9003a7d5elic90ipy', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnsjn00207d5e70i8w0pq', 'Employment verification (1+ year abroad)', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmc003c7d5erwfv9sj6', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnsjw00237d5enqde12ou', 'US entity formation documents', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsme003e7d5ey9pyitzl', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnsk300257d5e3pnme9gy', 'Company tax returns', 'REQUIRED', 'client_company', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmh003g7d5easmqetid', 'cmr6fnsic001i7d5evv73kunf', 'cmr6fnskl002c7d5ee6n7ci0b', 'US operations plan', 'CONDITIONAL', 'partner', 'attorney', 'new_office=true', 'CONFIDENTIAL', NULL, 1, true, 5);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsml003i7d5esqfzs3sb', 'cmr6fnsif001j7d5e9tjp8350', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmn003k7d5exbhvn9em', 'cmr6fnsif001j7d5e9tjp8350', 'cmr6fnsjn00207d5e70i8w0pq', 'Specialized knowledge evidence', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmq003m7d5emhxea3m5', 'cmr6fnsif001j7d5e9tjp8350', 'cmr6fnsju00227d5ejtkhstgu', 'Organizational chart', 'OPTIONAL', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmu003o7d5et717jrzq', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport (treaty country)', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsmw003q7d5e3u08cm86', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnsk800277d5e3d0ztf4y', 'Source of funds documentation', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsn1003s7d5edph52ojb', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnsko002d7d5e2zvfp1zc', 'Investment wire transfers', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsn4003u7d5e31j4pex4', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnskl002c7d5ee6n7ci0b', '5-year business plan', 'REQUIRED', 'partner', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsn6003w7d5emic0yxmz', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnsjw00237d5enqde12ou', 'US company formation documents', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsn9003y7d5e5auze5xp', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnskq002e7d5et43nkn0e', 'Commercial lease', 'CONDITIONAL', 'client', 'attorney', 'physical_location=true', 'CONFIDENTIAL', NULL, 1, true, 5);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsnm00407d5e1j7s5p6r', 'cmr6fnsih001k7d5ez42bfg2s', 'cmr6fnsks002f7d5etukhwk4l', 'Payroll records', 'CONDITIONAL', 'client', 'attorney', 'existing_operation=true', 'CONFIDENTIAL', NULL, 1, true, 6);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsnv00427d5e3wkg0p1v', 'cmr6fnsik001l7d5ezklhigt9', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsny00447d5en6vpifqp', 'cmr6fnsik001l7d5ezklhigt9', 'cmr6fnsjl001z7d5e2acpx83p', 'Updated CV', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnso000467d5ewyni19h7', 'cmr6fnsik001l7d5ezklhigt9', 'cmr6fnskd00297d5enc2iv0vn', 'Awards and media coverage', 'REQUIRED', 'client', 'attorney', NULL, 'INTERNAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnso300487d5enyt263yu', 'cmr6fnsik001l7d5ezklhigt9', 'cmr6fnskf002a7d5e46aexdme', 'Expert recommendation letters', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnso6004a7d5efga8fdcz', 'cmr6fnsik001l7d5ezklhigt9', 'cmr6fnskj002b7d5e9llp5h5d', 'Publications / citations', 'OPTIONAL', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnso9004c7d5e9hbfkk4h', 'cmr6fnsim001m7d5eif7m1kji', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsoc004e7d5eidgyn0u6', 'cmr6fnsim001m7d5eif7m1kji', 'cmr6fnsjl001z7d5e2acpx83p', 'Updated CV', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsoe004g7d5ehahzpkkq', 'cmr6fnsim001m7d5eif7m1kji', 'cmr6fnskd00297d5enc2iv0vn', 'Major awards / recognition evidence', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsoh004i7d5e8x2c1e40', 'cmr6fnsim001m7d5eif7m1kji', 'cmr6fnskf002a7d5e46aexdme', 'Expert letters', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsok004k7d5egwk3ktqp', 'cmr6fnsim001m7d5eif7m1kji', 'cmr6fnskj002b7d5e9llp5h5d', 'Publications and citation record', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsoo004m7d5e5sq4sqj6', 'cmr6fnsip001n7d5edrmj52jl', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsor004o7d5e3nzomc4f', 'cmr6fnsip001n7d5edrmj52jl', 'cmr6fnsju00227d5ejtkhstgu', 'Multinational organizational charts', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsou004q7d5ejldyv4p1', 'cmr6fnsip001n7d5edrmj52jl', 'cmr6fnsjn00207d5e70i8w0pq', 'Managerial capacity evidence', 'REQUIRED', 'client_company', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsow004s7d5ejtmxr1yp', 'cmr6fnsip001n7d5edrmj52jl', 'cmr6fnsk300257d5e3pnme9gy', 'US entity tax returns', 'REQUIRED', 'client_company', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsoz004u7d5e0h76jsya', 'cmr6fnsir001o7d5e9mkspx5b', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsp2004w7d5exj9flpwj', 'cmr6fnsir001o7d5e9mkspx5b', 'cmr6fnsjg001x7d5evegnpimi', 'Advanced degree evidence', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsp5004y7d5e9w0t2xuk', 'cmr6fnsir001o7d5e9mkspx5b', 'cmr6fnsjl001z7d5e2acpx83p', 'Updated CV', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsp700507d5eq6ej73du', 'cmr6fnsir001o7d5e9mkspx5b', 'cmr6fnskf002a7d5e46aexdme', 'Letters on national importance', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspa00527d5epqn5573n', 'cmr6fnsir001o7d5e9mkspx5b', 'cmr6fnskj002b7d5e9llp5h5d', 'Publications / impact evidence', 'OPTIONAL', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspe00547d5eco484fdf', 'cmr6fnsiu001p7d5er9x3muff', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspg00567d5evkxd09it', 'cmr6fnsiu001p7d5er9x3muff', 'cmr6fnsk800277d5e3d0ztf4y', 'Lawful source of funds trail', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspj00587d5eu8o214sy', 'cmr6fnsiu001p7d5er9x3muff', 'cmr6fnsko002d7d5e2zvfp1zc', 'Capital transfer evidence', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspn005a7d5eiyh78ot0', 'cmr6fnsiu001p7d5er9x3muff', 'cmr6fnskl002c7d5ee6n7ci0b', 'Job-creating business plan', 'REQUIRED', 'partner', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 3);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspq005c7d5e39piatn5', 'cmr6fnsiu001p7d5er9x3muff', 'cmr6fnsks002f7d5etukhwk4l', 'Job creation / payroll evidence', 'CONDITIONAL', 'client', 'attorney', 'operational=true', 'CONFIDENTIAL', NULL, 1, true, 4);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspu005e7d5er5kw5p5e', 'cmr6fnsiw001q7d5ezodaqr0u', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspw005g7d5er7mtve1d', 'cmr6fnsiw001q7d5ezodaqr0u', 'cmr6fnsk800277d5e3d0ztf4y', 'Lawful source of funds trail', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 1);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnspz005i7d5ex92uenr1', 'cmr6fnsiw001q7d5ezodaqr0u', 'cmr6fnsko002d7d5e2zvfp1zc', 'Capital transfer to project escrow', 'REQUIRED', 'client', 'attorney', NULL, 'RESTRICTED', NULL, 1, true, 2);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsq2005k7d5erq8pib1l', 'cmr6fnsi6001g7d5eksqhoen1', 'cmr6fnsiz001r7d5e11gpzjl4', 'Valid passport', 'REQUIRED', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 0);
INSERT INTO public."DocumentRequirement" (id, "visaCategoryId", "documentTypeId", label, necessity, "ownerRole", "reviewerRole", condition, sensitivity, guidance, "ruleVersion", "approvedByAttorney", "sortOrder") VALUES ('cmr6fnsq5005m7d5e00f2f29k', 'cmr6fnsi6001g7d5eksqhoen1', 'cmr6fnsjj001y7d5et8i88ufh', 'Program qualification evidence', 'OPTIONAL', 'client', 'attorney', NULL, 'CONFIDENTIAL', NULL, 1, true, 1);


--
-- Data for Name: DocumentReview; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: DocumentType; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsiz001r7d5e11gpzjl4', 'passport', 'Passport', 'IDENTITY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsj3001s7d5er30skuna', 'birth_certificate', 'Birth Certificate', 'IDENTITY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsj6001t7d5ew8o4k6en', 'marriage_certificate', 'Marriage Certificate', 'IDENTITY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsj9001u7d5efhir33r9', 'prior_visas', 'Prior Visas', 'IMMIGRATION');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjb001v7d5euw8xcpy2', 'i94', 'I-94 Record', 'IMMIGRATION');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsje001w7d5ekvby1bqf', 'uscis_notices', 'USCIS Notices / Receipts', 'IMMIGRATION');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjg001x7d5evegnpimi', 'diploma', 'Diploma', 'EDUCATION');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjj001y7d5et8i88ufh', 'transcripts', 'Academic Transcripts', 'EDUCATION');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjl001z7d5e2acpx83p', 'cv', 'Curriculum Vitae', 'EMPLOYMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjn00207d5e70i8w0pq', 'employment_letter', 'Employment Verification Letter', 'EMPLOYMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjr00217d5e99vwdi74', 'paystubs', 'Pay Stubs', 'EMPLOYMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsju00227d5ejtkhstgu', 'org_chart', 'Organizational Chart', 'COMPANY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsjw00237d5enqde12ou', 'articles_of_organization', 'Articles of Organization', 'COMPANY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsk000247d5egc0wbmmd', 'ein_letter', 'EIN Letter', 'COMPANY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsk300257d5e3pnme9gy', 'company_tax_returns', 'Company Tax Returns', 'COMPANY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsk500267d5e9foq4bcc', 'bank_statements', 'Bank Statements', 'FINANCIAL');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsk800277d5e3d0ztf4y', 'source_of_funds', 'Source of Funds Evidence', 'FINANCIAL');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnska00287d5ekahnghem', 'personal_tax_returns', 'Personal Tax Returns', 'FINANCIAL');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskd00297d5enc2iv0vn', 'awards_media', 'Awards / Media Coverage', 'EVIDENCE');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskf002a7d5e46aexdme', 'recommendation_letters', 'Recommendation Letters', 'EVIDENCE');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskj002b7d5e9llp5h5d', 'publications', 'Publications / Citations', 'EVIDENCE');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskl002c7d5ee6n7ci0b', 'business_plan', 'Business Plan', 'INVESTMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsko002d7d5e2zvfp1zc', 'wire_transfers', 'Wire Transfer Records', 'INVESTMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskq002e7d5et43nkn0e', 'lease_agreement', 'Lease Agreement', 'INVESTMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnsks002f7d5etukhwk4l', 'payroll_records', 'Payroll Records', 'INVESTMENT');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskv002g7d5ea6b288rq', 'dependent_documents', 'Dependent Documents', 'FAMILY');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskx002h7d5e0mv6mbol', 'engagement_letter', 'Engagement Letter', 'LEGAL');
INSERT INTO public."DocumentType" (id, key, name, category) VALUES ('cmr6fnskz002i7d5e64o1drdx', 'declarations', 'Declarations / Affidavits', 'LEGAL');


--
-- Data for Name: EligibilityAssessment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: EngagementLetter; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: IntakeAnswer; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: IntakeForm; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: IntakeQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsq8005n7d5ep1rc56rp', NULL, 'identity', 'full_name', 'Full legal name', 'Nome completo', 'Nombre legal completo', 'TEXT', NULL, true, NULL, NULL, 1, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqc005o7d5e1fsai3ko', NULL, 'identity', 'nationality', 'Nationality', 'Nacionalidade', 'Nacionalidad', 'COUNTRY', NULL, true, NULL, NULL, 2, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqf005p7d5eukswguuw', NULL, 'identity', 'second_citizenship', 'Do you hold a second citizenship?', 'Possui segunda cidadania?', '¿Tiene una segunda ciudadanía?', 'BOOLEAN', NULL, false, NULL, NULL, 3, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqh005q7d5e8995iiig', NULL, 'identity', 'second_citizenship_country', 'Which country?', 'Qual país?', '¿Qué país?', 'COUNTRY', NULL, false, 'second_citizenship', 'true', 4, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqk005r7d5epqkgelc9', NULL, 'identity', 'country_of_residence', 'Country of residence', 'País de residência', 'País de residencia', 'COUNTRY', NULL, true, NULL, NULL, 5, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqn005s7d5e5av2aplt', NULL, 'goal', 'goal', 'Main objective', 'Objetivo principal', 'Objetivo principal', 'SELECT', '["Visit", "Study", "Work", "Invest", "Transfer my company", "Green card"]', true, NULL, NULL, 10, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqr005t7d5ebgogmjlr', NULL, 'goal', 'timeline', 'Desired timeline', 'Prazo desejado', 'Plazo deseado', 'SELECT', '["ASAP", "3-6 months", "6-12 months", "1+ year"]', false, NULL, NULL, 11, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqt005u7d5eg3qjz4sd', NULL, 'history', 'prior_us_visas', 'Have you held US visas before?', 'Já teve vistos americanos?', '¿Ha tenido visas de EE.UU. antes?', 'BOOLEAN', NULL, true, NULL, NULL, 20, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqv005v7d5e2lx1999d', NULL, 'history', 'prior_denials', 'Any prior visa denials?', 'Alguma negativa de visto anterior?', '¿Alguna denegación de visa anterior?', 'BOOLEAN', NULL, true, NULL, NULL, 21, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsqx005w7d5eade0538e', NULL, 'history', 'prior_denial_details', 'Describe the denial(s)', 'Descreva a(s) negativa(s)', 'Describa la(s) denegación(es)', 'TEXTAREA', NULL, false, 'prior_denials', 'true', 22, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsr0005x7d5ewlrraiup', NULL, 'history', 'overstay', 'Have you ever overstayed a visa?', 'Já permaneceu além do prazo do visto?', '¿Alguna vez se quedó más tiempo del permitido?', 'BOOLEAN', NULL, true, NULL, NULL, 23, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsr2005y7d5e59yq1ti6', NULL, 'history', 'deportation', 'Any removal/deportation proceedings?', 'Algum processo de deportação/remoção?', '¿Algún proceso de deportación?', 'BOOLEAN', NULL, true, NULL, NULL, 24, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsr5005z7d5eqptk0n5z', NULL, 'family', 'marital_status', 'Marital status', 'Estado civil', 'Estado civil', 'SELECT', '["Single", "Married", "Divorced", "Widowed"]', false, NULL, NULL, 30, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsr700607d5e9613vgbi', NULL, 'family', 'dependents_count', 'Number of dependents', 'Número de dependentes', 'Número de dependientes', 'NUMBER', NULL, false, NULL, NULL, 31, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsra00617d5epcmqt6ac', NULL, 'education', 'highest_degree', 'Highest degree obtained', 'Maior grau de formação', 'Título más alto obtenido', 'SELECT', '["High school", "Bachelor", "Master", "MBA", "PhD", "Other"]', false, NULL, NULL, 40, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsrd00627d5em632689q', NULL, 'education', 'years_experience', 'Years of professional experience', 'Anos de experiência profissional', 'Años de experiencia profesional', 'NUMBER', NULL, false, NULL, NULL, 41, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsrg00637d5efpcssifn', NULL, 'business', 'owns_business', 'Do you own a business?', 'Possui empresa?', '¿Es dueño de una empresa?', 'BOOLEAN', NULL, false, NULL, NULL, 50, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsri00647d5ezbg0rjtk', NULL, 'business', 'business_revenue', 'Annual revenue (USD)', 'Faturamento anual (USD)', 'Ingresos anuales (USD)', 'NUMBER', NULL, false, 'owns_business', 'true', 51, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsrl00657d5e12v4kuzk', NULL, 'business', 'business_employees', 'Number of employees', 'Número de funcionários', 'Número de empleados', 'NUMBER', NULL, false, 'owns_business', 'true', 52, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsro00667d5ewq4sjulb', NULL, 'investment', 'investment_capital', 'Capital available to invest (USD)', 'Capital disponível para investir (USD)', 'Capital disponible para invertir (USD)', 'SELECT', '["None", "Under $100k", "$100k-$500k", "$500k-$1M", "Over $1M"]', false, NULL, NULL, 60, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsrq00677d5ewxxecm7o', NULL, 'investment', 'funds_source', 'Primary source of funds', 'Origem principal dos fundos', 'Fuente principal de los fondos', 'SELECT', '["Business income", "Salary/savings", "Sale of assets", "Inheritance/gift", "Investments", "Other"]', false, 'investment_capital', '!None', 61, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsru00687d5etib9ey63', NULL, 'recognition', 'awards', 'Awards, media coverage or publications?', 'Prêmios, mídia ou publicações?', '¿Premios, cobertura mediática o publicaciones?', 'BOOLEAN', NULL, false, NULL, NULL, 70, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsrw00697d5eddhs1rkh', NULL, 'recognition', 'awards_details', 'Briefly describe your recognition', 'Descreva brevemente seu reconhecimento', 'Describa brevemente su reconocimiento', 'TEXTAREA', NULL, false, 'awards', 'true', 71, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnsry006a7d5etfgvsfw7', NULL, 'employer', 'has_sponsor', 'Do you have a US employer/sponsor?', 'Possui empregador/patrocinador nos EUA?', '¿Tiene un empleador/patrocinador en EE.UU.?', 'BOOLEAN', NULL, false, NULL, NULL, 80, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnss1006b7d5euy2sldop', NULL, 'employer', 'sponsor_details', 'Sponsor company and role', 'Empresa patrocinadora e cargo', 'Empresa patrocinadora y cargo', 'TEXTAREA', NULL, false, 'has_sponsor', 'true', 81, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnss3006c7d5ecv3r53n2', NULL, 'risk', 'criminal_history', 'Any criminal history (arrests, charges, convictions)?', 'Histórico criminal (prisões, acusações, condenações)?', '¿Antecedentes penales (arrestos, cargos, condenas)?', 'BOOLEAN', NULL, true, NULL, NULL, 90, true);
INSERT INTO public."IntakeQuestion" (id, "visaCategoryId", block, key, label, "labelPt", "labelEs", "fieldType", options, required, "dependsOnKey", "dependsOnValue", "sortOrder", "isActive") VALUES ('cmr6fnss6006d7d5ea9nbhvrc', NULL, 'risk', 'criminal_details', 'Describe (confidential)', 'Descreva (confidencial)', 'Describa (confidencial)', 'TEXTAREA', NULL, false, 'criminal_history', 'true', 91, true);


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Invoice" (id, "tenantId", "caseId", number, amount, currency, status, "dueAt", "createdAt") VALUES ('cmr6fnsyd00807d5e9qcux895', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'INV-2026-0001', 8500.00, 'USD', 'PARTIAL', '2026-08-03 14:03:55.093', '2026-07-04 14:03:55.094');


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Lead" (id, "tenantId", name, email, phone, source, interest, "estimatedValue", stage, score, notes, "assignedToId", "createdAt", "updatedAt") VALUES ('cmr6fnsyj00827d5ej1z0dlqt', 'cmr6fnsv7006e7d5eb4kpk8p5', 'Maria Santos', 'maria@example.com', NULL, 'LANDING_PAGE', 'EB-2-NIW', 12000.00, 'SCREENING', 72, NULL, NULL, '2026-07-04 14:03:55.1', '2026-07-04 14:03:55.1');
INSERT INTO public."Lead" (id, "tenantId", name, email, phone, source, interest, "estimatedValue", stage, score, notes, "assignedToId", "createdAt", "updatedAt") VALUES ('cmr6fnsyj00837d5ejsdaykn7', 'cmr6fnsv7006e7d5eb4kpk8p5', 'Chen Wei', 'chen@example.com', NULL, 'REFERRAL', 'EB-5-DIRECT', 25000.00, 'CONSULT_SCHEDULED', 88, NULL, NULL, '2026-07-04 14:03:55.1', '2026-07-04 14:03:55.1');
INSERT INTO public."Lead" (id, "tenantId", name, email, phone, source, interest, "estimatedValue", stage, score, notes, "assignedToId", "createdAt", "updatedAt") VALUES ('cmr6fnsyk00847d5ehxdjrxj2', 'cmr6fnsv7006e7d5eb4kpk8p5', 'Ahmed Hassan', 'ahmed@example.com', NULL, 'ADS', 'L-1A', 15000.00, 'NEW', 45, NULL, NULL, '2026-07-04 14:03:55.1', '2026-07-04 14:03:55.1');


--
-- Data for Name: LegalNote; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."LegalNote" (id, "tenantId", "caseId", "authorId", body, visibility, "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsxw007p7d5ejg73eeox', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'cmr6fnsvr006j7d5e8v0qseek', 'Source of funds includes proceeds from a 2023 company sale - need the sale agreement and tax treatment before drafting. Marginality risk is low.', 'LEGAL_TEAM', NULL, '2026-07-04 14:03:55.077', '2026-07-04 14:03:55.077');


--
-- Data for Name: Membership; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnsw2006o7d5ejvtoz5io', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvk006h7d5e2y0jlvgf', 'cmr6fnsfn00127d5e5rhlgpij', true, '2026-07-04 14:03:55.01');
INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnsw6006q7d5eqdsubqtd', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvo006i7d5ejtfpb4er', 'cmr6fnsfz00137d5edz7i1g5q', true, '2026-07-04 14:03:55.014');
INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnsw9006s7d5efrf5sdsm', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvr006j7d5e8v0qseek', 'cmr6fnsgc00157d5eihdj9k0h', true, '2026-07-04 14:03:55.017');
INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnswc006u7d5ea15dbz7s', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvu006k7d5ew40t91ny', 'cmr6fnsgq00177d5efpne4vau', true, '2026-07-04 14:03:55.02');
INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnswf006w7d5emdqwyt4n', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvw006l7d5eesf8gnq6', 'cmr6fnshm001c7d5ejf8s5m3d', true, '2026-07-04 14:03:55.023');
INSERT INTO public."Membership" (id, "tenantId", "organizationId", "userId", "roleId", "isActive", "createdAt") VALUES ('cmr6fnswi006y7d5efr9gqn4n', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsvz006m7d5ev0c4wkjk', 'cmr6fnsht001d7d5e5786ql48', true, '2026-07-04 14:03:55.027');


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Message" (id, "threadId", "senderId", body, "createdAt") VALUES ('cmr6fnsxt007m7d5e4staiwnc', 'cmr6fnsxp007l7d5emktyculz', 'cmr6fnsvu006k7d5ew40t91ny', 'Hi Lucas! We opened your document checklist. Please start with your passport and bank statements.', '2026-07-04 14:03:55.073');
INSERT INTO public."Message" (id, "threadId", "senderId", body, "createdAt") VALUES ('cmr6fnsxt007n7d5etx1s3yws', 'cmr6fnsxp007l7d5emktyculz', 'cmr6fnsvw006l7d5eesf8gnq6', 'Thanks Sofia! Passport uploaded. Working on the bank statements this week.', '2026-07-04 14:03:55.073');


--
-- Data for Name: MessageThread; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."MessageThread" (id, "tenantId", "caseId", subject, channel, "createdAt") VALUES ('cmr6fnsxp007l7d5emktyculz', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'E-2 case - document collection', 'OPERATIONAL', '2026-07-04 14:03:55.069');


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Organization" (id, "tenantId", name, kind, "createdAt", "updatedAt") VALUES ('cmr6fnsvg006g7d5espyi1hsn', 'cmr6fnsv7006e7d5eb4kpk8p5', 'Martinez Immigration Law', 'LAW_FIRM', '2026-07-04 14:03:54.988', '2026-07-04 14:03:54.988');


--
-- Data for Name: Partner; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Partner" (id, "tenantId", "userId", name, kind, email, "isActive", "createdAt") VALUES ('cmr6fnsy6007u7d5eez8ku3hu', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsvz006m7d5ev0c4wkjk', 'Ross & Co CPAs', 'CPA_ACCOUNTANT', 'partner@cpafirm.dev', true, '2026-07-04 14:03:55.086');


--
-- Data for Name: PartnerAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."PartnerAssignment" (id, "partnerId", "caseId", scope, status, "expiresAt", "createdAt") VALUES ('cmr6fnsy6007w7d5ebqzkqwnm', 'cmr6fnsy6007u7d5eez8ku3hu', 'cmr6fnsx200757d5ew7umhv88', 'Source of funds CPA report', 'ACTIVE', NULL, '2026-07-04 14:03:55.086');


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Payment" (id, "invoiceId", amount, method, reference, "paidAt") VALUES ('cmr6fnsyd00817d5eg2ehxs6d', 'cmr6fnsyd00807d5e9qcux895', 4250.00, 'stripe', 'pi_demo_001', '2026-07-04 14:03:55.094');


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnscr00007d5evwo7fjs3', 'case.read', 'Read cases', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsd000017d5e2nrobew6', 'case.read_own', 'Read own cases', 'OWN');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsd400027d5e8bfzv08w', 'case.create', 'Create cases', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsd700037d5ev9m4jmyg', 'case.update', 'Update cases', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsda00047d5e5lt82o59', 'case.assign', 'Assign case team', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdd00057d5eazbvkxv0', 'case.change_status', 'Change case status', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdg00067d5eydsyi098', 'client.read', 'Read clients', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdi00077d5eeqe10m39', 'client.create', 'Create clients', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdl00087d5exsv8ztku', 'client.update', 'Update clients', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdo00097d5eac0xtfe4', 'lead.read', 'Read leads', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdr000a7d5e2nni9cxb', 'lead.manage', 'Manage leads', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdt000b7d5e590p6kbt', 'document.upload', 'Upload documents', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdv000c7d5ey6qc6wxg', 'document.read', 'Read documents', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsdy000d7d5ediobb3rv', 'document.read_own', 'Read own documents', 'OWN');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnse0000e7d5eckadw8vq', 'document.read_sensitive', 'Read restricted-sensitivity documents', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnse2000f7d5em2006clu', 'document.approve', 'Approve or reject documents', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnse5000g7d5ev5rpet78', 'document.suggest_review', 'Suggest document review outcome', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnse7000h7d5edczyex5l', 'checklist.edit', 'Edit case checklists', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnse9000i7d5ehj1gaqao', 'task.read', 'Read tasks', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnseb000j7d5ea8ousm8q', 'task.manage', 'Create and update tasks', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsee000k7d5ecg1n5bug', 'message.send', 'Send case messages', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnseg000l7d5e3y8osmd5', 'message.read_internal', 'Read internal-channel messages', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsej000m7d5esms5c9ac', 'legal_note.read', 'Read private legal notes', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsel000n7d5ek5isezq1', 'legal_note.read_limited', 'Read legal-team notes (not attorney-only)', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsen000o7d5er3422jk3', 'legal_note.create', 'Create private legal notes', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnseq000p7d5ey0uyauib', 'legal_strategy.create', 'Create/approve legal strategy', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnses000q7d5e6x6ldyd4', 'attorney_review.approve', 'Approve attorney review gates', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnseu000r7d5erg8918qz', 'billing.read', 'Read billing', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsex000s7d5em43hsaw8', 'billing.read_own', 'Read own invoices/payments', 'OWN');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsez000t7d5e6pqvlin6', 'billing.manage', 'Manage billing', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsf1000u7d5eyprbh77j', 'partner.assign', 'Invite/assign partners to cases', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsf4000v7d5etmk0ly1h', 'user.remove', 'Remove users from tenant', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsf6000w7d5e0qi7bsqe', 'dossier.export', 'Export case dossier', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsfb000x7d5e2avdte82', 'dossier.export_limited', 'Export own limited dossier', 'OWN');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsfd000y7d5eyczjutwc', 'audit.read', 'Read audit logs', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsfg000z7d5ezwn50v1j', 'report.read', 'Read firm reports', 'TENANT');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsfi00107d5eg55w63il', 'tenant.manage', 'Manage tenants', 'PLATFORM');
INSERT INTO public."Permission" (id, key, description, scope) VALUES ('cmr6fnsfk00117d5etwjzgzwh', 'visa_config.manage', 'Manage visa categories/requirements', 'PLATFORM');


--
-- Data for Name: RiskFlag; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'super_admin', 'Super Admin', 'Platform-wide administration. Every action is audit-logged.', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'firm_owner', 'Law Firm Owner', 'Owns the firm tenant', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsg600147d5ep30wqev3', 'firm_admin', 'Firm Admin', 'Firm administrative management', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'attorney', 'Attorney', 'Legally responsible for cases', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'supervising_attorney', 'Supervising Attorney', 'Approves strategies, petitions and filings', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsgq00177d5efpne4vau', 'paralegal', 'Paralegal', 'Collects documents, organizes tasks, prepares drafts', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'case_manager', 'Case Manager', 'Coordinates client, deadlines and partners', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsh400197d5e970760c8', 'intake_specialist', 'Intake Specialist', 'Commercial screening', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'billing_manager', 'Billing Manager', 'Fees and collections', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'auditor', 'Read-only Auditor', 'Views cases without editing', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'client', 'Client', 'Principal applicant / client portal user', true);
INSERT INTO public."Role" (id, key, name, description, "isSystem") VALUES ('cmr6fnsht001d7d5e5786ql48', 'partner', 'Partner', 'External partner; only sees explicitly assigned scope', true);


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsd000017d5e2nrobew6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsd400027d5e8bfzv08w');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsda00047d5e5lt82o59');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdo00097d5eac0xtfe4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdr000a7d5e2nni9cxb');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsdy000d7d5ediobb3rv');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnse0000e7d5eckadw8vq');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnse2000f7d5em2006clu');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnse5000g7d5ev5rpet78');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsej000m7d5esms5c9ac');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsel000n7d5ek5isezq1');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsen000o7d5er3422jk3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnseq000p7d5ey0uyauib');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnses000q7d5e6x6ldyd4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsex000s7d5em43hsaw8');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsez000t7d5e6pqvlin6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsf4000v7d5etmk0ly1h');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsfb000x7d5e2avdte82');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsfd000y7d5eyczjutwc');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsfi00107d5eg55w63il');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfn00127d5e5rhlgpij', 'cmr6fnsfk00117d5etwjzgzwh');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsd400027d5e8bfzv08w');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsda00047d5e5lt82o59');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdo00097d5eac0xtfe4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdr000a7d5e2nni9cxb');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnse0000e7d5eckadw8vq');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnse2000f7d5em2006clu');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsej000m7d5esms5c9ac');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsen000o7d5er3422jk3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnseq000p7d5ey0uyauib');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnses000q7d5e6x6ldyd4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsez000t7d5e6pqvlin6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsf4000v7d5etmk0ly1h');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsfd000y7d5eyczjutwc');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsfz00137d5edz7i1g5q', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsd400027d5e8bfzv08w');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsda00047d5e5lt82o59');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdo00097d5eac0xtfe4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdr000a7d5e2nni9cxb');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnse0000e7d5eckadw8vq');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnse2000f7d5em2006clu');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsej000m7d5esms5c9ac');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsen000o7d5er3422jk3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnseq000p7d5ey0uyauib');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnses000q7d5e6x6ldyd4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsez000t7d5e6pqvlin6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsf4000v7d5etmk0ly1h');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsg600147d5ep30wqev3', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsd400027d5e8bfzv08w');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnse0000e7d5eckadw8vq');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnse2000f7d5em2006clu');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsej000m7d5esms5c9ac');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsen000o7d5er3422jk3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnseq000p7d5ey0uyauib');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnses000q7d5e6x6ldyd4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgc00157d5eihdj9k0h', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsd400027d5e8bfzv08w');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsda00047d5e5lt82o59');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnse0000e7d5eckadw8vq');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnse2000f7d5em2006clu');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsej000m7d5esms5c9ac');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsen000o7d5er3422jk3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnseq000p7d5ey0uyauib');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnses000q7d5e6x6ldyd4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgj00167d5erfaay4q5', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnse5000g7d5ev5rpet78');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsel000n7d5ek5isezq1');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgq00177d5efpne4vau', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsd700037d5ev9m4jmyg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsdd00057d5eazbvkxv0');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsdl00087d5exsv8ztku');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnse7000h7d5edczyex5l');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnseb000j7d5ea8ousm8q');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnseg000l7d5e3y8osmd5');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsf1000u7d5eyprbh77j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsgz00187d5ef5gth07i', 'cmr6fnsf6000w7d5e0qi7bsqe');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnsdo00097d5eac0xtfe4');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnsdr000a7d5e2nni9cxb');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnsdi00077d5eeqe10m39');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsh400197d5e970760c8', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'cmr6fnseu000r7d5erg8918qz');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'cmr6fnsez000t7d5e6pqvlin6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsha001a7d5esexs6nd3', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnscr00007d5evwo7fjs3');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnsdg00067d5eydsyi098');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnsdv000c7d5ey6qc6wxg');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnsfd000y7d5eyczjutwc');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshf001b7d5eqvmx6eoi', 'cmr6fnsfg000z7d5ezwn50v1j');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsd000017d5e2nrobew6');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsdy000d7d5ediobb3rv');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsex000s7d5em43hsaw8');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnshm001c7d5ejf8s5m3d', 'cmr6fnsfb000x7d5e2avdte82');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsht001d7d5e5786ql48', 'cmr6fnse9000i7d5ehj1gaqao');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsht001d7d5e5786ql48', 'cmr6fnsee000k7d5ecg1n5bug');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsht001d7d5e5786ql48', 'cmr6fnsdt000b7d5e590p6kbt');
INSERT INTO public."RolePermission" ("roleId", "permissionId") VALUES ('cmr6fnsht001d7d5e5786ql48', 'cmr6fnsex000s7d5em43hsaw8');


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Task" (id, "tenantId", "caseId", title, description, status, priority, "assigneeId", "creatorId", "partnerAssignmentId", "dueAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsxk007h7d5ezsk9qk6z', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'Upload wire transfer records', NULL, 'OPEN', 'HIGH', 'cmr6fnsvw006l7d5eesf8gnq6', 'cmr6fnsvu006k7d5ew40t91ny', NULL, '2026-07-11 14:03:55.064', NULL, '2026-07-04 14:03:55.065', '2026-07-04 14:03:55.065');
INSERT INTO public."Task" (id, "tenantId", "caseId", title, description, status, priority, "assigneeId", "creatorId", "partnerAssignmentId", "dueAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsxk007i7d5enpu7xwk6', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'Review source of funds narrative', NULL, 'OPEN', 'NORMAL', 'cmr6fnsvr006j7d5e8v0qseek', 'cmr6fnsvu006k7d5ew40t91ny', NULL, NULL, NULL, '2026-07-04 14:03:55.065', '2026-07-04 14:03:55.065');
INSERT INTO public."Task" (id, "tenantId", "caseId", title, description, status, priority, "assigneeId", "creatorId", "partnerAssignmentId", "dueAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsxk007j7d5efnft64fi', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'Prepare document index', NULL, 'IN_PROGRESS', 'NORMAL', 'cmr6fnsvu006k7d5ew40t91ny', 'cmr6fnsvr006j7d5e8v0qseek', NULL, NULL, NULL, '2026-07-04 14:03:55.065', '2026-07-04 14:03:55.065');
INSERT INTO public."Task" (id, "tenantId", "caseId", title, description, status, priority, "assigneeId", "creatorId", "partnerAssignmentId", "dueAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsy6007y7d5ewt3s65gv', 'cmr6fnsv7006e7d5eb4kpk8p5', 'cmr6fnsx200757d5ew7umhv88', 'Prepare source-of-funds CPA report', NULL, 'OPEN', 'HIGH', 'cmr6fnsvz006m7d5ev0c4wkjk', 'cmr6fnsvr006j7d5e8v0qseek', 'cmr6fnsy6007w7d5ebqzkqwnm', '2026-07-14 14:03:55.085', NULL, '2026-07-04 14:03:55.086', '2026-07-04 14:03:55.086');


--
-- Data for Name: TaskComment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Template; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Tenant" (id, name, slug, plan, "isActive", "retentionDays", "createdAt", "updatedAt") VALUES ('cmr6fnsv7006e7d5eb4kpk8p5', 'Martinez Immigration Law', 'martinez-immigration', 'FIRM', true, NULL, '2026-07-04 14:03:54.979', '2026-07-04 14:03:54.979');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvk006h7d5e2y0jlvgf', 'admin@visaops.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'Platform Admin', NULL, 'en', NULL, false, true, NULL, NULL, '2026-07-04 14:03:54.992', '2026-07-04 14:03:54.992');
INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvo006i7d5ejtfpb4er', 'owner@martinezlaw.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'Ana Martinez', NULL, 'en', NULL, false, false, NULL, NULL, '2026-07-04 14:03:54.997', '2026-07-04 14:03:54.997');
INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvr006j7d5e8v0qseek', 'attorney@martinezlaw.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'David Chen', NULL, 'en', NULL, false, false, NULL, NULL, '2026-07-04 14:03:55', '2026-07-04 14:03:55');
INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvu006k7d5ew40t91ny', 'paralegal@martinezlaw.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'Sofia Reyes', NULL, 'en', NULL, false, false, NULL, NULL, '2026-07-04 14:03:55.002', '2026-07-04 14:03:55.002');
INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvw006l7d5eesf8gnq6', 'client@example.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'Lucas Ferreira', NULL, 'pt', NULL, false, false, NULL, NULL, '2026-07-04 14:03:55.005', '2026-07-04 14:03:55.005');
INSERT INTO public."User" (id, email, "passwordHash", name, phone, locale, "mfaSecret", "mfaEnabled", "isPlatformAdmin", "lastLoginAt", "deletedAt", "createdAt", "updatedAt") VALUES ('cmr6fnsvz006m7d5ev0c4wkjk', 'partner@cpafirm.dev', '$2b$10$yNWmqXkiWKQm/rfz74KHLO6ABgAC.WuiX3NYBHhzxchU8Q1F6sCLa', 'Emily Ross, CPA', NULL, 'en', NULL, false, false, NULL, NULL, '2026-07-04 14:03:55.007', '2026-07-04 14:03:55.007');


--
-- Data for Name: VisaCategory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnshz001e7d5e2pk7xg6p', 'B1-B2', 'B-1/B-2 Visitor', 'Business or tourism visitor visa', 'Short business trips, tourism, family visits', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsi3001f7d5eu100t9sc', 'F-1', 'F-1 Student', 'Academic student visa', 'Students admitted to US schools', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsi6001g7d5eksqhoen1', 'J-1', 'J-1 Exchange Visitor', 'Exchange visitor programs', 'Trainees, interns, scholars, au pairs', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsi9001h7d5eaz6szv3d', 'H-1B', 'H-1B Specialty Occupation', 'Specialty occupation worker', 'Professionals sponsored by US employers', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsic001i7d5evv73kunf', 'L-1A', 'L-1A Intracompany Executive/Manager', 'Intracompany transferee - executive or manager', 'Executives/managers transferring to a US entity', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsif001j7d5e9tjp8350', 'L-1B', 'L-1B Specialized Knowledge', 'Intracompany transferee - specialized knowledge', 'Key employees with specialized knowledge', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsih001k7d5ez42bfg2s', 'E-2', 'E-2 Treaty Investor', 'Treaty investor visa', 'Investors from treaty countries operating a US business', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsik001l7d5ezklhigt9', 'O-1', 'O-1 Extraordinary Ability', 'Individuals of extraordinary ability', 'Artists, scientists, athletes, business leaders', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsim001m7d5eif7m1kji', 'EB-1A', 'EB-1A Extraordinary Ability', 'Employment-based first preference - extraordinary ability', 'Top-of-field professionals seeking permanent residence', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsip001n7d5edrmj52jl', 'EB-1C', 'EB-1C Multinational Manager', 'Employment-based first preference - multinational manager/executive', 'Multinational executives moving permanently', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsir001o7d5e9mkspx5b', 'EB-2-NIW', 'EB-2 NIW', 'National Interest Waiver', 'Advanced-degree professionals whose work benefits the US', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsiu001p7d5er9x3muff', 'EB-5-DIRECT', 'EB-5 Direct', 'Immigrant investor - direct investment', 'Investors creating jobs through their own enterprise', true, NULL, NULL);
INSERT INTO public."VisaCategory" (id, key, name, description, audience, "isActive", "lastLegalReviewAt", "reviewedByName") VALUES ('cmr6fnsiw001q7d5ezodaqr0u', 'EB-5-RC', 'EB-5 Regional Center', 'Immigrant investor - regional center', 'Investors in regional center projects', true, NULL, NULL);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('5490f303-5296-4239-97b3-f470900a870a', '86cb6fed210d69444e6f4ffb501fe6f47eda0b824071444af797c5834b8c3e4b', '2026-07-04 14:03:52.259476+00', '0001_init', NULL, NULL, '2026-07-04 14:03:51.601435+00', 1);


--
-- Name: AIInteraction AIInteraction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIInteraction"
    ADD CONSTRAINT "AIInteraction_pkey" PRIMARY KEY (id);


--
-- Name: AttorneyReview AttorneyReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttorneyReview"
    ADD CONSTRAINT "AttorneyReview_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CaseApplicant CaseApplicant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseApplicant"
    ADD CONSTRAINT "CaseApplicant_pkey" PRIMARY KEY (id);


--
-- Name: CaseEvent CaseEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseEvent"
    ADD CONSTRAINT "CaseEvent_pkey" PRIMARY KEY (id);


--
-- Name: Case Case_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_pkey" PRIMARY KEY (id);


--
-- Name: ChecklistItem ChecklistItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY (id);


--
-- Name: Checklist Checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Checklist"
    ADD CONSTRAINT "Checklist_pkey" PRIMARY KEY (id);


--
-- Name: ClientProfile ClientProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClientProfile"
    ADD CONSTRAINT "ClientProfile_pkey" PRIMARY KEY (id);


--
-- Name: Client Client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: ComplianceEvent ComplianceEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplianceEvent"
    ADD CONSTRAINT "ComplianceEvent_pkey" PRIMARY KEY (id);


--
-- Name: ContentVersion ContentVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentVersion"
    ADD CONSTRAINT "ContentVersion_pkey" PRIMARY KEY (id);


--
-- Name: Dependent Dependent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dependent"
    ADD CONSTRAINT "Dependent_pkey" PRIMARY KEY (id);


--
-- Name: DocumentRequirement DocumentRequirement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentRequirement"
    ADD CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY (id);


--
-- Name: DocumentReview DocumentReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentReview"
    ADD CONSTRAINT "DocumentReview_pkey" PRIMARY KEY (id);


--
-- Name: DocumentType DocumentType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentType"
    ADD CONSTRAINT "DocumentType_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EligibilityAssessment EligibilityAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EligibilityAssessment"
    ADD CONSTRAINT "EligibilityAssessment_pkey" PRIMARY KEY (id);


--
-- Name: EngagementLetter EngagementLetter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EngagementLetter"
    ADD CONSTRAINT "EngagementLetter_pkey" PRIMARY KEY (id);


--
-- Name: IntakeAnswer IntakeAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeAnswer"
    ADD CONSTRAINT "IntakeAnswer_pkey" PRIMARY KEY (id);


--
-- Name: IntakeForm IntakeForm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeForm"
    ADD CONSTRAINT "IntakeForm_pkey" PRIMARY KEY (id);


--
-- Name: IntakeQuestion IntakeQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeQuestion"
    ADD CONSTRAINT "IntakeQuestion_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LegalNote LegalNote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegalNote"
    ADD CONSTRAINT "LegalNote_pkey" PRIMARY KEY (id);


--
-- Name: Membership Membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY (id);


--
-- Name: MessageThread MessageThread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MessageThread"
    ADD CONSTRAINT "MessageThread_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: PartnerAssignment PartnerAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PartnerAssignment"
    ADD CONSTRAINT "PartnerAssignment_pkey" PRIMARY KEY (id);


--
-- Name: Partner Partner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: RiskFlag RiskFlag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RiskFlag"
    ADD CONSTRAINT "RiskFlag_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: TaskComment TaskComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VisaCategory VisaCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VisaCategory"
    ADD CONSTRAINT "VisaCategory_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AIInteraction_tenantId_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AIInteraction_tenantId_caseId_idx" ON public."AIInteraction" USING btree ("tenantId", "caseId");


--
-- Name: AttorneyReview_caseId_gate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttorneyReview_caseId_gate_idx" ON public."AttorneyReview" USING btree ("caseId", gate);


--
-- Name: AuditLog_entity_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entity_entityId_idx" ON public."AuditLog" USING btree (entity, "entityId");


--
-- Name: AuditLog_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON public."AuditLog" USING btree ("tenantId", "createdAt");


--
-- Name: CaseApplicant_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CaseApplicant_caseId_idx" ON public."CaseApplicant" USING btree ("caseId");


--
-- Name: CaseEvent_caseId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CaseEvent_caseId_createdAt_idx" ON public."CaseEvent" USING btree ("caseId", "createdAt");


--
-- Name: Case_tenantId_attorneyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Case_tenantId_attorneyId_idx" ON public."Case" USING btree ("tenantId", "attorneyId");


--
-- Name: Case_tenantId_caseNumberInternal_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Case_tenantId_caseNumberInternal_key" ON public."Case" USING btree ("tenantId", "caseNumberInternal");


--
-- Name: Case_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Case_tenantId_status_idx" ON public."Case" USING btree ("tenantId", status);


--
-- Name: ChecklistItem_checklistId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChecklistItem_checklistId_idx" ON public."ChecklistItem" USING btree ("checklistId");


--
-- Name: Checklist_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Checklist_caseId_idx" ON public."Checklist" USING btree ("caseId");


--
-- Name: ClientProfile_clientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClientProfile_clientId_key" ON public."ClientProfile" USING btree ("clientId");


--
-- Name: Client_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Client_tenantId_idx" ON public."Client" USING btree ("tenantId");


--
-- Name: Company_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Company_tenantId_idx" ON public."Company" USING btree ("tenantId");


--
-- Name: ComplianceEvent_tenantId_dueAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ComplianceEvent_tenantId_dueAt_idx" ON public."ComplianceEvent" USING btree ("tenantId", "dueAt");


--
-- Name: ContentVersion_templateId_version_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContentVersion_templateId_version_key" ON public."ContentVersion" USING btree ("templateId", version);


--
-- Name: Dependent_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Dependent_clientId_idx" ON public."Dependent" USING btree ("clientId");


--
-- Name: DocumentRequirement_visaCategoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentRequirement_visaCategoryId_idx" ON public."DocumentRequirement" USING btree ("visaCategoryId");


--
-- Name: DocumentReview_documentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentReview_documentId_idx" ON public."DocumentReview" USING btree ("documentId");


--
-- Name: DocumentType_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DocumentType_key_key" ON public."DocumentType" USING btree (key);


--
-- Name: Document_tenantId_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Document_tenantId_caseId_idx" ON public."Document" USING btree ("tenantId", "caseId");


--
-- Name: EligibilityAssessment_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EligibilityAssessment_caseId_idx" ON public."EligibilityAssessment" USING btree ("caseId");


--
-- Name: IntakeAnswer_formId_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IntakeAnswer_formId_questionId_key" ON public."IntakeAnswer" USING btree ("formId", "questionId");


--
-- Name: IntakeForm_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IntakeForm_tenantId_status_idx" ON public."IntakeForm" USING btree ("tenantId", status);


--
-- Name: IntakeQuestion_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IntakeQuestion_key_key" ON public."IntakeQuestion" USING btree (key);


--
-- Name: Invoice_tenantId_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Invoice_tenantId_number_key" ON public."Invoice" USING btree ("tenantId", number);


--
-- Name: Lead_tenantId_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_tenantId_stage_idx" ON public."Lead" USING btree ("tenantId", stage);


--
-- Name: LegalNote_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LegalNote_caseId_idx" ON public."LegalNote" USING btree ("caseId");


--
-- Name: Membership_tenantId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Membership_tenantId_userId_key" ON public."Membership" USING btree ("tenantId", "userId");


--
-- Name: Membership_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Membership_userId_idx" ON public."Membership" USING btree ("userId");


--
-- Name: MessageThread_tenantId_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MessageThread_tenantId_caseId_idx" ON public."MessageThread" USING btree ("tenantId", "caseId");


--
-- Name: Message_threadId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_threadId_createdAt_idx" ON public."Message" USING btree ("threadId", "createdAt");


--
-- Name: Notification_userId_readAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_readAt_idx" ON public."Notification" USING btree ("userId", "readAt");


--
-- Name: Organization_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Organization_tenantId_idx" ON public."Organization" USING btree ("tenantId");


--
-- Name: PartnerAssignment_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PartnerAssignment_caseId_idx" ON public."PartnerAssignment" USING btree ("caseId");


--
-- Name: PartnerAssignment_partnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PartnerAssignment_partnerId_idx" ON public."PartnerAssignment" USING btree ("partnerId");


--
-- Name: Partner_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Partner_tenantId_idx" ON public."Partner" USING btree ("tenantId");


--
-- Name: Permission_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_key_key" ON public."Permission" USING btree (key);


--
-- Name: RiskFlag_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RiskFlag_caseId_idx" ON public."RiskFlag" USING btree ("caseId");


--
-- Name: Role_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_key_key" ON public."Role" USING btree (key);


--
-- Name: TaskComment_taskId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TaskComment_taskId_idx" ON public."TaskComment" USING btree ("taskId");


--
-- Name: Task_caseId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_caseId_idx" ON public."Task" USING btree ("caseId");


--
-- Name: Task_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_tenantId_status_idx" ON public."Task" USING btree ("tenantId", status);


--
-- Name: Template_tenantId_key_locale_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Template_tenantId_key_locale_key" ON public."Template" USING btree ("tenantId", key, locale);


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VisaCategory_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VisaCategory_key_key" ON public."VisaCategory" USING btree (key);


--
-- Name: AIInteraction AIInteraction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIInteraction"
    ADD CONSTRAINT "AIInteraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AIInteraction AIInteraction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AIInteraction"
    ADD CONSTRAINT "AIInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AttorneyReview AttorneyReview_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttorneyReview"
    ADD CONSTRAINT "AttorneyReview_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttorneyReview AttorneyReview_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttorneyReview"
    ADD CONSTRAINT "AttorneyReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttorneyReview AttorneyReview_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttorneyReview"
    ADD CONSTRAINT "AttorneyReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CaseApplicant CaseApplicant_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseApplicant"
    ADD CONSTRAINT "CaseApplicant_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CaseApplicant CaseApplicant_dependentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseApplicant"
    ADD CONSTRAINT "CaseApplicant_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES public."Dependent"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CaseEvent CaseEvent_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseEvent"
    ADD CONSTRAINT "CaseEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CaseEvent CaseEvent_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CaseEvent"
    ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Case Case_attorneyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_attorneyId_fkey" FOREIGN KEY ("attorneyId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Case Case_caseManagerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_caseManagerId_fkey" FOREIGN KEY ("caseManagerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Case Case_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Case Case_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Case Case_paralegalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_paralegalId_fkey" FOREIGN KEY ("paralegalId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Case Case_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Case Case_visaCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Case"
    ADD CONSTRAINT "Case_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES public."VisaCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChecklistItem ChecklistItem_checklistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public."Checklist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChecklistItem ChecklistItem_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChecklistItem ChecklistItem_requirementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChecklistItem"
    ADD CONSTRAINT "ChecklistItem_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES public."DocumentRequirement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Checklist Checklist_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Checklist"
    ADD CONSTRAINT "Checklist_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Checklist Checklist_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Checklist"
    ADD CONSTRAINT "Checklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClientProfile ClientProfile_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClientProfile"
    ADD CONSTRAINT "ClientProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Client Client_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Client Client_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Client"
    ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Company Company_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Company Company_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComplianceEvent ComplianceEvent_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplianceEvent"
    ADD CONSTRAINT "ComplianceEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ComplianceEvent ComplianceEvent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ComplianceEvent"
    ADD CONSTRAINT "ComplianceEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ContentVersion ContentVersion_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContentVersion"
    ADD CONSTRAINT "ContentVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."Template"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dependent Dependent_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dependent"
    ADD CONSTRAINT "Dependent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public."Client"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentRequirement DocumentRequirement_documentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentRequirement"
    ADD CONSTRAINT "DocumentRequirement_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES public."DocumentType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentRequirement DocumentRequirement_visaCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentRequirement"
    ADD CONSTRAINT "DocumentRequirement_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES public."VisaCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentReview DocumentReview_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentReview"
    ADD CONSTRAINT "DocumentReview_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentReview DocumentReview_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentReview"
    ADD CONSTRAINT "DocumentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Document Document_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_documentTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES public."DocumentType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_ownerUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EligibilityAssessment EligibilityAssessment_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EligibilityAssessment"
    ADD CONSTRAINT "EligibilityAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EngagementLetter EngagementLetter_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EngagementLetter"
    ADD CONSTRAINT "EngagementLetter_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EngagementLetter EngagementLetter_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EngagementLetter"
    ADD CONSTRAINT "EngagementLetter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IntakeAnswer IntakeAnswer_formId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeAnswer"
    ADD CONSTRAINT "IntakeAnswer_formId_fkey" FOREIGN KEY ("formId") REFERENCES public."IntakeForm"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IntakeAnswer IntakeAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeAnswer"
    ADD CONSTRAINT "IntakeAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."IntakeQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IntakeForm IntakeForm_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeForm"
    ADD CONSTRAINT "IntakeForm_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: IntakeForm IntakeForm_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeForm"
    ADD CONSTRAINT "IntakeForm_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: IntakeQuestion IntakeQuestion_visaCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntakeQuestion"
    ADD CONSTRAINT "IntakeQuestion_visaCategoryId_fkey" FOREIGN KEY ("visaCategoryId") REFERENCES public."VisaCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lead Lead_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LegalNote LegalNote_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegalNote"
    ADD CONSTRAINT "LegalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LegalNote LegalNote_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegalNote"
    ADD CONSTRAINT "LegalNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LegalNote LegalNote_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LegalNote"
    ADD CONSTRAINT "LegalNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membership Membership_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Membership Membership_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membership Membership_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membership Membership_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageThread MessageThread_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MessageThread"
    ADD CONSTRAINT "MessageThread_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageThread MessageThread_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MessageThread"
    ADD CONSTRAINT "MessageThread_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."MessageThread"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Organization Organization_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PartnerAssignment PartnerAssignment_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PartnerAssignment"
    ADD CONSTRAINT "PartnerAssignment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PartnerAssignment PartnerAssignment_partnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PartnerAssignment"
    ADD CONSTRAINT "PartnerAssignment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES public."Partner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Partner Partner_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Partner Partner_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RiskFlag RiskFlag_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RiskFlag"
    ADD CONSTRAINT "RiskFlag_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RiskFlag RiskFlag_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RiskFlag"
    ADD CONSTRAINT "RiskFlag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subscription Subscription_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TaskComment TaskComment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TaskComment TaskComment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaskComment"
    ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Task Task_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_caseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES public."Case"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_partnerAssignmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_partnerAssignmentId_fkey" FOREIGN KEY ("partnerAssignmentId") REFERENCES public."PartnerAssignment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Template Template_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Template"
    ADD CONSTRAINT "Template_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


