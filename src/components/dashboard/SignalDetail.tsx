import { IntelReportRow } from "@/hooks/useIntelReports";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Calendar, Cloud, Droplets, Thermometer, Leaf, TrendingUp, TrendingDown, Minus, Satellite, Eye } from "lucide-react";
import TradeSignalBadge from "./TradeSignalBadge";

interface Props {
  report: IntelReportRow;
  tradeSignal?: { signal: string; confidence: number | null; rationale?: string; price_target?: string; timeframe?: string } | null;
  onBack: () => void;
}

const Stat = ({ label, value, icon: Icon }: { label: string; value: string | number | null; icon?: any }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="text-[11px] font-['Geist'] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-[18px] font-['Geist'] font-semibold text-foreground">{typeof value === "number" ? value.toFixed(3) : value}</span>
    </div>
  );
};

const signalColors: Record<string, string> = {
  buy: "border-green-500/30 bg-green-500/5",
  sell: "border-red-500/30 bg-red-500/5",
  hold: "border-yellow-500/30 bg-yellow-500/5",
};

/** NDVI color bar: maps value [-1, 1] to a color */
const ndviColor = (v: number) => {
  if (v < 0) return "hsl(0, 70%, 50%)";
  if (v < 0.1) return "hsl(30, 80%, 55%)";
  if (v < 0.2) return "hsl(50, 85%, 50%)";
  if (v < 0.4) return "hsl(80, 70%, 45%)";
  if (v < 0.6) return "hsl(110, 60%, 40%)";
  return "hsl(140, 65%, 35%)";
};

const NdviBar = ({ value, label }: { value: number; label: string }) => {
  const pct = Math.max(0, Math.min(100, ((value + 1) / 2) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-['Geist'] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: ndviColor(value) }}
        />
      </div>
      <span className="text-[13px] font-['Geist'] font-semibold text-foreground w-14 text-right">{value.toFixed(3)}</span>
    </div>
  );
};

