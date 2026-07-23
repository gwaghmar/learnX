"use client";

import type { PlanStore } from "@/lib/plans-store";

type Props = {
  store: PlanStore;
  onSelect: (planId: string) => void;
  onDelete: (planId: string) => void;
};

/** Saved-plans list shown on the home screen — resume any plan in one tap. */
export default function PlanLibrary({ store, onSelect, onDelete }: Props) {
  const entries = Object.values(store.plans).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (!entries.length) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Your plans</h2>
      <div className="space-y-2">
        {entries.map(({ plan, tracker }) => {
          const items = plan.phases.flatMap((p) => p.items);
          const done = items.filter((i) => tracker[i.id]).length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;
          return (
            <div
              key={plan.id}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-sky-400/40 hover:bg-white/[0.07]"
            >
              <button onClick={() => onSelect(plan.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">{plan.role}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40">
                    {done}/{items.length} · {pct}%
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete the "${plan.role}" plan? This can't be undone.`)) onDelete(plan.id);
                }}
                title="Delete plan"
                aria-label={`Delete the ${plan.role} plan`}
                className="rounded-lg px-2 py-1 text-white/25 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
