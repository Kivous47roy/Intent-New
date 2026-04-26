import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, Check } from "lucide-react";
import { JOURNALS, type JournalType } from "@/lib/journals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type SortBucket = "do" | "defer" | "delete";
type IfThen = { if: string; then: string };

function fmt(seconds: number) {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const s = (abs % 60).toString().padStart(2, "0");
  return `${seconds < 0 ? "+" : ""}${m}:${s}`;
}

export default function JournalSession() {
  const { type } = useParams<{ type: JournalType }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const config = type ? JOURNALS[type] : undefined;

  const total = (config?.durationMinutes ?? 5) * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(true);
  const [text, setText] = useState("");
  const [threes, setThrees] = useState<string[]>(["", "", ""]);
  const [ifThens, setIfThens] = useState<IfThen[]>([
    { if: "", then: "" },
    { if: "", then: "" },
    { if: "", then: "" },
  ]);
  const [phase, setPhase] = useState<"write" | "sort">("write");
  const [sorts, setSorts] = useState<Record<number, SortBucket>>({});
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    setSeconds(total);
    startRef.current = Date.now();
  }, [total]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!config) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-ink-3">Unknown ritual.</div>
    );
  }

  const Icon = config.icon;
  const accent = `hsl(var(${config.accentVar}))`;
  const elapsed = total - seconds;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const overtime = seconds < 0;

  const dumpLines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const wordCount = (() => {
    if (config.structured === "three") return threes.filter((t) => t.trim()).length;
    if (config.structured === "ifthen") return ifThens.filter((p) => p.if.trim() || p.then.trim()).length;
    return text.trim().split(/\s+/).filter(Boolean).length;
  })();

  const meta = (() => {
    if (phase === "sort") return `${Object.keys(sorts).length} / ${dumpLines.length} sorted`;
    if (config.structured) return `${wordCount} / 3 written`;
    return `${wordCount} words`;
  })();

  const ctaLabel = phase === "sort" ? "Mark complete" : config.sortAfter ? "Sort it out" : "Mark complete";

  const handleCta = async () => {
    if (phase === "write" && config.sortAfter) {
      if (dumpLines.length === 0) {
        toast.error("Write a few thoughts first.");
        return;
      }
      setPhase("sort");
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      let content = text;
      let structured: any = null;
      if (config.structured === "three") {
        content = threes.map((t, i) => `${i + 1}. ${t}`).join("\n");
        structured = { items: threes };
      } else if (config.structured === "ifthen") {
        content = ifThens
          .map((p, i) => `Plan ${i + 1}: If ${p.if}, then I will ${p.then}.`)
          .join("\n");
        structured = { plans: ifThens };
      } else if (config.sortAfter) {
        structured = {
          do: dumpLines.filter((_, i) => sorts[i] === "do"),
          defer: dumpLines.filter((_, i) => sorts[i] === "defer"),
          delete: dumpLines.filter((_, i) => sorts[i] === "delete"),
          unsorted: dumpLines.filter((_, i) => !sorts[i]),
        };
      }

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
      toast.success("Kept.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="paper-bg flex min-h-dvh flex-col">
      {/* per-journal subtle pattern overlay */}
      <div className={`pointer-events-none fixed inset-0 z-0 opacity-30 pat-${config.pattern}`} aria-hidden />

      <div className="safe-top" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-white/40 text-ink-2 transition-colors hover:text-ink"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-paper">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${running ? "pulse-dot" : ""}`}
            style={{ background: accent }}
          />
          <span className="font-mono text-[13px] tabular-nums tracking-[0.05em]">{fmt(seconds)}</span>
          <button
            onClick={() => setRunning((r) => !r)}
            className="ml-1 opacity-90"
            aria-label={running ? "Pause" : "Play"}
          >
            {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>

        <div className="h-10 w-10" />
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-px bg-ink/10">
        <div
          className="h-px transition-all duration-1000"
          style={{ width: `${pct}%`, background: overtime ? accent : "hsl(var(--ink))" }}
        />
      </div>

      {/* Title + prompt */}
      <div className="px-6 pt-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-ink bg-paper"
            style={{ color: accent }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              {config.number} · {config.title}
            </p>
            <p className="mt-1 font-serif text-[16px] italic leading-snug text-ink-2">
              {phase === "sort" ? "Tap a bucket for each thought." : config.prompt}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col px-6 pb-32 pt-5">
        {phase === "write" && config.structured === "three" && (
          <div className="space-y-5">
            {threes.map((v, i) => (
              <div key={i}>
                <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-3">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <input
                  value={v}
                  onChange={(e) => {
                    const n = threes.slice();
                    n[i] = e.target.value;
                    setThrees(n);
                  }}
                  placeholder={config.placeholders?.[i] ?? ""}
                  className="w-full border-b border-line bg-transparent pb-3 font-serif text-[17px] leading-[1.5] outline-none placeholder:text-ink-3/70"
                />
              </div>
            ))}
          </div>
        )}

        {phase === "write" && config.structured === "ifthen" && (
          <div className="space-y-5">
            {ifThens.map((v, i) => (
              <div key={i} className="border-b border-line pb-3">
                <p className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-3">
                  PLAN {String(i + 1).padStart(2, "0")}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-[17px] italic text-ink-2">If</span>
                  <input
                    value={v.if}
                    onChange={(e) => {
                      const n = ifThens.slice();
                      n[i] = { ...n[i], if: e.target.value };
                      setIfThens(n);
                    }}
                    placeholder="it's 9am and the laptop is open"
                    className="flex-1 bg-transparent font-serif text-[17px] outline-none placeholder:text-ink-3/70"
                  />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-serif text-[17px] italic text-ink-2">then I will</span>
                  <input
                    value={v.then}
                    onChange={(e) => {
                      const n = ifThens.slice();
                      n[i] = { ...n[i], then: e.target.value };
                      setIfThens(n);
                    }}
                    placeholder="open the doc and write one sentence"
                    className="flex-1 bg-transparent font-serif text-[17px] outline-none placeholder:text-ink-3/70"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === "write" && !config.structured && (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={config.id === "brain_dump" ? "one thought per line\nor however it spills out…" : "just begin…"}
            className={`min-h-[40vh] flex-1 resize-none bg-transparent font-serif text-[18px] leading-[1.55] outline-none placeholder:text-ink-3/70 ${
              config.id === "expressive" ? "ruled" : ""
            }`}
          />
        )}

        {phase === "sort" && (
          <div className="space-y-2">
            {dumpLines.map((line, i) => {
              const v = sorts[i];
              return (
                <div key={i} className="rounded border border-line-strong bg-white/50 p-3">
                  <p className="mb-2.5 font-serif text-[15px] leading-[1.4]">{line}</p>
                  <div className="flex gap-1.5">
                    {(["do", "defer", "delete"] as const).map((k) => {
                      const active = v === k;
                      return (
                        <button
                          key={k}
                          onClick={() => setSorts({ ...sorts, [i]: k })}
                          className="flex-1 rounded border py-2 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors"
                          style={{
                            borderColor: active ? "hsl(var(--ink))" : "hsl(var(--ink) / 0.18)",
                            background: active ? "hsl(var(--ink))" : "transparent",
                            color: active ? "hsl(var(--paper))" : "hsl(var(--ink-2))",
                          }}
                        >
                          {k}
                          <div className="mt-0.5 text-[8px] tracking-normal opacity-70">
                            {k === "do" ? "now" : k === "defer" ? "later" : "release"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-paper via-paper to-transparent pt-6">
        <div className="mx-auto max-w-md px-6 pb-7">
          <div className="mb-2.5 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.12em] text-ink-3">{meta}</span>
            <div className="h-px flex-1 bg-ink/10" />
            <span
              className="font-mono text-[10px] tracking-[0.12em]"
              style={{ color: seconds <= 0 ? accent : "hsl(var(--ink-3))" }}
            >
              {seconds <= 0 ? "TIMER · DONE" : `TIMER · ${fmt(seconds)}`}
            </span>
          </div>

          <button
            onClick={handleCta}
            disabled={submitting}
            className="flex h-14 w-full items-center justify-between rounded bg-ink px-5 py-4 text-paper transition-opacity disabled:opacity-60"
          >
            <span className="text-[15px] font-medium">{submitting ? "Saving…" : ctaLabel}</span>
            <Check className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
}
