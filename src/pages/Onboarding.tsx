import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { JOURNAL_LIST } from "@/lib/journals";

const ACCENT_CYCLE = [
  "--j-brain",
  "--j-gratitude",
  "--j-expressive",
  "--j-intention",
  "--j-retrieval",
  "--j-affirmation",
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // Goals state for step 1
  const [goals, setGoals] = useState<{ emoji: string; title: string }[]>([]);
  const [addingGoal, setAddingGoal] = useState(false);
  const [newEmoji, setNewEmoji] = useState("✦");
  const [newTitle, setNewTitle] = useState("");

  const addGoal = () => {
    if (!newTitle.trim()) return;
    setGoals((prev) => [...prev, { emoji: newEmoji || "✦", title: newTitle.trim() }]);
    setNewTitle("");
    setNewEmoji("✦");
    setAddingGoal(false);
  };

  const removeGoal = (i: number) => {
    setGoals((prev) => prev.filter((_, idx) => idx !== i));
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save name + complete onboarding
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || "Friend",
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      // Save goals
      if (goals.length > 0) {
        const rows = goals.map((g, i) => ({
          user_id: user.id,
          title: g.title,
          emoji: g.emoji,
          accent_var: ACCENT_CYCLE[i % ACCENT_CYCLE.length],
          position: i,
        }));
        const { error: habitsError } = await supabase.from("habits").insert(rows);
        if (habitsError) throw habitsError;
      }

      await qc.invalidateQueries({ queryKey: ["profile"] });
      await qc.invalidateQueries({ queryKey: ["habits"] });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else finish();
  };

  const ctaDisabled = (step === 0 && !name.trim()) || saving;
  const ctaLabel =
    step === 0 ? "Continue" : step === 1 ? "Continue" : saving ? "Saving…" : "Start journaling";

  return (
    <div className="paper-bg flex min-h-dvh flex-col">
      <div className="safe-top" />

      {/* Progress bar */}
      <div className="flex gap-1.5 px-6 pt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-sm transition-colors duration-300"
            style={{
              background: i <= step ? "hsl(var(--ink))" : "hsl(var(--ink) / 0.18)",
            }}
          />
        ))}
      </div>

      {/* Mark */}
      <div className="mt-3 flex items-center gap-2 px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">INTENT</span>
        <div className="h-px flex-1 bg-ink/10" />
        <span className="font-mono text-[11px] text-ink-3">{String(step + 1).padStart(2, "0")} / 03</span>
      </div>

      <div className="flex flex-1 flex-col px-7 pt-10" key={step}>

        {/* Step 0 — Name */}
        {step === 0 && (
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── YOUR NAME</p>
            <h2 className="font-display text-[38px] leading-[1.05]">
              What should<br />
              we call <em className="font-serif not-italic font-normal italic">you</em>?
            </h2>
            <div className="mt-10 border-b-2 border-ink pb-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && next()}
                placeholder="Your name"
                className="w-full bg-transparent font-serif text-[30px] outline-none placeholder:text-ink-3"
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-ink-3">Used only for your greeting.</p>
          </div>
        )}

        {/* Step 1 — Everyday Goals */}
        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── EVERYDAY GOALS</p>
            <h2 className="font-display text-[34px] leading-[1.05]">
              What do you want<br />
              to do <em className="font-serif not-italic font-normal italic">every day</em>?
            </h2>
            <p className="mt-3 mb-6 text-[14px] leading-[1.5] text-ink-2">
              Add a few small goals. You can always change these in your Profile.
            </p>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {goals.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-line-strong bg-card-paper px-3.5 py-3"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                    style={{ borderColor: `hsl(var(${ACCENT_CYCLE[i % ACCENT_CYCLE.length]}))` }}
                  >
                    <span className="text-[14px]">{g.emoji}</span>
                  </div>
                  <span className="flex-1 font-serif text-[15px]">{g.title}</span>
                  <button
                    onClick={() => removeGoal(i)}
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
                      className="w-12 rounded border border-line bg-paper px-2 py-1.5 text-center font-serif text-[16px] outline-none focus:border-ink"
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
                        if (e.key === "Enter" && newTitle.trim()) addGoal();
                        if (e.key === "Escape") { setAddingGoal(false); setNewTitle(""); }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addGoal}
                      disabled={!newTitle.trim()}
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
                  className="flex w-full items-center gap-2 rounded border border-dashed border-line px-3.5 py-3 text-ink-3 hover:text-ink-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Add a goal</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Six Short Rituals overview */}
        {step === 2 && (
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── YOUR PRACTICE</p>
            <h1 className="font-display text-[40px] leading-[1.05]">
              Six short<br />
              writing rituals.<br />
              <em className="font-serif not-italic font-normal italic">One quiet</em>
              <br />
              <em className="font-serif not-italic font-normal italic">practice.</em>
            </h1>
            <div className="mt-8 space-y-2">
              {JOURNAL_LIST.map((j) => {
                const Icon = j.icon;
                return (
                  <div key={j.id} className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-ink/20 bg-paper"
                      style={{ color: `hsl(var(${j.accentVar}))` }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-serif text-[14px] text-ink">{j.title}</span>
                      <span className="ml-2 font-mono text-[10px] text-ink-3">{j.durationMinutes}m</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-[14px] leading-[1.5] text-ink-2">
              Pick one a day. Some mornings, some nights. Build it slow.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 pt-6">
        {step === 1 && (
          <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-3">
            {goals.length === 0 ? "You can add goals later in Profile" : `${goals.length} goal${goals.length > 1 ? "s" : ""} added`}
          </p>
        )}
        <button
          onClick={next}
          disabled={ctaDisabled}
          className="flex h-14 w-full items-center justify-between rounded px-6 text-[15px] font-medium transition-colors"
          style={{
            background: ctaDisabled ? "hsl(var(--paper-3))" : "hsl(var(--ink))",
            color: ctaDisabled ? "hsl(var(--ink-3))" : "hsl(var(--paper))",
          }}
        >
          <span>{ctaLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
