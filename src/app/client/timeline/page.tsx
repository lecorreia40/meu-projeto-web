import { requireUser } from "@/lib/permissions";
import { getMyCases } from "../data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/timeline";

export default async function ClientTimelinePage() {
  const user = await requireUser();
  const cases = await getMyCases(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Timeline</h1>
        <p className="text-sm text-slate-500">Everything that happened in your process.</p>
      </div>
      {cases.map((kase) => (
        <Card key={kase.id}>
          <CardHeader><CardTitle>Case {kase.caseNumberInternal}</CardTitle></CardHeader>
          <CardContent>
            <Timeline
              events={kase.events.map((e) => ({
                id: e.id, kind: e.kind, title: e.title, detail: e.detail, createdAt: e.createdAt,
              }))}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
