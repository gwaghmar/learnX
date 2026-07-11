import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnX — get job-ready with a free-resource learning plan",
  description:
    "Paste a job description. LearnX's agents research the company, map your skill gap, and build a learning plan from 100% free resources — with a tracker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
