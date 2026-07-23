# LearnX

**Paste the job. Get the plan. Land the role — without paying for a single course.**

> Full product spec, feature checklist, and roadmap: [`PRD.md`](./PRD.md). Market research behind the positioning: [`MARKET_ANALYSIS.md`](./MARKET_ANALYSIS.md).

LearnX is a single-screen AI app: a user pastes (or speaks) a job description or career goal — e.g. *"There's a Financial Systems Analyst opening at Acme, here's the JD, I have an interview"* — picks a few details about themselves (with a **"Help me figure out"** escape hatch on every question), and a multi-agent pipeline:

1. **Reads the real posting** — follows any link in the prompt and works from the fetched page, not assumptions.
2. **Researches the company and team live** — the Analyst agent searches the web (OpenRouter `:online`), cites its sources in the plan, and labels anything uncertain `Verify:` instead of stating it as fact.
3. **Maps the skill gap** — every JD skill scored `have / partial / missing` against the user's background.
4. **Builds a phased learning plan** — only free resources, preferring the **verified resource index** (`lib/resource-index.json`): 83 curated free courses/certs spanning tech, business, project management, design, HR, cybersecurity, healthcare, education, and entrepreneurship, whose links are re-checked weekly in CI.
5. **Verifies every link** — each resource URL is HEAD-checked server-side at generation time too; dead deep links are swapped for the provider's search page so a click always lands somewhere real.
6. **Tracks progress** — checkbox tracker with hours + percent complete, persisted locally, plus a **"This week"** section that slices the plan to the user's weekly hour budget.
7. **Merges new goals** — "also prep me for AWS Solutions Architect" re-runs the agents and rewrites the plan around *both* goals while keeping every completed item checked and untouched.

On top of the pipeline: a **plan library** (multiple concurrent plans, switch/resume/delete), a **daily learning streak**, one-click **Markdown export** and **.ics calendar export** of "this week," and an **interview drill mode** (with 🔊 read-aloud questions) that generates practice questions from the same company research and skill gaps as the plan.

Every part of the plan is actionable, not just readable: **swap** any resource for a different free one covering the same skill (instant via the verified index, or AI-generated on demand), **skip** an item you don't need without losing it, jot a **note** on any item, click a **skill-gap chip** to jump straight to where it's covered, and **share** a read-only link to your plan that others can preview and add to their own library in one click.

**Designed for attention, not against it:** a **Focus Mode** shows exactly one task at a time (with a built-in 5/15/25/45-minute timer and just two decisions — Done or Do this later), phases collapse to the one you're actually on, a "Start next" button removes the task-selection step, the profile form and marketing content hide behind optional disclosures so the first screen is short, a **Calm Mode** toggle kills confetti/animation (defaulting to your OS's reduced-motion setting), and opt-in **silent desktop reminders** (no sound, at most one nudge a day) help without nagging.

**Not just for job hunts:** a **🧑‍💼 Get a job / 🚀 Start a business** toggle switches the whole pipeline into **Business-Readiness Mode** — the same agents research the market instead of a company, map business capabilities instead of job skills, and end with a launch checklist instead of interview prep (e.g. "start a freelance bookkeeping practice"). And the **Interview Drill** now doubles as a lightweight mock interview: answer any question by voice or text and get brief, specific coach feedback.

**Certification rule:** only certifications any member of the public can take for free are recommended (freeCodeCamp, Google Skillshop, HubSpot Academy, CFI free courses, Kaggle, CS50). Certifications that require an employer to license the system (Workday Pro, NetSuite, customer-tied SAP certs) are explicitly excluded, with free public alternatives suggested instead.

## Quickstart

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY (optional — see demo mode)
npm run dev                  # http://localhost:3000
```

**Demo mode:** with no `OPENROUTER_API_KEY`, `/api/generate` returns a realistic sample plan (Financial Systems Analyst) so the entire UI — plan, tracker, links — works out of the box. Adding goals requires a key.

## Architecture

```
app/
  page.tsx                 # single-screen flow: plan library → sample-JD quick-start → prompt (+ tap-to-speak) → selectors → plan; landing sections (how-it-works, features, FAQ) below the fold; handles incoming shared-plan links
  api/generate/route.ts    # pipeline: URL fetcher → Analyst agent → Planner agent → link checker
  api/expand/route.ts      # goal merge: Expander agent, preserves completed item ids
  api/drill/route.ts       # interview drill questions generated from the plan's research + gaps
  api/drill/feedback/route.ts # brief AI coach feedback on a spoken/typed practice answer
  api/swap-resource/route.ts # one alternative resource for a skill: verified-index first, AI fallback, link-verified
