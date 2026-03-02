import { useIntelReports, IntelReportRow } from "@/hooks/useIntelReports";
import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { useState } from "react";
import SignalDetail from "./SignalDetail";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  low: "bg-green-500/10 text-green-700 border-green-500/20",
};

const ConfidenceBadge = ({ value }: { value: number | null }) => {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-destructive";
  return <span className={`text-[12px] font-semibold font-['Geist'] ${color}`}>{pct}%</span>;
};

const IntelFeed = () => {
  const { data: reports, isLoading } = useIntelReports();
  const [selected, setSelected] = useState<IntelReportRow | null>(null);

  if (selected) {
    return <SignalDetail report={selected} onBack={() => setSelected(null)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-['Geist'] text-[15px] text-muted-foreground">
          No intelligence reports yet. Connect your TerraSignal agent to start receiving signals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report, i) => {
        const signal = report.crop_signals;
        const sat = report.satellite_analyses?.[0];
        return (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(report)}
            className="w-full text-left rounded-xl border border-border bg-card p-5 hover:border-foreground/20 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-medium font-['Geist'] px-2 py-0.5 rounded-full border ${severityColors[signal?.severity || "low"]}`}>
                    {signal?.severity?.toUpperCase()}
                  </span>
                  {signal?.crop_type && (
                    <span className="text-[11px] font-['Geist'] text-muted-foreground">{signal.crop_type}</span>
                  )}
                  <span className="text-[11px] font-['Geist'] text-muted-foreground">·</span>
                  <span className="text-[11px] font-['Geist'] text-muted-foreground">{signal?.region_name}</span>
                </div>
                <h3 className="font-['Geist'] font-medium text-[15px] text-foreground truncate">{report.headline}</h3>
                {report.market_implication && (
                  <p className="font-['Geist'] text-[13px] text-muted-foreground mt-1 line-clamp-1">{report.market_implication}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <ConfidenceBadge value={report.confidence} />
                {sat?.anomaly_score != null && (
                  <div className="flex items-center gap-1">
                    {sat.anomaly_score > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : sat.anomaly_score < 0 ? (
                      <TrendingDown className="w-3 h-3 text-destructive" />
                    ) : (
                      <Minus className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-[11px] font-['Geist'] text-muted-foreground">{sat.anomaly_score.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-[10px] font-['Geist'] text-muted-foreground">
                  {new Date(report.generated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default IntelFeed;
