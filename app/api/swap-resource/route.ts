import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiAvailable, callModel, extractJson } from "@/lib/ai";
import { RESOURCE_CATALOG } from "@/lib/resources";
import { selectResources } from "@/lib/resource-index";
import { verifyResource } from "@/lib/verify-links";
import type { Resource } from "@/lib/types";

export const maxDuration = 30;

const BodySchema = z.object({
  skill: z.string().min(1).max(200),
  excludeUrl: z.string().max(2000),
  role: z.string().max(200).optional(),
});

const SWAP_SYSTEM = `You are the Planner agent of LearnX finding ONE alternative free resource for a single skill, because the user wants a different option than the one already in their plan.

${RESOURCE_CATALOG}

Return STRICT JSON only: {"resource": {"title": string, "provider": string, "url": string, "kind": "course"|"video"|"article"|"practice"|"certification"|"docs", "certNote": string | null}}`;

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const { skill, excludeUrl, role } = parsed.data;

    // Prefer the verified index first — instant, free, already link-checked weekly.
    const candidates = selectResources([skill], 10).filter((r) => r.url !== excludeUrl);
    if (candidates.length) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const resource: Resource = {
        title: pick.title,
        provider: pick.provider,
        url: pick.url,
        kind: pick.kind as Resource["kind"],
        certNote: pick.certNote,
      };
      return NextResponse.json({ resource: await verifyResource(resource), source: "index" });
    }

    if (!aiAvailable()) {
      return NextResponse.json(
        { error: "No alternative found in the free index for this skill yet." },
        { status: 404 }
      );
    }

    const out = await callModel([
      { role: "system", content: SWAP_SYSTEM },
      {
        role: "user",
        content: `Skill: ${skill}\nRole context: ${role || "unknown"}\nCurrent resource to avoid repeating: ${excludeUrl}`,
      },
    ]);
    const { resource } = extractJson<{ resource: Resource }>(out);
    return NextResponse.json({ resource: await verifyResource(resource), source: "ai" });
  } catch {
    return NextResponse.json({ error: "Could not find an alternative right now." }, { status: 500 });
  }
}
