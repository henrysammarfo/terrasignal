import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Loader2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const signalStyles: Record<string, { bg: string; text: string; icon: any }> = {
  buy: { bg: "bg-green-500/10 border-green-500/20", text: "text-green-600", icon: TrendingUp },
  sell: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-500", icon: TrendingDown },
  hold: { bg: "bg-yellow-500/10 border-yellow-500/20", text: "text-yellow-600", icon: Minus },
};

interface Props {
  reportId: string;
  signal?: { signal: string; confidence: number | null } | null;
}

const TradeSignalBadge = ({ reportId, signal }: Props) => {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const score = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await supabase.functions.invoke("signal-scoring", { body: { report_id: reportId } });
      qc.invalidateQueries({ queryKey: ["trade-signals"] });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (!signal) {
    return (
      <button
        onClick={score}
        disabled={loading}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px] font-['Geist'] font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
        title="Generate AI trade signal"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
        Score
      </button>
    );
  }

  const style = signalStyles[signal.signal] || signalStyles.hold;
  const Icon = style.icon;
  const pct = signal.confidence != null ? Math.round(signal.confidence * 100) : null;

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[10px] font-['Geist'] font-semibold uppercase">{signal.signal}</span>
      {pct !== null && <span className="text-[9px] font-['Geist'] opacity-80">{pct}%</span>}
    </div>
  );
};

export default TradeSignalBadge;
