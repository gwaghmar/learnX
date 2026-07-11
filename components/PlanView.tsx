"use client";

import { useMemo, useState } from "react";
import PromptBox from "./PromptBox";
import type { LearningPlan, SkillGap, TrackerState } from "@/lib/types";

type Props = {
  plan: LearningPlan;
  tracker: TrackerState;
  onToggleItem: (itemId: string) => void;
  onAddGoal: (goal: string) => Promise<void>;
  onStartOver: () => void;
  demo?: boolean;
  /** The "Hours per week to learn" selection, e.g. "5–10 hours". */
  hoursPerWeek?: string;
};

/** Turn the hours-per-week selection into a weekly hour budget. */
function weeklyBudget(selection?: string): number {
  const nums = (selection?.match(/\d+/g) || []).map(Number);
  if (!nums.length) return 8;
  if (selection?.trim().startsWith("<")) return Math.max(2, nums[0] - 1);
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  return selection?.includes("+") ? nums[0] + 2 : nums[0];
}

const GAP_STYLES: Record<SkillGap["status"], string> = {
  have: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  partial: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  missing: "border-rose-400/40 bg-rose-400/10 text-rose-300",
};

const KIND_ICONS: Record<string, string> = {
  course: "📚",
  video: "▶️",
  article: "📄",
  practice: "🧪",
  certification: "🏅",
  docs: "📘",
};

