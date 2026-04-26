import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { JOURNAL_LIST } from "@/lib/journals";
import { Flame, ChevronRight } from "lucide-react";

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  // Allow today missing — count back from yesterday if today not done yet.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Home() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: completionDates = [] } = useQuery({
    queryKey: ["streak", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("created_at")
        .eq("user_id", user!.id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((d) => d.created_at as string);
    },
  });

  const streak = calcStreak(completionDates);
  const today = new Date();
  const firstName = profile?.display_name?.split(" ")[0] ?? "";

  return (
    <div className="px-6 pt-12 animate-fade-up">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {format(today, "EEEE, MMM d")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">
          {firstName ? `Hello, ${firstName}.` : "Hello."}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">What does today need?</p>
      </header>

      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-amber shadow-glow">
          <Flame className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{streak}</span>
            <span className="text-sm text-muted-foreground">day{streak === 1 ? "" : "s"} streak</span>
          </div>
          <p className="text-xs text-muted-foreground/80">
            {streak === 0 ? "Start with a single entry today." : "Keep the rhythm going."}
          </p>
        </div>
      </div>

      <h2 className="mb-3 px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Practices</h2>
      <div className="space-y-3">
        {JOURNAL_LIST.map((j, idx) => {
          const Icon = j.icon;
          return (
            <Link
              key={j.id}
              to={`/journal/${j.id}`}
              className="group block rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card transition-spring hover:border-primary/40 hover:shadow-glow active:scale-[0.98]"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-amber transition-smooth group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-base font-semibold">{j.title}</h3>
                    <span className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">{j.durationMinutes} min</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{j.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-smooth group-hover:translate-x-0.5 group-hover:text-amber" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
