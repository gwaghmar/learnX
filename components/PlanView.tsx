"use client";

import { useMemo, useRef, useState } from "react";
import PromptBox from "./PromptBox";
import InterviewDrill from "./InterviewDrill";
import Celebration from "./Celebration";
import FocusMode from "./FocusMode";
import { downloadFile, planToMarkdown, thisWeekToChecklist, thisWeekToICS } from "@/lib/export";
import { buildShareUrl } from "@/lib/share";
import type { LearningPlan, MetaState, SkillGap, TrackerState } from "@/lib/types";

type Props = {
  plan: LearningPlan;
  tracker: TrackerState;
  meta: MetaState;
  onToggleItem: (itemId: string) => void;
  onSetItemMeta: (itemId: string, patch: { skipped?: boolean; note?: string }) => void;
  onSwapResource: (itemId: string, resourceIndex: number, skill: string, currentUrl: string) => Promise<void>;
  onAddGoal: (goal: string) => Promise<void>;
  onStartOver: () => void;
  demo?: boolean;
  /** The "Hours per week to learn" selection, e.g. "5–10 hours". */
  hoursPerWeek?: string;
  /** Current daily learning streak (days). */
  streak?: number;
  /** Calm Mode — skip confetti and other motion. */
  calmMode?: boolean;
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

export default function PlanView({
  plan,
  tracker,
  meta,
  onToggleItem,
  onSetItemMeta,
  onSwapResource,
  onAddGoal,
  onStartOver,
  demo,
  hoursPerWeek,
  streak = 0,
  calmMode = false,
}: Props) {
  const [newGoal, setNewGoal] = useState("");
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState("");
  const [burst, setBurst] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [swappingKey, setSwappingKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  // Per-phase collapse override — undefined means "use the smart default".
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({});
  const isBusiness = plan.mode === "business";

  const flash = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };

  const toggle = (itemId: string) => {
    if (!tracker[itemId]) setBurst((b) => b + 1); // celebrate completions only
    onToggleItem(itemId);
  };

  const allItems = useMemo(() => plan.phases.flatMap((p) => p.items), [plan]);
  // Skipped items don't count toward progress, hours, or "this week" — but stay visible to un-skip.
  const activeItems = useMemo(() => allItems.filter((i) => !meta[i.id]?.skipped), [allItems, meta]);
  const remainingActive = useMemo(() => activeItems.filter((i) => !tracker[i.id]), [activeItems, tracker]);
  const doneCount = activeItems.length - remainingActive.length;
  const totalHours = activeItems.reduce((s, i) => s + (i.estimatedHours || 0), 0);
  const doneHours = activeItems.filter((i) => tracker[i.id]).reduce((s, i) => s + (i.estimatedHours || 0), 0);
  const pct = activeItems.length ? Math.round((doneCount / activeItems.length) * 100) : 0;
  const nextItem = remainingActive[0] || null;

  // The earliest phase that still has incomplete, non-skipped work — opened
  // by default so the plan reads as "one chunk at a time," not a wall of tasks.
  const firstIncompletePhaseId = useMemo(() => {
    for (const phase of plan.phases) {
      if (phase.items.some((i) => !meta[i.id]?.skipped && !tracker[i.id])) return phase.id;
    }
    return null;
  }, [plan, tracker, meta]);

  // "This week": the next uncompleted, non-skipped items, in plan order, that fit the budget.
  const budget = weeklyBudget(hoursPerWeek);
  const thisWeek = useMemo(() => {
    const picked: typeof remainingActive = [];
    let hours = 0;
    for (const item of remainingActive) {
      if (picked.length && hours + (item.estimatedHours || 0) > budget) break;
      picked.push(item);
      hours += item.estimatedHours || 0;
      if (hours >= budget) break;
    }
    return picked;
  }, [remainingActive, budget]);

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

  /** Opens the item's phase (if collapsed), scrolls to it, and briefly highlights it. */
  const jumpToItem = (itemId: string) => {
    const phase = plan.phases.find((p) => p.items.some((i) => i.id === itemId));
    if (phase) setManualOpen((m) => ({ ...m, [phase.id]: true }));
    setTimeout(() => {
      document.getElementById(`item-${itemId}`)?.scrollIntoView({ behavior: calmMode ? "auto" : "smooth", block: "center" });
      setHighlightId(itemId);
      setTimeout(() => setHighlightId((h) => (h === itemId ? null : h)), 2200);
    }, 50);
  };

  const jumpToSkill = (skill: string) => {
    const s = skill.toLowerCase();
    const target = allItems.find((i) => i.skills.some((sk) => sk.toLowerCase().includes(s) || s.includes(sk.toLowerCase())));
    if (!target) {
      flash(`No single item tags "${skill}" — it's covered across the plan generally.`);
      return;
    }
    jumpToItem(target.id);
  };

  const handleShare = () => {
    const url = buildShareUrl(plan);
    if (!url) {
      flash("This plan is too large to share via link — try the Markdown export instead.");
      return;
    }
    navigator.clipboard
      ?.writeText(url)
      .then(() => flash("🔗 Share link copied to clipboard!"))
      .catch(() => flash(url));
  };

  const copyResourceLink = (url: string) => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => flash("Link copied!"))
      .catch(() => {});
  };

  const swapResource = async (itemId: string, resourceIndex: number, skill: string, currentUrl: string) => {
    const key = `${itemId}-${resourceIndex}`;
    setSwappingKey(key);
    try {
      await onSwapResource(itemId, resourceIndex, skill, currentUrl);
      flash("Swapped in a new resource.");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Couldn't find an alternative right now.");
    } finally {
      setSwappingKey(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24">
      <Celebration trigger={burst} disabled={calmMode} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/15 bg-[#12182a] px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      {/* Header + progress tracker — stays visible even in Focus Mode, for orientation */}
      <section>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">{plan.role}</h1>
          {plan.company && (
            <span className="text-sm text-white/50">{isBusiness ? "Target market" : "Target"}: {plan.company}</span>
          )}
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
              {doneCount}/{activeItems.length} items complete
              {activeItems.length !== allItems.length && (
                <span className="ml-1 text-white/35">({allItems.length - activeItems.length} skipped)</span>
              )}
            </span>
            <span className="text-white/50">
              ~{doneHours}h done of ~{totalHours}h · {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
          </div>

          {!focusMode && nextItem && (
            <button
              onClick={() => jumpToItem(nextItem.id)}
              className="mt-3 w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2.5 text-left text-sm font-medium text-sky-100 transition hover:bg-sky-400/20"
            >
              ▶ Start next: {nextItem.title} <span className="text-white/40">(~{nextItem.estimatedHours}h)</span>
            </button>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {streak > 0 && (
              <span className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-medium text-orange-300">
                🔥 {streak}-day streak
              </span>
            )}
            {!focusMode && (
              <button
                onClick={() => setFocusMode(true)}
                title="One task at a time, nothing else on screen"
                className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-200 transition hover:bg-violet-400/20"
              >
                🎯 Focus mode
              </button>
            )}
            <button
              onClick={handleShare}
              className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200 transition hover:bg-sky-400/20"
            >
              🔗 Share plan
            </button>
            <button
              onClick={() => downloadFile(`learnx-${plan.role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`, planToMarkdown(plan, tracker), "text/markdown")}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
            >
              ⬇ Download plan (.md)
            </button>
            <button
              onClick={() => downloadFile("learnx-this-week.ics", thisWeekToICS(thisWeek, plan.role), "text/calendar")}
              disabled={!thisWeek.length}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              📅 This week → calendar (.ics)
            </button>
            <button
              onClick={() =>
                navigator.clipboard
                  ?.writeText(thisWeekToChecklist(thisWeek, plan.role))
                  .then(() => flash("Checklist copied — paste into Todoist, Reminders, Notion…"))
                  .catch(() => {})
              }
              disabled={!thisWeek.length}
              title="Copy this week as a plain checklist for your to-do app"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              📋 Copy checklist
            </button>
          </div>
        </div>
      </section>

      {focusMode ? (
        <FocusMode
          remainingItems={remainingActive}
          onComplete={(id) => toggle(id)}
          onSkipFromPlan={(id) => onSetItemMeta(id, { skipped: true })}
          onExit={() => setFocusMode(false)}
        />
      ) : (
        <>
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

          {/* This week — the plan sliced to the user's weekly hour budget */}
          {thisWeek.length > 0 && (
            <section className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-300">
                📅 This week (~{budget}h available)
              </h2>
              <ul className="space-y-2 text-sm">
                {thisWeek.map((item) => (
                  <li key={item.id}>
                    <button onClick={() => jumpToItem(item.id)} className="flex items-baseline gap-2 text-left hover:text-emerald-200">
                      <span className="text-emerald-400">→</span>
                      <span>
                        {item.title}
                        <span className="ml-2 text-xs text-white/40">~{item.estimatedHours}h</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Company / team research (or market research, in business mode) */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              {isBusiness ? "Market & industry research" : "What the company & team actually do"}
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

          {/* Skill gap — click a chip to jump to the plan item that covers it */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              {isBusiness ? "Your business capability gap" : "Your skill gap"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {plan.skillGaps.map((gap) => (
                <button
                  key={gap.skill}
                  title={`${gap.note} — click to jump to where this is covered`}
                  onClick={() => jumpToSkill(gap.skill)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition hover:brightness-110 ${GAP_STYLES[gap.status] || GAP_STYLES.partial}`}
                >
                  {gap.skill} · {gap.status}
                </button>
              ))}
            </div>
          </section>

          {/* Phases — collapsible, one open by default (the current phase), so the plan reads as one chunk at a time */}
          {plan.phases.map((phase) => {
            const phaseActive = phase.items.filter((i) => !meta[i.id]?.skipped);
            const phaseDone = phaseActive.filter((i) => tracker[i.id]).length;
            const complete = phaseActive.length > 0 && phaseDone === phaseActive.length;
            const isOpen = manualOpen[phase.id] ?? phase.id === firstIncompletePhaseId;
            return (
              <details
                key={phase.id}
                open={isOpen}
                onToggle={(e) => {
                  const open = (e.target as HTMLDetailsElement).open;
                  setManualOpen((m) => ({ ...m, [phase.id]: open }));
                }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 marker:hidden">
                  <span>
                    <span className="text-lg font-semibold">
                      {complete && "✅ "}
                      {phase.title}
                    </span>
                    <span className="ml-2 text-xs text-white/40">
                      {phaseDone}/{phaseActive.length} done
                    </span>
                  </span>
                  <span className="shrink-0 text-sky-400 transition group-open:rotate-90">▸</span>
                </summary>
                <p className="mb-4 mt-2 text-sm text-white/55">{phase.summary}</p>
                <div className="space-y-4">
                  {phase.items.map((item) => {
                    const done = Boolean(tracker[item.id]);
                    const itemMeta = meta[item.id] || {};
                    const skipped = Boolean(itemMeta.skipped);
                    const highlighted = highlightId === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`item-${item.id}`}
                        className={`scroll-mt-24 rounded-xl border p-4 transition ${
                          highlighted
                            ? "border-sky-400 ring-2 ring-sky-400/60"
                            : done
                            ? "border-emerald-400/30 bg-emerald-400/5"
                            : skipped
                            ? "border-white/5 bg-white/[0.02] opacity-60"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <label className="flex flex-1 cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggle(item.id)}
                              className="mt-1 h-5 w-5 shrink-0 accent-emerald-400"
                            />
                            <div className="min-w-0">
                              <div className={`font-medium ${done ? "text-white/45 line-through" : ""}`}>
                                {item.title}
                                <span className="ml-2 text-xs font-normal text-white/40">~{item.estimatedHours}h</span>
                                {skipped && (
                                  <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-normal text-white/40">
                                    Skipped
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-white/60">{item.why}</p>
                            </div>
                          </label>
                          <button
                            onClick={() => onSetItemMeta(item.id, { skipped: !skipped })}
                            title={skipped ? "Bring this item back into your plan" : "Skip — remove from progress and this week"}
                            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/50 transition hover:bg-white/10"
                          >
                            {skipped ? "↩ Unskip" : "Skip"}
                          </button>
                        </div>

                        <div className="mt-3 space-y-1.5 pl-8">
                          {item.resources.map((r, ri) => {
                            const key = `${item.id}-${ri}`;
                            return (
                              <div key={ri} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-300 underline decoration-sky-300/30 underline-offset-4 hover:text-sky-200"
                                >
                                  {KIND_ICONS[r.kind] || "🔗"} {r.title}
                                </a>
                                <span className="text-xs text-white/40">{r.provider}</span>
                                {r.verified === false && (
                                  <span className="text-xs text-amber-300/70" title="Original link was unreachable; this goes to the provider's search instead.">
                                    (search link)
                                  </span>
                                )}
                                <button
                                  onClick={() => copyResourceLink(r.url)}
                                  title="Copy link"
                                  aria-label="Copy link"
                                  className="rounded px-1.5 py-0.5 text-xs text-white/30 transition hover:bg-white/10 hover:text-white/60"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => swapResource(item.id, ri, item.skills[0] || item.title, r.url)}
                                  disabled={swappingKey === key}
                                  title="Swap for a different free resource"
                                  className="rounded px-1.5 py-0.5 text-xs text-white/30 transition hover:bg-white/10 hover:text-white/60 disabled:opacity-40"
                                >
                                  {swappingKey === key ? "🔁…" : "🔁 Swap"}
                                </button>
                                {r.certNote && <div className="w-full text-xs text-emerald-300/70">🏅 {r.certNote}</div>}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-3 pl-8">
                          <input
                            type="text"
                            defaultValue={itemMeta.note || ""}
                            onBlur={(e) => {
                              if (e.target.value !== (itemMeta.note || "")) onSetItemMeta(item.id, { note: e.target.value });
                            }}
                            placeholder="Add a note about your progress…"
                            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-xs text-white/70 placeholder-white/25 outline-none transition focus:border-sky-400/50"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}

          {/* Interview prep (or launch checklist, in business mode) */}
          {plan.interviewPrep?.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
                {isBusiness ? "Launch checklist" : "Interview prep"}
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80">
                {plan.interviewPrep.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Interview drill — practice from the same research (job mode only; a business has no interviewer) */}
          {!isBusiness && <InterviewDrill plan={plan} />}
        </>
      )}

      <div className="flex items-center justify-between text-sm text-white/40">
        {demo && <span>Demo plan — set OPENROUTER_API_KEY for real generation.</span>}
        <button onClick={onStartOver} className="ml-auto underline underline-offset-4 hover:text-white/70">
          ← All plans / start a new one
        </button>
      </div>
    </div>
  );
}
