"use client";

import { useEffect, useState } from "react";
import PromptBox from "@/components/PromptBox";
import SelectField from "@/components/SelectField";
import PlanView from "@/components/PlanView";
import PlanLibrary from "@/components/PlanLibrary";
import SharedPlanPreview from "@/components/SharedPlanPreview";
import {
  currentStreak,
  emptySelections,
  hasCompletedToday,
  loadStore,
  recordCompletionToday,
  saveStore,
  type PlanStore,
} from "@/lib/plans-store";
import { decodePlanFromShare } from "@/lib/share";
import { getReduceMotion, setReduceMotion } from "@/lib/motion";
import {
  enableNotifications,
  disableNotifications,
  maybeNudgeStreak,
  notificationsEnabled,
  notificationsSupported,
} from "@/lib/notifications";
import type { LearningPlan, Selections } from "@/lib/types";

const PIPELINE_STEPS = [
  "Reading your job description…",
  "Following the posting link…",
  "Researching the company and team…",
  "Mapping your skill gap…",
  "Finding the best free resources…",
  "Verifying every link…",
  "Assembling your plan…",
];

const HOW_IT_WORKS = [
  { icon: "📋", title: "Paste the job", text: "A JD, a posting link, or just \"prep me for X\" — typed or spoken." },
  { icon: "🔎", title: "Agents research", text: "We read the real posting, research the company live, and map your gap." },
  { icon: "🗺️", title: "Get your plan", text: "Phased, sized to your hours, built only from verified free resources." },
  { icon: "✅", title: "Track to hired", text: "Weekly slices, streaks, interview drills — momentum until the offer." },
];

const FEATURES = [
  { icon: "🆓", title: "100% free resources", text: "freeCodeCamp, Kaggle, MIT OCW, CFI, Microsoft Learn — never a paywall. Certs included only if anyone can take them free." },
  { icon: "🔗", title: "Every link verified", text: "A curated index link-checked weekly in CI, plus a runtime check on every plan — and a one-click swap if you'd rather try a different free resource." },
  { icon: "🏢", title: "Real company research", text: "Live web search with cited sources. Anything uncertain is labeled \"Verify:\" — never assumptions dressed as facts." },
  { icon: "🎯", title: "Multi-goal merging", text: "Add \"also AWS Solutions Architect\" and the plan rewrites around both goals — completed work stays done." },
  { icon: "🎤", title: "Interview drills", text: "Practice the questions this company will actually ask — read aloud, generated from the same research as your plan." },
  { icon: "📅", title: "Fits your week", text: "Tell us your hours; get a \"this week\" slice, calendar export, and a streak to keep you honest." },
  { icon: "🔁", title: "Swap any resource", text: "Don't like a suggested course? Swap it instantly for another free one covering the same skill." },
  { icon: "🔗", title: "Share your plan", text: "One click copies a read-only link — friends can preview it and add it to their own library." },
];

const FAQ = [
  { q: "Is it really free?", a: "The resources in every plan are 100% free to consume — that's a hard rule in the planning engine, not a marketing claim. Certifications are only recommended if any member of the public can complete them at no cost." },
  { q: "What about certifications that need an employer's system?", a: "Vendor certs like Workday Pro or NetSuite require a company license — we never recommend those. If the job needs one of those systems, the plan says so explicitly and routes you to the best free public alternative." },
  { q: "Do I need an account?", a: "No. Plans and progress live in your browser. Cross-device sync with accounts is on the roadmap." },
  { q: "What if I'm not in tech?", a: "That's the point — financial analysts, ops, marketing, project managers. Most learning tools only serve developers; LearnX plans any role a job description exists for." },
  { q: "Can I prepare for two things at once?", a: "Yes — generate a plan, then use \"add more to your path\" to merge additional roles or certifications. Progress you've already made is always preserved. You can also keep fully separate plans side by side." },
  { q: "What if I don't like a suggested resource?", a: "Hit \"Swap\" next to it — you'll get a different free resource for the same skill instantly, pulled from the verified index or generated fresh if none is indexed yet." },
];

