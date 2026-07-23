# LearnX — Product Requirements Document

**Tagline:** *Paste the job. Get the plan. Land the role — without paying for a single course.*

**One-liner:** LearnX turns any job description or career goal into an AI-researched, free-resource learning plan with verified links, a progress tracker, and interview prep — the full loop from "I want this job" to "I'm ready for it."

---

## 1. Problem

People who want a specific job face four broken options:
- **Gap identifiers** (Jobscan, Careerflow) tell you what you're missing, then stop.
- **Roadmap generators** (roadmap.sh, roadmaps.cc) teach generic tracks, not *this* job at *this* company.
- **Interview preppers** (Final Round AI, Exponent) polish your answers but skip skill-building.
- **Course catalogs** (Coursera, LinkedIn Learning) recommend what they sell, not what's free and best.

Nobody closes the loop: **this specific posting → this specific plan → tracked to completion → interview-ready.** And nobody serves non-developer roles (financial analysts, ops, marketing) well at all.

## 2. Vision

The single screen someone opens the night they find a job posting they want — and keeps open every week until they're hired. Later: the same loop for "I want to start/run a business."

## 3. Target users

1. **The Switcher** — employed, targeting a specific posting or role change; 5–10 hrs/week; wants efficiency and interview readiness.
2. **The Breaker-in** — student/new grad/career-changer; more time than money; needs free certifications that actually signal.
3. **The Climber** — has the job family, wants the next tier (e.g. analyst → solutions architect); stacks goals over months.

## 4. Differentiators (the moats)

Per `MARKET_ANALYSIS.md`, chat assistants can generate a decent plan once. LearnX wins on what chat can't hold:

1. **Verified resource index** — curated free resources, link-checked weekly in CI; the Planner uses them verbatim. Every link works, every resource is genuinely free.
2. **Honest certification policy** — only certs anyone can take free (freeCodeCamp, CFI, Google Skillshop, Kaggle, CS50); employer-license-gated certs (Workday, NetSuite) are explicitly flagged with free alternatives.
3. **Real company research** — live web search with cited sources; uncertainty labeled `Verify:` instead of hallucinated as fact.
4. **Progress-preserving multi-goal merge** — add a second target; the plan rewrites around both without losing a single checked box.
5. **Persistent momentum** — tracker, weekly slice, streaks: a reason to come back every day until hired.

## 5. Feature spec

### ✅ Shipped (v0)
- Single-screen prompt (typed or tap-to-speak) + profile selectors, each with "Help me figure out"
- Agent pipeline: URL fetcher → Analyst (live web research, cited) → Planner (free-only, index-first) → link checker
- Phased plan with skill-gap chips, per-item resources, certification notes
- Progress tracker (items, hours, %) · "This week" hour-budget slice
- Add-a-goal merge preserving completed items
- Verified resource index (~40 entries) + weekly CI link check
- Demo mode (fully explorable without an API key)

### 🚀 v1 — "best website" sprint
- **Plan library** — multiple concurrent plans, each with its own tracker; switch, resume, delete; legacy single-plan state migrates automatically
- **Interview Drill mode** — flashcard-style practice questions generated from the plan's company research + skill gaps, with strong-answer guidance; works in demo mode
- **Streaks & celebration** — 🔥 daily learning streak; confetti when an item is completed
- **Export** — one-click Markdown download of the whole plan; .ics calendar file for the "This week" items
- **Real landing page** — hero, how-it-works, feature grid, FAQ, footer; the app is the hero, marketing supports it
- **PRD** (this document) as the single source of product truth

### 🚀 v1.1 — interactivity pass (nothing static)
- **Swap any resource** — one click replaces a suggested resource with a different free one for the same skill; checks the verified index first (instant, free), falls back to AI generation + link verification only if nothing indexed
- **Skip an item** — secondary action next to Complete; skipped items drop out of progress %, hours, and "This week" but stay visible to un-skip
- **Per-item notes** — free-text field on every item, persisted, for jotting personal progress
- **Shareable read-only plan links** — one click copies a URL encoding the whole plan (no backend); opening it shows a read-only preview with an "Add to my plans" button — the growth loop moved up from v2
- **Clickable skill-gap chips** — jump to and highlight the plan item that covers a given skill
- **Sample JD quick-start** — one-click example prompts (Financial Systems Analyst, Data Analyst, Product Marketing Manager) so a new visitor can see real output before writing anything
- **Spoken interview questions** — 🔊 read-aloud on every drill question via the Web Speech API, pairing with the existing tap-to-speak input
- **Copy-link** action on every resource

