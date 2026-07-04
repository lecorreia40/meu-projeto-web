# VisaOps - Visa Lifecycle Management Platform

Multi-tenant SaaS operating system for the whole visa market: immigration law firms, agencies
and consultancies, operational partners, and individuals who engage self-serve. The platform
covers the full visa lifecycle: lead capture, intelligent intake, per-visa structured forms,
readiness scoring, case management, document collection and review, legal workflow with
attorney approval gates, messaging, billing, plans and pricing, and post-approval compliance.

The entire interface is available in English, Portuguese and Spanish.

Core principle: the platform organizes, automates, educates and tracks. It never replaces
the attorney. Legal-advice paths are gated behind human review by design, and the AI layer
refuses individualized legal-advice requests.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend + Backend | Next.js 15 (App Router) + TypeScript strict |
| UI | Tailwind CSS v4, shadcn-style components, lucide icons |
| Database | PostgreSQL + Prisma |
| Auth | Signed JWT session cookies (jose) + bcrypt, MFA-ready schema |
| Storage | Local driver in dev, S3-compatible interface for production |
| Validation | Zod |
| i18n | EN / PT / ES dictionary structure |

## Getting started

```bash
npm install
docker compose up -d           # local PostgreSQL 16
cp .env.example .env           # set AUTH_SECRET in production
npm run db:push                # apply schema
npm run db:seed                # roles, permissions, 13 visa categories, demo data
npm run dev
```

Demo logins (password `demo1234`):

| Email | Role | Portal |
| --- | --- | --- |
| admin@visaops.dev | Platform Super Admin | /admin |
| owner@martinezlaw.dev | Law Firm Owner | /firm |
| attorney@martinezlaw.dev | Attorney | /firm |
| paralegal@martinezlaw.dev | Paralegal | /firm |
| client@example.dev | Client (Principal Applicant) | /client |
| partner@cpafirm.dev | Partner (CPA) | /partner |

Public pages: `/` (landing with per-audience positioning), `/intake` (free readiness
assessment wizard), and `/start` (self-serve: create an account and open a Document Readiness
case directly, no firm required).

## Feature status

All delivered and verified (strict `tsc`, production build, and per-feature Playwright smokes):

- Multi-tenant auth, sessions, RBAC + ABAC permissions, immutable audit log
- Four portals: law firm, client, partner, platform admin, plus public landing/intake/start
- CRM leads pipeline, clients, cases with a full workspace
- Dynamic document checklist engine per visa category
- Document vault: audited downloads, review workflow, versioning, sensitivity, filing lock
- Tasks, per-channel messaging, private legal notes, attorney approval gates
- Billing and a Plans & pricing catalog (assign a tier to any workspace)
- Post-approval compliance calendar
- Admin: tenant list, user management, editable visa catalog, plans, audit log
- Per-visa structured forms with client + server validation for all 13 categories
- Per-case readiness / health score (weighted composite, live-computed)
- Self-serve direct engagement and multi-vertical positioning
- In-app orientation (`/help`) tailored per profile
- Full EN / PT / ES localization, with a language switcher in the header

Known limitations / next phase: document uploads use a local-disk driver (swap `src/lib/storage.ts`
for S3/Cloudflare R2 so files persist on serverless hosting); no API rate limiting yet; AI
assistance layer is scaffolded with guardrails but not wired to a model.

## Production deploy (Supabase + Vercel)

See `DEPLOY.md` for the full click-by-click guide. The app is deployed by importing the repo on
Vercel with `DATABASE_URL` and `AUTH_SECRET` set. The database is initialized by pasting the SQL
files under `deploy/` into the Supabase SQL Editor, in this order:

1. `deploy/supabase-setup.sql` - full schema + demo data (run once, first)
2. `deploy/supabase-plans.sql` - Plans & pricing table and the 5 tiers
3. `deploy/supabase-case-form.sql` - `Case.formData` column for per-visa forms
4. `deploy/supabase-self-serve.sql` - the "VisaOps Direct" self-serve workspace

Prisma migrations (`prisma/migrations/`) are the canonical source; the SQL files are convenience
snapshots so production can be initialized without a shell.

## Architecture

### Multi-tenancy

