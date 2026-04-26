ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS evening_reminder_time time without time zone DEFAULT '21:00';