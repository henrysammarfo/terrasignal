
-- Watchlist table for user-saved commodities/regions
CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  commodity TEXT NOT NULL,
  region TEXT,
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON public.watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.watchlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON public.watchlists FOR UPDATE USING (auth.uid() = user_id);

-- Trade signals table for AI-powered buy/sell/hold scoring
CREATE TABLE public.trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.intel_reports(id) ON DELETE CASCADE,
  signal TEXT NOT NULL DEFAULT 'hold',
  confidence DOUBLE PRECISION,
  rationale TEXT,
  price_target TEXT,
  timeframe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view trade signals" ON public.trade_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access trade signals" ON public.trade_signals FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for watchlists
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_signals;
