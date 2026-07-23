import type { LearningPlan, Resource } from "./types";

/**
 * "When the user clicks a link, it has to take them to the perfect place."
 * Every resource URL is HEAD-checked before the plan is returned. Dead or
 * unreachable deep links are swapped for the provider's search URL so the
 * user always lands somewhere real.
 */

const SEARCH_FALLBACKS: Array<{ match: RegExp; search: (q: string) => string }> = [
  { match: /freecodecamp\.org/, search: (q) => `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(q)}` },
  { match: /kaggle\.com/, search: () => `https://www.kaggle.com/learn` },
  { match: /coursera\.org/, search: (q) => `https://www.coursera.org/search?query=${encodeURIComponent(q)}` },
  { match: /edx\.org/, search: (q) => `https://www.edx.org/search?q=${encodeURIComponent(q)}` },
  { match: /learn\.microsoft\.com/, search: (q) => `https://learn.microsoft.com/en-us/training/browse/?terms=${encodeURIComponent(q)}` },
  { match: /khanacademy\.org/, search: (q) => `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(q)}` },
  { match: /youtube\.com/, search: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { match: /ocw\.mit\.edu/, search: (q) => `https://ocw.mit.edu/search/?q=${encodeURIComponent(q)}` },
  { match: /alison\.com/, search: (q) => `https://alison.com/courses?query=${encodeURIComponent(q)}` },
  { match: /trailhead\.salesforce\.com/, search: (q) => `https://trailhead.salesforce.com/search?keywords=${encodeURIComponent(q)}` },
];

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    // Some course platforms reject HEAD; retry once with GET.
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Exported so /api/swap-resource can verify a single replacement link. */
export async function verifyResource(r: Resource): Promise<Resource> {
  const ok = await checkUrl(r.url);
  if (ok) return { ...r, verified: true };
  const fallback = SEARCH_FALLBACKS.find((f) => f.match.test(r.url));
  const query = `${r.title} ${r.provider}`;
  return {
    ...r,
    url: fallback
      ? fallback.search(r.title)
      : `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    verified: false,
  };
}

export async function verifyPlanLinks(plan: LearningPlan): Promise<LearningPlan> {
  const phases = await Promise.all(
    plan.phases.map(async (phase) => ({
      ...phase,
      items: await Promise.all(
        phase.items.map(async (item) => ({
          ...item,
          resources: await Promise.all(item.resources.map(verifyResource)),
        }))
      ),
    }))
  );
  return { ...plan, phases };
}
