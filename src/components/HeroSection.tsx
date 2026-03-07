import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Satellite, Activity, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ signals: 0, regions: 0, reports: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [signalsRes, reportsRes] = await Promise.all([
        supabase.from("crop_signals").select("region_name", { count: "exact" }),
        supabase.from("intel_reports").select("id", { count: "exact" }),
      ]);
      const signals = signalsRes.count || 0;
      const reports = reportsRes.count || 0;
      const regions = new Set(signalsRes.data?.map(s => s.region_name)).size;
      setStats({ signals, regions, reports });
    };
    fetchStats();
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover [transform:scaleY(-1)]"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-transparent to-[66.943%] to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 pt-[180px] sm:pt-[240px] md:pt-[290px] flex flex-col gap-6 sm:gap-8">
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-['Geist'] font-medium text-[36px] sm:text-[56px] md:text-[80px] leading-[1.05] tracking-[-0.04em] text-foreground"
        >
          Autonomous{" "}
          <span className="font-['Instrument_Serif'] italic text-[44px] sm:text-[68px] md:text-[100px]">
            intelligence
          </span>
          <br />
          for commodity markets
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="font-['Geist'] text-[15px] sm:text-[18px] leading-[1.6] text-muted-foreground max-w-[554px]"
        >
          TerraSignal monitors global news, Sentinel-2 satellite imagery, and
          weather data — then delivers actionable trade signals before the
          market moves.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row items-start gap-3 max-w-[520px]"
        >
          <button
            onClick={() => navigate("/auth")}
            className="rounded-full px-8 py-3.5 text-[14px] font-medium font-['Geist'] bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Start Free — No Card Required
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="rounded-full px-8 py-3.5 text-[14px] font-medium font-['Geist'] border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            View Live Dashboard
          </button>
        </motion.div>

        {/* Live Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
          className="flex flex-wrap items-center gap-6 sm:gap-10 mt-4"
        >
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-muted-foreground" />
            <span className="text-[14px] font-['Geist'] font-semibold text-foreground">{stats.signals}</span>
            <span className="text-[13px] font-['Geist'] text-muted-foreground">Signals Detected</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-[14px] font-['Geist'] font-semibold text-foreground">{stats.regions}</span>
            <span className="text-[13px] font-['Geist'] text-muted-foreground">Regions Monitored</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-[14px] font-['Geist'] font-semibold text-foreground">{stats.reports}</span>
            <span className="text-[13px] font-['Geist'] text-muted-foreground">Reports Generated</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
