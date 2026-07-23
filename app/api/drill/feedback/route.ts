import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable, callModel, extractJson } from "@/lib/ai";

export const maxDuration = 30;

const BodySchema = z.object({
  question: z.string().min(1).max(500),
  whyAsked: z.string().max(500),
  strongAnswer: z.string().max(1000),
  userAnswer: z.string().min(1, "Say or type an answer first").max(4000),
});

const FEEDBACK_SYSTEM = `You are a warm, direct interview coach. You receive an interview question, what a strong answer covers, and the candidate's actual spoken/typed answer.

Give brief, encouraging, specific feedback: 1) one sentence on what they did well, 2) one or two sentences on the single biggest thing to add or sharpen (comparing to the "strong answer" guidance), 3) never rewrite their answer for them — coach, don't script.

Return STRICT JSON only: {"feedback": string}`;

function demoFeedback(userAnswer: string): string {
  const words = userAnswer.trim().split(/\s+/).length;
  if (words < 15) {
    return "Good start — you've got the right instinct. Try adding one concrete example or number so an interviewer can picture exactly what you did, not just that you did it.";
  }
  return "Solid answer with real structure. To go one step further, tie the ending back to why this specific company/team would care about that outcome — that's the detail that separates a good answer from a great one.";
}

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
    }
    const { question, whyAsked, strongAnswer, userAnswer } = parsed.data;

    if (!aiAvailable()) {
      return NextResponse.json({ feedback: demoFeedback(userAnswer), demo: true });
    }

    const out = await callModel([
      { role: "system", content: FEEDBACK_SYSTEM },
      {
        role: "user",
        content: `QUESTION: ${question}\nWHY IT'S ASKED: ${whyAsked}\nWHAT A STRONG ANSWER COVERS: ${strongAnswer}\n\nCANDIDATE'S ANSWER: ${userAnswer}`,
      },
    ]);
    const { feedback } = extractJson<{ feedback: string }>(out);
    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({ error: "Could not generate feedback right now." }, { status: 500 });
  }
}
