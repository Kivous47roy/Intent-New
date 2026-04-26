import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [time, setTime] = useState("07:30");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setTime(profile.morning_reminder_time ?? "07:30");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), morning_reminder_time: time })
        .eq("user_id", user.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pt-12 animate-fade-up">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground truncate">{user?.email}</p>
      </header>

      <div className="space-y-5 rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-card">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-background/50 border-border/70" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Morning reminder</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12 rounded-xl bg-background/50 border-border/70" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="h-12 w-full rounded-xl bg-gradient-amber font-semibold text-primary-foreground shadow-glow">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Button
        variant="ghost"
        onClick={signOut}
        className="mt-6 h-12 w-full rounded-xl text-muted-foreground hover:text-foreground"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
