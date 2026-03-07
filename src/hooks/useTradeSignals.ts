import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TradeSignal {
  id: string;
  report_id: string;
  signal: string;
  confidence: number | null;
  rationale: string | null;
  price_target: string | null;
  timeframe: string | null;
  created_at: string;
}

export const useTradeSignals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trade-signals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trade_signals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TradeSignal[];
    },
    enabled: !!user,
  });
};
