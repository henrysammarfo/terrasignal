import { useEffect, useRef } from "react";
import { useIntelReports } from "@/hooks/useIntelReports";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const severityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const SignalMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
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

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !reports?.length) return;

    // Clear old markers
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) layer.remove();
    });

    reports.forEach((report) => {
      const signal = report.crop_signals;
      if (!signal?.bbox || signal.bbox.length !== 4) return;

      const [minLon, minLat, maxLon, maxLat] = signal.bbox;
      const lat = (minLat + maxLat) / 2;
      const lon = (minLon + maxLon) / 2;
      const color = severityColor[signal.severity] || "#6b7280";

      const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.4,
      }).addTo(mapInstance.current!);

      const sat = report.satellite_analyses?.[0];
      marker.bindPopup(`
        <div style="font-family: 'Geist', sans-serif; min-width: 200px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${report.headline}</div>
          <div style="font-size: 11px; color: #64748b;">${signal.region_name} · ${signal.crop_type || "—"}</div>
          ${sat?.anomaly_score != null ? `<div style="font-size: 11px; margin-top: 6px;">Anomaly: <strong>${sat.anomaly_score.toFixed(1)}</strong></div>` : ""}
          ${report.confidence != null ? `<div style="font-size: 11px;">Confidence: <strong>${Math.round(report.confidence * 100)}%</strong></div>` : ""}
        </div>
      `);
    });
  }, [reports]);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
};

export default SignalMap;
