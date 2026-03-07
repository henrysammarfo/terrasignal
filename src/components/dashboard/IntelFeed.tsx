import { useIntelReports, IntelReportRow } from "@/hooks/useIntelReports";
import { useTradeSignals } from "@/hooks/useTradeSignals";
import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import SignalDetail from "./SignalDetail";
import IntelFeedFilters, { SortField, SortDir } from "./IntelFeedFilters";
import TradeSignalBadge from "./TradeSignalBadge";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  low: "bg-green-500/10 text-green-700 border-green-500/20",
};

const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const ConfidenceBadge = ({ value }: { value: number | null }) => {
  if (value === null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-destructive";
  return <span className={`text-[12px] font-semibold font-['Geist'] ${color}`}>{pct}%</span>;
};

const IntelFeed = () => {
  const { data: reports, isLoading } = useIntelReports();
  const { data: tradeSignals } = useTradeSignals();
  const [selected, setSelected] = useState<IntelReportRow | null>(null);

  const [severity, setSeverity] = useState("all");
  const [cropType, setCropType] = useState("all");
  const [region, setRegion] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Map trade signals by report_id
  const tsMap = useMemo(() => {
    const m = new Map<string, { signal: string; confidence: number | null }>();
    tradeSignals?.forEach(ts => m.set(ts.report_id, { signal: ts.signal, confidence: ts.confidence }));
    return m;
  }, [tradeSignals]);

  const filtered = useMemo(() => {
    if (!reports) return [];
    let result = [...reports];

    if (severity !== "all") result = result.filter((r) => r.crop_signals?.severity === severity);
    if (cropType !== "all") result = result.filter((r) => r.crop_signals?.crop_type === cropType);
    if (region !== "all") result = result.filter((r) => r.crop_signals?.region_name === region);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime();
      } else if (sortField === "severity") {
        cmp = (severityOrder[a.crop_signals?.severity || "low"] || 0) - (severityOrder[b.crop_signals?.severity || "low"] || 0);
      } else if (sortField === "confidence") {
        cmp = (a.confidence || 0) - (b.confidence || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [reports, severity, cropType, region, sortField, sortDir]);

  if (selected) {
    return <SignalDetail report={selected} tradeSignal={tsMap.get(selected.id) || null} onBack={() => setSelected(null)} />;
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
    <div>
      <IntelFeedFilters
        reports={reports}
        severity={severity}
        cropType={cropType}
        region={region}
        sortField={sortField}
        sortDir={sortDir}
        onSeverity={setSeverity}
        onCropType={setCropType}
        onRegion={setRegion}
        onSortField={setSortField}
        onSortDir={setSortDir}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-['Geist'] text-[14px] text-muted-foreground">No reports match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report, i) => {
            const signal = report.crop_signals;
            const sat = report.satellite_analyses?.[0];
            const ts = tsMap.get(report.id);
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
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[11px] font-medium font-['Geist'] px-2 py-0.5 rounded-full border ${severityColors[signal?.severity || "low"]}`}>
                        {signal?.severity?.toUpperCase()}
                      </span>
                      {signal?.crop_type && (
                        <span className="text-[11px] font-['Geist'] text-muted-foreground">{signal.crop_type}</span>
                      )}
                      <span className="text-[11px] font-['Geist'] text-muted-foreground">·</span>
                      <span className="text-[11px] font-['Geist'] text-muted-foreground">{signal?.region_name}</span>
                      <TradeSignalBadge reportId={report.id} signal={ts} />
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
      )}
    </div>
  );
};

export default IntelFeed;
