const PREF_KEY = "learnx:notifications";
const LAST_STREAK_NUDGE_KEY = "learnx:last-streak-nudge";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsEnabled(): boolean {
  return notificationsSupported() && Notification.permission === "granted" && localStorage.getItem(PREF_KEY) !== "0";
}

/** Requests OS permission and remembers the user's choice. Returns the resulting state. */
export async function enableNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  const enabled = perm === "granted";
  localStorage.setItem(PREF_KEY, enabled ? "1" : "0");
  return enabled;
}

export function disableNotifications(): void {
  localStorage.setItem(PREF_KEY, "0");
}

/** Always silent — a visual desktop cue, never a sound, so it never breaks focus. */
export function notify(title: string, body: string): void {
  if (!notificationsEnabled()) return;
  try {
    new Notification(title, { body, silent: true, tag: "learnx" });
  } catch {
    /* some browsers throw if the tab isn't visible/allowed — safe to ignore */
  }
}

/** At most once per calendar day, nudge the user if they haven't logged progress yet. */
export function maybeNudgeStreak(hasCompletedToday: boolean): void {
  if (hasCompletedToday) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(LAST_STREAK_NUDGE_KEY) === today) return;
  localStorage.setItem(LAST_STREAK_NUDGE_KEY, today);
  notify("Keep your streak going 🔥", "You haven't checked anything off today yet — even one small item keeps it alive.");
}
