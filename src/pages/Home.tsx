import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { JOURNAL_LIST, TOTAL_RITUALS } from "@/lib/journals";
import { Flame, Check, ChevronRight, Repeat2 } from "lucide-react";

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function greeting(d: Date) {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const [habitsOpen, setHabitsOpen] = useState(false);

  const { data: completionDates = [] } = useQuery({
    queryKey: ["streak", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("created_at,journal_type")
        .eq("user_id", user!.id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: habits = [] } = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: ["habit_logs_today", user?.id, todayKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user!.id)
        .eq("logged_date", todayKey);
      if (error) throw error;
      return data ?? [];
    },
  });

  const doneHabits = new Set(habitLogs.map((l: any) => l.habit_id));

  const toggleHabit = useMutation({
    mutationFn: async (habitId: string) => {
      if (doneHabits.has(habitId)) {
        await supabase.from("habit_logs").delete()
          .eq("user_id", user!.id)
          .eq("habit_id", habitId)
          .eq("logged_date", todayKey);
      } else {
        await supabase.from("habit_logs").insert({
          user_id: user!.id,
          habit_id: habitId,
          logged_date: todayKey,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_logs_today"] });
      queryClient.invalidateQueries({ queryKey: ["habit_logs_28d"] });
    },
  });

  const streak = calcStreak(completionDates.map((d) => d.created_at as string));
  const completedToday = useMemo(() => {
    const set = new Set<string>();
    completionDates.forEach((e: any) => {
      if ((e.created_at as string).slice(0, 10) === todayKey) set.add(e.journal_type);
    });
    return set;
  }, [completionDates, todayKey]);

  const firstName = profile?.display_name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="safe-top" />

      {/* Header strip */}
      <div className="px-5 pt-2">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">INTENT</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-3">
            {format(today, "yyyy.MM.dd")}
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-[12px] italic text-ink-2">
              {greeting(today)}{firstName ? `, ${firstName}` : ""}.
            </p>
            <h1 className="mt-0.5 font-display text-[24px] leading-[1.05] text-ink">
              {format(today, "EEEE")}<span className="text-ink-3">,</span>{" "}
              <em className="font-serif not-italic font-normal italic">{format(today, "MMM d")}.</em>
            </h1>
          </div>

          {/* Streak coin */}
          <div className={`flex shrink-0 items-center gap-1.5 rounded-full border border-ink bg-paper-2 px-2.5 py-1.5 ${streak > 0 ? "animate-streak-pop" : ""}`}>
            <Flame className="h-3.5 w-3.5" style={{ color: "hsl(var(--accent))" }} strokeWidth={2} />
            <span className="font-display text-[16px] leading-none">{streak}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-2">D</span>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="mt-3 flex items-center gap-3 px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          ── TODAY · {completedToday.size} / {TOTAL_RITUALS}
        </span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col px-5 pb-4 pt-2 gap-2">

        {/* Habits tile */}
        <div className="overflow-hidden rounded border border-line-strong bg-card-paper">
          <button
            className="relative flex w-full items-center gap-3 px-3.5 py-3 text-left"
            onClick={() => setHabitsOpen(!habitsOpen)}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-ink bg-paper"
              style={{ color: "hsl(var(--j-retrieval))" }}
            >
              <Repeat2 className="h-4 w-4" strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="font-serif text-[16px] font-medium leading-tight text-ink">Habits</h3>
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">
                {doneHabits.size} of {habits.length} kept · tap to mark
              </p>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200"
              style={{ transform: habitsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            />
          </button>

          {habitsOpen && (
            <div className="border-t border-line px-3.5 pb-3 pt-2">
              {habits.length === 0 ? (
                <p className="py-1 font-serif text-[13px] italic text-ink-3">
                  No habits yet. Open full check-in to add.
                </p>
              ) : (
                <div className="space-y-2">
                  {(habits as any[]).map((h) => {
                    const done = doneHabits.has(h.id);
                    const accent = `hsl(var(${h.accent_var || "--j-brain"}))`;
                    return (
                      <button
                        key={h.id}
                        onClick={() => toggleHabit.mutate(h.id)}
                        className="flex w-full items-center gap-2.5 py-0.5"
                      >
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                          style={done ? { background: accent, borderColor: accent } : { borderColor: accent }}
                        >
                          {done && <Check className="h-3 w-3 text-paper" strokeWidth={2.4} />}
                        </div>
                        <span
                          className={`font-serif text-[14px] text-left ${done ? "line-through text-ink-3" : "text-ink"}`}
                        >
                          {h.emoji} {h.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <Link
                to="/habits"
                className="mt-3 block w-full rounded border border-ink bg-paper px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink"
              >
                Open full check-in
              </Link>
            </div>
          )}
        </div>

        {/* Journal ritual cards */}
        <div className="flex flex-1 flex-col justify-between gap-2">
          {JOURNAL_LIST.map((j) => {
            const Icon = j.icon;
            const done = completedToday.has(j.id);
            const accent = `hsl(var(${j.accentVar}))`;
            return (
              <Link
                key={j.id}
                to={`/journal/${j.id}`}
                className={`relative block flex-1 overflow-hidden rounded border px-3.5 py-3 transition-transform active:scale-[0.99] ${
                  done ? "border-line bg-paper-2 opacity-70" : "border-line-strong bg-card-paper"
                }`}
              >
                {/* Pattern background */}
                <div
                  className={`pointer-events-none absolute inset-0 opacity-50 pat-${j.pattern}`}
                  aria-hidden
                />
                <div className="relative flex h-full items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-ink bg-paper"
                    style={{ color: accent }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.6} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif text-[16px] font-medium leading-tight text-ink truncate">
                        {j.title}
                      </h3>
                      <span className="font-mono text-[9px] tracking-[0.1em] text-ink-3">{j.number}</span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2 line-clamp-1">{j.blurb}</p>
                  </div>

                  <div className="shrink-0">
                    {done ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper">
                        <Check className="h-3 w-3" strokeWidth={2.4} />
                      </div>
                    ) : (
                      <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[9px] tracking-[0.05em] text-ink-2">
                        {j.durationMinutes}M
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
