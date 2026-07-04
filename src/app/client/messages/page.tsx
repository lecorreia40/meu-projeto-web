import { requireUser } from "@/lib/permissions";
import { getMyCases } from "../data";
import { sendMessageAction } from "@/server/actions/messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

export default async function ClientMessagesPage() {
  const user = await requireUser();
  const cases = await getMyCases(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-slate-500">Talk to your legal team. History is kept for your records.</p>
      </div>

      {cases.map((kase) => (
        <Card key={kase.id}>
          <CardHeader><CardTitle>Case {kase.caseNumberInternal}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {kase.threads.flatMap((t) => t.messages).length === 0 && (
                <p className="text-sm text-slate-500">No messages yet.</p>
              )}
              {kase.threads.flatMap((thread) => thread.messages).map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 text-sm ${message.sender.id === user.id ? "ml-8 bg-brand-50" : "mr-8 bg-slate-50"}`}
                >
                  <div className="mb-0.5 text-xs font-medium text-slate-600">
                    {message.sender.id === user.id ? "You" : message.sender.name} · {formatDate(message.createdAt)}
                  </div>
                  {message.body}
                </div>
              ))}
            </div>
            <form action={sendMessageAction} className="flex gap-2">
              <input type="hidden" name="caseId" value={kase.id} />
              <input type="hidden" name="channel" value="OPERATIONAL" />
              <Textarea name="body" placeholder="Write a message to your team…" required className="min-h-[44px] flex-1" />
              <Button type="submit">Send</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
