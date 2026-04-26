import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { JOURNALS, type JournalType } from "@/lib/journals";

function dateLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
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
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Group by date label
  const groups = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const key = dateLabel(new Date(e.created_at));
    (acc[key] ||= []).push(e);
    return acc;
  }, {});

  return (
    <div className="px-6 pt-12 animate-fade-up">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your journal</p>
        <h1 className="mt-2 text-3xl font-semibold">History</h1>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No entries yet. Your reflections will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          {Object.entries(groups).map(([label, list]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</h2>
              <div className="space-y-2">
                {list.map((e) => {
                  const cfg = JOURNALS[e.journal_type as JournalType];
                  const Icon = cfg.icon;
                  const preview = (e.content ?? "").trim().split("\n")[0]?.slice(0, 90) ?? "";
                  return (
                    <article
                      key={e.id}
                      className="rounded-2xl border border-border/60 bg-gradient-card p-4 shadow-card"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-amber">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold">{cfg.title}</h3>
                            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                              {format(new Date(e.created_at), "h:mm a")}
                            </span>
                          </div>
                          {preview && (
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{preview}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
