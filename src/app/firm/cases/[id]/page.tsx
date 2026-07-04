import { notFound } from "next/navigation";
import { getCaseWorkspace, changeCaseStatusAction, addLegalNoteAction, recordAttorneyReviewAction } from "@/server/actions/cases";
import { uploadDocumentAction, reviewDocumentAction } from "@/server/actions/documents";
import { createTaskAction, completeTaskAction } from "@/server/actions/tasks";
import { sendMessageAction } from "@/server/actions/messages";
import { can, legalNoteFilterFor, visibleMessageChannels } from "@/lib/permissions";
import { db } from "@/lib/db";
import { caseProgress } from "@/lib/case-status";
import { formatDate, formatMoney, humanize } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { tEnum } from "@/lib/i18n/enum-labels";
import { CaseHealthCard } from "@/components/case-health";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Timeline } from "@/components/timeline";
import { CaseStatusBadge, RiskBadge, TaskStatusBadge, ChecklistStatusBadge, DocumentStatusBadge } from "@/components/status-badge";

const ALL_STATUSES = [
  "INTAKE_STARTED", "INTAKE_COMPLETE", "INITIAL_REVIEW", "PROPOSAL_SENT", "ENGAGEMENT_SIGNED",
  "DOCUMENT_COLLECTION", "EVIDENCE_REVIEW", "DRAFTING", "ATTORNEY_REVIEW", "CLIENT_REVIEW",
  "FILING_READY", "FILED", "RECEIPT_RECEIVED", "BIOMETRICS_INTERVIEW", "RFE_NOID",
  "APPROVED", "DENIED", "CLOSED", "POST_APPROVAL_MONITORING",
];

const GATES = ["INTAKE_COMPLETE", "LEGAL_STRATEGY", "DOCUMENT_COMPLETE", "PETITION_DRAFT", "FILING_READY", "RFE_RESPONSE", "POST_FILING"];

