# LearnX

**Paste a job description. Get job-ready with a plan built from 100% free resources.**

LearnX is a single-screen AI app: a user pastes (or speaks) a job description or career goal — e.g. *"There's a Financial Systems Analyst opening at Acme, here's the JD, I have an interview"* — picks a few details about themselves (with a **"Help me figure out"** escape hatch on every question), and a multi-agent pipeline:

1. **Reads the real posting** — follows any link in the prompt and works from the fetched page, not assumptions.
2. **Researches the company and team live** — the Analyst agent searches the web (OpenRouter `:online`), cites its sources in the plan, and labels anything uncertain `Verify:` instead of stating it as fact.
3. **Maps the skill gap** — every JD skill scored `have / partial / missing` against the user's background.
4. **Builds a phased learning plan** — only free resources, preferring the **verified resource index** (`lib/resource-index.json`): ~40 curated free courses/certs (freeCodeCamp, Kaggle Learn, MIT OCW, Microsoft Learn, CFI free tier, …) whose links are re-checked weekly in CI.
5. **Verifies every link** — each resource URL is HEAD-checked server-side at generation time too; dead deep links are swapped for the provider's search page so a click always lands somewhere real.
6. **Tracks progress** — checkbox tracker with hours + percent complete, persisted locally, plus a **"This week"** section that slices the plan to the user's weekly hour budget.
7. **Merges new goals** — "also prep me for AWS Solutions Architect" re-runs the agents and rewrites the plan around *both* goals while keeping every completed item checked and untouched.

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
  page.tsx                 # single-screen flow: prompt (+ tap-to-speak) → selectors → plan
  api/generate/route.ts    # pipeline: URL fetcher → Analyst agent → Planner agent → link checker
  api/expand/route.ts      # goal merge: Expander agent, preserves completed item ids
components/
  PromptBox.tsx            # textarea + Web Speech API mic button
  SelectField.tsx          # selector that always offers "Help me figure out"
  PlanView.tsx             # company research, skill-gap chips, phases, tracker, add-a-goal
lib/
  ai.ts                    # OpenRouter client (abort, web-search ':online', citations), URL fetcher
  prompts.ts               # Analyst / Planner / Expander system prompts
  resources.ts             # free-provider catalog + hard rules (certs, deep links)
  resource-index.json      # THE MOAT: curated free resources, link-checked weekly in CI
  resource-index.ts        # skill-matching + prompt injection for the index
  verify-links.ts          # HEAD-check every resource URL, safe search-URL fallbacks
  demo-plan.ts             # keyless demo plan
  types.ts                 # LearningPlan, Phase, PlanItem, Resource, TrackerState
scripts/
  check-links.mjs          # link checker for the index (npm run check-links)
.github/workflows/
  link-check.yml           # weekly cron + PR check on index changes
```

State is client-side (`localStorage`) in the MVP — no accounts, no database. See the roadmap.

## Roadmap

Informed by the market analysis in [`MARKET_ANALYSIS.md`](./MARKET_ANALYSIS.md) — the moats are the **verified free-resource index**, the **persistent tracker**, and **progress-preserving goal merge**; the JD parse and gap report are table stakes.

- [x] MVP: prompt → agents → free-resource plan → tracker → goal merge (this repo)
- [x] Curated, continuously re-verified resource index (weekly CI link checker) preferred over per-request link generation — kills link rot, cuts LLM cost
- [x] Live web search in the Analyst agent (company research with cited sources)
- [x] Weekly schedule view ("your 8 hours this week")
- [ ] Grow the resource index (target 300+ entries across non-tech roles) + auto-repair broken entries
- [ ] Accounts + Postgres persistence (plans, tracker, multiple concurrent plans)
- [ ] Calendar export for the weekly schedule
- [ ] Business-readiness mode ("I want to start X business — make me ready to run it")
- [ ] Interview drill mode generated from the same company research
- [ ] B2B2C: career centers, workforce boards, bootcamps
