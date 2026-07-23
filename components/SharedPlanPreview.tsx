"use client";

import type { LearningPlan } from "@/lib/types";

type Props = {
  plan: LearningPlan;
  onImport: () => void;
  onDismiss: () => void;
};

/** Read-only view of a plan someone shared via link — no tracker, just the growth CTA. */
export default function SharedPlanPreview({ plan, onImport, onDismiss }: Props) {
  const itemCount = plan.phases.reduce((s, p) => s + p.items.length, 0);
  const totalHours = plan.phases.flatMap((p) => p.items).reduce((s, i) => s + (i.estimatedHours || 0), 0);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4 text-center text-sm text-sky-200">
        👀 You&rsquo;re viewing a shared LearnX plan — read-only until you add it to your own plans.
      </div>

      <h1 className="text-3xl font-bold">{plan.role}</h1>
      {plan.company && <p className="mt-1 text-white/50">Target: {plan.company}</p>}
      <p className="mt-2 text-sm text-white/50">
        {plan.phases.length} phases · {itemCount} items · ~{totalHours}h total · 100% free resources
      </p>

      <div className="mt-6 space-y-4">
        {plan.phases.map((phase) => (
          <div key={phase.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">{phase.title}</h2>
            <p className="mt-1 text-sm text-white/55">{phase.summary}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/70">
              {phase.items.map((item) => (
                <li key={item.id}>
                  • {item.title} <span className="text-white/35">(~{item.estimatedHours}h)</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
        <p className="mb-3 text-sm text-white/70">
          Add this plan to your own library to unlock the checklist, streak, exports, and interview drills.
        </p>
        <button
          onClick={onImport}
          className="rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
        >
          ➕ Add to my plans &amp; start tracking
        </button>
      </div>

      <button onClick={onDismiss} className="mx-auto mt-6 block text-sm text-white/40 underline underline-offset-4 hover:text-white/70">
        No thanks, take me to LearnX
      </button>
    </div>
  );
}
