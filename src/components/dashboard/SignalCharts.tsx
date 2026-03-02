import { useIntelReports } from "@/hooks/useIntelReports";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SignalCharts = () => {
  const { data: reports } = useIntelReports();

  if (!reports?.length) return null;

  // Build NDVI trend data from satellite analyses
  const ndviData = reports
    .filter((r) => r.satellite_analyses?.[0]?.ndvi_mean != null)
    .map((r) => ({
      region: r.crop_signals?.region_name?.split(",")[0] || "Unknown",
      ndvi: r.satellite_analyses![0].ndvi_mean!,
      delta: r.satellite_analyses![0].ndvi_delta ?? 0,
      anomaly: r.satellite_analyses![0].anomaly_score ?? 0,
    }))
    .reverse();

  // Weather anomaly data
  const weatherData = reports
    .filter((r) => r.weather_contexts?.[0])
    .map((r) => {
      const w = r.weather_contexts![0];
      return {
        region: r.crop_signals?.region_name?.split(",")[0] || "Unknown",
        precip: w.precip_anomaly_mm ?? 0,
        temp: w.temp_anomaly_c ?? 0,
        soil: w.soil_moisture_percentile ?? 0,
      };
    })
    .reverse();

  return (
    <div className="space-y-6">
      {/* NDVI + Anomaly Chart */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Vegetation Health (NDVI) & Anomaly Score
        </h3>
        <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ndviData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="region"
                tick={{ fontSize: 11, fontFamily: "Geist", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: "Geist", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "Geist",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Bar dataKey="ndvi" name="NDVI Mean" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="anomaly" name="Anomaly Score" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weather Anomalies Chart */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h3 className="text-[12px] font-['Geist'] font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Weather Anomalies by Region
        </h3>
        <div className="h-[220px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weatherData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="region"
                tick={{ fontSize: 11, fontFamily: "Geist", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: "Geist", fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "Geist",
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Line type="monotone" dataKey="precip" name="Precip Anomaly (mm)" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="temp" name="Temp Anomaly (°C)" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="soil" name="Soil Moisture %" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SignalCharts;
