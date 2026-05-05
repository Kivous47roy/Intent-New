import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, ArrowLeft } from "lucide-react";

export default function HabitsCheckin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

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

  const { data: todayLogs = [] } = useQuery({
    queryKey: ["habit_logs_today", user?.id, todayKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_logs").select("habit_id")
        .eq("user_id", user!.id).eq("logged_date", todayKey);
      if (error) throw error;
      return data ?? [];
    },
  });

  const doneSet = new Set((todayLogs as any[]).map((l) => l.habit_id));
  const total = (habits as any[]).length;
  const count = doneSet.size;

  const toggleMutation = useMutation({
    mutationFn: async (habitId: string) => {
      if (doneSet.has(habitId)) {
        await supabase.from("habit_logs").delete()
          .eq("user_id", user!.id).eq("habit_id", habitId).eq("logged_date", todayKey);
      } else {
        await supabase.from("habit_logs").insert({
          user_id: user!.id, habit_id: habitId, logged_date: todayKey,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_logs_today"] });
      queryClient.invalidateQueries({ queryKey: ["habit_logs_28d"] });
    },
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="safe-top" />

      {/* Header */}
      <div className="px-5 pt-2">
        <div className="mb-2 flex items-baseline gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-ink-3 hover:text-ink-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Back</span>
          </button>
          <div className="h-px flex-1 bg-ink/10" />
          <Link
            to="/habit-log"
            className="font-mono text-[11px] tracking-[0.12em] text-ink-2 underline underline-offset-2"
          >
            LOG ↗
          </Link>
        </div>
        <div className="mb-1 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            EVERYDAY GOALS · TONIGHT
          </span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] text-ink-3">
            {format(today, "yyyy.MM.dd")}
          </span>
        </div>
        <h1 className="font-display text-[28px] leading-[1.05] text-ink">
          What did today<br />
          <em className="font-serif not-italic font-normal italic">actually</em> hold?
        </h1>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-4 h-[3px] rounded-full bg-line overflow-hidden">
            <div
              className="h-full bg-ink transition-all duration-300"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-2.5">
        {total === 0 ? (
          <p className="py-6 font-serif text-[14px] italic text-ink-3">
            No everyday goals yet. Add them in your Profile.
          </p>
        ) : (
          (habits as any[]).map((h) => {
            const done = doneSet.has(h.id);
            const accent = `hsl(var(${h.accent_var || "--j-brain"}))`;
            return (
              <button
                key={h.id}
                onClick={() => toggleMutation.mutate(h.id)}
                className={`flex w-full items-center gap-3.5 rounded border px-4 py-3.5 text-left transition-colors ${
                  done ? "border-ink bg-paper-2" : "border-line-strong bg-card-paper"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
                  style={
                    done
                      ? { background: "hsl(var(--ink))", borderColor: "hsl(var(--ink))" }
                      : { borderColor: "hsl(var(--line-strong))" }
                  }
                >
                  {done && <Check className="h-3.5 w-3.5 text-paper" strokeWidth={2.6} />}
                </div>
                <span className="text-[20px]">{h.emoji}</span>
                <span
                  className="flex-1 font-serif text-[17px] font-medium"
                  style={
                    done
                      ? { textDecoration: "line-through", color: "hsl(var(--ink-3))" }
                      : { color: "hsl(var(--ink))" }
                  }
                >
                  {h.title}
                </span>
              </button>
            );
          })
        )}

        {count === total && total > 0 && (
          <div className="mt-2 rounded border border-ink bg-paper-2 px-4 py-3.5">
            <p className="font-serif text-[14px] italic leading-[1.5]">
              All {total}, today. A small day, well kept.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
