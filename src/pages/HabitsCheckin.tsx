import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, Plus, X, ArrowLeft } from "lucide-react";

const ACCENT_OPTIONS = [
  { label: "Blue", value: "--j-brain" },
  { label: "Green", value: "--j-gratitude" },
  { label: "Wave", value: "--j-expressive" },
  { label: "Warm", value: "--j-intention" },
  { label: "Gold", value: "--j-retrieval" },
  { label: "Red", value: "--j-affirmation" },
];

export default function HabitsCheckin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("✦");
  const [newAccent, setNewAccent] = useState("--j-brain");

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

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id,
        title: newTitle.trim(),
        emoji: newEmoji || "✦",
        accent_var: newAccent,
        position: (habits as any[]).length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      setNewTitle("");
      setNewEmoji("✦");
      setNewAccent("--j-brain");
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await supabase.from("habits").delete().eq("id", habitId).eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["habit_logs_today"] });
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
          Tonight's <em className="font-serif not-italic font-normal italic">marks</em>.
        </h1>
      </div>

      <div className="mt-3 flex items-center gap-3 px-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          ── TODAY · {doneSet.size} / {(habits as any[]).length}
        </span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-8 space-y-2">
        {(habits as any[]).length === 0 && !adding && (
          <p className="py-4 font-serif text-[14px] italic text-ink-3">
            Add your first habit below.
          </p>
        )}

        {(habits as any[]).map((h) => {
          const done = doneSet.has(h.id);
          const accent = `hsl(var(${h.accent_var || "--j-brain"}))`;
          return (
            <div
              key={h.id}
              className={`flex items-center gap-3 rounded border px-3.5 py-3 transition-colors ${
                done
                  ? "border-line bg-paper-2 opacity-75"
                  : "border-line-strong bg-card-paper"
              }`}
            >
              <button
                onClick={() => toggleMutation.mutate(h.id)}
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
              </button>
              <div className="flex-1 min-w-0">
                <span
                  className="font-serif text-[15px]"
                  style={
                    done
                      ? { textDecoration: "line-through", opacity: 0.6 }
                      : {}
                  }
                >
                  {h.emoji} {h.title}
                </span>
              </div>
              <button
                onClick={() => deleteMutation.mutate(h.id)}
                className="shrink-0 text-ink-3 hover:text-ink-2 transition-colors p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Add form */}
        {adding ? (
          <div className="rounded border border-line-strong bg-card-paper px-3.5 py-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-12 rounded border border-line bg-paper px-2 py-1.5 text-center font-serif text-[15px] outline-none focus:border-ink"
                placeholder="✦"
                maxLength={2}
              />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                placeholder="Habit name"
                className="flex-1 rounded border border-line bg-paper px-2.5 py-1.5 font-serif text-[15px] outline-none placeholder:text-ink-3 focus:border-ink"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) addMutation.mutate();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewTitle("");
                  }
                }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewAccent(opt.value)}
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors"
                  style={
                    newAccent === opt.value
                      ? {
                          background: `hsl(var(${opt.value}))`,
                          borderColor: `hsl(var(${opt.value}))`,
                          color: "hsl(var(--paper))",
                        }
                      : {
                          borderColor: `hsl(var(${opt.value})/0.4)`,
                          color: `hsl(var(${opt.value}))`,
                        }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (newTitle.trim()) addMutation.mutate();
                }}
                disabled={!newTitle.trim() || addMutation.isPending}
                className="flex-1 rounded border border-ink bg-ink py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper disabled:opacity-40"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="flex-1 rounded border border-line py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded border border-dashed border-line px-3.5 py-3 text-ink-3 hover:text-ink-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
              Add habit
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
