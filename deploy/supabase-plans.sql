-- VisaOps: migracao dos planos (item 1).
-- Cole no SQL Editor do Supabase e clique em Run.
-- Cria a tabela Plan e insere os 5 planos com precos.

-- 1) Estrutura (tabela + enum)
-- CreateEnum
CREATE TYPE "PlanInterval" AS ENUM ('MONTHLY', 'ANNUAL', 'PER_USER', 'CUSTOM');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" "PlanInterval" NOT NULL DEFAULT 'MONTHLY',
    "seats" INTEGER,
    "activeCasesLimit" INTEGER,
    "features" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_key_key" ON "Plan"("key");


-- 2) Dados: os 5 planos
INSERT INTO public."Plan" (id, key, name, description, "priceMonthly", currency, "interval", seats, "activeCasesLimit", features, "isActive", "isPublic", "sortOrder", "createdAt", "updatedAt") VALUES ('cmr6o2awn006e7d7joplriinm', 'STARTER', 'Starter', 'Solo attorney getting started', 49.00, 'USD', 'MONTHLY', 1, 15, '["1 user", "Up to 15 active cases", "CRM and intake", "Document vault", "Email support"]', true, true, 0, '2026-07-04 17:59:08.471', '2026-07-04 17:59:08.471');
INSERT INTO public."Plan" (id, key, name, description, "priceMonthly", currency, "interval", seats, "activeCasesLimit", features, "isActive", "isPublic", "sortOrder", "createdAt", "updatedAt") VALUES ('cmr6o2awr006f7d7j23brykmb', 'FIRM', 'Firm', 'Small immigration practice', 149.00, 'USD', 'MONTHLY', 5, 75, '["Up to 5 users", "Up to 75 active cases", "Attorney approval gates", "Partner assignments", "Priority support"]', true, true, 1, '2026-07-04 17:59:08.476', '2026-07-04 17:59:08.476');
INSERT INTO public."Plan" (id, key, name, description, "priceMonthly", currency, "interval", seats, "activeCasesLimit", features, "isActive", "isPublic", "sortOrder", "createdAt", "updatedAt") VALUES ('cmr6o2awt006g7d7jjq5w7b7f', 'GROWTH', 'Growth', 'Growing multi-attorney firm', 399.00, 'USD', 'MONTHLY', 15, NULL, '["Up to 15 users", "Unlimited active cases", "Automations", "Billing and invoicing", "Reports and analytics"]', true, true, 2, '2026-07-04 17:59:08.478', '2026-07-04 17:59:08.478');
INSERT INTO public."Plan" (id, key, name, description, "priceMonthly", currency, "interval", seats, "activeCasesLimit", features, "isActive", "isPublic", "sortOrder", "createdAt", "updatedAt") VALUES ('cmr6o2aww006h7d7j2v1aw7nr', 'ENTERPRISE', 'Enterprise', 'Multi-office and high volume', 999.00, 'USD', 'MONTHLY', NULL, NULL, '["Unlimited users", "Multi-office", "SSO", "Advanced audit and retention", "API access", "Dedicated support"]', true, true, 3, '2026-07-04 17:59:08.48', '2026-07-04 17:59:08.48');
INSERT INTO public."Plan" (id, key, name, description, "priceMonthly", currency, "interval", seats, "activeCasesLimit", features, "isActive", "isPublic", "sortOrder", "createdAt", "updatedAt") VALUES ('cmr6o2awz006i7d7jiukx750h', 'WHITE_LABEL', 'White Label', 'Own domain and branding', 1999.00, 'USD', 'MONTHLY', NULL, NULL, '["Everything in Enterprise", "Custom domain", "Custom branding", "Client portal white labeling"]', true, true, 4, '2026-07-04 17:59:08.483', '2026-07-04 17:59:08.483');
