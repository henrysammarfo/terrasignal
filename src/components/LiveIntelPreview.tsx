import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, AlertTriangle, TrendingUp, Satellite } from "lucide-react";

interface ReportPreview {
  id: string;
  headline: string;
  summary: string | null;
  confidence: number | null;
  generated_at: string;
  crop_signals: {
    region_name: string;
    severity: string;
    crop_type: string | null;
  } | null;
}

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-green-500/15 text-green-700 dark:text-green-400",
};

const LiveIntelPreview = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("intel_reports")
        .select("id, headline, summary, confidence, generated_at, crop_signals(region_name, severity, crop_type)")
        .order("generated_at", { ascending: false })
        .limit(4);
      setReports((data as ReportPreview[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <section className="relative z-10 bg-background py-28 px-6">
      <div className="mx-auto max-w-[1200px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-[13px] font-semibold font-['Geist'] uppercase tracking-[0.12em] text-muted-foreground mb-3">
              Live Intelligence
            </p>
            <h2 className="font-['Geist'] font-medium text-[28px] sm:text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.03em] text-foreground max-w-[520px]">
              Latest{" "}
              <span className="font-['Instrument_Serif'] italic text-[34px] sm:text-[42px] md:text-[48px]">
                signals
              </span>{" "}
              from the field
            </h2>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-2 text-[13px] font-medium font-['Geist'] text-muted-foreground hover:text-foreground transition-colors"
          >
            View all reports <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-12 text-center"
          >
            <Satellite className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-['Geist'] text-[16px] font-medium text-foreground mb-2">
              Agent scanning in progress
            </h3>
            <p className="font-['Geist'] text-[14px] text-muted-foreground max-w-[400px] mx-auto">
              Our autonomous agent is monitoring global RSS feeds, satellite imagery, and weather data.
              Reports will appear here once the first scan completes.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                onClick={() => navigate("/auth")}
                className="group rounded-2xl border border-border bg-card p-6 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {r.crop_signals && (
                      <span className={`text-[11px] font-semibold font-['Geist'] uppercase tracking-wider px-2 py-0.5 rounded-full ${severityColor[r.crop_signals.severity] || severityColor.low}`}>
                        {r.crop_signals.severity}
                      </span>
                    )}
                    {r.crop_signals?.crop_type && (
                      <span className="text-[11px] font-['Geist'] text-muted-foreground uppercase tracking-wider">
                        {r.crop_signals.crop_type}
                      </span>
                    )}
                  </div>
                  {r.confidence != null && (
                    <span className="text-[11px] font-['Geist'] font-medium text-muted-foreground">
                      {Math.round(r.confidence * 100)}% conf
                    </span>
                  )}
                </div>
                <h3 className="font-['Geist'] text-[15px] font-medium text-foreground leading-snug mb-2 line-clamp-2">
                  {r.headline}
                </h3>
                {r.crop_signals?.region_name && (
                  <p className="text-[12px] font-['Geist'] text-muted-foreground">
                    📍 {r.crop_signals.region_name}
                  </p>
                )}
                <p className="text-[11px] font-['Geist'] text-muted-foreground/60 mt-2">
                  {new Date(r.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LiveIntelPreview;
