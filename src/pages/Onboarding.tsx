import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sun } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [time, setTime] = useState("07:30");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim(),
          morning_reminder_time: time,
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

  return (
    <div className="flex min-h-dvh flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-sm flex-1 animate-fade-up">
        <div className="mb-10">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-amber shadow-glow">
            <Sun className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <h1 className="text-3xl font-semibold leading-tight">Let's set things up.</h1>
          <p className="mt-3 text-base text-muted-foreground">Just two quick details to start.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Your name</Label>
            <Input
              id="name"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="h-14 rounded-xl bg-card/60 border-border/70 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-xs uppercase tracking-wider text-muted-foreground">Morning reminder</Label>
            <Input
              id="time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-14 rounded-xl bg-card/60 border-border/70 text-base"
            />
            <p className="text-xs text-muted-foreground/80">A gentle nudge to start your day with intention.</p>
          </div>

          <Button
            type="submit"
            disabled={saving || !name.trim()}
            className="h-14 w-full rounded-xl bg-gradient-amber text-base font-semibold text-primary-foreground shadow-glow hover:opacity-95"
          >
            {saving ? "Saving…" : "Begin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