const SignalDetail = ({ report, tradeSignal, onBack }: Props) => {
  const signal = report.crop_signals;
  const sat = report.satellite_analyses?.[0];
  const weather = report.weather_contexts?.[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-[13px] font-['Geist'] text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[11px] font-medium font-['Geist'] px-2 py-0.5 rounded-full border ${
            signal?.severity === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
            signal?.severity === "high" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
            signal?.severity === "medium" ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" :
            "bg-green-500/10 text-green-700 border-green-500/20"
          }`}>{signal?.severity?.toUpperCase()}</span>
          <span className="text-[12px] font-['Geist'] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {signal?.region_name}
          </span>
          {signal?.crop_type && <span className="text-[12px] font-['Geist'] text-muted-foreground">· {signal.crop_type}</span>}
          <TradeSignalBadge reportId={report.id} signal={tradeSignal} />
        </div>
        <h1 className="font-['Geist'] font-medium text-[24px] tracking-[-0.02em] text-foreground">{report.headline}</h1>
        <p className="font-['Geist'] text-[14px] text-muted-foreground mt-2">{report.summary}</p>
      </div>

      {/* Trade Signal Detail */}
      {tradeSignal && (
        <div className={`rounded-xl border p-5 ${signalColors[tradeSignal.signal] || signalColors.hold}`}>
          <div className="flex items-center gap-2 mb-2">
            {tradeSignal.signal === "buy" ? <TrendingUp className="w-4 h-4 text-green-600" /> :
             tradeSignal.signal === "sell" ? <TrendingDown className="w-4 h-4 text-red-500" /> :
             <Minus className="w-4 h-4 text-yellow-600" />}
            <h3 className="text-[13px] font-['Geist'] font-semibold text-foreground uppercase">{tradeSignal.signal} Signal</h3>
            {tradeSignal.confidence != null && (
              <span className="text-[12px] font-['Geist'] text-muted-foreground ml-auto">{Math.round(tradeSignal.confidence * 100)}% confidence</span>
            )}
          </div>
          {tradeSignal.rationale && <p className="font-['Geist'] text-[13px] text-foreground mb-2">{tradeSignal.rationale}</p>}
          <div className="flex gap-4 text-[12px] font-['Geist'] text-muted-foreground">
            {tradeSignal.price_target && <span>Target: <strong className="text-foreground">{tradeSignal.price_target}</strong></span>}
            {tradeSignal.timeframe && <span>Timeframe: <strong className="text-foreground">{tradeSignal.timeframe}</strong></span>}
          </div>
        </div>
      )}

      {/* Market Implication */}
      {report.market_implication && (
        <div className="rounded-xl border border-border bg-accent/50 p-5">
          <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-2">Market Implication</h3>
          <p className="font-['Geist'] text-[14px] text-foreground">{report.market_implication}</p>
          {report.confidence != null && (
            <p className="font-['Geist'] text-[12px] text-muted-foreground mt-2">
              Confidence: <span className="font-semibold text-foreground">{Math.round(report.confidence * 100)}%</span>
            </p>
          )}
        </div>
      )}

      {/* ═══════ Satellite Imagery Panel ═══════ */}
      {sat && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Satellite className="w-4 h-4 text-primary" />
            <h3 className="text-[13px] font-['Geist'] font-semibold text-foreground">Sentinel-2 Satellite Analysis</h3>
            {sat.acquisition_date && (
              <span className="ml-auto text-[11px] font-['Geist'] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {sat.acquisition_date}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Thumbnail */}
            {sat.thumbnail_url ? (
              <div className="relative aspect-square md:aspect-auto md:min-h-[280px] bg-muted">
                <img
                  src={sat.thumbnail_url}
                  alt={`Sentinel-2 RGB · ${signal?.region_name}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-['Geist'] flex items-center gap-1">
                  <Eye className="w-3 h-3" /> RGB Composite · Sentinel-2 L2A
                </div>
                {sat.cloud_cover_pct != null && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-['Geist'] flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> {sat.cloud_cover_pct.toFixed(1)}% cloud
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center bg-muted min-h-[200px]">
                <div className="text-center">
                  <Satellite className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[12px] font-['Geist'] text-muted-foreground">No satellite preview available</p>
                </div>
              </div>
            )}

            {/* Right: Spectral Indices */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-[11px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-3">Vegetation Index (NDVI)</h4>
                {sat.ndvi_mean != null && <NdviBar value={sat.ndvi_mean} label="Current" />}
                {sat.ndvi_mean != null && sat.ndvi_delta != null && (
                  <NdviBar value={sat.ndvi_mean - sat.ndvi_delta} label="Baseline" />
                )}
              </div>

              {sat.ndvi_delta != null && (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-['Geist'] text-muted-foreground">Change Detection (ΔNDVI)</span>
                    <span className={`text-[15px] font-['Geist'] font-bold ${sat.ndvi_delta >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {sat.ndvi_delta >= 0 ? "+" : ""}{sat.ndvi_delta.toFixed(4)}
                    </span>
                  </div>
                  <p className="text-[10px] font-['Geist'] text-muted-foreground mt-1">
                    {sat.ndvi_delta < -0.1 ? "Significant vegetation decline detected" :
                     sat.ndvi_delta < 0 ? "Mild vegetation stress" :
                     sat.ndvi_delta > 0.1 ? "Vegetation recovery observed" :
                     "Stable vegetation conditions"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {sat.ndwi_mean != null && (
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-['Geist'] text-muted-foreground">NDWI</span>
                    </div>
                    <span className="text-[15px] font-['Geist'] font-semibold text-foreground">{sat.ndwi_mean.toFixed(3)}</span>
                  </div>
                )}
                {sat.msi_mean != null && (
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Thermometer className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] font-['Geist'] text-muted-foreground">MSI (Stress)</span>
                    </div>
                    <span className="text-[15px] font-['Geist'] font-semibold text-foreground">{sat.msi_mean.toFixed(3)}</span>
                  </div>
                )}
              </div>

              {sat.anomaly_score != null && (
                <div className={`rounded-lg border p-3 ${
                  Math.abs(sat.anomaly_score) > 2 ? "border-destructive/30 bg-destructive/5" :
                  Math.abs(sat.anomaly_score) > 1 ? "border-yellow-500/30 bg-yellow-500/5" :
                  "border-border"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-['Geist'] text-muted-foreground">Anomaly Score</span>
                    <span className={`text-[18px] font-['Geist'] font-bold ${
                      Math.abs(sat.anomaly_score) > 2 ? "text-destructive" :
                      Math.abs(sat.anomaly_score) > 1 ? "text-yellow-600" : "text-foreground"
                    }`}>{sat.anomaly_score.toFixed(2)}σ</span>
                  </div>
                  <p className="text-[10px] font-['Geist'] text-muted-foreground mt-1">
                    {Math.abs(sat.anomaly_score) > 2 ? "⚠️ Severe deviation from baseline — SCL-validated" :
                     Math.abs(sat.anomaly_score) > 1 ? "⚡ Moderate deviation from historical baseline" :
                     "Within normal range"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Weather Data */}
      {weather && (
        <div>
          <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-3">Weather Context</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Precip Anomaly" value={weather.precip_anomaly_mm != null ? `${weather.precip_anomaly_mm.toFixed(1)}mm` : null} icon={Droplets} />
            <Stat label="Temp Anomaly" value={weather.temp_anomaly_c != null ? `${weather.temp_anomaly_c.toFixed(1)}°C` : null} icon={Thermometer} />
            <Stat label="Drought Index" value={weather.drought_index} />
            <Stat label="Soil Moisture" value={weather.soil_moisture_percentile != null ? `${weather.soil_moisture_percentile.toFixed(0)}%` : null} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SignalDetail;
