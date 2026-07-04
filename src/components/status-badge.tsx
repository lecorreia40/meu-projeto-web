import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/case-status";
import { humanize, cn } from "@/lib/utils";
import type { CaseStatus, RiskLevel, TaskStatus, ChecklistItemStatus, DocumentStatus } from "@prisma/client";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {humanize(status)}
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

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={RISK_VARIANT[level]}>Risk: {humanize(level)}</Badge>;
}

const TASK_VARIANT: Record<TaskStatus, "default" | "info" | "warning" | "success" | "outline"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  BLOCKED: "warning",
  DONE: "success",
  CANCELLED: "outline",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={TASK_VARIANT[status]}>{humanize(status)}</Badge>;
}

const CHECKLIST_VARIANT: Record<ChecklistItemStatus, "default" | "info" | "warning" | "success" | "danger" | "outline"> = {
  PENDING: "default",
  UPLOADED: "info",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  WAIVED: "outline",
};

export function ChecklistStatusBadge({ status }: { status: ChecklistItemStatus }) {
  return <Badge variant={CHECKLIST_VARIANT[status]}>{humanize(status)}</Badge>;
}

const DOC_VARIANT: Record<DocumentStatus, "default" | "info" | "warning" | "success" | "danger" | "outline"> = {
  PENDING_REVIEW: "default",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "danger",
  ARCHIVED: "outline",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={DOC_VARIANT[status]}>{humanize(status)}</Badge>;
}
