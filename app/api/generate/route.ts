import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable, callModel, callModelWithMeta, extractJson, extractUrls, fetchUrlText } from "@/lib/ai";
import { ANALYST_SYSTEM, PLANNER_SYSTEM, modeAddendum, selectionsBlock } from "@/lib/prompts";
import { demoPlan, demoBusinessPlan } from "@/lib/demo-plan";
import { indexPromptBlock, selectResources } from "@/lib/resource-index";
import { verifyPlanLinks } from "@/lib/verify-links";
import type { LearningPlan, SkillGap } from "@/lib/types";

export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(10, "Tell us a bit more about the job or goal").max(20_000),
  selections: z.object({
    education: z.string().max(200),
    experience: z.string().max(200),
    hoursPerWeek: z.string().max(200),
    timeline: z.string().max(200),
    background: z.string().max(2_000),
  }),
  mode: z.enum(["job", "business"]).optional().default("job"),
});

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }
    const { prompt, selections, mode } = parsed.data;

    if (!aiAvailable()) {
      const plan = mode === "business" ? demoBusinessPlan(prompt.slice(0, 120)) : demoPlan(prompt.slice(0, 120));
      return NextResponse.json({ plan, demo: true });
    }

    // Stage 0 — follow any job-posting links in the prompt (no assumptions:
    // read the real posting).
    const urls = extractUrls(prompt);
    const fetched = (
      await Promise.all(
        urls.map(async (url) => {
          const text = await fetchUrlText(url);
          return text ? `--- Content fetched from ${url} ---\n${text}` : "";
        })
      )
    ).filter(Boolean);

    // Stage 1 — Analyst: parse JD, research company/team LIVE on the web
    // (OpenRouter :online), map skill gap.
    const analystRes = await callModelWithMeta(
      [
        { role: "system", content: ANALYST_SYSTEM },
        {
          role: "user",
          content: `${selectionsBlock(selections)}\n\nUSER GOAL / JOB DESCRIPTION:\n${prompt}\n\n${fetched.join("\n\n")}${modeAddendum(mode)}`,
        },
      ],
      { web: true }
    );
    const analysis = extractJson<{
      requiredSkills?: Array<{ skill?: string }>;
      skillGaps?: SkillGap[];
    }>(analystRes.content);

    // Stage 2 — Planner: free-resource, deep-linked, phased plan. The
    // verified resource index for the relevant skills is injected so most
    // links come from the pre-checked catalog.
    const skillPhrases = [
      ...(analysis.requiredSkills || []).map((s) => s.skill || ""),
      ...(analysis.skillGaps || []).map((g) => g.skill),
    ];
    const indexBlock = indexPromptBlock(selectResources(skillPhrases));
    const plannerOut = await callModel([
      { role: "system", content: PLANNER_SYSTEM },
      {
        role: "user",
        content: `${selectionsBlock(selections)}\n\nANALYST OUTPUT:\n${JSON.stringify(analysis, null, 2)}\n\n${indexBlock}${modeAddendum(mode)}`,
      },
    ]);
    const raw = extractJson<Omit<LearningPlan, "id" | "createdAt" | "goals">>(plannerOut);

    // Surface the Analyst's live-research citations in the plan.
    const sources = analystRes.sourceUrls.slice(0, 5).map((u) => `Source: ${u}`);

    // Stage 3 — link checker: every URL verified or swapped for a safe search link.
    const plan = await verifyPlanLinks({
      ...raw,
      companyResearch: [...(raw.companyResearch || []), ...sources],
      id: `plan-${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      goals: [prompt.slice(0, 200)],
      mode,
    });

    console.log(JSON.stringify({ route: "generate", ms: Date.now() - started, status: 200 }));
    return NextResponse.json({ plan });
  } catch (error) {
    console.log(
      JSON.stringify({ route: "generate", ms: Date.now() - started, status: 500, error: String(error).slice(0, 300) })
    );
    return NextResponse.json({ error: "Plan generation failed. Please try again." }, { status: 500 });
  }
}
