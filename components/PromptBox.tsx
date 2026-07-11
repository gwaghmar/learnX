"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
};

/**
 * Prompt textarea with tap-to-speak (Web Speech API, Chrome/Edge/Safari).
 * Falls back gracefully: the mic button hides when unsupported.
 */
export default function PromptBox({ value, onChange, placeholder, rows = 7 }: Props) {
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) {
        onChange((valueRef.current ? valueRef.current + " " : "") + transcript.trim());
      }
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    return () => rec.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 pr-14 text-base leading-relaxed placeholder-white/35 outline-none transition focus:border-sky-400/60 focus:bg-white/[0.07]"
      />
      {supported && (
        <button
          type="button"
          onClick={toggleMic}
          title={recording ? "Stop recording" : "Tap to speak"}
          aria-label={recording ? "Stop recording" : "Tap to speak"}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border transition ${
            recording
              ? "recording border-red-400/60 bg-red-500/20 text-red-300"
              : "border-white/15 bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
