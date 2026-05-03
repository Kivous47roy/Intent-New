import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, isToday as isTodayFn } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JOURNALS, type JournalType } from "@/lib/journals";
import { Calendar } from "@/components/ui/calendar";

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  const totalWords = entries.reduce(
    (sum: number, e: any) => sum + (e.content ?? "").trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const wordsLabel = totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords);

  const writtenDays = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e: any) => set.add(dayKey(new Date(e.created_at))));
    return set;
  }, [entries]);

  const writtenDates = useMemo(
    () => Array.from(writtenDays).map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m - 1, d);
    }),
    [writtenDays],
  );

  const dayEntries = useMemo(
    () => entries.filter((e: any) => isSameDay(new Date(e.created_at), selectedDay)),
    [entries, selectedDay],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="safe-top" />

      <div className="px-5 pt-2">
        <h1 className="font-display text-[24px] leading-[1.05]">
          What you've <em className="font-serif not-italic font-normal italic">kept</em>.
        </h1>
      </div>

      {/* Stats strip */}
      <div className="mx-5 mt-2.5 overflow-hidden rounded border border-line-strong bg-white/40">
        <div className="flex">
          {[
            { n: String(streak), l: "STREAK" },
            { n: String(totalEntries), l: "ENTRIES" },
            { n: wordsLabel, l: "WORDS" },
          ].map((s, i) => (
            <div key={s.l} className={`flex-1 px-3 py-2 ${i ? "border-l border-line" : ""}`}>
              <div className="font-display text-[18px] leading-none">{s.n}</div>
              <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-ink-3">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="mx-5 mt-3 flex justify-center rounded border border-line bg-white/40">
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={(d) => {
            if (d) {
              setSelectedDay(d);
              setExpandedId(null);
            }
          }}
          disabled={(date) => date > new Date()}
          modifiers={{ written: writtenDates }}
          modifiersClassNames={{
            written:
              "relative font-semibold text-primary underline underline-offset-[6px] decoration-2 decoration-primary",
          }}
          classNames={{
            day_today:
              "ring-2 ring-primary ring-offset-1 ring-offset-background rounded-full font-bold text-ink",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
          }}
          className="p-2 pointer-events-auto mx-auto"
        />
      </div>

      {/* Day detail */}
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-3">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
            {format(selectedDay, "EEE, d MMM").toUpperCase()}
          </span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] text-ink-3">
            {dayEntries.length} {dayEntries.length === 1 ? "ENTRY" : "ENTRIES"}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-ink-3">Loading…</p>
        ) : dayEntries.length === 0 ? (
          <p className="font-serif text-[14px] italic text-ink-3">
            {isTodayFn(selectedDay) ? "Today is still open." : "Nothing written."}
          </p>
        ) : (
          <div className="space-y-2">
            {dayEntries.map((e: any) => {
              const cfg = JOURNALS[e.journal_type as JournalType];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <div
                  key={e.id}
                  className="rounded border border-line bg-white/60 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: `hsl(var(${cfg.accentVar}))` }}
                      strokeWidth={1.8}
                    />
                    <span className="font-serif text-[15px] font-medium">{cfg.title}</span>
                    <span className="ml-auto font-mono text-[10px] tracking-[0.04em] text-ink-3">
                      {format(new Date(e.created_at), "HH:mm")}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-ink">
                    {e.content?.trim() || <span className="italic text-ink-3">No content.</span>}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
