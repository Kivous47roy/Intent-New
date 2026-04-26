import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JOURNALS, type JournalType } from "@/lib/journals";

function startOfDayKey(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

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

export default function History() {
  const { user } = useAuth();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const streak = calcStreak(entries.map((e: any) => e.created_at));
  const totalEntries = entries.length;
  const totalWords = entries.reduce((sum: number, e: any) => sum + ((e.content ?? "").trim().split(/\s+/).filter(Boolean).length), 0);
  const wordsLabel = totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords);

  const days = useMemo(() => {
    const arr: { d: Date; key: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push({ d, key: startOfDayKey(d) });
    }
    return arr;
  }, []);

  const entriesByDay = useMemo(() => {
    const m: Record<string, typeof entries> = {};
    entries.forEach((e: any) => {
      const k = startOfDayKey(new Date(e.created_at));
      (m[k] ||= []).push(e);
    });
    return m;
  }, [entries]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="safe-top" />

      <div className="px-6 pt-3">
        <div className="mb-3 flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">HISTORY</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[11px] text-ink-3">14 DAYS</span>
        </div>
        <h1 className="font-display text-[34px] leading-[1.05]">
          What you've<br />
          <em className="font-serif not-italic font-normal italic">kept</em>.
        </h1>
      </div>

      {/* Stats strip */}
      <div className="mx-6 mt-5 overflow-hidden rounded border border-line-strong bg-white/40">
        <div className="flex">
          {[
            { n: String(streak), l: "STREAK" },
            { n: String(totalEntries), l: "ENTRIES" },
            { n: wordsLabel, l: "WORDS" },
          ].map((s, i) => (
            <div key={s.l} className={`flex-1 px-4 py-3 ${i ? "border-l border-line" : ""}`}>
              <div className="font-display text-[24px]">{s.n}</div>
              <div className="mt-0.5 font-mono text-[10px] tracking-[0.12em] text-ink-3">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-5">
        <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-3">── ENTRIES</p>
      </div>

      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : (
          <div>
            {days.map(({ d, key }, i) => {
              const dayEntries = entriesByDay[key] ?? [];
              const isToday = i === 0;
              return (
                <div key={key} className="flex gap-4 border-t border-line py-3.5">
                  <div className="w-14 shrink-0">
                    <div
                      className={`font-display text-[26px] leading-none ${isToday ? "italic" : ""}`}
                    >
                      {String(d.getDate()).padStart(2, "0")}
                    </div>
                    <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-3">
                      {format(d, "EEE").toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    {dayEntries.length === 0 ? (
                      <p className="font-serif text-[14px] italic text-ink-3">
                        {isToday ? "Today is still open." : "—"}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayEntries.map((e: any) => {
                          const cfg = JOURNALS[e.journal_type as JournalType];
                          if (!cfg) return null;
                          const Icon = cfg.icon;
                          const preview = (e.content ?? "")
                            .trim()
                            .replace(/\s+/g, " ")
                            .slice(0, 36);
                          return (
                            <div
                              key={e.id}
                              className="flex items-center gap-2.5 rounded border border-line bg-white/50 px-2.5 py-1.5"
                            >
                              <Icon
                                className="h-3.5 w-3.5 shrink-0"
                                style={{ color: `hsl(var(${cfg.accentVar}))` }}
                                strokeWidth={1.8}
                              />
                              <span className="font-serif text-[14px] font-medium">{cfg.title}</span>
                              <span className="ml-auto truncate font-mono text-[10px] tracking-[0.04em] text-ink-3">
                                {preview}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
