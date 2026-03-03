import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface IntelReportRow {
  id: string;
  headline: string;
  summary: string | null;
  confidence: number | null;
  market_implication: string | null;
  generated_at: string;
  signal_id: string;
  crop_signals: {
    id: string;
    event_title: string;
    region_name: string;
    crop_type: string | null;
    severity: string;
    bbox: number[] | null;
    event_source: string | null;
    published_at: string | null;
  } | null;
  satellite_analyses: {
    ndvi_mean: number | null;
    ndvi_delta: number | null;
    ndwi_mean: number | null;
    msi_mean: number | null;
    anomaly_score: number | null;
    cloud_cover_pct: number | null;
    acquisition_date: string | null;
    thumbnail_url: string | null;
  }[] | null;
  weather_contexts: {
    precip_anomaly_mm: number | null;
    temp_anomaly_c: number | null;
    drought_index: string | null;
    soil_moisture_percentile: number | null;
  }[] | null;
}

export const useIntelReports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime: auto-refresh when new reports or signals land
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("intel-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "intel_reports" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["intel-reports"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crop_signals" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["intel-reports"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["intel-reports", user?.id],
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from("intel_reports")
        .select(`
          *,
          crop_signals!inner (
            id, event_title, region_name, crop_type, severity, bbox, event_source, published_at
          )
        `)
        .order("generated_at", { ascending: false });

      if (error) throw error;
      if (!reports?.length) return [] as IntelReportRow[];

      const signalIds = reports.map((r: any) => r.signal_id);

      const [satResult, weatherResult] = await Promise.all([
        supabase.from("satellite_analyses").select("*").in("signal_id", signalIds),
        supabase.from("weather_contexts").select("*").in("signal_id", signalIds),
      ]);

      const satBySignal = new Map<string, any[]>();
      (satResult.data || []).forEach((s: any) => {
        const arr = satBySignal.get(s.signal_id) || [];
        arr.push(s);
        satBySignal.set(s.signal_id, arr);
      });

      const weatherBySignal = new Map<string, any[]>();
      (weatherResult.data || []).forEach((w: any) => {
        const arr = weatherBySignal.get(w.signal_id) || [];
        arr.push(w);
        weatherBySignal.set(w.signal_id, arr);
      });

      return reports.map((r: any) => ({
        ...r,
        satellite_analyses: satBySignal.get(r.signal_id) || [],
        weather_contexts: weatherBySignal.get(r.signal_id) || [],
      })) as IntelReportRow[];
    },
    enabled: !!user,
  });
};
