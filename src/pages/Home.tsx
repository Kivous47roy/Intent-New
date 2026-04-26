import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { JOURNAL_LIST, TOTAL_RITUALS } from "@/lib/journals";
import { Flame, Check } from "lucide-react";

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
  const today = new Date();

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

  const streak = calcStreak(completionDates.map((d) => d.created_at as string));
  const todayKey = today.toISOString().slice(0, 10);
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
      <div className="px-6 pt-3">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">INTENT</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-3">
            {format(today, "yyyy.MM.dd")}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-sm italic text-ink-2">
              {greeting(today)}{firstName ? `, ${firstName}` : ""}.
            </p>
            <h1 className="mt-1 font-display text-[38px] leading-[1.05] text-ink">
              {format(today, "EEEE")}<span className="text-ink-3">,</span>
              <br />
              <em className="font-serif not-italic font-normal italic">{format(today, "MMM d")}.</em>
            </h1>
          </div>

          {/* Streak coin */}
          <div className={`flex shrink-0 items-center gap-2 rounded-full border border-ink bg-paper-2 px-3 py-2 ${streak > 0 ? "animate-streak-pop" : ""}`}>
            <Flame className="h-4 w-4" style={{ color: "hsl(var(--accent))" }} strokeWidth={2} />
            <span className="font-display text-[22px] leading-none">{streak}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">DAYS</span>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="mt-7 flex items-center gap-3 px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          ── TODAY'S RITUALS · {completedToday.size} / {TOTAL_RITUALS}
        </span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      {/* Cards */}
      <div className="flex-1 px-6 pb-6 pt-3">
        <div className="space-y-2.5">
          {JOURNAL_LIST.map((j) => {
            const Icon = j.icon;
            const done = completedToday.has(j.id);
            const accent = `hsl(var(${j.accentVar}))`;
            return (
              <Link
                key={j.id}
                to={`/journal/${j.id}`}
                className={`relative block overflow-hidden rounded border p-4 transition-transform active:scale-[0.99] ${
                  done ? "border-line bg-paper-2 opacity-70" : "border-line-strong bg-card-paper"
                }`}
              >
                {/* Pattern background */}
                <div
                  className={`pointer-events-none absolute inset-0 opacity-50 pat-${j.pattern}`}
                  aria-hidden
                />
                <div className="relative flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-ink bg-paper"
                    style={{ color: accent }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif text-[17px] font-medium leading-tight text-ink">
                        {j.title}
                      </h3>
                      <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3">{j.number}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{j.blurb}</p>
                    {j.timeOfDay !== "anytime" && (
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                        {j.timeOfDay === "morning" ? "MORNING" : "NIGHT"}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {done ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </div>
                    ) : (
                      <span className="rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-[0.05em] text-ink-2">
                        {j.durationMinutes} MIN
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer quote */}
        <div className="mt-7 border-t border-line pt-5">
          <p className="font-serif text-[15px] italic leading-[1.45] text-ink-2">
            "The faintest ink is more durable than the strongest memory."
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
            — CHINESE PROVERB
          </p>
        </div>
      </div>
    </div>
  );
}
