const KEY = "learnx:reduce-motion";

/**
 * "Calm mode" — true if the user has asked for less motion, either via our
 * own toggle or their OS-level reduced-motion setting. Read once on mount
 * (client-only; localStorage/matchMedia don't exist during SSR).
 */
export function getReduceMotion(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    /* ignore */
  }
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function setReduceMotion(reduce: boolean): void {
  localStorage.setItem(KEY, reduce ? "1" : "0");
}
