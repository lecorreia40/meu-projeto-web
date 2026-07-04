-- VisaOps: coluna formData no Case (item 12: formularios por visto).
-- Cole no SQL Editor do Supabase e clique em Run.

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "formData" JSONB NOT NULL DEFAULT '{}';

