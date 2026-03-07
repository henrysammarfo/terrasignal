import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommodityPrice {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePct: number;
  updatedAt: string;
}

const CommodityTicker = () => {
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("commodity-prices");
      if (fnError) throw fnError;
      if (data?.success && data.data) {
        setPrices(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch prices:", e);
      setError("Unable to load prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[72px] w-[140px] rounded-xl bg-muted animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <p className="font-['Geist'] text-[12px] text-muted-foreground flex-1">{error}</p>
        <button onClick={fetchPrices} className="text-primary hover:opacity-80 transition-opacity">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {prices.map((c, i) => (
        <motion.div
          key={c.symbol}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col justify-between rounded-xl border border-border bg-card px-3.5 py-2.5 min-w-[130px] shrink-0 hover:border-foreground/20 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-['Geist'] text-[11px] font-medium text-muted-foreground">{c.name}</span>
            <div className="flex items-center gap-1">
              {(c as any).live && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" title="Live data" />}
              {c.change > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : c.change < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-500" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Geist'] text-[16px] font-semibold text-foreground tracking-tight">
              {c.price.toLocaleString(undefined, { minimumFractionDigits: c.price > 100 ? 0 : 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`font-['Geist'] text-[11px] font-medium ${
              c.changePct > 0 ? "text-green-600" : c.changePct < 0 ? "text-red-500" : "text-muted-foreground"
            }`}>
              {c.changePct > 0 ? "+" : ""}{c.changePct.toFixed(2)}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CommodityTicker;
