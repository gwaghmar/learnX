import RAW_INDEX from "./resource-index.json";

/**
 * The verified resource index — the product's moat (see MARKET_ANALYSIS.md).
 * A curated set of free resources whose URLs are continuously link-checked
 * (scripts/check-links.mjs runs weekly in CI). The Planner agent is told to
 * prefer these URLs verbatim over anything it would generate itself, which
 * makes most plan links link-rot-proof by construction.
 */

export type IndexedResource = {
  id: string;
  title: string;
  provider: string;
  url: string;
  kind: string;
  skills: string[];
  certNote?: string;
};

export const RESOURCE_INDEX: IndexedResource[] = RAW_INDEX as IndexedResource[];

/**
 * Pick index entries relevant to a set of skill phrases. Matches loosely in
 * both directions ("SQL for finance data" matches the "sql" tag) and returns
 * at most `max` entries so the prompt stays small.
 */
export function selectResources(skillPhrases: string[], max = 20): IndexedResource[] {
  const phrases = skillPhrases.map((s) => s.toLowerCase()).filter(Boolean);
  if (!phrases.length) return [];
  const scored = RESOURCE_INDEX.map((entry) => {
    let score = 0;
    for (const tag of entry.skills) {
      for (const phrase of phrases) {
        if (phrase.includes(tag) || tag.includes(phrase)) score++;
      }
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map((s) => s.entry);
}

/** Render selected entries as a prompt block for the Planner agent. */
export function indexPromptBlock(entries: IndexedResource[]): string {
  if (!entries.length) return "";
  const lines = entries.map(
    (e) =>
      `- [${e.id}] "${e.title}" — ${e.provider} — ${e.url} — kind: ${e.kind}${e.certNote ? ` — ${e.certNote}` : ""}`
  );
  return `VERIFIED RESOURCE INDEX (these URLs are pre-verified and link-checked weekly — when one matches a skill you are planning for, use it VERBATIM (title, provider, url, certNote) instead of generating your own link):
${lines.join("\n")}`;
}
