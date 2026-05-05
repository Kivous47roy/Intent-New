import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, getDaysInMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JOURNALS, type JournalType } from "@/lib/journals";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const WEEK_DAYS = ["S","M","T","W","T","F","S"];

function isoKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export default function History() {
  const { user } = useAuth();
  const today = new Date();
  const todayKey = isoKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries").select("*")
        .eq("user_id", user!.id).eq("completed", true)
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const streak = calcStreak(entries.map((e: any) => e.created_at));
  const totalEntries = entries.length;
  const totalWords = entries.reduce(
    (s: number, e: any) => s + (e.content ?? "").trim().split(/\s+/).filter(Boolean).length, 0
  );
  const wordsLabel = totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords);

  const entriesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    entries.forEach((e: any) => {
      const d = new Date(e.created_at);
      const k = isoKey(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return map;
  }, [entries]);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(new Date(viewYear, viewMonth));

  const cells: ({ d: number; key: string } | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      d: i + 1,
      key: isoKey(viewYear, viewMonth, i + 1),
    })),
  ];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const selEntries = entriesByDay[selectedKey] || [];
  const selDate = (() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return { weekday: format(dt, "EEEE"), d, monthName: MONTH_NAMES[m - 1] };
  })();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="safe-top" />

      {/* Header */}
      <div className="px-5 pt-2">
        <div className="mb-1 flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">JOURNAL</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] text-ink-3">CALENDAR</span>
        </div>
        <h1 className="font-display text-[28px] leading-[1.05]">
          Your <em className="font-serif not-italic font-normal italic">journal</em>.
        </h1>
      </div>

      {/* Stats strip */}
      <div className="mx-5 mt-2 overflow-hidden rounded border border-line-strong bg-white/40">
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

      {/* Month nav */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded border border-line-strong bg-white/40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-[20px] font-light leading-none">
          {MONTH_NAMES[viewMonth]}{" "}
          <em className="font-serif not-italic italic">{viewYear}</em>
        </span>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded border border-line-strong bg-white/40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 px-5">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className="py-1 text-center font-mono text-[10px] tracking-[0.12em] text-ink-3">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-5">
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const has = !!(entriesByDay[c.key]?.length);
          const isSel = c.key === selectedKey;
          const isToday = c.key === todayKey;
          const dayEntries = entriesByDay[c.key] || [];
          return (
            <button
              key={i}
              onClick={() => setSelectedKey(c.key)}
              className="aspect-square flex flex-col items-center justify-center rounded border transition-colors"
              style={{
                borderColor: isSel
                  ? "hsl(var(--ink))"
                  : has ? "hsl(var(--ink) / 0.22)" : "transparent",
                background: isSel
                  ? "hsl(var(--ink))"
                  : has ? "rgba(255,253,247,0.85)" : "transparent",
                color: isSel
                  ? "hsl(var(--paper))"
                  : has ? "hsl(var(--ink))" : "hsl(var(--ink) / 0.4)",
                opacity: has ? 1 : 0.55,
                cursor: has || isToday ? "pointer" : "default",
              }}
            >
              <span
                className="font-display text-[15px] font-light leading-none"
                style={{ fontStyle: isToday ? "italic" : "normal" }}
              >
                {c.d}
              </span>
              {has && (
                <div className="mt-1 flex gap-[2px]">
                  {dayEntries.slice(0, 4).map((e: any, idx: number) => {
                    const cfg = JOURNALS[e.journal_type as JournalType];
                    return (
                      <span
                        key={idx}
                        className="h-1 w-1 rounded-full"
                        style={{
                          background: isSel
                            ? "hsl(var(--paper))"
                            : cfg ? `hsl(var(${cfg.accentVar}))` : "hsl(var(--ink))",
                        }}
                      />
                    );
                  })}
                </div>
              )}
              {!has && isToday && (
                <div className="mt-1 h-1 w-1 rounded-full" style={{ background: "hsl(var(--accent))" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-5 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-line-strong bg-paper/80" />
          <span className="font-mono text-[9px] tracking-[0.1em] text-ink-3">WROTE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-line-strong" />
          <span className="font-mono text-[9px] tracking-[0.1em] text-ink-3">EMPTY</span>
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        <div className="rounded border border-line-strong bg-card-paper/70 p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                {selDate.weekday.toUpperCase()}
              </div>
              <div className="font-display text-[22px] font-light leading-[1.05]">
                {selDate.monthName}{" "}
                <em className="font-serif not-italic italic">{selDate.d}</em>
              </div>
            </div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3">
              {selEntries.length} {selEntries.length === 1 ? "ENTRY" : "ENTRIES"}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-ink-3">Loading…</p>
          ) : selEntries.length === 0 ? (
            <p className="font-serif text-[14px] italic text-ink-3">
              {selectedKey === todayKey ? "Today is still open." : "No entries this day."}
            </p>
          ) : (
            <div className="space-y-0">
              {selEntries.map((e: any, idx: number) => {
                const cfg = JOURNALS[e.journal_type as JournalType];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <div key={e.id} className={`${idx ? "mt-3 border-t border-line pt-3" : ""}`}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: `hsl(var(${cfg.accentVar}))` }}
                        strokeWidth={1.8}
                      />
                      <span className="font-serif text-[14px] font-medium">{cfg.title}</span>
                      <span className="flex-1" />
                      <span className="font-mono text-[9px] tracking-[0.1em] text-ink-3">
                        {format(new Date(e.created_at), "HH:mm")}
                      </span>
                    </div>
                    <p className="font-serif text-[13px] leading-[1.55] text-ink-2 line-clamp-3">
                      {e.content?.trim() || <span className="italic text-ink-3">No content.</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
