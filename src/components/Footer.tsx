import { useState } from "react";
import { ArrowRight } from "lucide-react";

const linkColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Status", "Support"],
  },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
  };

  return (
    <footer className="bg-foreground text-background px-6 pt-20 pb-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand + Newsletter */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center">
                <span className="text-foreground text-xs font-bold font-['Geist']">T</span>
              </div>
              <span className="text-[17px] font-semibold font-['Geist'] tracking-[-0.02em]">
                TerraSignal
              </span>
            </div>
            <p className="text-[14px] font-['Geist'] leading-[1.7] opacity-50 max-w-[300px]">
              Real-time commodity intelligence for teams that need to move before the market does.
            </p>
            <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                maxLength={255}
                className="flex-1 rounded-full bg-background/10 border border-background/15 px-4 py-2.5 text-[13px] font-['Geist'] text-background placeholder:text-background/40 outline-none focus:border-background/30 transition-colors"
              />
              <button
                type="submit"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background text-foreground hover:opacity-90 transition-opacity"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Link Columns */}
          {linkColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="text-[13px] font-semibold font-['Geist'] uppercase tracking-[0.1em] opacity-40">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-[14px] font-['Geist'] opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] font-['Geist'] opacity-30">
            © 2026 TerraSignal. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[12px] font-['Geist'] opacity-30 hover:opacity-60 transition-opacity"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