### 🚀 v1.2 — attention-friendly pass (ADHD-friendly by design)
- **Focus Mode** — one task at a time, full-screen, nothing else competing for attention: title, why, resources, a built-in 5/15/25/45-min timer, and exactly two decisions (Done / Do this later). A "skip from plan" link stays one tap further away so it's never an accidental click.
- **Collapsible phases** — only the current phase (the earliest with incomplete work) is open by default; others collapse to a one-line progress summary. The plan reads as one chunk, not a wall of tasks.
- **"Start next" button** — a single always-visible action that jumps straight to the next thing to do, removing the task-selection step entirely.
- **Progressive disclosure on entry** — the profile selectors collapse behind "Customize your plan (optional)," and deeper marketing content ("Why LearnX," FAQ) collapses behind "Learn more" — the first screen is just: samples, prompt, one button.
- **Calm Mode** — a persistent toggle (defaulting to the OS's `prefers-reduced-motion` setting) that turns off confetti and animation entirely; a CSS-level `prefers-reduced-motion` rule backs it up even without the toggle.
- **Silent desktop reminders** — opt-in, no sound, ever: a notification when a focus-timer session ends, and at most one gentle nudge a day if the streak hasn't been touched yet. Tab must be open (no backend/push yet — see v2).
- **Copy-as-checklist** — one click copies "this week" as a plain-text checklist for pasting into Todoist/Reminders/Notion, on top of the existing .ics export.

### 🚀 v1.3 — business mode, bigger index, voice coaching, B2B2C surface
- **Business-Readiness Mode** — a "🧑‍💼 Get a job / 🚀 Start a business" toggle. Same agent pipeline and JSON schema, reinterpreted: "company" → target market, "companyResearch" → market/industry research, "skillGaps" → business capabilities (bookkeeping, licensing, pricing, marketing…), "interviewPrep" → a launch checklist. Two business sample prompts (freelance bookkeeping, freelance web design) plus a keyless demo plan.
- **Resource index grown from ~40 to 83 entries** — added project management, UX/product design, HR/people ops, cybersecurity, DevOps/cloud, healthcare admin, education, legal, supply chain, and a dedicated entrepreneurship/small-business cluster (SBA, SCORE, Y Combinator Startup School, IRS small-business guidance) feeding Business Mode.
- **Voice interview coaching** — record a spoken (or typed) answer to any drill question and get brief, specific AI feedback comparing it to the "strong answer" guidance, without ever rewriting the answer for you. A lighter, fully self-contained take on a mock interview (no new infra).
- **B2B2C landing surface** — a "for career centers, bootcamps & workforce boards" section with a contact link; full cohort dashboards remain a v2 item (see below).

### 🔜 Next (v2) — needs real infrastructure decisions, not yet built
- **Accounts + Postgres persistence (Supabase)**: plans sync across devices. Deliberately not started — it needs a real Supabase project provisioned under the owner's account (none of the existing projects are for LearnX) and can't be verified end-to-end in a browser-less environment. Scoped as its own dedicated pass once a project is designated.
- **Background push notifications**: needs a service worker, VAPID keys, and subscription storage — same infra dependency as accounts, plus it's untestable without a real HTTPS browser session. Today's notifications (PRD v1.2) work great but only while the tab is open.
- Resource index at 300+ entries; auto-repair pipeline for broken entries.
- Full B2B2C dashboards (cohort view, seat management, admin roles) beyond the landing-page surface shipped in v1.3.
- Deployment: the repo still isn't connected to a live URL — see README for the one remaining manual step.

## 6. UX principles

1. **One screen to value.** No signup wall, no onboarding tour. Paste → plan in under a minute.
2. **Never fake certainty.** `Verify:` prefixes, cited sources, "(search link)" badges when a deep link was swapped.
3. **Momentum over completeness.** The user's next 7 days matter more than the full 3-month arc — "This week" leads.
4. **Everything reversible.** Add goals, switch plans, start over — nothing destroys progress silently.

## 7. Architecture snapshot

Next.js 15 App Router · React 19 · Tailwind v4. Client state in `localStorage` via a small plans-store (v1); Supabase in v2. AI via OpenRouter (Analyst uses `:online` web search). Full file map in `README.md`.

## 8. Monetization (v2+, per market analysis)

- Free: 1 active plan, weekly link verification, demo drills
- Pro (~$9–12/mo or ~$5 weekly pass for active hunters): unlimited plans + merges, deep company research, mock interviews, calendar sync
- B2B2C: career centers / workforce boards / bootcamps (per-seat)

## 9. Success metrics

- **Activation:** % of visitors who generate a plan (target 40%+ of engaged visitors)
- **Retention:** % of plan-owners returning within 7 days (the tracker/streak loop)
- **Depth:** items completed per plan; goals merged per user
- **Quality:** % of plan links that resolve (CI-measured, target 99%+); user-reported "link was wrong" rate ~0
- **Outcome (north star):** self-reported interviews landed / offers

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Chatbots commoditize one-shot plans | Invest in state: tracker, merge, streaks, index (chat can't hold these) |
| Link rot breaks trust | Index-first planning + CI checks + runtime verifier + "(search link)" fallback |
| LLM cost per generation | Index injection shrinks prompts; cache company research per (company, role) in v2 |
| Job boards block the URL fetcher | Graceful degradation to pasted JD text; never block plan generation |
| Hallucinated company claims | Web-cited Analyst + `Verify:` labeling + sources rendered in UI |
