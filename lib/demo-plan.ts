import type { LearningPlan } from "./types";

/**
 * Demo-mode plan (no OPENROUTER_API_KEY set) so the full UI — plan, tracker,
 * add-a-goal — is explorable out of the box. Links are real.
 */
export function demoPlan(goal: string): LearningPlan {
  return {
    id: `plan-demo`,
    createdAt: new Date().toISOString(),
    goals: [goal || "Financial Systems Analyst (sample)"],
    mode: "job",
    role: "Financial Systems Analyst",
    company: "Sample Corp",
    companyResearch: [
      "Demo mode: set OPENROUTER_API_KEY to get real JD parsing and company research.",
      "The role sits between Finance and IT: owning the ERP/EPM stack, month-end close support, and reporting automation.",
      "JD names: Excel (advanced), SQL, a major ERP (e.g. Oracle/SAP/NetSuite), Power BI or Tableau, and process documentation.",
      "Verify: team size and which ERP modules this team owns — ask the recruiter.",
    ],
    skillGaps: [
      { skill: "Advanced Excel (modeling, Power Query)", status: "partial", note: "Most analysts know Excel; the gap is usually Power Query + structured modeling." },
      { skill: "SQL for finance data", status: "missing", note: "Core requirement in nearly every FSA posting." },
      { skill: "ERP concepts (GL, close process)", status: "missing", note: "You need vocabulary + process understanding, not employer-licensed certs." },
      { skill: "Dashboarding (Power BI)", status: "partial", note: "One solid portfolio dashboard is enough to talk about in interviews." },
    ],
    phases: [
      {
        id: "phase-foundations",
        title: "Phase 1 — Data foundations",
        summary: "Close the two core gaps every FSA posting screens for: SQL and serious Excel.",
        items: [
          {
            id: "sql-fundamentals",
            title: "SQL fundamentals for analysts",
            why: "Every FSA JD lists SQL; finance teams live in reporting databases.",
            skills: ["SQL"],
            estimatedHours: 15,
            resources: [
              { title: "SQLBolt — Interactive SQL lessons", provider: "SQLBolt", url: "https://sqlbolt.com", kind: "practice" },
              { title: "Mode SQL Tutorial (analyst track)", provider: "Mode", url: "https://mode.com/sql-tutorial/", kind: "course" },
            ],
          },
          {
            id: "excel-power-query",
            title: "Advanced Excel + Power Query",
            why: "FSAs automate recurring reporting; Power Query is the highest-leverage Excel skill.",
            skills: ["Excel", "Power Query"],
            estimatedHours: 12,
            resources: [
              { title: "Get started with Power Query", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/power-query/power-query-what-is-power-query", kind: "docs" },
              { title: "Leila Gharani — Power Query playlist", provider: "YouTube", url: "https://www.youtube.com/results?search_query=leila+gharani+power+query", kind: "video" },
            ],
          },
        ],
      },
      {
        id: "phase-systems",
        title: "Phase 2 — Finance systems fluency",
        summary: "Speak ERP: general ledger, month-end close, and how finance systems fit together.",
        items: [
          {
            id: "accounting-fundamentals",
            title: "Accounting fundamentals (free certificate)",
            why: "You'll support close and reconciliations — the vocabulary is non-negotiable.",
            skills: ["Accounting", "Month-end close"],
            estimatedHours: 10,
            resources: [
              {
                title: "CFI — Accounting Fundamentals (free)",
                provider: "Corporate Finance Institute",
                url: "https://corporatefinanceinstitute.com/course/learn-accounting-fundamentals-corporate-finance/",
                kind: "certification",
                certNote: "Free course, open to anyone — no employer license required.",
              },
            ],
          },
          {
            id: "erp-concepts",
            title: "ERP concepts without an employer license",
            why: "Vendor certs like NetSuite/Workday require company access — learn the concepts free instead and say so in interviews.",
            skills: ["ERP", "Business processes"],
            estimatedHours: 8,
            resources: [
              { title: "ERP systems explained — search results", provider: "YouTube", url: "https://www.youtube.com/results?search_query=ERP+general+ledger+month+end+close+explained", kind: "video" },
              { title: "Oracle MyLearn free paths", provider: "Oracle", url: "https://mylearn.oracle.com/ou/home", kind: "course" },
            ],
          },
        ],
      },
      {
        id: "phase-portfolio",
        title: "Phase 3 — Proof + interview prep",
        summary: "One dashboard project you can demo, plus targeted interview practice.",
        items: [
          {
            id: "power-bi-dashboard",
            title: "Build a finance dashboard in Power BI",
            why: "A concrete artifact turns 'I'm learning' into 'here's what I built'.",
            skills: ["Power BI", "Data visualization"],
            estimatedHours: 12,
            resources: [
              { title: "Power BI learning path", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", kind: "course" },
            ],
          },
        ],
      },
    ],
    interviewPrep: [
      "Research which ERP the company runs (LinkedIn job posts + engineering blog) and learn its module names.",
      "Prepare a STAR story about automating a manual reporting process.",
      "Practice explaining a reconciliation you'd debug: data source → transformation → report.",
      "Ask the interviewer: what does the close calendar look like, and where does this role own it?",
    ],
  };
}

/**
 * Demo-mode plan for Business-Readiness Mode (no OPENROUTER_API_KEY set).
 * Same schema as demoPlan(), reinterpreted per lib/prompts.ts's modeAddendum:
 * "interviewPrep" becomes a launch checklist, "companyResearch" becomes
 * market research, "skillGaps" become business capabilities.
 */
export function demoBusinessPlan(goal: string): LearningPlan {
  return {
    id: `plan-demo-business`,
    createdAt: new Date().toISOString(),
    goals: [goal || "Freelance bookkeeping practice (sample)"],
    mode: "business",
    role: "Freelance Bookkeeping Practice",
    company: "Local small businesses",
    companyResearch: [
      "Demo mode: set OPENROUTER_API_KEY to get real market research for your specific idea.",
      "Bookkeeping for small businesses is typically billed monthly ($200–$800/client depending on transaction volume) or hourly.",
      "Most clients need: monthly reconciliation, categorization, basic financial statements, and tax-season handoff to a CPA.",
      "Verify: local licensing requirements — most U.S. states don't require a special license for bookkeeping (unlike accounting/CPA work), but check yours.",
    ],
    skillGaps: [
      { skill: "Bookkeeping fundamentals (double-entry, reconciliation)", status: "partial", note: "Core service you're selling — needs to be rock solid before your first client." },
      { skill: "QuickBooks / accounting software", status: "missing", note: "Most small-business clients already use QuickBooks or Wave; you need to be fluent in at least one." },
      { skill: "Business registration & basic legal setup", status: "missing", note: "LLC/sole prop, EIN, business bank account — do this before you take payment." },
      { skill: "Pricing & client acquisition", status: "missing", note: "The single biggest reason freelance bookkeeping practices stall is no repeatable way to find clients." },
    ],
    phases: [
      {
        id: "phase-foundations",
        title: "Phase 1 — Bookkeeping foundations",
        summary: "Get genuinely good at the service before you sell it.",
        items: [
          {
            id: "bookkeeping-basics",
            title: "Learn double-entry bookkeeping",
            why: "This is the actual service — clients are paying for accuracy and reliability here.",
            skills: ["Bookkeeping", "Accounting"],
            estimatedHours: 15,
            resources: [
              { title: "Intuit Bookkeeping (audit)", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/intuit-bookkeeping", kind: "course", certNote: "Free to audit; certificate costs money" },
              { title: "Accounting Fundamentals (free)", provider: "Corporate Finance Institute", url: "https://corporatefinanceinstitute.com/course/learn-accounting-fundamentals-corporate-finance/", kind: "certification", certNote: "Free course, open to anyone" },
            ],
          },
          {
            id: "quickbooks-fluency",
            title: "Get fluent in QuickBooks Online",
            why: "The tool your clients already use — you need to move fast in it from day one.",
            skills: ["QuickBooks", "Accounting software"],
            estimatedHours: 10,
            resources: [
              { title: "QuickBooks tutorials — search results", provider: "YouTube", url: "https://www.youtube.com/results?search_query=quickbooks+online+tutorial+for+bookkeepers", kind: "video" },
            ],
          },
        ],
      },
      {
        id: "phase-setup",
        title: "Phase 2 — Legal & business setup",
        summary: "The unglamorous but non-negotiable steps before you take your first dollar.",
        items: [
          {
            id: "business-registration",
            title: "Register your business and open a business bank account",
            why: "Commingling personal and business money is the #1 mistake new freelancers make.",
            skills: ["Business registration", "Legal setup"],
            estimatedHours: 6,
            resources: [
              { title: "SBA free business guide", provider: "U.S. Small Business Administration", url: "https://www.sba.gov/business-guide", kind: "docs" },
              { title: "IRS Small Business & Self-Employed Tax Center", provider: "IRS", url: "https://www.irs.gov/businesses/small-businesses-self-employed", kind: "docs" },
            ],
          },
        ],
      },
      {
        id: "phase-clients",
        title: "Phase 3 — Pricing & your first clients",
        summary: "Turn the skill into an actual, paying practice.",
        items: [
          {
            id: "pricing-model",
            title: "Set your pricing and service packages",
            why: "Undercharging is the second-biggest reason bookkeeping practices stall out.",
            skills: ["Pricing", "Business planning"],
            estimatedHours: 5,
            resources: [
              { title: "SCORE free mentorship & templates", provider: "SCORE", url: "https://www.score.org/", kind: "article" },
            ],
          },
          {
            id: "first-clients",
            title: "Land your first 3 clients",
            why: "Proof of concept — everything after this gets easier with real references.",
            skills: ["Sales", "Marketing", "Networking"],
            estimatedHours: 10,
            resources: [
              { title: "Y Combinator Startup School", provider: "Y Combinator", url: "https://www.startupschool.org/", kind: "course", certNote: "Free, open to anyone" },
            ],
          },
        ],
      },
    ],
    interviewPrep: [
      "Register your business name and get an EIN from the IRS (free, takes 10 minutes online).",
      "Open a dedicated business bank account before accepting any payment.",
      "Set your pricing before you talk to a single prospect — decide monthly retainer vs. hourly now.",
      "Write a one-page service description you can send to a prospective client today.",
      "Ask 5 people in your network if they know a small business owner who does their own books.",
      "Set up QuickBooks Online for yourself first — practice on your own numbers before a client's.",
    ],
  };
}
