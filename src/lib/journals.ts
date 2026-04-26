import { Brain, Leaf, Waves, Compass, Sparkles, Anchor, type LucideIcon } from "lucide-react";

export type JournalType =
  | "brain_dump"
  | "gratitude"
  | "expressive"
  | "implementation"
  | "retrieval"
  | "affirmation";

export type StructuredKind = "three" | "ifthen" | null;
export type TimeOfDay = "morning" | "night" | "anytime";

export interface JournalConfig {
  id: JournalType;
  number: string;        // "01" .. "06"
  title: string;
  blurb: string;
  prompt: string;
  helper: string;
  durationMinutes: number;
  icon: LucideIcon;
  /** CSS var name for accent colour, e.g. --j-brain */
  accentVar: string;
  pattern: "crosshatch" | "dots" | "lines" | "diagonal" | "grid" | "arcs";
  structured: StructuredKind;
  /** Brain dump: after timer, sort each line into do/defer/delete */
  sortAfter?: boolean;
  timeOfDay: TimeOfDay;
  placeholders?: string[];
}

export const JOURNALS: Record<JournalType, JournalConfig> = {
  brain_dump: {
    id: "brain_dump",
    number: "01",
    title: "Brain Dump",
    blurb: "Empty the noise. Then sort it.",
    prompt: "Write every task, worry, or idea on your mind right now. Don't organize. Just unload.",
    helper: "One thought per line. You'll sort them after.",
    durationMinutes: 10,
    icon: Brain,
    accentVar: "--j-brain",
    pattern: "crosshatch",
    structured: null,
    sortAfter: true,
    timeOfDay: "night",
  },
  gratitude: {
    id: "gratitude",
    number: "02",
    title: "Gratitude",
    blurb: "Three specific moments. Memory plus action.",
    prompt: "Three things you're grateful for today. Be specific — the moment, what you saw, what you did.",
    helper: "Tie each one to something concrete.",
    durationMinutes: 5,
    icon: Leaf,
    accentVar: "--j-gratitude",
    pattern: "dots",
    structured: "three",
    timeOfDay: "morning",
    placeholders: [
      "Be specific. The light, the smell, the words.",
      "Memory + action.",
      "A small thing counts.",
    ],
  },
  expressive: {
    id: "expressive",
    number: "03",
    title: "Expressive",
    blurb: "Raw feeling. No editing, no rules.",
    prompt: "What am I feeling right now? Write it raw. Don't edit. The page can hold all of it.",
    helper: "No editing. Let it pour out.",
    durationMinutes: 15,
    icon: Waves,
    accentVar: "--j-expressive",
    pattern: "lines",
    structured: null,
    timeOfDay: "night",
  },
  implementation: {
    id: "implementation",
    number: "04",
    title: "Implementation Intention",
    blurb: "Three 'if X, then I will Y' for today.",
    prompt: "Write three plans: 'If X happens, then I will do Y.' Concrete cues, concrete actions.",
    helper: "Specific cues lead to specific actions.",
    durationMinutes: 5,
    icon: Compass,
    accentVar: "--j-intention",
    pattern: "diagonal",
    structured: "ifthen",
    timeOfDay: "morning",
  },
  retrieval: {
    id: "retrieval",
    number: "05",
    title: "Retrieval",
    blurb: "Blurt everything you remember.",
    prompt: "You just learned something. Without looking back, write everything you remember. Loose, messy, complete.",
    helper: "Don't peek. Recall builds memory.",
    durationMinutes: 30,
    icon: Sparkles,
    accentVar: "--j-retrieval",
    pattern: "grid",
    structured: null,
    timeOfDay: "night",
  },
  affirmation: {
    id: "affirmation",
    number: "06",
    title: "Affirmation",
    blurb: "Daily reinforcement of who you are and what you have.",
    prompt: "What do you know to be true about your life right now — your support, your safety, your strength? Write it as fact, not hope.",
    helper: "Write it as fact, not hope.",
    durationMinutes: 5,
    icon: Anchor,
    accentVar: "--j-affirmation",
    pattern: "arcs",
    structured: "three",
    timeOfDay: "morning",
    placeholders: [
      "I am supported by…",
      "Right now I have…",
      "What is solid in my life is…",
    ],
  },
};

export const JOURNAL_LIST: JournalConfig[] = [
  JOURNALS.brain_dump,
  JOURNALS.gratitude,
  JOURNALS.expressive,
  JOURNALS.implementation,
  JOURNALS.retrieval,
  JOURNALS.affirmation,
];

export const TOTAL_RITUALS = JOURNAL_LIST.length;
