export type Selections = {
  education: string;
  experience: string;
  hoursPerWeek: string;
  timeline: string;
  background: string;
};

export type ResourceKind =
  | "course"
  | "video"
  | "article"
  | "practice"
  | "certification"
  | "docs";

export type Resource = {
  title: string;
  provider: string;
  url: string;
  kind: ResourceKind;
  /** e.g. "Free certificate, no employer license required" */
  certNote?: string;
  /** Set server-side after the link checker runs. */
  verified?: boolean;
};

export type PlanItem = {
  id: string;
  title: string;
  why: string;
  skills: string[];
  estimatedHours: number;
  resources: Resource[];
};

export type Phase = {
  id: string;
  title: string;
  summary: string;
  items: PlanItem[];
};

export type SkillGap = {
  skill: string;
  status: "have" | "partial" | "missing";
  note: string;
};

export type LearningPlan = {
  id: string;
  createdAt: string;
  /** All goals folded into this plan, in the order they were added. */
  goals: string[];
  role: string;
  company?: string;
  /** Facts about the company/team. Uncertain items are prefixed "Verify:". */
  companyResearch: string[];
  skillGaps: SkillGap[];
  phases: Phase[];
  interviewPrep: string[];
};

/** itemId -> completed */
export type TrackerState = Record<string, boolean>;

export type GenerateRequest = {
  prompt: string;
  selections: Selections;
};

export type ExpandRequest = {
  plan: LearningPlan;
  newGoal: string;
  selections: Selections;
  completedItemIds: string[];
};
