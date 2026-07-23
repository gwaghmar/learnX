"use client";

import { useEffect, useState } from "react";

const EMOJI = ["🎉", "✨", "🎊", "⭐", "💪", "🔥"];

/**
 * Lightweight confetti burst — re-renders a fresh particle set whenever
 * `trigger` increments, no libraries. Skipped entirely in Calm Mode so
 * motion-sensitive or easily-distracted users aren't pulled off task.
 */
export default function Celebration({ trigger, disabled }: { trigger: number; disabled?: boolean }) {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; emoji: string }>>([]);

  useEffect(() => {
    if (!trigger || disabled) return;
    const batch = Array.from({ length: 18 }, (_, i) => ({
      id: trigger * 100 + i,
      left: 10 + Math.random() * 80,
      delay: Math.random() * 0.3,
      emoji: EMOJI[Math.floor(Math.random() * EMOJI.length)],
    }));
    setParticles(batch);
    const t = setTimeout(() => setParticles([]), 1600);
    return () => clearTimeout(t);
  }, [trigger, disabled]);

  if (!particles.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti absolute top-0 text-2xl"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
