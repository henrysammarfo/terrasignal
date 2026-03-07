import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Yahoo Finance commodity futures symbols
const SYMBOLS = [
  { symbol: "ZC=F", name: "Corn", unit: "¢/bu" },
  { symbol: "ZW=F", name: "Wheat", unit: "¢/bu" },
  { symbol: "ZS=F", name: "Soybeans", unit: "¢/bu" },
  { symbol: "SB=F", name: "Sugar #11", unit: "¢/lb" },
  { symbol: "KC=F", name: "Coffee", unit: "¢/lb" },
  { symbol: "CT=F", name: "Cotton", unit: "¢/lb" },
  { symbol: "ZR=F", name: "Rough Rice", unit: "$/cwt" },
  { symbol: "CC=F", name: "Cocoa", unit: "$/mt" },
];

async function fetchYahooQuote(symbol: string): Promise<any | null> {
  try {
    // Yahoo Finance v8 API - free, no auth required
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "TerraSignal/1.0" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose;

    if (!price || !prevClose) return null;

    const change = price - prevClose;
    const changePct = (change / prevClose) * 100;

    return {
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
    };
  } catch (e) {
    console.error(`Yahoo fetch failed for ${symbol}:`, e);
    return null;
  }
}

// Fallback: deterministic simulated prices (used if Yahoo is unreachable)
function simulatedPrice(symbol: string): { price: number; change: number; changePct: number } {
  const basePrices: Record<string, { price: number; range: number }> = {
    "ZC=F": { price: 447.0, range: 15 },
    "ZW=F": { price: 611.25, range: 20 },
    "ZS=F": { price: 1185.0, range: 30 },
    "SB=F": { price: 19.5, range: 1.5 },
    "KC=F": { price: 185.0, range: 8 },
    "CT=F": { price: 78.5, range: 3 },
    "ZR=F": { price: 15.8, range: 0.8 },
    "CC=F": { price: 8250.0, range: 350 },
  };
  const base = basePrices[symbol] || { price: 100, range: 5 };
  const hourSeed = Math.floor(Date.now() / 3600000);
  const hash = Array.from(symbol).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const variation = Math.sin(hourSeed * hash * 0.001) * base.range;
  const price = base.price + variation;
  const prevPrice = base.price + Math.sin((hourSeed - 1) * hash * 0.001) * base.range;
  const change = price - prevPrice;
  const changePct = (change / prevPrice) * 100;
  return {
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Fetch all symbols in parallel from Yahoo Finance
    const results = await Promise.all(
      SYMBOLS.map(async (s) => {
        const live = await fetchYahooQuote(s.symbol);
        const data = live || simulatedPrice(s.symbol);
        return {
          symbol: s.symbol,
          name: s.name,
          unit: s.unit,
          price: data.price,
          change: data.change,
          changePct: data.changePct,
          live: !!live,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const liveCount = results.filter(r => r.live).length;
    console.log(`Commodity prices: ${liveCount}/${results.length} live from Yahoo Finance`);

    return new Response(JSON.stringify({ success: true, data: results, liveCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Commodity prices error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch prices" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
