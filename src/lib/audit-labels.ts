/**
 * Human-readable labels for audit action codes.
 *
 * The raw codes (e.g. "auth.login_failed") are precise for the trail but hard
 * to read at a glance. This maps them to friendly labels plus a severity tone
 * so the admin views can surface what needs attention. The full audit table
 * still shows the raw code as a secondary reference for governance.
 */
import type { BadgeProps } from "@/components/ui/badge";

type Tone = NonNullable<BadgeProps["variant"]>;

const MAP: Record<string, { label: string; tone: Tone }> = {
  "auth.login": { label: "Signed in", tone: "success" },
  "auth.logout": { label: "Signed out", tone: "default" },
  "auth.login_failed": { label: "Sign-in failed", tone: "danger" },
  "case.create": { label: "Opened a case", tone: "info" },
  "case.update": { label: "Updated a case", tone: "info" },
  "case.change_status": { label: "Changed case status", tone: "info" },
  "client.create": { label: "Added a client", tone: "info" },
  "lead.create": { label: "Added a lead", tone: "default" },
  "lead.move_stage": { label: "Moved a lead", tone: "default" },
  "document.upload": { label: "Uploaded a document", tone: "info" },
  "document.review": { label: "Reviewed a document", tone: "info" },
  "document.download": { label: "Downloaded a document", tone: "warning" },
  "document.download_denied": { label: "Download blocked", tone: "danger" },
  "task.create": { label: "Created a task", tone: "default" },
  "task.complete": { label: "Completed a task", tone: "success" },
  "message.send": { label: "Sent a message", tone: "default" },
  "legal_note.create": { label: "Added a legal note", tone: "info" },
  "attorney_review.record": { label: "Recorded attorney review", tone: "info" },
  "intake.submit": { label: "Submitted intake", tone: "default" },
};

export function auditLabel(action: string): { label: string; tone: Tone } {
  const known = MAP[action];
  if (known) return known;
  // Fallback: turn "domain.verb_phrase" into "Verb phrase domain"
  const [domain, verb] = action.split(".");
  const text = verb ? `${verb.replace(/_/g, " ")} ${domain.replace(/_/g, " ")}` : action;
  return { label: text.charAt(0).toUpperCase() + text.slice(1), tone: "default" };
}
