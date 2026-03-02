import { motion } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Navbar = () => {
  const { session } = useAuth();
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-md border-b border-border/40"
    >
      <a href="/">
        <Logo />
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

      {/* Auth */}
      {session ? (
        <Link to="/dashboard" className="text-[14px] font-['Geist'] font-medium text-foreground px-5 py-2 rounded-full border border-border hover:bg-muted transition-colors">
          Dashboard
        </Link>
      ) : (
        <Link to="/auth" className="text-[14px] font-['Geist'] font-medium text-foreground px-5 py-2 rounded-full border border-border hover:bg-muted transition-colors">
          Sign In
        </Link>
      )}
    </motion.nav>
  );
};

export default Navbar;
