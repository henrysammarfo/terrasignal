import { motion } from "motion/react";
import { Newspaper, Satellite, TrendingUp, Bell, Globe, Cpu } from "lucide-react";

const features = [
  {
    icon: Newspaper,
    title: "Multi-Tier RSS Monitoring",
    description:
      "Scans Reuters, USDA, FAO, GDACS, NASA Earth Observatory and 15+ other live feeds. AI scores every headline for satellite-observable relevance.",
  },
  {
    icon: Satellite,
    title: "Sentinel-2 Satellite Analysis",
    description:
      "Computes NDVI, NDWI, and MSI from live Sentinel-2 L2A imagery via Microsoft Planetary Computer — no API key required. Detects crop stress, drought, and anomalies.",
  },
  {
    icon: Globe,
    title: "Live Weather Context",
    description:
      "Pulls historical temperature and precipitation data from Open-Meteo to contextualize every signal with drought indices and soil moisture estimates.",
  },
  {
    icon: Cpu,
    title: "AI-Powered Reports",
    description:
      "Flock AI synthesizes satellite data, weather, and news into actionable intelligence reports with trade signals, confidence scores, and market implications.",
  },
  {
    icon: TrendingUp,
    title: "Trade Signal Generation",
    description:
      "Every report produces a buy, sell, or hold recommendation with confidence scores, price targets, and timeframes based on real satellite + market data.",
  },
  {
    icon: Bell,
    title: "Multi-Channel Delivery",
    description:
      "Alerts delivered to Slack, the live dashboard, and optionally via OpenClaw to WhatsApp and Telegram. High-severity signals trigger instant notifications.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative z-10 bg-background py-28 px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16"
        >
          <p className="text-[13px] font-semibold font-['Geist'] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            How It Works
          </p>
          <h2 className="font-['Geist'] font-medium text-[28px] sm:text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.03em] text-foreground max-w-[580px]">
            End-to-end pipeline,{" "}
            <span className="font-['Instrument_Serif'] italic text-[34px] sm:text-[42px] md:text-[48px]">
              fully autonomous
            </span>
          </h2>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.08,
              }}
              className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:bg-muted/50"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
                <feature.icon className="h-5 w-5 text-background" />
              </div>
              <h3 className="font-['Geist'] font-medium text-[18px] tracking-[-0.01em] text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="font-['Geist'] text-[14px] leading-[1.65] text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
