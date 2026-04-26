import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MORNING_PRESETS = ["06:30", "07:00", "07:30", "08:00"];
const EVENING_PRESETS = ["20:00", "20:30", "21:00", "21:30"];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [morning, setMorning] = useState("07:30");
  const [evening, setEvening] = useState("21:00");
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (step === 0) return setStep(1);
    if (step === 1) return setStep(2);
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || "Friend",
          morning_reminder_time: morning,
          evening_reminder_time: evening,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const ctaDisabled = (step === 1 && !name.trim()) || saving;
  const ctaLabel = step === 0 ? "Begin" : step === 1 ? "Continue" : saving ? "Saving…" : "Start journaling";

  return (
    <div className="paper-bg flex min-h-dvh flex-col">
      <div className="safe-top" />

      {/* progress dots */}
      <div className="flex gap-1.5 px-6 pt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-sm transition-colors"
            style={{
              background: i <= step ? "hsl(var(--ink))" : "hsl(var(--ink) / 0.18)",
            }}
          />
        ))}
      </div>

      {/* mark */}
      <div className="mt-3 flex items-center gap-2 px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">INTENT</span>
        <div className="h-px flex-1 bg-ink/10" />
        <span className="font-mono text-[11px] text-ink-3">{String(step + 1).padStart(2, "0")} / 03</span>
      </div>

      <div className="flex flex-1 flex-col justify-center px-7 animate-fade-up" key={step}>
        {step === 0 && (
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── WELCOME</p>
            <h1 className="font-display text-[44px] leading-[1.05]">
              Six short<br />
              writing rituals.<br />
              <em className="font-serif not-italic font-normal italic">One quiet</em>
              <br />
              <em className="font-serif not-italic font-normal italic">practice.</em>
            </h1>
            <p className="mt-7 max-w-[300px] text-[15px] leading-[1.5] text-ink-2">
              Brain dump. Gratitude. Raw feeling. Implementation intentions. Retrieval. Affirmation. Pick one a day.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── YOUR NAME</p>
            <h2 className="font-display text-[36px] leading-[1.1]">
              What should we<br />call you?
            </h2>
            <div className="mt-9 border-b border-ink pb-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                className="w-full bg-transparent font-serif text-[28px] outline-none placeholder:text-ink-3"
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-ink-3">Used only for gentle nudges.</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">── DAILY NUDGES</p>
            <h2 className="font-display text-[34px] leading-[1.1]">
              When should we<br />remind you?
            </h2>
            <p className="mt-3 mb-6 text-[14px] leading-[1.5] text-ink-2">
              Two small notifications. Morning to set intentions, evening to wind down. You can change these any time.
            </p>

            <TimeBlock
              icon={<Sun className="h-5 w-5" strokeWidth={1.6} />}
              label="EVERY MORNING"
              value={morning}
              onChange={setMorning}
              presets={MORNING_PRESETS}
            />
            <div className="h-3" />
            <TimeBlock
              icon={<Moon className="h-5 w-5" strokeWidth={1.6} />}
              label="EVERY EVENING"
              value={evening}
              onChange={setEvening}
              presets={EVENING_PRESETS}
            />
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4">
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

function TimeBlock({
  icon,
  label,
  value,
  onChange,
  presets,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets: string[];
}) {
  return (
    <div className="overflow-hidden rounded border border-line-strong bg-white/40">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="text-ink-2">{icon}</span>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent font-display text-[32px] tracking-[-0.02em] outline-none"
        />
        <span className="text-right font-mono text-[10px] leading-tight text-ink-3">
          {label.split(" ").map((w, i) => (
            <span key={i} className="block">{w}</span>
          ))}
        </span>
      </div>
      <div className="flex border-t border-line">
        {presets.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="flex-1 border-line py-3 font-mono text-[12px] transition-colors"
            style={{
              borderLeftWidth: i ? 1 : 0,
              borderLeftStyle: "solid",
              background: t === value ? "hsl(var(--ink))" : "transparent",
              color: t === value ? "hsl(var(--paper))" : "hsl(var(--ink-2))",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