`Platform -> Tenant -> Organization -> Users/Clients/Cases/Documents`. Every tenant-owned
table carries `tenantId` and every query in the app layer filters by it. Users can belong to
multiple tenants with different roles (`Membership`). Partner users only reach data through
an explicit, expirable `PartnerAssignment`.

### Permissions: RBAC + ABAC

- RBAC: `Role -> RolePermission -> Permission` seeded from a permission catalog
  (`case.read`, `document.approve`, `legal_note.read`, `attorney_review.approve`, ...).
- ABAC: `src/lib/permissions.ts` layers attribute checks on top: tenant isolation, case
  team membership, document ownership, sensitivity level, partner assignment scope and
  message channel visibility.

Hard rules enforced in code regardless of role configuration:

- Clients never read legal notes or internal-channel messages.
- Partners only see their assigned tasks and their own uploads, never the full case.
- `RESTRICTED` documents require `document.read_sensitive` (owners can see their own uploads).
- Cross-tenant access is impossible for non-platform-admin users.

### Legal workflow guardrails

- 19-status case pipeline from `INTAKE_STARTED` to `POST_APPROVAL_MONITORING`.
- Attorney approval gates (`AttorneyReview`): moving a case to `FILING_READY`/`FILED`
  requires an approved filing-ready review or an approver performing the transition.
- Eligibility assessments and AI route suggestions are stored as `DRAFT` and only become
  recommendations after attorney review.
- The AI layer (`src/lib/ai-guardrails.ts`) blocks legal-advice prompts with a standard
  redirect, logs every interaction (including blocked ones) in `AIInteraction`, and has no
  code path to change case status or send documents.

### Security

- Signed, httpOnly, short-lived session cookies; middleware guards all portal routes.
- No public document URLs: downloads go through `/api/documents/[id]/download`, which
  checks permissions and writes an `AuditLog` row (including denials).
- Append-only `AuditLog` for logins, uploads, reviews, status changes, note access, exports.
- Soft delete + retention fields on sensitive records; documents lock after filing.
- Upload validation: size cap, MIME allowlist, SHA-256 hash, path-traversal-safe storage keys.

### Checklist engine

Checklists are configuration, not code. `DocumentRequirement` rows per visa category define
label, necessity (required/optional/conditional), owner role, reviewer, condition expression,
sensitivity and rule version. Opening a case instantiates a `Checklist` from the category's
requirements; uploads attach to items and flow through the review pipeline.

### Visa engine

13 seeded categories: B1/B2, F-1, J-1, H-1B, L-1A, L-1B, E-2, O-1, EB-1A, EB-1C, EB-2 NIW,
EB-5 Direct, EB-5 Regional Center - each with document requirements and intake questions,
manageable from the admin portal.

## Project layout

```
prisma/schema.prisma        Full multi-tenant data model (40+ entities)
prisma/seed.ts              Roles, permissions, visa categories, demo tenant
src/lib/                    auth, permissions (RBAC+ABAC), audit, storage, i18n, AI guardrails
src/server/actions/         Server actions: cases, clients, leads, documents, tasks, messages, intake
src/components/             Design system (ui/) + app shell, badges, timeline
src/app/firm/               Law firm portal: dashboard, leads CRM, clients, cases, workspace,
                            tasks, documents review queue, partners, billing, compliance
src/app/client/             Client portal: plain-language case view, tasks, uploads, messages,
                            payments, timeline
src/app/partner/            Partner portal: assigned tasks and own deliverables only
src/app/admin/              Platform admin: tenants, visa engine, audit log
src/app/intake/             Public multi-step intake wizard with conditional questions
src/app/api/documents/      Audited document download route
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build / server |
| `npm run typecheck` | Strict TypeScript check |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed catalog + demo data |
| `npm run db:studio` | Prisma Studio |

## Roadmap

- Phase 2: RFE/NOID manager, e-sign, form data mapping, calendar, richer reports.
- Phase 3: OCR + document classification, case summaries, inconsistency detection,
  translation, RAG over attorney-reviewed content (all behind the existing guardrails).
- Phase 4: white label, SSO, public API, custom roles, advanced analytics, marketplace.

## Legal notice

This software supports immigration workflows but does not provide legal advice. Immigration
legal advice must come from a licensed attorney or accredited representative.
