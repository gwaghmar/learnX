import type { LearningPlan, MetaState, Selections, TrackerState } from "./types";

/**
 * Client-side plan library (v1): multiple concurrent plans, each with its own
 * tracker, plus the learning streak. All in localStorage; Supabase sync is a
 * v2 item in PRD.md. Legacy single-plan keys migrate automatically.
 */

export type StoredPlan = {
  plan: LearningPlan;
  tracker: TrackerState;
  /** Per-item notes and skip flags — separate from completion so progress math stays simple. */
  meta?: MetaState;
  selections: Selections;
  demo?: boolean;
  updatedAt: string;
};

export type PlanStore = {
  plans: Record<string, StoredPlan>;
  activeId: string | null;
};

const STORE_KEY = "learnx:store";
const STREAK_KEY = "learnx:streak-days";
const LEGACY_PLAN = "learnx:plan";
const LEGACY_TRACKER = "learnx:tracker";
const LEGACY_SELECTIONS = "learnx:selections";

export function emptySelections(): Selections {
  return { education: "", experience: "", hoursPerWeek: "", timeline: "", background: "" };
}

export function loadStore(): PlanStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as PlanStore;

    // One-time migration from the v0 single-plan keys.
    const legacyPlan = localStorage.getItem(LEGACY_PLAN);
    if (legacyPlan) {
      const plan = JSON.parse(legacyPlan) as LearningPlan;
      const tracker = JSON.parse(localStorage.getItem(LEGACY_TRACKER) || "{}") as TrackerState;
      const selections =
        (JSON.parse(localStorage.getItem(LEGACY_SELECTIONS) || "null") as Selections | null) || emptySelections();
      const store: PlanStore = {
        plans: { [plan.id]: { plan, tracker, selections, updatedAt: new Date().toISOString() } },
        activeId: plan.id,
      };
      saveStore(store);
      localStorage.removeItem(LEGACY_PLAN);
      localStorage.removeItem(LEGACY_TRACKER);
      localStorage.removeItem(LEGACY_SELECTIONS);
      return store;
    }
  } catch {
    /* corrupted state — start fresh */
  }
  return { plans: {}, activeId: null };
}

export function saveStore(store: PlanStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

/** Record that the user completed at least one item today (streak fuel). */
export function recordCompletionToday(): void {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const days = new Set<string>(JSON.parse(localStorage.getItem(STREAK_KEY) || "[]"));
    days.add(today);
    localStorage.setItem(STREAK_KEY, JSON.stringify([...days].sort().slice(-400)));
  } catch {
    localStorage.setItem(STREAK_KEY, JSON.stringify([today]));
  }
}

/** Consecutive learning days ending today (or yesterday, so a streak isn't dead at breakfast). */
export function currentStreak(): number {
  let days: string[];
  try {
    days = JSON.parse(localStorage.getItem(STREAK_KEY) || "[]");
  } catch {
    return 0;
  }
  const set = new Set(days);
  const day = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  // Allow the streak to start counting from yesterday if today has no activity yet.
  if (!set.has(iso(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (set.has(iso(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}
