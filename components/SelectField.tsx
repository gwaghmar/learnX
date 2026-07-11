"use client";

export const HELP_ME = "help me figure out";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
};

/**
 * Every selector always offers "Help me figure out" — the agents then infer
 * the value from context instead of forcing the user to guess.
 */
export default function SelectField({ label, value, onChange, options }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400/60 [&>option]:bg-slate-900"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={HELP_ME}>🤔 Help me figure out</option>
      </select>
    </label>
  );
}