type Sample = { label: string; prompt: string; selections: Partial<Selections> };

const JOB_SAMPLES: Sample[] = [
  {
    label: "Financial Systems Analyst",
    prompt:
      "There's a Financial Systems Analyst opening at a mid-size logistics company. The JD asks for advanced Excel, SQL, ERP experience (Oracle or NetSuite), Power BI dashboards, and supporting month-end close. I have an interview next month.",
    selections: { education: "Bachelor's", experience: "1–3 years", hoursPerWeek: "10–20 hours", timeline: "1 month", background: "Accountant, strong Excel, no SQL" },
  },
  {
    label: "Data Analyst",
    prompt:
      "I want to become a Data Analyst at a mid-size e-commerce company. Postings ask for SQL, Python (pandas), A/B testing knowledge, and dashboarding in Looker or Tableau.",
    selections: { education: "Bachelor's", experience: "None yet", hoursPerWeek: "10–20 hours", timeline: "3 months", background: "Marketing coordinator, comfortable with spreadsheets" },
  },
  {
    label: "Product Marketing Manager",
    prompt:
      "Targeting Product Marketing Manager roles at B2B SaaS startups. JDs want positioning/messaging experience, go-to-market planning, competitive analysis, and comfort presenting to sales teams.",
    selections: { education: "Bachelor's", experience: "3–5 years", hoursPerWeek: "5–10 hours", timeline: "3 months", background: "Content marketer, no formal PMM experience" },
  },
];

const BUSINESS_SAMPLES: Sample[] = [
  {
    label: "Freelance bookkeeping",
    prompt:
      "I want to start a freelance bookkeeping practice serving local small businesses. I have basic accounting knowledge but no clients or business setup yet.",
    selections: { education: "Bachelor's", experience: "1–3 years", hoursPerWeek: "10–20 hours", timeline: "3 months", background: "Worked in an accounting department, comfortable with spreadsheets" },
  },
  {
    label: "Freelance web design business",
    prompt:
      "I want to start a freelance web design business for small local businesses — building simple marketing websites and handling basic hosting/maintenance.",
    selections: { education: "Bachelor's", experience: "None yet", hoursPerWeek: "10–20 hours", timeline: "3 months", background: "Comfortable with computers, no professional design or dev experience" },
  },
];

