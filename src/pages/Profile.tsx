import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { JOURNALS, type JournalType } from "@/lib/journals";
import { Bell, Moon, LogOut, Flame, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ACCENT_CYCLE = [
  "--j-brain",
  "--j-gratitude",
  "--j-expressive",
  "--j-intention",
  "--j-retrieval",
  "--j-affirmation",
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [morning, setMorning] = useState("07:30");
  const [evening, setEvening] = useState("21:00");
  const [morningOn, setMorningOn] = useState(true);
  const [eveningOn, setEveningOn] = useState(true);

  // Everyday Goals
  const [addingGoal, setAddingGoal] = useState(false);
  const [newEmoji, setNewEmoji] = useState("✦");
  const [newTitle, setNewTitle] = useState("");

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

  const addGoalMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id,
        title: newTitle.trim(),
        emoji: newEmoji || "✦",
        accent_var: ACCENT_CYCLE[(habits as any[]).length % ACCENT_CYCLE.length],
        position: (habits as any[]).length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      setNewTitle("");
      setNewEmoji("✦");
      setAddingGoal(false);
    },
    onError: (err: any) => toast.error(err.message ?? "Could not add goal"),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("habits").delete().eq("id", id).eq("user_id", user!.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setMorning(profile.morning_reminder_time ?? "07:30");
      setEvening((profile as any).evening_reminder_time ?? "21:00");
    }
  }, [profile]);

  const { data: entries = [] } = useQuery({
    queryKey: ["entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("created_at,journal_type")
        .eq("user_id", user!.id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const dates = entries.map((e: any) => (e.created_at as string).slice(0, 10));
    const days = new Set(dates);
    // current
    let current = 0;
    const cursor = new Date();
    if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    }
    // longest
    const sorted = Array.from(days).sort();
    let longest = 0;
    let run = 0;
    let prev: Date | null = null;
    sorted.forEach((s) => {
      const d = new Date(s);
      if (prev && (d.getTime() - prev.getTime()) === 86400000) run++;
      else run = 1;
      longest = Math.max(longest, run);
      prev = d;
    });
    // most-used
    const counts: Record<string, number> = {};
    entries.forEach((e: any) => {
      counts[e.journal_type] = (counts[e.journal_type] ?? 0) + 1;
    });
    let topId: string | null = null;
    let topCount = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > topCount) {
        topId = k;
        topCount = v;
      }
    });
    const topTitle = topId && JOURNALS[topId as JournalType] ? JOURNALS[topId as JournalType].title : "—";
    return { current, longest, total: entries.length, top: topTitle };
  }, [entries]);

  const save = async (patch: Partial<{ display_name: string; morning_reminder_time: string; evening_reminder_time: string }>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const onSaveAll = async () => {
    await save({
      display_name: name.trim() || "Friend",
      morning_reminder_time: morning,
      evening_reminder_time: evening,
    });
    toast.success("Saved.");
  };

  const initial = (name || user?.email || "?").charAt(0).toUpperCase();
  const joined = profile ? format(new Date((profile as any).created_at), "MMMM yyyy").toUpperCase() : "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="safe-top" />

      <div className="px-5 pt-2">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">PROFILE</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] text-ink-3">v1.0</span>
        </div>

        <div className="mt-1 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ink bg-paper-3">
            <span className="font-display text-[20px] italic">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={onSaveAll}
              className="w-full bg-transparent font-display text-[20px] leading-[1.05] outline-none"
            />
            <p className="font-mono text-[10px] tracking-[0.08em] text-ink-3">
              {joined ? `JOINED · ${joined}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-3 pt-3">
        {/* Everyday Goals */}
        <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-ink-3">── EVERYDAY GOALS</p>
        <div className="mb-4 space-y-2">
          {(habits as any[]).map((h, i) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded border border-line-strong bg-card-paper px-3.5 py-2.5"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px]"
                style={{ borderColor: `hsl(var(${h.accent_var || "--j-brain"}))` }}
              >
                {h.emoji}
              </div>
              <span className="flex-1 font-serif text-[14px] text-ink">{h.title}</span>
              <button
                onClick={() => deleteGoalMutation.mutate(h.id)}
                className="shrink-0 text-ink-3 hover:text-ink-2 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {addingGoal ? (
            <div className="rounded border border-line-strong bg-card-paper px-3.5 py-3 space-y-2">
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
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Goal name"
                  className="flex-1 rounded border border-line bg-paper px-2.5 py-1.5 font-serif text-[15px] outline-none placeholder:text-ink-3 focus:border-ink"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTitle.trim()) addGoalMutation.mutate();
                    if (e.key === "Escape") { setAddingGoal(false); setNewTitle(""); }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (newTitle.trim()) addGoalMutation.mutate(); }}
                  disabled={!newTitle.trim() || addGoalMutation.isPending}
                  className="flex-1 rounded border border-ink bg-ink py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper disabled:opacity-40"
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingGoal(false); setNewTitle(""); }}
                  className="flex-1 rounded border border-line py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingGoal(true)}
              className="flex w-full items-center gap-2 rounded border border-dashed border-line px-3.5 py-2.5 text-ink-3 hover:text-ink-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Add everyday goal</span>
            </button>
          )}
        </div>

        <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-ink-3">── PRACTICE</p>
        <div className="mb-4 overflow-hidden rounded border border-line-strong bg-white/40">
          {[
            { l: "Current streak", v: `${stats.current} days`, accent: true },
            { l: "Longest streak", v: `${stats.longest} days` },
            { l: "Total entries", v: String(stats.total) },
            { l: "Most-used ritual", v: stats.top },
          ].map((row, i, arr) => (
            <div
              key={row.l}
              className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: i < arr.length - 1 ? "1px solid hsl(var(--ink) / 0.10)" : undefined }}
            >
              <span className="text-[12px] text-ink-2">{row.l}</span>
              <span
                className="flex items-center gap-1.5 font-serif text-[13px] font-medium"
                style={{ color: row.accent ? "hsl(var(--accent))" : "hsl(var(--ink))" }}
              >
                {row.accent && <Flame className="h-3 w-3" />}
                {row.v}
              </span>
            </div>
          ))}
        </div>

        <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-ink-3">── SETTINGS</p>
        <div className="overflow-hidden rounded border border-line-strong bg-white/40">
          <ReminderRow
            icon={<Bell className="h-3.5 w-3.5" />}
            label="Morning reminder"
            on={morningOn}
            setOn={setMorningOn}
            time={morning}
            onTime={(v) => {
              setMorning(v);
              save({ morning_reminder_time: v });
            }}
          />
          <div className="border-t border-line" />
          <ReminderRow
            icon={<Moon className="h-3.5 w-3.5" />}
            label="Evening reminder"
            on={eveningOn}
            setOn={setEveningOn}
            time={evening}
            onTime={(v) => {
              setEvening(v);
              save({ evening_reminder_time: v });
            }}
          />
          <div className="border-t border-line" />
          <button
            onClick={signOut}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left"
          >
            <span className="flex items-center gap-2 text-[12px]" style={{ color: "hsl(var(--accent))" }}>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </span>
          </button>
        </div>

        {/* Footer mark — fills empty space gracefully */}
        <div className="mt-6 flex flex-col items-center gap-1.5 pb-2">
          <div className="h-px w-10 bg-ink/15" />
          <p className="font-display text-[18px] italic leading-none text-ink-3">Intent</p>
          <p className="font-mono text-[9px] tracking-[0.18em] text-ink-3">— DAILY PRACTICE —</p>
        </div>
      </div>
    </div>
  );
}

function ReminderRow({
  icon,
  label,
  on,
  setOn,
  time,
  onTime,
}: {
  icon: React.ReactNode;
  label: string;
  on: boolean;
  setOn: (v: boolean) => void;
  time: string;
  onTime: (v: string) => void;
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[12px]">
          <span className="text-ink-2">{icon}</span>
          {label}
        </span>
        <button
          type="button"
          onClick={() => setOn(!on)}
          className="relative h-[20px] w-9 rounded-full transition-colors"
          style={{ background: on ? "hsl(var(--ink))" : "hsl(var(--paper-3))" }}
          aria-pressed={on}
        >
          <span
            className="absolute top-[2px] h-[16px] w-[16px] rounded-full bg-paper transition-all"
            style={{ left: on ? 18 : 2, boxShadow: "0 1px 2px hsl(var(--ink) / 0.25)" }}
          />
        </button>
      </div>
      {on && (
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">EVERY DAY AT</span>
          <input
            type="time"
            value={time}
            onChange={(e) => onTime(e.target.value)}
            className="w-20 bg-transparent text-right font-display text-[14px] outline-none"
          />
        </div>
      )}
    </div>
  );
}
