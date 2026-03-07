import { useEffect, useRef } from "react";
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

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div ref={mapRef} className="w-full h-[300px] sm:h-[400px] md:h-[500px]" />
    </div>
  );
};

export default SignalMap;
