import { Brain, Heart, Flame, Target, BookOpen, type LucideIcon } from "lucide-react";

export type JournalType = "brain_dump" | "gratitude" | "expressive" | "implementation" | "retrieval";

export interface JournalConfig {
  id: JournalType;
  title: string;
  shortTitle: string;
  description: string;
  prompt: string;
  helper: string;
  durationMinutes: number;
  icon: LucideIcon;
  accent: string;
}

export const JOURNALS: Record<JournalType, JournalConfig> = {
  brain_dump: {
    id: "brain_dump",
    title: "Brain Dump",
    shortTitle: "Brain Dump",
    description: "Empty your mind. Sort what matters.",
    prompt: "Write every task, worry, and idea swirling in your head.",
    helper: "Don't filter. Just unload. You'll sort it after.",
    durationMinutes: 10,
    icon: Brain,
    accent: "from-amber-400/20 to-amber-500/5",
  },
  gratitude: {
    id: "gratitude",
    title: "Gratitude",
    shortTitle: "Gratitude",
    description: "Three specific things. Memory + action.",
    prompt: "What 3 specific things are you grateful for today?",
    helper: "Be specific. Tie each one to a memory or action.",
    durationMinutes: 5,
    icon: Heart,
    accent: "from-rose-400/20 to-amber-400/5",
  },
  expressive: {
    id: "expressive",
    title: "Expressive",
    shortTitle: "Expressive",
    description: "Raw emotion. No editing.",
    prompt: "What am I feeling right now?",
    helper: "Write without editing. Let it pour out.",
    durationMinutes: 15,
    icon: Flame,
    accent: "from-orange-400/20 to-rose-400/5",
  },
  implementation: {
    id: "implementation",
    title: "Implementation Intention",
    shortTitle: "Intentions",
    description: "If X, then I will do Y. Three of them.",
    prompt: "Write 3 \"If X, then I will do Y\" sentences.",
    helper: "Specific cues lead to specific actions.",
    durationMinutes: 5,
    icon: Target,
    accent: "from-emerald-400/20 to-amber-400/5",
  },
  retrieval: {
    id: "retrieval",
    title: "Retrieval",
    shortTitle: "Retrieval",
    description: "Blurt everything you remember.",
    prompt: "After learning something new — write everything you remember.",
    helper: "Don't peek at notes. Recall builds memory.",
    durationMinutes: 30,
    icon: BookOpen,
    accent: "from-sky-400/20 to-amber-400/5",
  },
};

export const JOURNAL_LIST: JournalConfig[] = [
  JOURNALS.brain_dump,
  JOURNALS.gratitude,
  JOURNALS.expressive,
  JOURNALS.implementation,
  JOURNALS.retrieval,
];
