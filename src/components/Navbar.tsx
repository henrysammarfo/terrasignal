import { motion } from "motion/react";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md border-b border-border/40"
    >
      {/* Logo */}
      <a href="/" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <span className="text-background text-xs font-bold font-['Geist']">T</span>
        </div>
        <span className="text-[17px] font-semibold font-['Geist'] tracking-[-0.02em] text-foreground">
          TerraSignal
        </span>
      </a>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {["Features", "Pricing", "About"].map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="text-[14px] font-['Geist'] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {link}
          </a>
        ))}
      </div>

      {/* Sign In */}
      <button className="text-[14px] font-['Geist'] font-medium text-foreground px-5 py-2 rounded-full border border-border hover:bg-muted transition-colors">
        Sign In
      </button>
    </motion.nav>
  );
};

export default Navbar;
