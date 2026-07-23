import type { LearningPlan } from "./types";

/**
 * Shareable read-only plan links: the plan JSON is base64-encoded straight
 * into a URL query param — no backend, no database, works on static hosting.
 * "Add to my plans" (see SharedPlanPreview) is the growth loop: importing a
 * shared plan turns a viewer into a user with their own tracker.
 */

const MAX_SHARE_LENGTH = 6000; // stays comfortably under URL length limits everywhere

function unicodeSafeBtoa(json: string): string {
  const bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return btoa(bytes);
}

function unicodeSafeAtob(encoded: string): string {
  const bytes = atob(encoded);
  return decodeURIComponent(
    bytes
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Returns null if the plan is too large to fit safely in a URL. */
export function encodePlanForShare(plan: LearningPlan): string | null {
  try {
    const encoded = unicodeSafeBtoa(JSON.stringify(plan));
    return encoded.length > MAX_SHARE_LENGTH ? null : encoded;
  } catch {
    return null;
  }
}

export function decodePlanFromShare(encoded: string): LearningPlan | null {
  try {
    const plan = JSON.parse(unicodeSafeAtob(encoded));
    if (plan && typeof plan === "object" && Array.isArray(plan.phases)) return plan as LearningPlan;
    return null;
  } catch {
    return null;
  }
}

/** Builds a full shareable URL for the current page, or null if too large. */
export function buildShareUrl(plan: LearningPlan): string | null {
  if (typeof window === "undefined") return null;
  const encoded = encodePlanForShare(plan);
  if (!encoded) return null;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("shared", encoded);
  return url.toString();
}
