CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✦',
  accent_var TEXT NOT NULL DEFAULT '--j-brain',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habits" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own habits" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own habits" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.habit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, logged_date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own habit logs" ON public.habit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habit logs" ON public.habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own habit logs" ON public.habit_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_habit_logs_user_date ON public.habit_logs(user_id, logged_date DESC);

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
