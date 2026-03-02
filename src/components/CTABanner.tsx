import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const CTABanner = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
  };

  return (
    <section className="relative z-10 bg-background px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto max-w-[1200px] rounded-3xl bg-foreground text-background px-8 py-20 md:px-20 text-center flex flex-col items-center"
      >
        <h2 className="font-['Geist'] font-medium text-[38px] md:text-[48px] leading-[1.1] tracking-[-0.03em] mb-4 max-w-[600px]">
          Start making{" "}
          <span className="font-['Instrument_Serif'] italic text-[44px] md:text-[54px]">
            smarter
          </span>{" "}
          moves today
        </h2>
        <p className="font-['Geist'] text-[16px] leading-[1.6] opacity-50 max-w-[440px] mb-10">
          Join thousands of commodity professionals using TerraSignal to stay ahead of the market.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex items-center w-full max-w-[460px] rounded-full bg-background/10 border border-background/15 p-1.5"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            maxLength={255}
            className="flex-1 bg-transparent px-5 py-2.5 text-[14px] font-['Geist'] text-background placeholder:text-background/35 outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full bg-background text-foreground px-5 py-2.5 text-[13px] font-medium font-['Geist'] hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default CTABanner;
