"use client";

import { useState } from "react";
import FocusTimer from "./FocusTimer";
import { notify } from "@/lib/notifications";
import type { PlanItem } from "@/lib/types";

type Props = {
  /** Non-done, non-skipped items in plan order — one task, front to back. */
  remainingItems: PlanItem[];
  onComplete: (itemId: string) => void;
  onSkipFromPlan: (itemId: string) => void;
  onExit: () => void;
};

const KIND_ICONS: Record<string, string> = {
  course: "📚",
  video: "▶️",
  article: "📄",
  practice: "🧪",
  certification: "🏅",
  docs: "📘",
};

/**
 * ADHD-friendly single-task view: one card, one decision, nothing else on
 * screen competing for attention. "Later" only reorders this session (a
 * queue you can come back to); the real Skip lives one tap away, clearly
 * separate from a quick reshuffle.
 */
export default function FocusMode({ remainingItems, onComplete, onSkipFromPlan, onExit }: Props) {
  const [laterIds, setLaterIds] = useState<string[]>([]);
  const [timerDone, setTimerDone] = useState(false);

  const queue = remainingItems.filter((i) => !laterIds.includes(i.id));
  const current = queue[0];
  const totalToday = remainingItems.length;

  if (!current) {
    return (
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-8 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-lg font-medium">
          {laterIds.length ? "Everything else is set aside for later." : "You're all caught up — nothing left to focus on!"}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {laterIds.length > 0 && (
            <button
              onClick={() => setLaterIds([])}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Show them again
            </button>
          )}
          <button
            onClick={onExit}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Exit focus mode
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>
          Task {totalToday - queue.length + 1} of {totalToday}
        </span>
        <button onClick={onExit} className="underline underline-offset-4 hover:text-white/70">
          Exit focus mode
        </button>
      </div>

      <div className="rounded-2xl border border-sky-400/25 bg-sky-400/5 p-6">
        <h2 className="text-xl font-bold leading-snug">{current.title}</h2>
        <p className="mt-1 text-sm text-white/50">~{current.estimatedHours}h estimated</p>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{current.why}</p>

        <div className="mt-4 space-y-1.5">
          {current.resources.map((r, ri) => (
            <a
              key={ri}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-sky-300 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-200"
            >
              {KIND_ICONS[r.kind] || "🔗"} {r.title} <span className="text-xs text-white/40">— {r.provider}</span>
            </a>
          ))}
        </div>
      </div>

      <FocusTimer
        onComplete={() => {
          setTimerDone(true);
          notify("⏰ Focus timer done", `Time's up for "${current.title}". Take a short break or keep going.`);
        }}
      />
      {timerDone && (
        <p className="text-center text-sm text-emerald-300" aria-live="polite">
          ⏰ Time&rsquo;s up — finish this thought, then take a short break or keep going.
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => onComplete(current.id)}
          className="rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110"
        >
          ✅ Done — next task
        </button>
        <button
          onClick={() => setLaterIds((ids) => [...ids, current.id])}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
        >
          ⏭ Do this later
        </button>
      </div>
      <p className="text-center text-xs text-white/30">
        Not relevant anymore?{" "}
        <button onClick={() => onSkipFromPlan(current.id)} className="underline underline-offset-4 hover:text-white/60">
          Skip it from your plan
        </button>
      </p>
    </section>
  );
}
