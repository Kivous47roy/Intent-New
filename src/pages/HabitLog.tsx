import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame } from "lucide-react";

function calcCurrentStreak(row: number[]) {
  let cur = 0;
  for (let i = row.length - 1; i >= 0; i--) {
    if (row[i] === 1) cur++; else break;
  }
  return cur;
}

function calcBestStreak(row: number[]) {
  let best = 0, run = 0;
  for (const v of row) {
    if (v === 1) { run++; best = Math.max(best, run); } else run = 0;
  }
  return best;
}

export default function HabitLog() {
  const { user } = useAuth();
  const today = new Date();

  const days = Array.from({ length: 28 }, (_, i) =>
    subDays(today, 27 - i).toISOString().slice(0, 10)
  );

  const { data: habits = [] } = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits").select("*").eq("user_id", user!.id).order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["habit_logs_28d", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = subDays(today, 27).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("habit_logs").select("habit_id, logged_date")
        .eq("user_id", user!.id).gte("logged_date", since);
      if (error) throw error;
      return data ?? [];
    },
  });

  const logSet = new Set((logs as any[]).map((l) => `${l.habit_id}:${l.logged_date}`));

  const buildRow = (habitId: string) =>
    days.map((d) => (logSet.has(`${habitId}:${d}`) ? 1 : 0));

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="safe-top" />

      <div className="px-5 pt-2">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            EVERYDAY GOALS · STREAKS
          </span>
          <div className="h-px flex-1 bg-ink/10" />
        </div>
        <h1 className="font-display text-[28px] leading-[1.05] text-ink">
          On a <em className="font-serif not-italic font-normal italic">roll</em>.
        </h1>
      </div>

      <div className="flex-1 px-5 pt-5 pb-8 space-y-4">
        {(habits as any[]).length === 0 ? (
          <p className="font-serif text-[14px] italic text-ink-3 py-4">
            No everyday goals yet. Add them in Profile.
          </p>
        ) : (
          (habits as any[]).map((h) => {
            const accent = `hsl(var(${h.accent_var || "--j-brain"}))`;
            const row = buildRow(h.id);
            const cur = calcCurrentStreak(row);
            const best = calcBestStreak(row);

            return (
              <div
                key={h.id}
                className="rounded border border-line-strong bg-card-paper px-4 py-3.5"
              >
                {/* Header */}
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="text-[20px]">{h.emoji}</span>
                  <span className="flex-1 font-serif text-[16px] font-medium text-ink">
                    {h.title}
                  </span>
                  <div className="flex items-center gap-1" style={{ color: "hsl(var(--accent))" }}>
                    <Flame className="h-3.5 w-3.5" />
                    <span className="font-display text-[22px] leading-none">{cur}</span>
                  </div>
                </div>

                {/* Sparkline strip */}
                <div className="mb-2 flex h-6 items-end gap-[2px]">
                  {row.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: v === 1 ? "100%" : "20%",
                        background: v === 1 ? accent : "hsl(var(--ink) / 0.15)",
                        opacity: v === 1 ? 0.9 : 1,
                      }}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
                    28 D AGO
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
                    BEST · {best} D
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
