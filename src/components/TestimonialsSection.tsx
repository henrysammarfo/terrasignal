import { motion } from "motion/react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "TerraSignal cut our research time by 80%. We now catch supply disruptions hours before they hit the wires.",
    name: "Sarah Chen",
    role: "Head of Commodities",
    company: "Meridian Capital",
    initial: "M",
  },
  {
    quote:
      "The satellite imagery integration is a game-changer. We verified crop yield estimates weeks ahead of USDA reports.",
    name: "James Okafor",
    role: "Portfolio Manager",
    company: "Atlas Trading",
    initial: "A",
  },
  {
    quote:
      "Our entire trading desk runs on TerraSignal alerts. It's become the backbone of our decision-making process.",
    name: "Elena Voss",
    role: "Director of Strategy",
    company: "Nordvik Group",
    initial: "N",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="relative z-10 bg-background py-28 px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16"
        >
          <p className="text-[13px] font-semibold font-['Geist'] uppercase tracking-[0.12em] text-muted-foreground mb-3">
            Testimonials
          </p>
          <h2 className="font-['Geist'] font-medium text-[28px] sm:text-[36px] md:text-[42px] leading-[1.15] tracking-[-0.03em] text-foreground max-w-[480px]">
            Trusted by{" "}
            <span className="font-['Instrument_Serif'] italic text-[34px] sm:text-[42px] md:text-[48px]">
              leading
            </span>{" "}
            trading teams
          </h2>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-8"
            >
              <Quote className="w-5 h-5 text-muted-foreground/40 mb-5" />
              <p className="font-['Geist'] text-[15px] leading-[1.7] text-foreground/80 flex-1 mb-8">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center">
                  <span className="text-background text-[12px] font-bold font-['Geist']">
                    {t.initial}
                  </span>
                </div>
                <div>
                  <p className="font-['Geist'] text-[14px] font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="font-['Geist'] text-[12px] text-muted-foreground">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
