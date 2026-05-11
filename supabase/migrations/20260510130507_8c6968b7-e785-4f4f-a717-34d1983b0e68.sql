
-- Add notification + branding fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_lead_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS notify_new_episodes boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_releases boolean NOT NULL DEFAULT true;

-- Branding bucket for app logo (single global logo at branding/logo.png)
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Branding public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can upload branding"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'branding');

CREATE POLICY "Authenticated users can update branding"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'branding');

CREATE POLICY "Authenticated users can delete branding"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'branding');

-- Last-sent tracking for daily email reminder dedupe
CREATE TABLE IF NOT EXISTS public.reminder_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_id uuid NOT NULL,
  sent_for_date date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reminder_id, sent_for_date)
);

ALTER TABLE public.reminder_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email log"
ON public.reminder_email_log FOR SELECT
USING (auth.uid() = user_id);
