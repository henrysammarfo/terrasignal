import { motion } from "motion/react";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals exploring commodity signals.",
    cta: "Get Started",
    highlighted: false,
    features: [
      "5 commodity watchlists",
      "Daily market digest",
      "Basic news monitoring",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For teams that need real-time edge.",
    cta: "Start Free Trial",
    highlighted: true,
    features: [
      "Unlimited watchlists",
      "Real-time alerts & signals",
      "Satellite imagery access",
      "API access",
      "Priority support",
      "Custom dashboards",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For orgs with complex data needs.",
    cta: "Contact Sales",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom data integrations",
      "SSO & advanced security",
      "SLA guarantees",
      "On-premise deployment",
    ],
  },
];

const PricingSection = () => {
  return (
    <section className="relative z-10 bg-muted/30 py-28 px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p className="text-[13px] font-semibold font-['Geist'] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Pricing
          </p>
          <h2 className="font-['Geist'] font-medium text-[42px] leading-[1.15] tracking-[-0.03em] text-foreground">
            Plans that{" "}
            <span className="font-['Instrument_Serif'] italic text-[48px]">
              scale
            </span>{" "}
            with you
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlighted
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-background text-foreground text-[11px] font-semibold font-['Geist'] uppercase tracking-[0.08em] px-3 py-1">
                  Most Popular
                </span>
              )}

              <h3 className="font-['Geist'] font-semibold text-[15px] tracking-[-0.01em] mb-4">
                {tier.name}
              </h3>

              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-['Geist'] font-medium text-[40px] tracking-[-0.03em]">
                  {tier.price}
                </span>
                {tier.period && (
                  <span
                    className={`text-[14px] font-['Geist'] ${
                      tier.highlighted ? "opacity-50" : "text-muted-foreground"
                    }`}
                  >
                    {tier.period}
                  </span>
                )}
              </div>

              <p
                className={`text-[14px] font-['Geist'] leading-[1.6] mb-8 ${
                  tier.highlighted ? "opacity-60" : "text-muted-foreground"
                }`}
              >
                {tier.description}
              </p>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        tier.highlighted
                          ? "text-background/60"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-[14px] font-['Geist'] ${
                        tier.highlighted ? "opacity-80" : "text-muted-foreground"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-full py-3 text-[14px] font-medium font-['Geist'] transition-opacity hover:opacity-90 ${
                  tier.highlighted
                    ? "bg-background text-foreground"
                    : "bg-foreground text-background"
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
