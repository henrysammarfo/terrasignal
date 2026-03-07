import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTABanner = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 bg-background px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-[1200px] rounded-3xl bg-foreground text-background px-8 py-20 md:px-20 text-center flex flex-col items-center"
      >
        <h2 className="font-['Geist'] font-medium text-[28px] sm:text-[38px] md:text-[48px] leading-[1.1] tracking-[-0.03em] mb-4 max-w-[600px]">
          Start receiving{" "}
          <span className="font-['Instrument_Serif'] italic text-[34px] sm:text-[44px] md:text-[54px]">
            live intel
          </span>{" "}
          today
        </h2>
        <p className="font-['Geist'] text-[16px] leading-[1.6] opacity-50 max-w-[440px] mb-10">
          Free during open beta. Real satellite data, real trade signals,
          real market intelligence — delivered autonomously.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 rounded-full bg-background text-foreground px-8 py-3.5 text-[14px] font-medium font-['Geist'] hover:opacity-90 transition-opacity"
        >
          Create Free Account
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
};

export default CTABanner;
