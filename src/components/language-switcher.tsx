"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setLocaleAction } from "@/server/actions/locale";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = { en: "EN", pt: "PT", es: "ES" };

export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-xs",
        pending && "opacity-60",
        className
      )}
    >
      <Globe className="ml-1 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      {(["en", "pt", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          disabled={pending}
          aria-pressed={l === locale}
          className={cn(
            "rounded-md px-2 py-1 font-medium transition-colors",
            l === locale ? "bg-brand-400 text-brand-950" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
