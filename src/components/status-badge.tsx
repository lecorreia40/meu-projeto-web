import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/case-status";
import { cn } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { tEnum } from "@/lib/i18n/enum-labels";
import type { CaseStatus, RiskLevel, TaskStatus, ChecklistItemStatus, DocumentStatus } from "@prisma/client";

export async function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const locale = await getLocale();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {tEnum("caseStatus", status, locale)}
    </span>
  );
}

const RISK_VARIANT: Record<RiskLevel, "default" | "success" | "warning" | "danger"> = {
  UNKNOWN: "default",
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
};

export async function RiskBadge({ level }: { level: RiskLevel }) {
  const locale = await getLocale();
  const riskWord: Record<string, string> = { en: "Risk", pt: "Risco", es: "Riesgo" };
  return <Badge variant={RISK_VARIANT[level]}>{riskWord[locale] ?? "Risk"}: {tEnum("riskLevel", level, locale)}</Badge>;
}

const TASK_VARIANT: Record<TaskStatus, "default" | "info" | "warning" | "success" | "outline"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  BLOCKED: "warning",
  DONE: "success",
  CANCELLED: "outline",
};

export async function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const locale = await getLocale();
  return <Badge variant={TASK_VARIANT[status]}>{tEnum("taskStatus", status, locale)}</Badge>;
}

const CHECKLIST_VARIANT: Record<ChecklistItemStatus, "default" | "info" | "warning" | "success" | "danger" | "outline"> = {
  PENDING: "default",
  UPLOADED: "info",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  WAIVED: "outline",
};

export async function ChecklistStatusBadge({ status }: { status: ChecklistItemStatus }) {
  const locale = await getLocale();
  return <Badge variant={CHECKLIST_VARIANT[status]}>{tEnum("checklistStatus", status, locale)}</Badge>;
}

const DOC_VARIANT: Record<DocumentStatus, "default" | "info" | "warning" | "success" | "danger" | "outline"> = {
  PENDING_REVIEW: "default",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
  ARCHIVED: "outline",
};

export async function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const locale = await getLocale();
  return <Badge variant={DOC_VARIANT[status]}>{tEnum("documentStatus", status, locale)}</Badge>;
}
