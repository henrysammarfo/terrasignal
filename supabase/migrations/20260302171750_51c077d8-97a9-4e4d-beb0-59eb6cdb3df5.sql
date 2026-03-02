
-- Crop signals table
CREATE TABLE public.crop_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_content TEXT,
  event_url TEXT,
  event_source TEXT,
  published_at TIMESTAMPTZ,
  region_name TEXT NOT NULL,
  bbox DOUBLE PRECISION[] CHECK (array_length(bbox, 1) = 4),
  crop_type TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signals" ON public.crop_signals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signals" ON public.crop_signals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can insert signals" ON public.crop_signals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can select signals" ON public.crop_signals FOR SELECT TO service_role USING (true);

-- Satellite analyses table
CREATE TABLE public.satellite_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.crop_signals(id) ON DELETE CASCADE NOT NULL,
  acquisition_date DATE,
  ndvi_mean DOUBLE PRECISION,
  ndvi_delta DOUBLE PRECISION,
  ndwi_mean DOUBLE PRECISION,
  msi_mean DOUBLE PRECISION,
  cloud_cover_pct DOUBLE PRECISION,
  anomaly_score DOUBLE PRECISION,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.satellite_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for their signals" ON public.satellite_analyses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crop_signals cs WHERE cs.id = signal_id AND cs.user_id = auth.uid()));
CREATE POLICY "Service role full access analyses" ON public.satellite_analyses FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Weather contexts table
CREATE TABLE public.weather_contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.crop_signals(id) ON DELETE CASCADE NOT NULL,
  date_from DATE,
  date_to DATE,
  precip_anomaly_mm DOUBLE PRECISION,
  temp_anomaly_c DOUBLE PRECISION,
  drought_index TEXT,
  soil_moisture_percentile DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weather for their signals" ON public.weather_contexts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crop_signals cs WHERE cs.id = signal_id AND cs.user_id = auth.uid()));
CREATE POLICY "Service role full access weather" ON public.weather_contexts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Intel reports table
CREATE TABLE public.intel_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.crop_signals(id) ON DELETE CASCADE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 1),
  market_implication TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intel_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reports for their signals" ON public.intel_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.crop_signals cs WHERE cs.id = signal_id AND cs.user_id = auth.uid()));
CREATE POLICY "Service role full access reports" ON public.intel_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES public.intel_reports(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for notifications and intel_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intel_reports;

-- Trigger for updated_at on crop_signals
CREATE TRIGGER update_crop_signals_updated_at
  BEFORE UPDATE ON public.crop_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_crop_signals_user_id ON public.crop_signals(user_id);
CREATE INDEX idx_crop_signals_severity ON public.crop_signals(severity);
CREATE INDEX idx_intel_reports_signal_id ON public.intel_reports(signal_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
