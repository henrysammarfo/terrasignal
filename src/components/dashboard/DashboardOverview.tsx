import { useMemo } from "react";
import { motion } from "motion/react";
import { useIntelReports } from "@/hooks/useIntelReports";
import { useTradeSignals } from "@/hooks/useTradeSignals";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  Satellite, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Globe, BarChart3, ShieldCheck, Target, Zap
} from "lucide-react";

const StatCard = ({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: any; color?: string;
}) => (
  <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${color || "text-muted-foreground"}`} />
      <span className="text-[11px] font-['Geist'] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-[22px] font-['Geist'] font-semibold text-foreground tracking-tight">{value}</span>
    {sub && <span className="text-[11px] font-['Geist'] text-muted-foreground">{sub}</span>}
  </div>
);

const SeverityBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-['Geist'] text-muted-foreground w-14 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-['Geist'] font-medium text-foreground w-8 text-right">{count}</span>
    </div>
  );
};

const DashboardOverview = () => {
  const { data: reports } = useIntelReports();
  const { data: tradeSignals } = useTradeSignals();
  const { data: watchlist } = useWatchlist();

  const stats = useMemo(() => {
    if (!reports) return null;

    const total = reports.length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = reports.filter(r => new Date(r.generated_at) >= weekAgo);

    // Severity breakdown
    const severities = { critical: 0, high: 0, medium: 0, low: 0 };
    reports.forEach(r => {
      const s = r.crop_signals?.severity || "low";
      if (s in severities) severities[s as keyof typeof severities]++;
    });

    // Unique regions
    const regions = new Set(reports.map(r => r.crop_signals?.region_name).filter(Boolean));

    // Unique crops
    const crops = new Set(reports.map(r => r.crop_signals?.crop_type).filter(Boolean));

    // Average confidence
    const confidences = reports.map(r => r.confidence).filter((c): c is number => c != null);
    const avgConfidence = confidences.length > 0
      ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 100)
      : 0;

    // Trade signal breakdown
    const buyCount = tradeSignals?.filter(t => t.signal === "buy").length || 0;
    const sellCount = tradeSignals?.filter(t => t.signal === "sell").length || 0;
    const holdCount = tradeSignals?.filter(t => t.signal === "hold").length || 0;

    // Avg anomaly score
    const anomalies = reports
      .map(r => r.satellite_analyses?.[0]?.anomaly_score)
      .filter((a): a is number => a != null);
    const avgAnomaly = anomalies.length > 0
      ? (anomalies.reduce((a, b) => a + b, 0) / anomalies.length).toFixed(1)
      : "N/A";

    return {
      total, thisWeek: thisWeek.length, severities, regions: regions.size,
      crops: crops.size, avgConfidence, buyCount, sellCount, holdCount,
      avgAnomaly, watchlistCount: watchlist?.length || 0,
      activeAlerts: watchlist?.filter(w => w.alert_enabled).length || 0,
    };
  }, [reports, tradeSignals, watchlist]);

  if (!stats) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Signals" value={stats.total} sub={`${stats.thisWeek} this week`} icon={Satellite} color="text-primary" />
        <StatCard label="Regions Covered" value={stats.regions} sub={`${stats.crops} commodities`} icon={Globe} color="text-blue-500" />
        <StatCard label="Avg Confidence" value={`${stats.avgConfidence}%`} icon={ShieldCheck} color="text-green-600" />
        <StatCard label="Avg Anomaly" value={stats.avgAnomaly} sub="Satellite deviation" icon={Target} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Severity Distribution
          </h3>
          <div className="space-y-2.5">
            <SeverityBar label="Critical" count={stats.severities.critical} total={stats.total} color="bg-destructive" />
            <SeverityBar label="High" count={stats.severities.high} total={stats.total} color="bg-orange-500" />
            <SeverityBar label="Medium" count={stats.severities.medium} total={stats.total} color="bg-yellow-500" />
            <SeverityBar label="Low" count={stats.severities.low} total={stats.total} color="bg-green-500" />
          </div>
        </div>

        {/* Trade Signals Summary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Trade Signals
          </h3>
          <div className="flex items-end gap-6 mb-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[24px] font-['Geist'] font-bold text-green-600">{stats.buyCount}</span>
              <p className="text-[11px] font-['Geist'] text-muted-foreground">Buy</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Minus className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-[24px] font-['Geist'] font-bold text-yellow-600">{stats.holdCount}</span>
              <p className="text-[11px] font-['Geist'] text-muted-foreground">Hold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[24px] font-['Geist'] font-bold text-red-500">{stats.sellCount}</span>
              <p className="text-[11px] font-['Geist'] text-muted-foreground">Sell</p>
            </div>
          </div>

          {/* Watchlist mini summary */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-['Geist'] text-muted-foreground">Watchlist Items</span>
              <span className="text-[14px] font-['Geist'] font-semibold text-foreground">{stats.watchlistCount}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[12px] font-['Geist'] text-muted-foreground">Active Alerts</span>
              <span className="text-[14px] font-['Geist'] font-semibold text-foreground">{stats.activeAlerts}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
