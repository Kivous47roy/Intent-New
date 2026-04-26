import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Welcome to Intent.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/`,
    });
    if (error) toast.error(error.message ?? "Google sign-in failed");
  };

  return (
    <div className="paper-bg flex min-h-dvh flex-col items-center justify-center px-7">
      <div className="mx-auto w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-baseline gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">INTENT</span>
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[11px] text-ink-3">{mode === "signup" ? "01 / NEW" : "01 / RETURN"}</span>
        </div>

        <h1 className="font-display text-[40px] leading-[1.05]">
          Six short<br />
          writing rituals.<br />
          <em className="font-serif not-italic font-normal italic">One quiet practice.</em>
        </h1>
        <p className="mt-5 max-w-[300px] text-[14px] leading-[1.5] text-ink-2">
          {mode === "signup" ? "Make an account to keep your streak and entries." : "Welcome back. Sign in to continue."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded border border-line-strong bg-white/50 text-[14px] text-ink transition-colors hover:bg-white/80"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">OR</span>
          <div className="h-px flex-1 bg-ink/10" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-b border-ink bg-transparent pb-2 font-serif text-[18px] outline-none"
              placeholder="you@somewhere.com"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-b border-ink bg-transparent pb-2 font-serif text-[18px] outline-none"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 flex h-14 w-full items-center justify-between rounded bg-ink px-5 py-4 text-paper transition-opacity disabled:opacity-60"
          >
            <span className="text-[15px] font-medium">
              {submitting ? "Just a moment…" : mode === "signup" ? "Create account" : "Sign in"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-5 w-full text-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-ink"
        >
          {mode === "signup" ? "Already have an account · Sign in" : "New here · Create account"}
        </button>
      </div>
    </div>
  );
}
