import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: todayLogs = [] } = useQuery({
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

  const doneSet = new Set((todayLogs as any[]).map((l) => l.habit_id));

  const toggleMutation = useMutation({
    mutationFn: async (habitId: string) => {
      if (doneSet.has(habitId)) {
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
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-3">
            {format(today, "yyyy.MM.dd")}
          </span>
        </div>
        <h1 className="font-display text-[24px] leading-[1.05] text-ink">
          Tonight's <em className="font-serif not-italic font-normal italic">goals</em>.
        </h1>
      </div>

      <div className="mt-3 flex items-center gap-3 px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          ── EVERYDAY GOALS · {doneSet.size} / {(habits as any[]).length} done
        </span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8 space-y-2">
        {(habits as any[]).length === 0 ? (
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
                className={`flex w-full items-center gap-3 rounded border px-3.5 py-3 text-left transition-colors ${
                  done
                    ? "border-line bg-paper-2 opacity-75"
                    : "border-line-strong bg-card-paper"
                }`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
                  style={
                    done
                      ? { background: accent, borderColor: accent }
                      : { borderColor: accent }
                  }
                >
                  {done && (
                    <Check className="h-3.5 w-3.5 text-paper" strokeWidth={2.4} />
                  )}
                </div>
                <span
                  className="font-serif text-[15px]"
                  style={done ? { textDecoration: "line-through", opacity: 0.6 } : {}}
                >
                  {h.emoji} {h.title}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
