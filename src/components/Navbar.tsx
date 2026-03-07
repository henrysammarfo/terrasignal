import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const { session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact us", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl bg-background/70 backdrop-blur-md border border-border/40 rounded-full shadow-lg overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 sm:px-6 py-2.5 mx-auto">
        {/* Logo */}
        <a href="/" className="shrink-0">
          <Logo />
        </a>

        {/* Desktop center nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[14px] font-['Geist'] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {session ? (
            <Link
              to="/dashboard"
              className="text-[14px] font-['Geist'] font-medium text-primary-foreground bg-foreground px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth?mode=signup"
                className="hidden sm:inline-flex text-[14px] font-['Geist'] font-medium text-foreground hover:text-foreground/80 transition-colors px-4 py-2"
              >
                Sign up
              </Link>
              <Link
                to="/auth"
                className="text-[14px] font-['Geist'] font-medium text-primary-foreground bg-foreground px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
              >
                Sign in
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-border/40"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[14px] font-['Geist'] font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-2 rounded-lg hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
