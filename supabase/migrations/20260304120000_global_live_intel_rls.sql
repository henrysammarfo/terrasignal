-- TerraSignal: allow ALL authenticated users to see live intel from the system agent.
-- The Python agent pushes reports with user_id = system_agent_user_id; everyone sees that feed.
-- One-time: create a user in Supabase Auth (e.g. agent@yourdomain.com), then:
--   INSERT INTO public.app_config (system_agent_user_id) VALUES ('that-user-uuid');
-- Use that same UUID as SUPABASE_AGENT_USER_ID in the Python agent .env.

CREATE TABLE IF NOT EXISTS public.app_config (
  id SERIAL PRIMARY KEY,
  system_agent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read app_config (needed for RLS subqueries).
CREATE POLICY "Authenticated can read app_config"
  ON public.app_config FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (run the INSERT above via Supabase SQL Editor or dashboard).
CREATE POLICY "Service role full access app_config"
  ON public.app_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure at least one row exists (system_agent_user_id can be NULL until you set it).
INSERT INTO public.app_config (system_agent_user_id)
SELECT NULL WHERE NOT EXISTS (SELECT 1 FROM public.app_config LIMIT 1);

-- Crop signals: users see their own OR the system agent's.
CREATE POLICY "Users can view system agent signals"
  ON public.crop_signals FOR SELECT TO authenticated
  USING (user_id = (SELECT system_agent_user_id FROM public.app_config LIMIT 1));

-- Satellite analyses: users see analyses for their signals OR for system agent's signals.
CREATE POLICY "Users can view system agent analyses"
  ON public.satellite_analyses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_signals cs
      WHERE cs.id = signal_id AND cs.user_id = (SELECT system_agent_user_id FROM public.app_config LIMIT 1)
    )
  );

-- Weather contexts: same.
CREATE POLICY "Users can view system agent weather"
  ON public.weather_contexts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_signals cs
      WHERE cs.id = signal_id AND cs.user_id = (SELECT system_agent_user_id FROM public.app_config LIMIT 1)
    )
  );

-- Intel reports: same.
CREATE POLICY "Users can view system agent reports"
  ON public.intel_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crop_signals cs
      WHERE cs.id = signal_id AND cs.user_id = (SELECT system_agent_user_id FROM public.app_config LIMIT 1)
    )
  );
