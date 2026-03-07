import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const FALLBACK_DATA: CommodityPrice[] = [
  { symbol: "ZW", name: "Wheat", price: 542.25, change: -1.2 },
  { symbol: "ZC", name: "Corn", price: 435.50, change: 0.8 },
  { symbol: "ZS", name: "Soybeans", price: 1142.75, change: -0.3 },
  { symbol: "CC", name: "Cocoa", price: 8245.00, change: 2.1 },
  { symbol: "KC", name: "Coffee", price: 248.30, change: 1.5 },
  { symbol: "CT", name: "Cotton", price: 72.45, change: -0.6 },
  { symbol: "SB", name: "Sugar", price: 19.82, change: 0.4 },
  { symbol: "CL", name: "Crude Oil", price: 71.20, change: -0.9 },
];

const CommodityTickerLanding = () => {
  const [prices] = useState<CommodityPrice[]>(FALLBACK_DATA);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let pos = 0;
    const speed = 0.5;
    let raf: number;
    const scroll = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      raf = requestAnimationFrame(scroll);
    };
    raf = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(raf);
  }, []);

  const doubled = [...prices, ...prices];

  return (
    <div className="relative z-10 bg-muted/30 border-y border-border py-4 overflow-hidden">
      <div ref={scrollRef} className="flex gap-8 overflow-hidden whitespace-nowrap">
        {doubled.map((c, i) => (
          <div key={`${c.symbol}-${i}`} className="flex items-center gap-3 shrink-0 px-2">
            <span className="text-[11px] font-['Geist'] font-semibold text-muted-foreground uppercase tracking-wider">
              {c.name}
            </span>
            <span className="text-[13px] font-['Geist'] font-medium text-foreground">
              ${c.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[12px] font-['Geist'] font-medium ${c.change >= 0 ? "text-green-600" : "text-red-500"}`}>
              {c.change >= 0 ? "+" : ""}{c.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommodityTickerLanding;
