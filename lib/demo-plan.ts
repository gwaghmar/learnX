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
