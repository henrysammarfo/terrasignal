CREATE TABLE public.agent_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  events_detected integer DEFAULT 0,
  regions_scanned integer DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
  ON public.agent_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access scans"
  ON public.agent_scans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);