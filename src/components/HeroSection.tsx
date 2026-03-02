import { motion } from "motion/react";
import { Star } from "lucide-react";

const HeroSection = () => {
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
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[26.416%] from-[rgba(255,255,255,0)] to-[66.943%] to-white" />
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
          Simple{" "}
          <span className="font-['Instrument_Serif'] italic text-[44px] sm:text-[68px] md:text-[100px]">
            management
          </span>
          <br />
          for your remote team
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="font-['Geist'] text-[15px] sm:text-[18px] leading-[1.6] text-[#373a46] opacity-80 max-w-[554px]"
        >
          TerraSignal delivers real-time commodity intelligence — monitoring
          news, satellite imagery, and market signals so your team can act
          before the market moves.
        </motion.p>

        {/* Email Input Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col gap-4 max-w-[520px]"
        >
          {/* Input Container */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center rounded-[20px] sm:rounded-[40px] bg-[#fcfcfc] border border-border px-2 py-1.5 gap-2 sm:gap-0"
            style={{
              boxShadow: "0px 10px 40px 5px rgba(194,194,194,0.25)",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 bg-transparent px-4 sm:px-5 py-3 text-[15px] font-['Geist'] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              className="rounded-[32px] px-6 py-3 text-[14px] font-medium font-['Geist'] text-white whitespace-nowrap"
              style={{
                background:
                  "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #111111 100%)",
                boxShadow:
                  "inset -4px -6px 25px 0px rgba(201,201,201,0.08), inset 4px 4px 10px 0px rgba(29,29,29,0.24)",
              }}
            >
              Create Free Account
            </button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-3 pl-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-[13px] font-['Geist'] text-muted-foreground font-medium">
              1,020+ Reviews
            </span>
            <div className="flex items-center gap-2 ml-1">
              {["G", "▲", "◆", "★"].map((icon, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground"
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
