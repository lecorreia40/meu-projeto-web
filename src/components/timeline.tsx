import { formatDate, humanize } from "@/lib/utils";
import type { CaseEvent } from "@prisma/client";

export function Timeline({
  events,
}: {
  events: Array<Pick<CaseEvent, "id" | "kind" | "title" | "detail" | "createdAt"> & { actorName?: string | null }>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No events yet.</p>;
  }
  return (
    <ol className="relative ml-3 space-y-6 border-l border-slate-200 pl-6">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 ring-1 ring-slate-200" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-slate-900">{event.title}</span>
            <span className="text-xs text-slate-400">{formatDate(event.createdAt)}</span>
          </div>
          {event.detail && <p className="mt-0.5 text-sm text-slate-600">{event.detail}</p>}
          <p className="mt-0.5 text-xs text-slate-400">
            {humanize(event.kind)}
            {event.actorName ? ` · ${event.actorName}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
