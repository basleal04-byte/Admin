"use client";

import { cn } from "@/lib/utils";

export function BarChart({
  data,
  className,
}: {
  data: Array<{ label: string; value: number }>;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn("flex h-40 items-end gap-2", className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-emerald-700/80"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}
            title={String(d.value)}
          />
          <span className="text-[10px] text-stone-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-stone-500">{item.label}</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-1 text-xs text-stone-400">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