components/
  PromptBox.tsx            # textarea + Web Speech API mic button
  SelectField.tsx          # selector that always offers "Help me figure out"
  PlanLibrary.tsx           # saved-plans list on the home screen (resume/delete)
  PlanView.tsx             # company/market research, clickable skill-gap chips, collapsible phases (skip/note/swap/copy per item), tracker, add-a-goal, exports, streak, share, Focus Mode entry, toast — labels adapt to Business-Readiness Mode
  FocusMode.tsx              # one task at a time: title/why/resources, timer, Done / Do this later
  FocusTimer.tsx             # 5/15/25/45-min countdown used by Focus Mode
  InterviewDrill.tsx        # flashcard-style practice questions with reveal, 🔊 read-aloud, and 🎙️ voice-answer coach feedback
  Celebration.tsx           # confetti burst on item completion (skipped in Calm Mode)
  SharedPlanPreview.tsx      # read-only view of an imported shared-plan link, with "add to my plans" CTA
lib/
  ai.ts                    # OpenRouter client (abort, web-search ':online', citations), URL fetcher
  prompts.ts               # Analyst / Planner / Expander system prompts + modeAddendum() for Business-Readiness Mode
  resources.ts             # free-provider catalog + hard rules (certs, deep links)
  resource-index.json      # THE MOAT: 83 curated free resources, link-checked weekly in CI
  resource-index.ts        # skill-matching + prompt injection for the index
  verify-links.ts          # HEAD-check every resource URL (also used for single-resource swaps), safe search-URL fallbacks
  plans-store.ts            # multi-plan localStorage store + per-item meta (skip/note) + streak tracking + v0 migration
  export.ts                 # plan → Markdown, "this week" → .ics calendar + plain-text checklist
  share.ts                  # plan ↔ shareable URL codec (unicode-safe base64, no backend)
  motion.ts                  # Calm Mode preference (defaults to OS prefers-reduced-motion)
  notifications.ts           # silent desktop reminders: opt-in, permission-gated, ≤1 streak nudge/day
  demo-plan.ts             # keyless demo plans (job mode + business mode)
  types.ts                 # LearningPlan (with mode: "job"|"business"), Phase, PlanItem, Resource, TrackerState, ItemMeta
scripts/
  check-links.mjs          # link checker for the index (npm run check-links)
.github/workflows/
  link-check.yml           # weekly cron + PR check on index changes
```

State is client-side (`localStorage`) in v1 — no accounts, no database yet. See `PRD.md` for the v2 persistence plan.

## Deployment

Not yet connected to a live URL. The fastest path: go to **vercel.com/new**, import `gwaghmar/learnX` from GitHub, and deploy (Next.js auto-detected, zero config needed). Add `OPENROUTER_API_KEY` in the project's environment variables afterward for real generation — it runs in demo mode without it. This has to be done from the Vercel account itself; the automation in this repo's history couldn't complete it due to a project-creation permission scoped to the connecting account.

## Roadmap

See [`PRD.md`](./PRD.md) for the full spec. Snapshot:

- [x] MVP: prompt → agents → free-resource plan → tracker → goal merge
- [x] Verified resource index + weekly CI link checker + live-cited company research + "this week" view
- [x] **v1:** plan library (multiple plans), interview drill mode, streaks + celebration, Markdown/.ics export, full landing page
- [x] **v1.1:** swap any resource, skip/note per item, shareable plan links, sample-JD quick-start, spoken interview questions
- [x] **v1.2:** Focus Mode + timer, collapsible phases, "Start next" button, progressive disclosure, Calm Mode, silent desktop reminders, copy-as-checklist
- [x] **v1.3:** Business-Readiness Mode, resource index → 83 entries, voice interview coaching, B2B2C landing surface
- [ ] Grow the resource index further (target 300+ entries)
- [ ] Accounts + Postgres persistence (cross-device sync) — needs a Supabase project provisioned first
- [ ] Background push notifications (works with the tab closed) — needs the same infra plus VAPID keys
- [ ] Full B2B2C dashboards (cohort view, seat management)
- [ ] Deploy to a live URL (see above)
