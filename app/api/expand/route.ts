import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable, callModel, extractJson } from "@/lib/ai";
import { EXPANDER_SYSTEM, selectionsBlock } from "@/lib/prompts";
import { verifyPlanLinks } from "@/lib/verify-links";
import type { LearningPlan } from "@/lib/types";

export const maxDuration = 120;

const BodySchema = z.object({
  plan: z.any(),
  newGoal: z.string().min(5).max(20_000),
  selections: z.object({
    education: z.string().max(200),
    experience: z.string().max(200),
    hoursPerWeek: z.string().max(200),
    timeline: z.string().max(200),
    background: z.string().max(2_000),
  }),
  completedItemIds: z.array(z.string()).max(500),
});

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { plan, newGoal, selections, completedItemIds } = parsed.data as {
      plan: LearningPlan;
      newGoal: string;
      selections: z.infer<typeof BodySchema>["selections"];
      completedItemIds: string[];
    };

    if (!aiAvailable()) {
      return NextResponse.json(
        { error: "Adding goals requires OPENROUTER_API_KEY (demo mode is read-only)." },
        { status: 503 }
      );
    }

    const out = await callModel([
      { role: "system", content: EXPANDER_SYSTEM },
      {
        role: "user",
        content: `${selectionsBlock(selections)}

CURRENT PLAN JSON:
${JSON.stringify(plan, null, 2)}

ITEM IDS THE USER HAS ALREADY COMPLETED (keep these items untouched):
${JSON.stringify(completedItemIds)}

NEW GOAL TO MERGE IN:
${newGoal}`,
      },
    ]);
    const raw = extractJson<Omit<LearningPlan, "id" | "createdAt" | "goals">>(out);

    const merged = await verifyPlanLinks({
      ...raw,
      id: plan.id,
      createdAt: plan.createdAt,
      goals: [...plan.goals, newGoal.slice(0, 200)],
    });

    console.log(JSON.stringify({ route: "expand", ms: Date.now() - started, status: 200 }));
    return NextResponse.json({ plan: merged });
  } catch (error) {
    console.log(
      JSON.stringify({ route: "expand", ms: Date.now() - started, status: 500, error: String(error).slice(0, 300) })
    );
    return NextResponse.json({ error: "Plan update failed. Please try again." }, { status: 500 });
  }
}
