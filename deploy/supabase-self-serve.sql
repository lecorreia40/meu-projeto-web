-- VisaOps: workspace self-serve (item 14).
-- Cole no SQL Editor do Supabase e clique em Run. Idempotente.
-- Cria o tenant e a organizacao "VisaOps Direct" onde os aplicantes que
-- contratam direto (self-serve) caem como clientes.

INSERT INTO "Tenant" (id, name, slug, plan, "isActive", "createdAt", "updatedAt")
VALUES ('tnt_visaops_direct', 'VisaOps Direct', 'visaops-direct', 'STARTER', true, now(), now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Organization" (id, "tenantId", name, kind, "createdAt", "updatedAt")
SELECT 'org_visaops_direct', t.id, 'VisaOps Direct', 'CONSULTANCY', now(), now()
FROM "Tenant" t WHERE t.slug = 'visaops-direct'
ON CONFLICT (id) DO NOTHING;
