import { IntelReportRow } from "@/hooks/useIntelReports";
import { motion } from "motion/react";
import { ArrowLeft, MapPin, Calendar, Cloud, Droplets, Thermometer, Leaf } from "lucide-react";

interface Props {
  report: IntelReportRow;
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

const SignalDetail = ({ report, onBack }: Props) => {
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
        <div className="flex items-center gap-2 mb-2">
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
        </div>
        <h1 className="font-['Geist'] font-medium text-[24px] tracking-[-0.02em] text-foreground">{report.headline}</h1>
        <p className="font-['Geist'] text-[14px] text-muted-foreground mt-2">{report.summary}</p>
      </div>

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

      {/* Satellite Data */}
      {sat && (
        <div>
          <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-3">Satellite Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="NDVI Mean" value={sat.ndvi_mean} icon={Leaf} />
            <Stat label="NDVI Delta" value={sat.ndvi_delta} icon={Leaf} />
            <Stat label="NDWI" value={sat.ndwi_mean} icon={Droplets} />
            <Stat label="MSI" value={sat.msi_mean} />
            <Stat label="Anomaly" value={sat.anomaly_score} />
            <Stat label="Cloud Cover" value={sat.cloud_cover_pct != null ? `${sat.cloud_cover_pct.toFixed(1)}%` : null} icon={Cloud} />
            <Stat label="Acquired" value={sat.acquisition_date} icon={Calendar} />
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
