import { useQuery } from "@tanstack/react-query";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("position");
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
        .from("habit_logs")
        .select("habit_id, logged_date")
        .eq("user_id", user!.id)
        .gte("logged_date", since);
      if (error) throw error;
      return data ?? [];
    },
  });

  const logSet = new Set(
    (logs as any[]).map((l) => `${l.habit_id}:${l.logged_date}`)
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="safe-top" />

      <div className="px-5 pt-2">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            HABITS · LOG
          </span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-3">
            28 D
          </span>
        </div>
        <h1 className="font-display text-[24px] leading-[1.05] text-ink">
          A month of{" "}
          <em className="font-serif not-italic font-normal italic">small things</em>.
        </h1>
      </div>

      {/* Day markers */}
      <div className="mt-3 px-5">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: "repeat(28, 1fr)" }}
        >
          {days.map((d, i) => (
            <div key={d} className="flex flex-col items-center">
              {(i === 0 || i === 6 || i === 13 || i === 20 || i === 27) && (
                <span className="font-mono text-[7px] text-ink-3 leading-none mb-0.5">
                  {format(new Date(d + "T00:00:00"), "d")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pt-3 pb-8 space-y-6">
        {(habits as any[]).length === 0 ? (
          <p className="font-serif text-[14px] italic text-ink-3 py-4">
            No habits yet. Add them from Today's habits tile.
          </p>
        ) : (
          (habits as any[]).map((h) => {
            const accent = `hsl(var(${h.accent_var || "--j-brain"}))`;
            const count = days.filter((d) =>
              logSet.has(`${h.id}:${d}`)
            ).length;

            return (
              <div key={h.id}>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="font-serif text-[15px] text-ink">
                    {h.emoji} {h.title}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.1em] text-ink-3">
                    {count}/28
                  </span>
                </div>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: "repeat(28, 1fr)" }}
                >
                  {days.map((d) => {
                    const filled = logSet.has(`${h.id}:${d}`);
                    return (
                      <div
                        key={d}
                        title={d}
                        className="aspect-square rounded-sm border"
                        style={
                          filled
                            ? {
                                background: accent,
                                borderColor: accent,
                                opacity: 0.85,
                              }
                            : {
                                background: "transparent",
                                borderColor: "hsl(var(--ink)/0.10)",
                                opacity: 0.4,
                              }
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
