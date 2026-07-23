import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable, callModel, extractJson } from "@/lib/ai";
import type { LearningPlan } from "@/lib/types";

export const maxDuration = 60;

const BodySchema = z.object({ plan: z.any() });

export type DrillQuestion = {
  question: string;
  whyAsked: string;
  strongAnswer: string;
};

const DRILL_SYSTEM = `You are the Interview Coach agent of LearnX. You receive a user's learning plan JSON (target role, company research, skill gaps, phases).

Generate 8 interview questions THIS candidate is likely to face for THIS role at THIS company. Mix: 2 company/motivation, 3 technical/skills (target their gap areas — that's where they'll be probed), 2 behavioral (STAR), 1 curveball.

For each question give:
- "question": the question as an interviewer would ask it
- "whyAsked": one sentence on what the interviewer is really testing
- "strongAnswer": 2-4 sentences describing what a strong answer covers (structure + specifics to mention), NOT a script to memorize

Return STRICT JSON only: {"questions": [{"question": string, "whyAsked": string, "strongAnswer": string}]}`;

const DEMO_QUESTIONS: DrillQuestion[] = [
  {
    question: "Walk me through how you'd investigate a report that doesn't tie out to the general ledger.",
    whyAsked: "Tests systematic debugging across finance data — the core daily work of a systems analyst.",
    strongAnswer:
      "A strong answer traces the data path: source system → extract/transform → report layer, checking row counts and totals at each hop. Mention isolating the period, comparing to a known-good close, and documenting the root cause so it can't recur.",
  },
  {
    question: "Why do you want to work on financial systems rather than pure accounting or pure IT?",
    whyAsked: "Checks that you understand — and want — the translator role between Finance and Engineering.",
    strongAnswer:
      "Strong answers give a concrete story of bridging both worlds: e.g. automating a close task, explaining a system constraint to accountants, or turning a finance need into a requirement. End with why this company's stack interests you.",
  },
  {
    question: "A month-end close deadline is tonight and your ERP job fails. What do you do in the first 30 minutes?",
    whyAsked: "Pressure-tests prioritization, communication, and knowing when to escalate.",
    strongAnswer:
      "Cover: check the error and last successful run, assess blast radius, notify close stakeholders early with an ETA, attempt the documented rerun/rollback, and escalate to the vendor/IT with specifics if it's beyond you. Communication beats heroics.",
  },
  {
    question: "How comfortable are you with SQL? Describe the hardest query you've written.",
    whyAsked: "Every FSA posting screens for SQL; they want honesty plus evidence of growth.",
    strongAnswer:
      "Be honest about level, then show trajectory: describe a real query (joins, aggregation, window function if applicable), why it was needed, and what you'd do differently. If you're learning, name what you've completed and what you can do today.",
  },
  {
    question: "Tell me about a time you automated something manual. What was the impact?",
    whyAsked: "Behavioral check for the improvement mindset the role exists to provide.",
    strongAnswer:
      "Use STAR and quantify: hours saved per month, error rate before/after, who benefited. Bonus points for mentioning documentation and handover so the automation survived you.",
  },
  {
    question: "What do you know about our company and what do you think this team owns?",
    whyAsked: "Filters candidates who did real research from those who skimmed the JD.",
    strongAnswer:
      "Name what the company does, its scale, and the systems mentioned in the posting; state your hypothesis of the team's charter (e.g. ERP ownership, close support, reporting) and ask a sharp clarifying question back.",
  },
  {
    question: "How would you explain a complex reconciliation issue to a non-technical stakeholder?",
    whyAsked: "Communication is half this job; jargon under pressure is a red flag.",
    strongAnswer:
      "Describe leading with the business impact, using an analogy, and offering a clear next step with a date. Give a real example if you have one.",
  },
  {
    question: "Where do you want this role to take you in three years?",
    whyAsked: "Gauges retention risk and whether your ambitions fit the team's growth path.",
    strongAnswer:
      "Tie ambition to the role's natural ladder (senior analyst, systems lead, product owner of the finance stack). Ambition + patience reads far better than either alone.",
  },
];

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const plan = parsed.data.plan as LearningPlan;

    if (!aiAvailable()) {
      return NextResponse.json({ questions: DEMO_QUESTIONS, demo: true });
    }

    const out = await callModel([
      { role: "system", content: DRILL_SYSTEM },
      {
        role: "user",
        content: `LEARNING PLAN JSON:\n${JSON.stringify(
          {
            role: plan.role,
            company: plan.company,
            companyResearch: plan.companyResearch,
            skillGaps: plan.skillGaps,
            phases: plan.phases.map((p) => ({ title: p.title, items: p.items.map((i) => i.title) })),
          },
          null,
          2
        )}`,
      },
    ]);
    const { questions } = extractJson<{ questions: DrillQuestion[] }>(out);

    console.log(JSON.stringify({ route: "drill", ms: Date.now() - started, status: 200 }));
    return NextResponse.json({ questions });
  } catch (error) {
    console.log(
      JSON.stringify({ route: "drill", ms: Date.now() - started, status: 500, error: String(error).slice(0, 300) })
    );
    return NextResponse.json({ error: "Could not generate questions. Please try again." }, { status: 500 });
  }
}
