"use client";

import { useState } from "react";
import type { LearningPlan } from "@/lib/types";

type DrillQuestion = { question: string; whyAsked: string; strongAnswer: string };

/**
 * Interview Drill — flashcard practice generated from the plan's company
 * research and skill gaps. Think first, then reveal what a strong answer covers.
 */
export default function InterviewDrill({ plan }: { plan: LearningPlan }) {
  const [questions, setQuestions] = useState<DrillQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");
      setQuestions(data.questions);
      setIdx(0);
      setRevealed(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (!questions) return;
    setIdx((i) => (i + 1) % questions.length);
    setRevealed(false);
  };

  const q = questions?.[idx];

  return (
    <section className="rounded-2xl border border-violet-400/25 bg-violet-400/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-300">🎤 Interview drill</h2>
        {questions && (
          <span className="text-xs text-white/40">
            {idx + 1} / {questions.length}
          </span>
        )}
      </div>

      {!questions && (
        <div>
          <p className="mb-3 text-sm text-white/60">
            Practice the questions this role at this company is actually likely to ask — generated from your plan&rsquo;s
            company research and your skill gaps.
          </p>
          <button
            onClick={start}
            disabled={loading}
            className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-40"
          >
            {loading ? "Preparing questions…" : "Start practicing"}
          </button>
          {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        </div>
      )}

      {q && (
        <div>
          <p className="text-base font-medium leading-relaxed">{q.question}</p>
          <p className="mt-2 text-xs text-white/45">Why they ask: {q.whyAsked}</p>

          {revealed ? (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-relaxed text-white/80">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                A strong answer covers
              </span>
              {q.strongAnswer}
            </div>
          ) : (
            <p className="mt-4 text-sm italic text-white/40">
              Say your answer out loud (or jot it down) before revealing.
            </p>
          )}

          <div className="mt-4 flex gap-3">
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20"
              >
                Reveal strong answer
              </button>
            )}
            <button
              onClick={next}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Next question →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
