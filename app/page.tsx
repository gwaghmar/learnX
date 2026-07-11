"use client";

import { useEffect, useState } from "react";
import PromptBox from "@/components/PromptBox";
import SelectField from "@/components/SelectField";
import PlanView from "@/components/PlanView";
import type { LearningPlan, Selections, TrackerState } from "@/lib/types";

const PLAN_KEY = "learnx:plan";
const TRACKER_KEY = "learnx:tracker";
const SELECTIONS_KEY = "learnx:selections";

const EMPTY_SELECTIONS: Selections = {
  education: "",
  experience: "",
  hoursPerWeek: "",
  timeline: "",
  background: "",
};

const PIPELINE_STEPS = [
  "Reading your job description…",
  "Following the posting link…",
  "Researching the company and team…",
  "Mapping your skill gap…",
  "Finding the best free resources…",
  "Verifying every link…",
  "Assembling your plan…",
];

export default function Home() {
  const [view, setView] = useState<"input" | "loading" | "plan">("input");
  const [prompt, setPrompt] = useState("");
  const [selections, setSelections] = useState<Selections>(EMPTY_SELECTIONS);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [tracker, setTracker] = useState<TrackerState>({});
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  // Restore a saved plan + tracker on load.
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(PLAN_KEY);
      const savedTracker = localStorage.getItem(TRACKER_KEY);
      const savedSelections = localStorage.getItem(SELECTIONS_KEY);
      if (savedPlan) {
        setPlan(JSON.parse(savedPlan));
        setTracker(savedTracker ? JSON.parse(savedTracker) : {});
        if (savedSelections) setSelections(JSON.parse(savedSelections));
        setView("plan");
      }
    } catch {
      /* corrupted local state — start fresh */
    }
  }, []);

  // Cycle the pipeline narration while generating.
  useEffect(() => {
    if (view !== "loading") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [view]);

  const persist = (nextPlan: LearningPlan, nextTracker: TrackerState) => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(nextPlan));
    localStorage.setItem(TRACKER_KEY, JSON.stringify(nextTracker));
    localStorage.setItem(SELECTIONS_KEY, JSON.stringify(selections));
  };

  const setSel = (key: keyof Selections) => (v: string) => setSelections((s) => ({ ...s, [key]: v }));

  const generate = async () => {
    setError("");
    setView("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, selections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setPlan(data.plan);
      setTracker({});
      setDemo(Boolean(data.demo));
      persist(data.plan, {});
      setView("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setView("input");
    }
  };

  const addGoal = async (newGoal: string) => {
    if (!plan) return;
    const completedItemIds = Object.keys(tracker).filter((id) => tracker[id]);
    const res = await fetch("/api/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, newGoal, selections, completedItemIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to merge the new goal");
    setPlan(data.plan);
    persist(data.plan, tracker);
  };

  const toggleItem = (itemId: string) => {
    setTracker((t) => {
      const next = { ...t, [itemId]: !t[itemId] };
      if (plan) persist(plan, next);
      return next;
    });
  };

  const startOver = () => {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(TRACKER_KEY);
    setPlan(null);
    setTracker({});
    setPrompt("");
    setView("input");
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:py-16">
      {view === "input" && (
        <div className="mx-auto max-w-2xl">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Learn<span className="text-sky-400">X</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/60">
              Paste a job description or name your goal. Our agents research the company, map your skill gap, and
              build a learning plan from <span className="text-emerald-300">100% free resources</span> — with a
              tracker to get you there.
            </p>
          </header>

          <PromptBox
            value={prompt}
            onChange={setPrompt}
            placeholder={
              'e.g. "There\'s a Financial Systems Analyst opening at Acme Corp — here\'s the JD: … Prepare me for the interview." (paste the posting link and we\'ll read it)'
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Education level"
              value={selections.education}
              onChange={setSel("education")}
              options={["High school", "Associate degree", "Bachelor's", "Master's", "PhD", "Bootcamp / self-taught"]}
            />
            <SelectField
              label="Relevant experience"
              value={selections.experience}
              onChange={setSel("experience")}
              options={["None yet", "< 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"]}
            />
            <SelectField
              label="Hours per week to learn"
              value={selections.hoursPerWeek}
              onChange={setSel("hoursPerWeek")}
              options={["< 5 hours", "5–10 hours", "10–20 hours", "20+ hours"]}
            />
            <SelectField
              label="Target timeline"
              value={selections.timeline}
              onChange={setSel("timeline")}
              options={["2 weeks (interview soon!)", "1 month", "3 months", "6 months", "No deadline"]}
            />
          </div>

          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
              Your current role / background (optional)
            </span>
            <PromptBox
              value={selections.background}
              onChange={setSel("background")}
              placeholder='e.g. "Accountant, strong Excel, no SQL" — or leave blank and we’ll figure it out'
              rows={2}
            />
          </div>

          {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

          <button
            onClick={generate}
            disabled={prompt.trim().length < 10}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          >
            Build my plan
          </button>
          <p className="mt-3 text-center text-xs text-white/35">
            Free resources only · free certifications anyone can take · every link verified
          </p>
        </div>
      )}

      {view === "loading" && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-sky-400" />
          <p className="text-lg font-medium">{PIPELINE_STEPS[step]}</p>
          <p className="mt-2 text-sm text-white/40">Multi-agent pipeline running — usually 20–60 seconds.</p>
        </div>
      )}

      {view === "plan" && plan && (
        <PlanView
          plan={plan}
          tracker={tracker}
          onToggleItem={toggleItem}
          onAddGoal={addGoal}
          onStartOver={startOver}
          demo={demo}
          hoursPerWeek={selections.hoursPerWeek}
        />
      )}
    </main>
  );
}
