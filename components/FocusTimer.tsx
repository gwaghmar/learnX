"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [5, 15, 25, 45];

/**
 * A small, single-purpose countdown timer for one work session. No sound
 * (unpredictable audio is its own distraction) — a visible pulse + callback
 * when time's up so the parent can show a calm, on-screen cue.
 */
export default function FocusTimer({ onComplete }: { onComplete?: () => void }) {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const pick = (m: number) => {
    setRunning(false);
    setMinutes(m);
    setRemaining(m * 60);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const done = remaining === 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">Focus timer</span>
        <div className="flex gap-1">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => pick(m)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${
                minutes === m ? "bg-sky-400/20 text-sky-200" : "text-white/40 hover:bg-white/10"
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>
      <div
        className={`text-center font-mono text-4xl tabular-nums ${done ? "text-emerald-300" : "text-white"}`}
        aria-live="polite"
      >
        {done ? "Time's up!" : `${mm}:${ss}`}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={done}
          className="rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-40"
        >
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button
          onClick={() => pick(minutes)}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition hover:bg-white/10"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
