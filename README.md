# LearnX

**Paste a job description. Get job-ready with a plan built from 100% free resources.**

LearnX is a single-screen AI app: a user pastes (or speaks) a job description or career goal — e.g. *"There's a Financial Systems Analyst opening at Acme, here's the JD, I have an interview"* — picks a few details about themselves (with a **"Help me figure out"** escape hatch on every question), and a multi-agent pipeline:

1. **Reads the real posting** — follows any link in the prompt and works from the fetched page, not assumptions.
2. **Researches the company and team** — what they actually do; anything uncertain is explicitly labeled `Verify:` instead of stated as fact.
3. **Maps the skill gap** — every JD skill scored `have / partial / missing` against the user's background.
4. **Builds a phased learning plan** — only free resources (freeCodeCamp, Kaggle Learn, MIT OCW, Microsoft Learn, CFI free tier, …), sized to the user's hours-per-week and timeline.
5. **Verifies every link** — each resource URL is HEAD-checked server-side; dead deep links are swapped for the provider's search page so a click always lands somewhere real.
6. **Tracks progress** — checkbox tracker with hours + percent complete, persisted locally.
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
  ai.ts                    # OpenRouter client (60s abort), JSON extraction, URL fetcher
  prompts.ts               # Analyst / Planner / Expander system prompts
  resources.ts             # curated free-provider catalog + hard rules (certs, deep links)
  verify-links.ts          # HEAD-check every resource URL, safe search-URL fallbacks
  demo-plan.ts             # keyless demo plan
  types.ts                 # LearningPlan, Phase, PlanItem, Resource, TrackerState
```

State is client-side (`localStorage`) in the MVP — no accounts, no database. See the roadmap.

## Roadmap

Informed by the market analysis in [`MARKET_ANALYSIS.md`](./MARKET_ANALYSIS.md) — the moats are the **verified free-resource index**, the **persistent tracker**, and **progress-preserving goal merge**; the JD parse and gap report are table stakes.

- [x] MVP: prompt → agents → free-resource plan → tracker → goal merge (this repo)
- [ ] Curated, continuously re-verified resource index (cron link checker) instead of per-request generation — kills link rot, cuts LLM cost
- [ ] Live web search in the Analyst agent (company research with citations + confidence labels)
- [ ] Accounts + Postgres persistence (plans, tracker, multiple concurrent plans)
- [ ] Weekly schedule view ("your 8 hours this week") + calendar export
- [ ] Business-readiness mode ("I want to start X business — make me ready to run it")
- [ ] Interview drill mode generated from the same company research
- [ ] B2B2C: career centers, workforce boards, bootcamps