export default function Home() {
  const [view, setView] = useState<"input" | "loading" | "plan" | "shared">("input");
  const [prompt, setPrompt] = useState("");
  const [selections, setSelections] = useState<Selections>(emptySelections());
  const [store, setStore] = useState<PlanStore>({ plans: {}, activeId: null });
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [sharedPlan, setSharedPlan] = useState<LearningPlan | null>(null);
  const [calmMode, setCalmMode] = useState(false);
  const [notifsOn, setNotifsOn] = useState(false);
  const [notifsSupported, setNotifsSupported] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [mode, setMode] = useState<"job" | "business">("job");

  // Restore the plan library on load; handle an incoming shared-plan link first.
  useEffect(() => {
    const s = loadStore();
    setStore(s);
    setStreak(currentStreak());
    setCalmMode(getReduceMotion());
    setNotifsSupported(notificationsSupported());
    setNotifsOn(notificationsEnabled());
    if (notificationsEnabled()) maybeNudgeStreak(hasCompletedToday());

    const sharedParam = new URLSearchParams(window.location.search).get("shared");
    if (sharedParam) {
      const decoded = decodePlanFromShare(sharedParam);
      window.history.replaceState({}, "", window.location.pathname);
      if (decoded) {
        setSharedPlan(decoded);
        setView("shared");
        return;
      }
    }

    if (s.activeId && s.plans[s.activeId]) {
      setSelections(s.plans[s.activeId].selections);
      setView("plan");
    }
  }, []);

  // Cycle the pipeline narration while generating.
  useEffect(() => {
    if (view !== "loading") return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, [view]);

  const active = store.activeId ? store.plans[store.activeId] : null;

  const update = (next: PlanStore) => {
    setStore(next);
    saveStore(next);
  };

  const setSel = (key: keyof Selections) => (v: string) => setSelections((s) => ({ ...s, [key]: v }));

  const applySample = (sample: Sample) => {
    setPrompt(sample.prompt);
    setSelections((s) => ({ ...s, ...sample.selections }));
    setCustomizeOpen(true); // so users can see (and tweak) what the sample filled in
    document.getElementById("build-plan-btn")?.scrollIntoView({ behavior: calmMode ? "auto" : "smooth", block: "center" });
  };

  const generate = async () => {
    setError("");
    setView("loading");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, selections, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const plan: LearningPlan = data.plan;
      update({
        plans: {
          ...store.plans,
          [plan.id]: {
            plan,
            tracker: {},
            meta: {},
            selections,
            demo: Boolean(data.demo),
            updatedAt: new Date().toISOString(),
          },
        },
        activeId: plan.id,
      });
      setPrompt("");
      setView("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setView("input");
    }
  };

  const addGoal = async (newGoal: string) => {
    if (!active) return;
    const completedItemIds = Object.keys(active.tracker).filter((id) => active.tracker[id]);
    const res = await fetch("/api/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: active.plan, newGoal, selections: active.selections, completedItemIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to merge the new goal");
    update({
      ...store,
      plans: {
        ...store.plans,
        [data.plan.id]: { ...active, plan: data.plan, updatedAt: new Date().toISOString() },
      },
      activeId: data.plan.id,
    });
  };

  const toggleItem = (itemId: string) => {
    if (!active || !store.activeId) return;
    const completing = !active.tracker[itemId];
    if (completing) {
      recordCompletionToday();
      setStreak(currentStreak());
    }
    update({
      ...store,
      plans: {
        ...store.plans,
        [store.activeId]: {
          ...active,
          tracker: { ...active.tracker, [itemId]: completing },
          updatedAt: new Date().toISOString(),
        },
      },
    });
  };

  const setItemMeta = (itemId: string, patch: { skipped?: boolean; note?: string }) => {
    if (!active || !store.activeId) return;
    const meta = { ...(active.meta || {}) };
    meta[itemId] = { ...meta[itemId], ...patch };
    update({
      ...store,
      plans: {
        ...store.plans,
        [store.activeId]: { ...active, meta, updatedAt: new Date().toISOString() },
      },
    });
  };

  const swapResource = async (itemId: string, resourceIndex: number, skill: string, currentUrl: string) => {
    if (!active || !store.activeId) return;
    const res = await fetch("/api/swap-resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, excludeUrl: currentUrl, role: active.plan.role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No alternative available");
    const nextPlan: LearningPlan = {
      ...active.plan,
      phases: active.plan.phases.map((phase) => ({
        ...phase,
        items: phase.items.map((item) =>
          item.id === itemId
            ? { ...item, resources: item.resources.map((r, i) => (i === resourceIndex ? data.resource : r)) }
            : item
        ),
      })),
    };
    update({
      ...store,
      plans: {
        ...store.plans,
        [store.activeId]: { ...active, plan: nextPlan, updatedAt: new Date().toISOString() },
      },
    });
  };

  const selectPlan = (planId: string) => {
    const entry = store.plans[planId];
    if (!entry) return;
    setSelections(entry.selections);
    update({ ...store, activeId: planId });
    setView("plan");
  };

  const deletePlan = (planId: string) => {
    const plans = { ...store.plans };
    delete plans[planId];
    update({ plans, activeId: store.activeId === planId ? null : store.activeId });
  };

  const importSharedPlan = () => {
    if (!sharedPlan) return;
    const newId = store.plans[sharedPlan.id] ? `plan-${Date.now().toString(36)}` : sharedPlan.id;
    const importedPlan: LearningPlan = { ...sharedPlan, id: newId };
    const nextSelections = emptySelections();
    const next: PlanStore = {
      plans: {
        ...store.plans,
        [newId]: { plan: importedPlan, tracker: {}, meta: {}, selections: nextSelections, updatedAt: new Date().toISOString() },
      },
      activeId: newId,
    };
    update(next);
    setSelections(nextSelections);
    setSharedPlan(null);
    setView("plan");
  };

  const dismissSharedPlan = () => {
    setSharedPlan(null);
    setView(active ? "plan" : "input");
  };

  const backToHome = () => {
    update({ ...store, activeId: null });
    setView("input");
  };

  const toggleCalmMode = () => {
    const next = !calmMode;
    setCalmMode(next);
    setReduceMotion(next);
  };

  const toggleNotifications = async () => {
    if (notifsOn) {
      disableNotifications();
      setNotifsOn(false);
      return;
    }
    setNotifsOn(await enableNotifications());
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:py-16">
      {/* Focus-friendly settings — always reachable, never in the way */}
      <div className="fixed right-3 top-3 z-30 flex gap-2">
        <button
          onClick={toggleCalmMode}
          title="Turn off confetti and other motion"
          className={`rounded-full border px-3 py-1.5 text-xs shadow-lg backdrop-blur transition ${
            calmMode
              ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
              : "border-white/15 bg-[#12182a]/80 text-white/60 hover:bg-white/10"
          }`}
        >
          🌙 Calm mode{calmMode ? ": on" : ""}
        </button>
        {notifsSupported && (
          <button
            onClick={toggleNotifications}
            title="Silent desktop reminders — no sound, never spammy"
            className={`rounded-full border px-3 py-1.5 text-xs shadow-lg backdrop-blur transition ${
              notifsOn
                ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
                : "border-white/15 bg-[#12182a]/80 text-white/60 hover:bg-white/10"
            }`}
          >
            🔔 Reminders{notifsOn ? ": on" : ""}
          </button>
        )}
      </div>

      {view === "shared" && sharedPlan && (
        <SharedPlanPreview plan={sharedPlan} onImport={importSharedPlan} onDismiss={dismissSharedPlan} />
      )}

      {view === "input" && (
        <div className="mx-auto max-w-2xl">
          <header className={`mb-10 text-center ${calmMode ? "" : "fade-up"}`}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Learn<span className="text-sky-400">X</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/60">
              {mode === "business" ? (
                <>
                  Describe the business you want to start. Get the plan. Launch it —{" "}
                  <span className="text-emerald-300">without paying for a single course.</span>
                </>
              ) : (
                <>
                  Paste the job. Get the plan. Land the role —{" "}
                  <span className="text-emerald-300">without paying for a single course.</span>
                </>
              )}
            </p>
          </header>

          <PlanLibrary store={store} onSelect={selectPlan} onDelete={deletePlan} />

          <div className="mb-4 flex justify-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
            <button
              onClick={() => setMode("job")}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                mode === "job" ? "bg-sky-500 font-semibold text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              🧑‍💼 Get a job
            </button>
            <button
              onClick={() => setMode("business")}
              className={`flex-1 rounded-full px-4 py-2 transition ${
                mode === "business" ? "bg-emerald-500 font-semibold text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              🚀 Start a business
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">Try a sample:</span>
            {(mode === "business" ? BUSINESS_SAMPLES : JOB_SAMPLES).map((sample) => (
              <button
                key={sample.label}
                onClick={() => applySample(sample)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-sky-400/40 hover:bg-white/10"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <PromptBox
            value={prompt}
            onChange={setPrompt}
            placeholder={
              mode === "business"
                ? 'e.g. "I want to start a freelance bookkeeping practice serving local small businesses. I have basic accounting knowledge but no clients yet."'
                : 'e.g. "There\'s a Financial Systems Analyst opening at Acme Corp — here\'s the JD: … Prepare me for the interview." (paste the posting link and we\'ll read it)'
            }
          />

          <details
            open={customizeOpen}
            onToggle={(e) => setCustomizeOpen((e.target as HTMLDetailsElement).open)}
            className="group mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white/70 marker:hidden">
              <span>⚙️ Customize your plan <span className="font-normal text-white/40">(optional — we'll assume sensible defaults)</span></span>
              <span className="text-sky-400 transition group-open:rotate-90">▸</span>
            </summary>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </details>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>
          )}

          <button
            id="build-plan-btn"
            onClick={generate}
            disabled={prompt.trim().length < 10}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          >
            {mode === "business" ? "Build my launch plan" : "Build my plan"}
          </button>
          <p className="mt-3 text-center text-xs text-white/35">
            Free resources only · free certifications anyone can take · every link verified
          </p>

          {/* ——— Landing sections ——— */}
          <section className="mt-20">
            <h2 className="mb-6 text-center text-2xl font-bold">How it works</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs font-semibold text-white/30">STEP {i + 1}</span>
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Deeper marketing content — collapsed by default so the first screen stays short and decision-light */}
          <details
            open={learnMoreOpen}
            onToggle={(e) => setLearnMoreOpen((e.target as HTMLDetailsElement).open)}
            className="group mt-16"
          >
            <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white/60 marker:hidden hover:bg-white/10">
              Why LearnX, free resources &amp; FAQ
              <span className="text-sky-400 transition group-open:rotate-90">▸</span>
            </summary>

            <section className="mt-8">
              <h2 className="mb-2 text-center text-2xl font-bold">Why LearnX</h2>
              <p className="mb-6 text-center text-sm text-white/50">
                Course catalogs recommend what they sell. We recommend what&rsquo;s actually free — and exactly what{" "}
                <em>this job</em> needs.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h3 className="font-semibold">
                      <span className="mr-2">{f.icon}</span>
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{f.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={() => document.getElementById("build-plan-btn")?.scrollIntoView({ behavior: calmMode ? "auto" : "smooth", block: "center" })}
                  className="rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/20"
                >
                  Try it now ↑
                </button>
              </div>
            </section>

            <section className="mt-16">
              <h2 className="mb-6 text-center text-2xl font-bold">Questions</h2>
              <div className="space-y-2">
                {FAQ.map((item) => (
                  <details key={item.q} className="group rounded-xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer list-none font-medium marker:hidden">
                      <span className="mr-2 inline-block text-sky-400 transition group-open:rotate-90">▸</span>
                      {item.q}
                    </summary>
                    <p className="mt-2 pl-6 text-sm leading-relaxed text-white/60">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="mt-16 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 text-center">
              <h2 className="text-xl font-bold">For career centers, bootcamps &amp; workforce boards</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Give every student or job-seeker you serve a personalized, verified-free-resource plan instead of a
                generic handout — with progress you can see. Cohort dashboards and seat-based access are in
                development; write in and we&rsquo;ll loop you into early access.
              </p>
              <a
                href="mailto:hello@learnx.app?subject=LearnX%20for%20teams"
                className="mt-4 inline-block rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
              >
                ✉️ Get in touch
              </a>
            </section>

            <footer className="mt-16 border-t border-white/10 pt-6 text-center text-xs text-white/30">
              LearnX — open learning, honestly linked. Built with a verified free-resource index, link-checked weekly.
            </footer>
          </details>
        </div>
      )}

      {view === "loading" && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-sky-400" />
          <p className="text-lg font-medium">{PIPELINE_STEPS[step]}</p>
          <p className="mt-2 text-sm text-white/40">Multi-agent pipeline running — usually 20–60 seconds.</p>
        </div>
      )}

      {view === "plan" && active && (
        <PlanView
          plan={active.plan}
          tracker={active.tracker}
          meta={active.meta || {}}
          onToggleItem={toggleItem}
          onSetItemMeta={setItemMeta}
          onSwapResource={swapResource}
          onAddGoal={addGoal}
          onStartOver={backToHome}
          demo={active.demo}
          hoursPerWeek={active.selections.hoursPerWeek}
          streak={streak}
          calmMode={calmMode}
        />
      )}
    </main>
  );
}
