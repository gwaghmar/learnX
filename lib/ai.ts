/**
 * Thin OpenRouter client with a 60s abort, JSON extraction, and a demo-mode
 * fallback so the app is fully explorable without an API key.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function aiAvailable(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function callModel(messages: ChatMessage[], maxTokens = 8000): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "LearnX",
      },
      body: JSON.stringify({
        model: process.env.LEARNX_MODEL || "anthropic/claude-sonnet-4.5",
        max_tokens: maxTokens,
        messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Empty model response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/** Pull the first top-level JSON object out of a model response. */
export function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/**
 * Fetch a job-posting URL server-side and reduce it to readable text so the
 * Analyst agent works from the REAL posting, not assumptions.
 */
export async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LearnXBot/0.1)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(nbsp|amp|quot|#39|lt|gt);/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000);
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

export function extractUrls(text: string): string[] {
  return (text.match(/https?:\/\/[^\s)"'<>]+/g) || []).slice(0, 3);
}
