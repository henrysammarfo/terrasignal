import { useEffect, useRef, useState } from "react";
import { useIntelReports } from "@/hooks/useIntelReports";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const escHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const severityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

/** Map NDVI to a fill color for the bounding box overlay */
const ndviToColor = (ndvi: number | null | undefined): string => {
  if (ndvi == null) return "#6b728080";
  if (ndvi < 0) return "#ef4444";
  if (ndvi < 0.1) return "#f97316";
  if (ndvi < 0.2) return "#eab308";
  if (ndvi < 0.4) return "#84cc16";
  if (ndvi < 0.6) return "#22c55e";
  return "#16a34a";
};

const SignalMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);
  const { data: reports } = useIntelReports();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    L.control.zoom({ position: "bottomright" }).addTo(mapInstance.current);
    layerGroup.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !layerGroup.current || !reports?.length) return;

    layerGroup.current.clearLayers();

    reports.forEach((report) => {
      const signal = report.crop_signals;
      if (!signal?.bbox || signal.bbox.length !== 4) return;

      const [minLon, minLat, maxLon, maxLat] = signal.bbox;
      const lat = (minLat + maxLat) / 2;
      const lon = (minLon + maxLon) / 2;
      const color = severityColor[signal.severity] || "#6b7280";
      const sat = report.satellite_analyses?.[0];
      const ndviColor = ndviToColor(sat?.ndvi_mean);

      // Bounding box rectangle colored by NDVI
      const bounds: L.LatLngBoundsExpression = [[minLat, minLon], [maxLat, maxLon]];
      const rect = L.rectangle(bounds, {
        color: ndviColor,
        weight: 2,
        opacity: 0.7,
        fillColor: ndviColor,
        fillOpacity: 0.15,
        dashArray: "6 4",
      });
      rect.addTo(layerGroup.current!);

      // Center marker
      const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.5,
      });
      marker.addTo(layerGroup.current!);

      // Shared popup
      const thumbnailHtml = sat?.thumbnail_url
        ? `<img src="${escHtml(sat.thumbnail_url)}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-top:6px;" alt="Sentinel-2" />`
        : "";
      const ndviHtml = sat?.ndvi_mean != null
        ? `<div style="font-size:11px;margin-top:4px;">NDVI: <strong>${sat.ndvi_mean.toFixed(3)}</strong></div>`
        : "";
      const deltaHtml = sat?.ndvi_delta != null
        ? `<div style="font-size:11px;">ΔNDVI: <strong style="color:${sat.ndvi_delta >= 0 ? "#16a34a" : "#ef4444"}">${sat.ndvi_delta >= 0 ? "+" : ""}${sat.ndvi_delta.toFixed(4)}</strong></div>`
        : "";

      const popup = `
        <div style="font-family:'Geist',sans-serif;min-width:200px;max-width:260px;">
          ${thumbnailHtml}
          <div style="font-size:13px;font-weight:600;margin:6px 0 4px;">${escHtml(report.headline)}</div>
          <div style="font-size:11px;color:#64748b;">${escHtml(signal.region_name)} · ${escHtml(signal.crop_type || "—")}</div>
          ${ndviHtml}${deltaHtml}
          ${sat?.anomaly_score != null ? `<div style="font-size:11px;">Anomaly: <strong>${sat.anomaly_score.toFixed(2)}σ</strong></div>` : ""}
          ${report.confidence != null ? `<div style="font-size:11px;">Confidence: <strong>${Math.round(report.confidence * 100)}%</strong></div>` : ""}
        </div>
      `;

      marker.bindPopup(popup);
      rect.bindPopup(popup);
    });
  }, [reports]);

  const [legendOpen, setLegendOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card relative">
      <div ref={mapRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px]" />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="bg-card/95 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-['Geist'] font-medium text-foreground shadow-md hover:bg-accent transition-colors"
        >
          {legendOpen ? "▾ Legend" : "▸ Legend"}
        </button>

        {legendOpen && (
          <div className="mt-1.5 bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg min-w-[160px] space-y-3">
            {/* Severity markers */}
            <div>
              <p className="text-[10px] font-['Geist'] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Signal Severity</p>
              <div className="space-y-1">
                {(["critical", "high", "medium", "low"] as const).map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: severityColor[s] }} />
                    <span className="text-[11px] font-['Geist'] text-foreground capitalize">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NDVI color scale */}
            <div>
              <p className="text-[10px] font-['Geist'] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">NDVI (Bbox Fill)</p>
              <div className="flex rounded-md overflow-hidden h-3 border border-border">
                {["#ef4444","#f97316","#eab308","#84cc16","#22c55e","#16a34a"].map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] font-['Geist'] text-muted-foreground">&lt;0</span>
                <span className="text-[9px] font-['Geist'] text-muted-foreground">0.3</span>
                <span className="text-[9px] font-['Geist'] text-muted-foreground">&gt;0.6</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalMap;