export default async function CaseWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCaseWorkspace(id);
  if (!result?.kase) notFound();
  const { user, kase } = result;

  const locale = await getLocale();
  const t = getDictionary(locale);
  const f = t.firm;

  const noteFilter = legalNoteFilterFor(user);
  const legalNotes = noteFilter
    ? await db.legalNote.findMany({
        where: { caseId: kase.id, deletedAt: null, ...noteFilter },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const channels = visibleMessageChannels(user);
  const visibleThreads = kase.threads.filter((t) => channels.includes(t.channel));
  const checklist = kase.checklists[0];
  const checklistDone = checklist?.items.filter((i) => i.status === "APPROVED").length ?? 0;
  const checklistTotal = checklist?.items.length ?? 0;
  const teamMembers = await db.membership.findMany({
    where: { tenantId: user.tenantId ?? "-", isActive: true, role: { key: { notIn: ["client", "partner"] } } },
    include: { user: { select: { id: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{kase.caseNumberInternal}</h1>
            <CaseStatusBadge status={kase.status} />
            <RiskBadge level={kase.riskLevel} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {kase.client.fullName} · {kase.visaCategory.name}
            {kase.company ? ` · ${kase.company.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/firm/cases/${kase.id}/form`}>
            <Button variant="secondary" type="button">{f.openForm}</Button>
          </a>
          {can(user, "case.change_status") && (
            <form action={changeCaseStatusAction} className="flex items-center gap-2">
              <input type="hidden" name="caseId" value={kase.id} />
              <Select name="status" defaultValue={kase.status} className="w-56">
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{tEnum("caseStatus", s, locale)}</option>)}
              </Select>
              <Button type="submit" variant="secondary">{f.updateStatus}</Button>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="text-xs text-slate-500">{f.thProgress}</div>
            <Progress value={caseProgress(kase.status)} className="mt-2" />
            <div className="mt-1 text-xs text-slate-400">{caseProgress(kase.status)}%</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{f.attorney}</div>
            <div className="text-sm font-medium">{kase.attorney?.name ?? f.unassigned}</div>
            <div className="text-xs text-slate-500">{f.paralegal}: {kase.paralegal?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{f.nextActionLbl}</div>
            <div className="text-sm font-medium">{kase.nextAction ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{f.nextDeadlineLbl}</div>
            <div className="text-sm font-medium">{formatDate(kase.nextDeadlineAt)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{f.checklistLbl}</div>
            <div className="text-sm font-medium">{checklistDone}/{checklistTotal} {f.approvedWord}</div>
            <div className="text-xs text-slate-500">{f.receipt}: {kase.externalReceiptNumber ?? "-"}</div>
          </div>
        </CardContent>
      </Card>

      <CaseHealthCard
        input={{
          visaKey: kase.visaCategory.key,
          formData: kase.formData as Record<string, unknown>,
          checklistStatuses: kase.checklists.flatMap((cl) => cl.items).map((i) => i.status),
          documentStatuses: kase.documents.map((d) => d.status),
          openRiskFlags: kase.riskFlags.map((r) => ({ severity: r.severity })),
          nextDeadlineAt: kase.nextDeadlineAt,
          status: kase.status,
        }}
        labels={{
          title: f.healthTitle,
          sub: f.healthSub,
          band: { good: f.bandGood, warning: f.bandWarning, critical: f.bandCritical },
          factor: { form: f.factorForm, checklist: f.factorChecklist, documents: f.factorDocuments, risk: f.factorRisk, deadline: f.factorDeadline },
        }}
      />

      {kase.riskFlags.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardHeader><CardTitle className="text-rose-800">{f.openRiskFlags}</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {kase.riskFlags.map((flag) => (
              <Badge key={flag.id} variant="danger">{humanize(flag.kind)}{flag.note ? ` - ${flag.note}` : ""}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>{f.documentChecklist}</CardTitle>
            <CardDescription>{f.generatedBy} {kase.visaCategory.key}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!checklist && <p className="text-sm text-slate-500">{f.noChecklist}</p>}
            {checklist?.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">
                      {tEnum("necessity", item.necessity, locale)} · {f.owner}: {item.ownerRole}
                      {item.document ? ` · v${item.document.version}` : ""}
                    </div>
                  </div>
                  <ChecklistStatusBadge status={item.status} />
                </div>
                {can(user, "document.upload") && item.status !== "APPROVED" && (
                  <form action={uploadDocumentAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="caseId" value={kase.id} />
                    <input type="hidden" name="checklistItemId" value={item.id} />
                    <Input name="file" type="file" className="h-8 text-xs" required />
                    <Button size="sm" variant="secondary" type="submit">{t.ui.upload}</Button>
                  </form>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents + review */}
        <Card>
          <CardHeader>
            <CardTitle>{f.documentsTitle}</CardTitle>
            <CardDescription>{f.downloadsAudited}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {kase.documents.length === 0 && <p className="text-sm text-slate-500">{f.noDocumentsUploaded}</p>}
            {kase.documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <a href={`/api/documents/${doc.id}/download`} className="truncate text-sm font-medium text-brand-700 hover:underline">
                      {doc.filename}
                    </a>
                    <div className="text-xs text-slate-500">
                      {doc.documentType?.name ?? "-"} · v{doc.version} · {tEnum("sensitivity", doc.sensitivity, locale)} · {doc.owner?.name ?? "-"} · {formatDate(doc.createdAt)}
                    </div>
                  </div>
                  <DocumentStatusBadge status={doc.status} />
                </div>
                {can(user, "document.approve") && doc.status !== "APPROVED" && !doc.lockedAt && (
                  <form action={reviewDocumentAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="documentId" value={doc.id} />
                    <Input name="comment" placeholder={f.reviewComment} className="h-8 w-48 text-xs" />
                    <Select name="decision" defaultValue="APPROVED" className="h-8 w-40 text-xs">
                      <option value="APPROVED">{f.approve}</option>
                      <option value="NEEDS_CHANGES">{f.needsChanges}</option>
                      <option value="REJECTED">{f.reject}</option>
                    </Select>
                    <Button size="sm" variant="secondary" type="submit">{f.review}</Button>
                  </form>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader><CardTitle>{f.tasksTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {can(user, "task.manage") && (
              <form action={createTaskAction} className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-2">
                <input type="hidden" name="caseId" value={kase.id} />
                <Input name="title" placeholder={f.thTask} required className="sm:col-span-2" />
                <Select name="assigneeId" defaultValue="">
                  <option value="">{f.assignee}</option>
                  {teamMembers.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                </Select>
                <div className="flex gap-2">
                  <Input name="dueAt" type="date" className="flex-1" />
                  <Button type="submit" size="sm">{t.ui.add}</Button>
                </div>
              </form>
            )}
            {kase.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-slate-500">
                    {task.assignee?.name ?? f.unassigned} · {t.ui.due} {formatDate(task.dueAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  {task.status !== "DONE" && task.status !== "CANCELLED" && (
                    <form action={completeTaskAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <Button size="sm" variant="ghost" type="submit">{t.ui.done}</Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle>{t.nav.messages}</CardTitle>
            <CardDescription>{f.messagesImmutable}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibleThreads.map((thread) => (
              <div key={thread.id}>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={thread.channel === "INTERNAL" ? "warning" : "info"}>{tEnum("channel", thread.channel, locale)}</Badge>
                  <span className="text-xs text-slate-500">{thread.subject}</span>
                </div>
                <div className="space-y-2">
                  {thread.messages.map((message) => (
                    <div key={message.id} className={`rounded-lg p-3 text-sm ${message.sender.id === user.id ? "bg-brand-50" : "bg-slate-50"}`}>
                      <div className="mb-0.5 text-xs font-medium text-slate-600">
                        {message.sender.name} · {formatDate(message.createdAt)}
                      </div>
                      {message.body}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <form action={sendMessageAction} className="flex gap-2">
              <input type="hidden" name="caseId" value={kase.id} />
              <Textarea name="body" placeholder={f.writeMessage} required className="min-h-[44px] flex-1" />
              <div className="flex flex-col gap-2">
                <Select name="channel" defaultValue="OPERATIONAL" className="w-36">
                  {channels.map((ch) => <option key={ch} value={ch}>{tEnum("channel", ch, locale)}</option>)}
                </Select>
                <Button type="submit" size="sm">{t.ui.send}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Legal notes - gated */}
        {legalNotes !== null && (
          <Card>
            <CardHeader>
              <CardTitle>{f.legalNotesPrivate}</CardTitle>
              <CardDescription>{f.neverVisible}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {can(user, "legal_note.create") && (
                <form action={addLegalNoteAction} className="space-y-2 rounded-lg border border-slate-100 p-3">
                  <input type="hidden" name="caseId" value={kase.id} />
                  <Textarea name="body" placeholder={f.privateNote} required />
                  <div className="flex items-center gap-2">
                    <Select name="visibility" defaultValue="LEGAL_TEAM" className="w-44">
                      <option value="LEGAL_TEAM">{f.legalTeamOpt}</option>
                      <option value="ATTORNEY_ONLY">{f.attorneyOnlyOpt}</option>
                    </Select>
                    <Button size="sm" type="submit">{f.addNote}</Button>
                  </div>
                </form>
              )}
              {legalNotes.map((note) => (
                <div key={note.id} className="rounded-lg bg-amber-50/60 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{note.author.name}</span>
                    <span>{formatDate(note.createdAt)}</span>
                    <Badge variant="warning">{humanize(note.visibility)}</Badge>
                  </div>
                  <p className="text-sm text-slate-800">{note.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Attorney review gates */}
        <Card>
          <CardHeader>
            <CardTitle>{f.attorneyGates}</CardTitle>
            <CardDescription>{f.gatesSub}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {can(user, "attorney_review.approve") && (
              <form action={recordAttorneyReviewAction} className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-2">
                <input type="hidden" name="caseId" value={kase.id} />
                <Select name="gate" defaultValue="LEGAL_STRATEGY">
                  {GATES.map((g) => <option key={g} value={g}>{humanize(g)}</option>)}
                </Select>
                <Select name="decision" defaultValue="APPROVED">
                  <option value="APPROVED">{f.approve}</option>
                  <option value="NEEDS_CHANGES">{f.needsChanges}</option>
                  <option value="REJECTED">{f.reject}</option>
                </Select>
                <Input name="comment" placeholder={f.reviewComment} className="sm:col-span-2" />
                <Button size="sm" type="submit" className="sm:col-span-2">{f.recordReview}</Button>
              </form>
            )}
            {kase.attorneyReviews.length === 0 && <p className="text-sm text-slate-500">{f.noReviews}</p>}
            {kase.attorneyReviews.map((review) => (
              <div key={review.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="text-sm font-medium">{humanize(review.gate)}</div>
                  <div className="text-xs text-slate-500">{review.reviewer.name} · {formatDate(review.createdAt)}{review.comment ? ` · ${review.comment}` : ""}</div>
                </div>
                <Badge variant={review.decision === "APPROVED" ? "success" : review.decision === "REJECTED" ? "danger" : "warning"}>
                  {humanize(review.decision)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Billing summary */}
      {can(user, "billing.read") && kase.invoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{f.billingTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {kase.invoices.map((invoice) => {
              const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
              return (
                <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                  <span className="font-medium">{invoice.number}</span>
                  <span>{formatMoney(Number(invoice.amount))} · {f.thPaid} {formatMoney(paid)}</span>
                  <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                    {tEnum("invoiceStatus", invoice.status, locale)}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>{t.nav.timeline}</CardTitle></CardHeader>
        <CardContent>
          <Timeline
            events={kase.events.map((e) => ({
              id: e.id, kind: e.kind, title: e.title, detail: e.detail, createdAt: e.createdAt,
              actorName: e.actor?.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