export default function PlanView({ plan, tracker, onToggleItem, onAddGoal, onStartOver, demo, hoursPerWeek }: Props) {
  const [newGoal, setNewGoal] = useState("");
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState("");

  const allItems = useMemo(() => plan.phases.flatMap((p) => p.items), [plan]);
  const doneCount = allItems.filter((i) => tracker[i.id]).length;
  const totalHours = allItems.reduce((s, i) => s + (i.estimatedHours || 0), 0);
  const doneHours = allItems.filter((i) => tracker[i.id]).reduce((s, i) => s + (i.estimatedHours || 0), 0);
  const pct = allItems.length ? Math.round((doneCount / allItems.length) * 100) : 0;

  // "This week": the next uncompleted items, in plan order, that fit the
  // user's weekly hour budget (always at least one).
  const budget = weeklyBudget(hoursPerWeek);
  const thisWeek = useMemo(() => {
    const upNext = allItems.filter((i) => !tracker[i.id]);
    const picked: typeof upNext = [];
    let hours = 0;
    for (const item of upNext) {
      if (picked.length && hours + (item.estimatedHours || 0) > budget) break;
      picked.push(item);
      hours += item.estimatedHours || 0;
      if (hours >= budget) break;
    }
    return picked;
  }, [allItems, tracker, budget]);

  const submitGoal = async () => {
    if (!newGoal.trim() || expanding) return;
    setExpanding(true);
    setExpandError("");
    try {
      await onAddGoal(newGoal.trim());
      setNewGoal("");
    } catch (e) {
      setExpandError(e instanceof Error ? e.message : "Failed to add goal");
    } finally {
      setExpanding(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24">
      {/* Add another goal — lives on top, per the product spec */}
      <section className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-sky-300">
          Want to add more to your path?
        </h2>
        <p className="mb-3 text-sm text-white/60">
          Add another target (e.g. &ldquo;also prepare me for AWS Solutions Architect&rdquo;) and the agents will
          rewrite the plan around both goals — everything you&rsquo;ve already completed stays checked.
        </p>
        <PromptBox value={newGoal} onChange={setNewGoal} placeholder="Add another role, certification, or skill goal…" rows={2} />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={submitGoal}
            disabled={expanding || !newGoal.trim()}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-40"
          >
            {expanding ? "Re-planning…" : "Merge into my plan"}
          </button>
          {expandError && <span className="text-sm text-rose-300">{expandError}</span>}
        </div>
      </section>

      {/* Header + progress tracker */}
      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">{plan.role}</h1>
          {plan.company && <span className="text-sm text-white/50">Target: {plan.company}</span>}
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {plan.goals.map((g, i) => (
            <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              🎯 {g.length > 70 ? g.slice(0, 70) + "…" : g}
            </span>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">
              {doneCount}/{allItems.length} items complete
            </span>
            <span className="text-white/50">
              ~{doneHours}h done of ~{totalHours}h · {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      {/* This week — the plan sliced to the user's weekly hour budget */}
      {thisWeek.length > 0 && (
        <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-300">
            📅 This week (~{budget}h available)
          </h2>
          <ul className="space-y-2 text-sm">
            {thisWeek.map((item) => (
              <li key={item.id} className="flex items-baseline gap-2">
                <span className="text-emerald-400">→</span>
                <span>
                  {item.title}
                  <span className="ml-2 text-xs text-white/40">~{item.estimatedHours}h</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Company / team research */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
          What the company &amp; team actually do
        </h2>
        <ul className="space-y-2 text-sm leading-relaxed text-white/80">
          {plan.companyResearch.map((line, i) => {
            if (line.startsWith("Source: ")) {
              const url = line.slice("Source: ".length).trim();
              return (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="text-sky-400">🔗</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sky-300/70 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-200"
                  >
                    {url}
                  </a>
                </li>
              );
            }
            return (
              <li key={i} className="flex gap-2">
                <span className="text-sky-400">{line.startsWith("Verify:") ? "❓" : "•"}</span>
                <span className={line.startsWith("Verify:") ? "text-amber-200/80" : ""}>{line}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Skill gap */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Your skill gap</h2>
        <div className="flex flex-wrap gap-2">
          {plan.skillGaps.map((gap) => (
            <span
              key={gap.skill}
              title={gap.note}
              className={`cursor-help rounded-full border px-3 py-1 text-xs font-medium ${GAP_STYLES[gap.status] || GAP_STYLES.partial}`}
            >
              {gap.skill} · {gap.status}
            </span>
          ))}
        </div>
      </section>

      {/* Phases + tracker checkboxes */}
      {plan.phases.map((phase, pi) => (
        <section key={phase.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">{phase.title}</h2>
          <p className="mb-4 mt-1 text-sm text-white/55">{phase.summary}</p>
          <div className="space-y-4">
            {phase.items.map((item) => {
              const done = Boolean(tracker[item.id]);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    done ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => onToggleItem(item.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-emerald-400"
                    />
                    <div className="min-w-0">
                      <div className={`font-medium ${done ? "text-white/45 line-through" : ""}`}>
                        {item.title}
                        <span className="ml-2 text-xs font-normal text-white/40">~{item.estimatedHours}h</span>
                      </div>
                      <p className="mt-1 text-sm text-white/60">{item.why}</p>
                    </div>
                  </label>
                  <div className="mt-3 space-y-1.5 pl-8">
                    {item.resources.map((r, ri) => (
                      <div key={ri} className="text-sm">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-300 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-200"
                        >
                          {KIND_ICONS[r.kind] || "🔗"} {r.title}
                        </a>
                        <span className="ml-2 text-xs text-white/40">{r.provider}</span>
                        {r.verified === false && (
                          <span className="ml-2 text-xs text-amber-300/70" title="Original link was unreachable; this goes to the provider's search instead.">
                            (search link)
                          </span>
                        )}
                        {r.certNote && <div className="text-xs text-emerald-300/70">🏅 {r.certNote}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {pi === plan.phases.length - 1 && null}
        </section>
      ))}

      {/* Interview prep */}
      {plan.interviewPrep?.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">Interview prep</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80">
            {plan.interviewPrep.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between text-sm text-white/40">
        {demo && <span>Demo plan — set OPENROUTER_API_KEY for real generation.</span>}
        <button onClick={onStartOver} className="ml-auto underline underline-offset-4 hover:text-white/70">
          Start over with a new plan
        </button>
      </div>
    </div>
  );
}
