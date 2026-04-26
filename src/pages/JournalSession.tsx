import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pause, Play, Trash2, Clock4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { JOURNALS, type JournalType } from "@/lib/journals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortBucket = "do" | "defer" | "delete";

interface BrainItem {
  id: string;
  text: string;
  bucket?: SortBucket;
}

function fmt(seconds: number) {
  const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, "0");
  const s = (Math.abs(seconds) % 60).toString().padStart(2, "0");
  return `${seconds < 0 ? "+" : ""}${m}:${s}`;
}

export default function JournalSession() {
  const { type } = useParams<{ type: JournalType }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const config = type ? JOURNALS[type] : undefined;

  const total = (config?.durationMinutes ?? 5) * 60;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(true);
  const [content, setContent] = useState("");
  const [phase, setPhase] = useState<"write" | "sort">("write");
  const [items, setItems] = useState<BrainItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setRemaining(total);
    startRef.current = Date.now();
  }, [total]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsed = total - remaining;
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const overtime = remaining < 0;

  const isBrainDump = type === "brain_dump";

  const goToSort = () => {
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: `${i}-${text.slice(0, 8)}`, text }));
    if (!lines.length) {
      toast.error("Write a few items first.");
      return;
    }
    setItems(lines);
    setPhase("sort");
  };

  const setBucket = (id: string, bucket: SortBucket) =>
    setItems((curr) => curr.map((it) => (it.id === id ? { ...it, bucket } : it)));

  const handleComplete = async () => {
    if (!user || !config) return;
    setSubmitting(true);
    try {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      const structured = isBrainDump
        ? {
            do: items.filter((i) => i.bucket === "do").map((i) => i.text),
            defer: items.filter((i) => i.bucket === "defer").map((i) => i.text),
            delete: items.filter((i) => i.bucket === "delete").map((i) => i.text),
            unsorted: items.filter((i) => !i.bucket).map((i) => i.text),
          }
        : null;

      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        journal_type: config.id,
        content,
        structured_data: structured,
        duration_seconds: duration,
        completed: true,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["streak"] });
      await qc.invalidateQueries({ queryKey: ["entries"] });
      toast.success("Session complete.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Unknown practice.
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/70 text-muted-foreground transition-smooth hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className={cn(
            "flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 font-mono text-sm tabular-nums",
            overtime ? "text-amber border-primary/40 animate-pulse-glow" : "text-foreground"
          )}>
            <Clock4 className="h-3.5 w-3.5" />
            {fmt(remaining)}
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/70 text-muted-foreground transition-smooth hover:text-foreground"
            aria-label={running ? "Pause" : "Resume"}
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full bg-gradient-amber transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-amber">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{config.title}</p>
            <h1 className="mt-0.5 text-lg font-semibold leading-snug">{config.prompt}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{config.helper}</p>
          </div>
        </div>
      </header>

      {/* Body */}
      {phase === "write" ? (
        <div className="flex flex-1 flex-col px-5 pb-32">
          <Textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isBrainDump ? "One thought per line…" : "Begin when you're ready…"}
            className="min-h-[40vh] flex-1 resize-none rounded-2xl border-border/50 bg-card/40 p-5 text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>
      ) : (
        <SortPhase items={items} setBucket={setBucket} />
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/90 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          {isBrainDump && phase === "write" ? (
            <Button
              onClick={goToSort}
              className="h-12 flex-1 rounded-xl bg-gradient-amber font-semibold text-primary-foreground shadow-glow"
            >
              Sort it →
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={submitting || (!isBrainDump && !content.trim())}
              className="h-12 flex-1 rounded-xl bg-gradient-amber font-semibold text-primary-foreground shadow-glow"
            >
              <Check className="mr-2 h-4 w-4" strokeWidth={2.6} />
              {submitting ? "Saving…" : "Complete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SortPhase({
  items,
  setBucket,
}: {
  items: BrainItem[];
  setBucket: (id: string, b: SortBucket) => void;
}) {
  const buckets: { key: SortBucket; label: string; tone: string }[] = [
    { key: "do", label: "Do", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    { key: "defer", label: "Defer", tone: "bg-primary/15 text-amber border-primary/30" },
    { key: "delete", label: "Delete", tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  ];
  return (
    <div className="flex-1 px-5 pb-32">
      <p className="mb-3 text-sm text-muted-foreground">
        Tap a bucket for each thought.
      </p>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl border border-border/50 bg-card/50 p-4 shadow-soft"
          >
            <p className="text-sm leading-relaxed">{it.text}</p>
            <div className="mt-3 flex gap-2">
              {buckets.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBucket(it.id, b.key)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-smooth",
                    it.bucket === b.key
                      ? b.tone
                      : "border-border/50 bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {b.key === "delete" ? <Trash2 className="mx-auto h-3.5 w-3.5" /> : b.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
