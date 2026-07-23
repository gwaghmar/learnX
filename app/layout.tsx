import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnX — paste the job, get the plan, land the role",
  description:
    "Paste a job description or speak your goal. LearnX's agents research the company, map your skill gap, and build a learning plan from 100% free, link-verified resources — with a tracker, streaks, and interview drills.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
