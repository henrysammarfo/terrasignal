import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Region {
  name: string;
  lat: number;
  lng: number;
  count: number;
  severity: string;
}

const severityColor: Record<string, string> = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(142, 71%, 45%)",
};

const SignalMapPreview = () => {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("crop_signals")
        .select("region_name, severity, bbox");

      if (!data?.length) return;

      const map = new Map<string, { lats: number[]; lngs: number[]; count: number; severity: string }>();

      data.forEach((s) => {
        const existing = map.get(s.region_name);
        const bbox = s.bbox as number[] | null;
        const lat = bbox && bbox.length >= 4 ? (bbox[1] + bbox[3]) / 2 : 0;
        const lng = bbox && bbox.length >= 4 ? (bbox[0] + bbox[2]) / 2 : 0;

        if (existing) {
          existing.count++;
          if (lat) existing.lats.push(lat);
          if (lng) existing.lngs.push(lng);
          // Keep highest severity
          const order = ["critical", "high", "medium", "low"];
          if (order.indexOf(s.severity) < order.indexOf(existing.severity)) {
            existing.severity = s.severity;
          }
        } else {
          map.set(s.region_name, {
            lats: lat ? [lat] : [],
            lngs: lng ? [lng] : [],
            count: 1,
            severity: s.severity,
          });
        }
      });

      const result: Region[] = [];
      map.forEach((v, name) => {
        if (v.lats.length === 0) return;
        const avgLat = v.lats.reduce((a, b) => a + b, 0) / v.lats.length;
        const avgLng = v.lngs.reduce((a, b) => a + b, 0) / v.lngs.length;
        result.push({ name, lat: avgLat, lng: avgLng, count: v.count, severity: v.severity });
      });

      setRegions(result);
    };

    fetch();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-['Geist'] font-semibold text-[28px] sm:text-[36px] tracking-[-0.03em] text-foreground">
            Live Signal Map
          </h2>
          <p className="mt-3 text-[15px] font-['Geist'] text-muted-foreground max-w-xl mx-auto">
            Active crop intelligence signals detected across global agricultural regions.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 420 }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full"
            style={{ background: "hsl(var(--muted))" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {regions.map((r) => (
              <CircleMarker
                key={r.name}
                center={[r.lat, r.lng]}
                radius={Math.min(8 + r.count * 2, 22)}
                pathOptions={{
                  color: severityColor[r.severity] || severityColor.medium,
                  fillColor: severityColor[r.severity] || severityColor.medium,
                  fillOpacity: 0.35,
                  weight: 2,
                }}
              >
                <Popup>
                  <span className="font-['Geist'] text-[13px] font-medium">
                    {r.name} — {r.count} signal{r.count > 1 ? "s" : ""}
                  </span>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-5">
          {Object.entries(severityColor).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[12px] font-['Geist'] text-muted-foreground capitalize">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SignalMapPreview;

