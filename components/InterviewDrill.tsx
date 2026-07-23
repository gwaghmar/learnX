"use client";

import { useEffect, useRef, useState } from "react";
import type { LearningPlan } from "@/lib/types";

type DrillQuestion = { question: string; whyAsked: string; strongAnswer: string };

/**
 * Interview Drill — flashcard practice generated from the plan's company
 * research and skill gaps. Think first, then reveal what a strong answer
 * covers. Optionally answer by voice and get quick AI feedback — a lighter,
 * self-contained take on a "mock interview."
 */
export default function InterviewDrill({ plan }: { plan: LearningPlan }) {
  const [questions, setQuestions] = useState<DrillQuestion[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const [answer, setAnswer] = useState("");
  const [recording, setRecording] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const recognitionRef = useRef<any>(null);
  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (SR) {
      setMicSupported(true);
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
        }
        if (transcript) setAnswer((a) => (a ? a + " " : "") + transcript.trim());
      };
      rec.onend = () => setRecording(false);
      rec.onerror = () => setRecording(false);
      recognitionRef.current = rec;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  const speak = (text: string) => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (recording) {
      rec.stop();
      setRecording(false);
    } else {
      rec.start();
      setRecording(true);
    }
  };

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
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    setRecording(false);
    setIdx((i) => (i + 1) % questions.length);
    setRevealed(false);
    setAnswer("");
    setFeedback("");
    setFeedbackError("");
  };

  const getFeedback = async () => {
    if (!q || !answer.trim()) return;
    setFeedbackLoading(true);
    setFeedbackError("");
    setFeedback("");
    try {
      const res = await fetch("/api/drill/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.question, whyAsked: q.whyAsked, strongAnswer: q.strongAnswer, userAnswer: answer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get feedback");
      setFeedback(data.feedback);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setFeedbackLoading(false);
    }
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
            company research and your skill gaps. Answer out loud and get quick feedback.
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
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium leading-relaxed">{q.question}</p>
            {speechSupported && (
              <button
                onClick={() => speak(q.question)}
                title="Hear this question read aloud"
                aria-label="Hear this question read aloud"
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-sm transition hover:bg-white/10"
              >
                🔊
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-white/45">Why they ask: {q.whyAsked}</p>

          <div className="relative mt-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer by voice (🎙️) or type here…"
              rows={3}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 pr-12 text-sm leading-relaxed placeholder-white/30 outline-none transition focus:border-violet-400/50"
            />
            {micSupported && (
              <button
                onClick={toggleMic}
                title={recording ? "Stop recording" : "Answer by voice"}
                aria-label={recording ? "Stop recording" : "Answer by voice"}
                className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  recording
                    ? "recording border-red-400/60 bg-red-500/20 text-red-300"
                    : "border-white/15 bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                🎙️
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={getFeedback}
              disabled={!answer.trim() || feedbackLoading}
              className="rounded-xl border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20 disabled:opacity-40"
            >
              {feedbackLoading ? "Thinking…" : "💬 Get feedback on my answer"}
            </button>
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Reveal strong answer
              </button>
            )}
          </div>
          {feedbackError && <p className="mt-2 text-sm text-rose-300">{feedbackError}</p>}
          {feedback && (
            <div className="mt-3 rounded-xl border border-violet-400/25 bg-violet-400/10 p-4 text-sm leading-relaxed text-white/80">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-violet-300">Coach feedback</span>
              {feedback}
            </div>
          )}

          {revealed && (
            <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-relaxed text-white/80">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-emerald-300">
                A strong answer covers
              </span>
              {q.strongAnswer}
            </div>
          )}

          <div className="mt-4">
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
