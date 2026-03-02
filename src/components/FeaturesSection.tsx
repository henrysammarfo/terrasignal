import { motion } from "motion/react";
import { Newspaper, Satellite, TrendingUp, Bell } from "lucide-react";

const features = [
  {
    icon: Newspaper,
    title: "News Monitoring",
    description:
      "Track breaking commodity news across 10,000+ sources in real time. Our AI filters noise so you only see what moves markets.",
  },
  {
    icon: Satellite,
    title: "Satellite Analysis",
    description:
      "Monitor crop health, storage levels, and shipping routes with sub-daily satellite imagery — processed and delivered automatically.",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description:
      "Unified dashboards combining price data, trade flows, and sentiment signals into actionable insights for every commodity.",
  },
  {
    icon: Bell,
    title: "Autonomous Alerts",
    description:
      "Custom triggers that watch the market 24/7 and notify your team the moment conditions match — before competitors react.",
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
            Capabilities
          </p>
          <h2 className="font-['Geist'] font-medium text-[42px] leading-[1.15] tracking-[-0.03em] text-foreground max-w-[520px]">
            Everything you need to{" "}
            <span className="font-['Instrument_Serif'] italic text-[48px]">
              outpace
            </span>{" "}
            the market
          </h2>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.1,
              }}
              className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:bg-muted/50"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
                <feature.icon className="h-5 w-5 text-background" />
              </div>
              <h3 className="font-['Geist'] font-medium text-[18px] tracking-[-0.01em] text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="font-['Geist'] text-[15px] leading-[1.65] text-muted-foreground">
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
