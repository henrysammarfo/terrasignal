import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Satellite, Brain, TrendingUp, Shield, Users, Zap, Target, BarChart3, Globe, Layers, ArrowRight, Check, X, Minus } from "lucide-react";

const TOTAL_SLIDES = 13;

// ─── Slide Data ──────────────────────────────────────────────

const competitorMatrix = [
  { feature: "Real-time satellite imagery (Sentinel-2)", terra: true, gro: false, descartes: true, manual: false },
  { feature: "Automated spectral analysis (NDVI/NDWI/MSI)", terra: true, gro: false, descartes: true, manual: false },
  { feature: "AI-powered news monitoring & scoring", terra: true, gro: true, descartes: false, manual: false },
  { feature: "Weather anomaly contextualization", terra: true, gro: true, descartes: "partial", manual: "partial" },
  { feature: "Autonomous end-to-end pipeline", terra: true, gro: false, descartes: false, manual: false },
  { feature: "Trade signal generation", terra: true, gro: "partial", descartes: false, manual: false },
  { feature: "Real-time Slack/webhook delivery", terra: true, gro: false, descartes: false, manual: false },
  { feature: "Open-source & self-hostable", terra: true, gro: false, descartes: false, manual: true },
  { feature: "Sub-$500/mo entry price", terra: true, gro: false, descartes: false, manual: true },
  { feature: "No manual analyst required", terra: true, gro: false, descartes: false, manual: false },
];

const pricingTiers = [
  {
    name: "Free / Developer",
    price: "$0",
    period: "/month",
    description: "For developers and researchers exploring commodity intelligence",
    features: [
      "5 regions monitored",
      "Daily satellite scans",
      "Basic NDVI analysis",
      "7-day data retention",
      "Community support",
      "Dashboard access",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    description: "For commodity traders and agricultural analysts",
    features: [
      "50 regions monitored",
      "Hourly satellite scans",
      "Full spectral suite (NDVI/NDWI/MSI)",
      "AI-generated intel reports",
      "Trade signal generation",
      "Slack & webhook delivery",
      "90-day data retention",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For hedge funds, insurers, and commodity houses",
    features: [
      "Unlimited regions",
      "Sub-15-min scan cadence",
      "Custom spectral indices",
      "Private LLM deployment",
      "Dedicated Slack channels",
      "Historical backfill (5+ years)",
      "API access & white-label",
      "Dedicated success manager",
      "SOC 2 compliance",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const gtmPhases = [
  {
    phase: "Phase 1: Land",
    timeline: "Months 1–6",
    icon: Target,
    color: "from-emerald-500 to-emerald-400",
    strategy: "Developer-led acquisition",
    tactics: [
      "Open-source the agent on GitHub — build credibility and community",
      "Free tier targets independent traders, ag-tech researchers, and quant developers",
      "Content marketing: publish satellite analysis case studies on crop disruptions",
      "Hackathon & conference presence (TCC AI Challenge, AGU, Commodity Trading Week)",
      "SEO-optimized landing page with live demo dashboard",
    ],
    kpi: "1,000 free users, 50 GitHub stars",
  },
  {
    phase: "Phase 2: Expand",
    timeline: "Months 6–18",
    icon: TrendingUp,
    color: "from-amber-500 to-amber-400",
    strategy: "Convert power users to Pro",
    tactics: [
      "Usage-based upsell triggers: region limits, scan frequency, alert channels",
      "Partner with commodity data vendors (Refinitiv, Bloomberg) for distribution",
      "Direct outreach to mid-market commodity trading desks (50–200 person firms)",
      "Launch Slack integration marketplace listing",
      "Case studies: quantified ROI from early Pro adopters (e.g., 'Detected Ukraine wheat disruption 3 days before market moved')",
    ],
    kpi: "200 Pro subscribers, $350K ARR",
  },
  {
    phase: "Phase 3: Scale",
    timeline: "Months 18–36",
    icon: Globe,
    color: "from-blue-500 to-blue-400",
    strategy: "Enterprise & vertical expansion",
    tactics: [
      "Enterprise sales team targeting top-50 commodity trading houses & agricultural insurers",
      "White-label API for integration into existing trading platforms (CTRM systems)",
      "Expand beyond crops: mining, forestry, water stress, energy infrastructure",
      "Geographic expansion: add ESA, JAXA, and commercial satellite feeds",
      "Strategic partnerships with reinsurers (Swiss Re, Munich Re) for parametric insurance",
    ],
    kpi: "20 Enterprise accounts, $5M ARR, Series A",
  },
];

// ─── Utility Components ──────────────────────────────────────

const FeatureIcon = ({ value }: { value: boolean | string }) => {
  if (value === true) return <Check className="w-5 h-5 text-emerald-400" />;
  if (value === "partial") return <Minus className="w-5 h-5 text-amber-400" />;
  return <X className="w-5 h-5 text-red-400/60" />;
};

const SlideNumber = ({ current, total }: { current: number; total: number }) => (
  <div className="absolute bottom-6 right-8 text-white/30 text-sm font-mono">
    {current} / {total}
  </div>
);

// ─── Individual Slides ───────────────────────────────────────

function TitleSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-20 relative">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
        <div className="flex items-center gap-4 mb-8">
          <Satellite className="w-16 h-16 text-emerald-400" />
          <h1 className="text-8xl font-black tracking-tight text-white">TerraSignal</h1>
        </div>
        <p className="text-3xl text-white/70 font-light max-w-4xl">
          AI-Powered Commodity Intelligence from Space
        </p>
        <div className="mt-12 flex items-center gap-3 text-emerald-400/80 text-xl">
          <Zap className="w-6 h-6" />
          <span>TCC AI Agent Challenge 2025 — Hackathon Submission</span>
        </div>
      </motion.div>
      <SlideNumber current={1} total={TOTAL_SLIDES} />
    </div>
  );
}

function ProblemSlide() {
  const problems = [
    { stat: "$120B+", label: "lost annually to crop disruptions, weather events, and supply chain shocks" },
    { stat: "3–5 days", label: "average delay for commodity analysts to detect field-level disruptions" },
    { stat: "85%", label: "of agricultural intelligence still relies on manual monitoring and phone calls" },
  ];
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">The Problem</h2>
      <p className="text-2xl text-white/50 mb-16">Commodity markets are flying blind on ground-level supply disruptions</p>
      <div className="grid grid-cols-3 gap-12">
        {problems.map((p, i) => (
          <motion.div key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}>
            <div className="text-6xl font-black text-emerald-400 mb-4">{p.stat}</div>
            <p className="text-xl text-white/70 leading-relaxed">{p.label}</p>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={2} total={TOTAL_SLIDES} />
    </div>
  );
}

function SolutionSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-6">The Solution</h2>
      <p className="text-2xl text-white/50 mb-16">An autonomous AI agent that monitors the Earth and delivers actionable commodity intelligence</p>
      <div className="grid grid-cols-3 gap-8">
        {[
          { icon: Satellite, title: "See", desc: "Sentinel-2 satellite imagery analyzed every pass — NDVI, NDWI, MSI spectral indices detect crop stress before it's visible" },
          { icon: Brain, title: "Think", desc: "LLM-powered synthesis fuses satellite data with weather anomalies, news events, and commodity prices into coherent intelligence" },
          { icon: TrendingUp, title: "Act", desc: "Trade signals with confidence scores delivered to your dashboard, Slack, or trading system within minutes" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <item.icon className="w-12 h-12 text-emerald-400 mb-4" />
            <h3 className="text-3xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-lg text-white/60 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={3} total={TOTAL_SLIDES} />
    </div>
  );
}

function PipelineSlide() {
  const stages = [
    { step: "1", title: "Detect", desc: "RSS feeds + Flock AI relevance scoring", color: "bg-red-500/20 border-red-500/40" },
    { step: "2", title: "Locate", desc: "Geocode regions → bounding boxes", color: "bg-orange-500/20 border-orange-500/40" },
    { step: "3", title: "Observe", desc: "Sentinel-2 L2A via STAC API", color: "bg-amber-500/20 border-amber-500/40" },
    { step: "4", title: "Contextualize", desc: "Open-Meteo + Yahoo Finance", color: "bg-emerald-500/20 border-emerald-500/40" },
    { step: "5", title: "Synthesize", desc: "LLM fusion → intel report", color: "bg-blue-500/20 border-blue-500/40" },
    { step: "6", title: "Deliver", desc: "Dashboard + Slack + webhooks", color: "bg-purple-500/20 border-purple-500/40" },
  ];
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">How It Works</h2>
      <p className="text-2xl text-white/50 mb-14">Fully autonomous 6-stage pipeline — zero human intervention</p>
      <div className="flex items-center gap-3">
        {stages.map((s, i) => (
          <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3">
            <div className={`${s.color} border rounded-xl p-5 min-w-[200px]`}>
              <div className="text-sm font-mono text-white/40 mb-1">Step {s.step}</div>
              <div className="text-xl font-bold text-white mb-1">{s.title}</div>
              <div className="text-sm text-white/50">{s.desc}</div>
            </div>
            {i < stages.length - 1 && <ArrowRight className="w-5 h-5 text-white/20 flex-shrink-0" />}
          </motion.div>
        ))}
      </div>
      <SlideNumber current={4} total={TOTAL_SLIDES} />
    </div>
  );
}

function TechStackSlide() {
  const stacks = [
    { category: "Agent", items: ["Python 3.12", "LangGraph orchestration", "Flock AI scoring", "Microsoft Planetary Computer (STAC)"] },
    { category: "Spectral Analysis", items: ["Sentinel-2 L2A (Bands B04, B08, B03, B11)", "NDVI (vegetation health)", "NDWI (water stress)", "MSI (moisture stress)"] },
    { category: "Data Sources", items: ["Open-Meteo (weather anomalies)", "Yahoo Finance (commodity prices)", "RSS news feeds (Reuters, FAO)", "OpenCage Geocoder"] },
    { category: "Frontend & Backend", items: ["React + Vite + TypeScript", "Supabase (Postgres + Auth + Edge Functions)", "Leaflet.js (geospatial maps)", "Recharts (data viz)"] },
  ];
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">Tech Stack</h2>
      <p className="text-2xl text-white/50 mb-14">Built on open standards and production-grade infrastructure</p>
      <div className="grid grid-cols-4 gap-6">
        {stacks.map((s, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-emerald-400 mb-4">{s.category}</h3>
            <ul className="space-y-2">
              {s.items.map((item, j) => (
                <li key={j} className="text-base text-white/60 flex items-start gap-2">
                  <span className="text-emerald-400/60 mt-1">▸</span> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={5} total={TOTAL_SLIDES} />
    </div>
  );
}

function MarketSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">Market Opportunity</h2>
      <p className="text-2xl text-white/50 mb-14">Agricultural intelligence is a massive, underserved market</p>
      <div className="grid grid-cols-3 gap-12">
        {[
          { label: "TAM", value: "$44B", desc: "Global agricultural analytics market by 2030 (MarketsAndMarkets, 2024)", color: "text-blue-400" },
          { label: "SAM", value: "$8.5B", desc: "Commodity trading intelligence & satellite-based crop monitoring", color: "text-emerald-400" },
          { label: "SOM", value: "$850M", desc: "AI-first commodity intel platforms serving active traders & insurers", color: "text-amber-400" },
        ].map((m, i) => (
          <motion.div key={i} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.15 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-lg font-mono text-white/40 mb-2">{m.label}</div>
            <div className={`text-6xl font-black ${m.color} mb-4`}>{m.value}</div>
            <p className="text-base text-white/50">{m.desc}</p>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={6} total={TOTAL_SLIDES} />
    </div>
  );
}

function DemoSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">Live Demo</h2>
      <p className="text-2xl text-white/50 mb-12">Real pipeline output — not mockups</p>
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-emerald-400 mb-4">Sample Intel Report</h3>
          <div className="space-y-3 text-white/70">
            <div className="flex justify-between"><span className="text-white/40">Region:</span><span>Punjab, India</span></div>
            <div className="flex justify-between"><span className="text-white/40">Event:</span><span>Wheat rust outbreak detected</span></div>
            <div className="flex justify-between"><span className="text-white/40">NDVI Delta:</span><span className="text-red-400">-0.18 (significant decline)</span></div>
            <div className="flex justify-between"><span className="text-white/40">Precip Anomaly:</span><span className="text-amber-400">+42mm above normal</span></div>
            <div className="flex justify-between"><span className="text-white/40">Confidence:</span><span className="text-emerald-400">87%</span></div>
            <div className="flex justify-between"><span className="text-white/40">Trade Signal:</span><span className="text-emerald-400 font-bold">LONG Wheat — 6wk target</span></div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-emerald-400 mb-4">Pipeline Performance</h3>
          <div className="space-y-3 text-white/70">
            <div className="flex justify-between"><span className="text-white/40">End-to-end latency:</span><span>~90 seconds</span></div>
            <div className="flex justify-between"><span className="text-white/40">Satellite data fetch:</span><span>~15 seconds (STAC API)</span></div>
            <div className="flex justify-between"><span className="text-white/40">Spectral analysis:</span><span>~8 seconds (3 indices)</span></div>
            <div className="flex justify-between"><span className="text-white/40">LLM synthesis:</span><span>~20 seconds</span></div>
            <div className="flex justify-between"><span className="text-white/40">Regions per scan:</span><span>10–50 concurrent</span></div>
            <div className="flex justify-between"><span className="text-white/40">Data sources fused:</span><span>5 (satellite, weather, news, prices, geocode)</span></div>
          </div>
        </div>
      </div>
      <SlideNumber current={7} total={TOTAL_SLIDES} />
    </div>
  );
}

function CompetitiveLandscapeSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-16">
      <h2 className="text-5xl font-bold text-white mb-3">Competitive Landscape</h2>
      <p className="text-xl text-white/50 mb-8">TerraSignal vs. incumbent solutions — feature-by-feature</p>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-white/40 text-base font-medium w-[340px]">Capability</th>
              <th className="p-4 text-center text-emerald-400 text-base font-bold w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  <Satellite className="w-5 h-5" />
                  TerraSignal
                </div>
              </th>
              <th className="p-4 text-center text-white/60 text-base font-medium w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/30">$100M+ raised</span>
                  Gro Intelligence
                </div>
              </th>
              <th className="p-4 text-center text-white/60 text-base font-medium w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/30">Acq. by Frontgrade</span>
                  Descartes Labs
                </div>
              </th>
              <th className="p-4 text-center text-white/60 text-base font-medium w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-white/30">Status quo</span>
                  Manual Research
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {competitorMatrix.map((row, i) => (
              <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-3.5 text-white/70 text-sm">{row.feature}</td>
                <td className="p-3.5 text-center"><FeatureIcon value={row.terra} /></td>
                <td className="p-3.5 text-center"><FeatureIcon value={row.gro} /></td>
                <td className="p-3.5 text-center"><FeatureIcon value={row.descartes} /></td>
                <td className="p-3.5 text-center"><FeatureIcon value={row.manual} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex gap-8 text-sm text-white/40">
        <span>Gro Intelligence: Acquired by Bayer/Climate Corp ecosystem, $100M+ raised, focuses on structured ag data, no satellite imagery pipeline</span>
        <span>Descartes Labs: Acquired by Frontgrade Technologies (2024), geospatial ML platform, no autonomous commodity intel</span>
      </div>
      <SlideNumber current={8} total={TOTAL_SLIDES} />
    </div>
  );
}

function BusinessModelSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-5xl font-bold text-white mb-3">Business Model</h2>
      <p className="text-xl text-white/50 mb-10">SaaS pricing with usage-based expansion — aligned with customer value</p>
      <div className="grid grid-cols-3 gap-6">
        {pricingTiers.map((tier, i) => (
          <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
            className={`rounded-2xl p-8 flex flex-col ${
              tier.highlight
                ? "bg-emerald-500/10 border-2 border-emerald-500/40 relative"
                : "bg-white/5 border border-white/10"
            }`}>
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}
            <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
            <div className="flex items-baseline gap-1 mb-3">
              <span className={`text-5xl font-black ${tier.highlight ? "text-emerald-400" : "text-white"}`}>{tier.price}</span>
              <span className="text-white/40 text-lg">{tier.period}</span>
            </div>
            <p className="text-sm text-white/50 mb-6">{tier.description}</p>
            <ul className="space-y-2.5 flex-1">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={`mt-6 w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
              tier.highlight
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}>
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center text-sm text-white/30">
        Unit economics: ~$2.50/region/scan (satellite API + compute) → 85%+ gross margin at Pro tier
      </div>
      <SlideNumber current={9} total={TOTAL_SLIDES} />
    </div>
  );
}

function GoToMarketSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-5xl font-bold text-white mb-3">Go-to-Market Strategy</h2>
      <p className="text-xl text-white/50 mb-10">Land → Expand → Scale — developer-led growth into enterprise</p>
      <div className="space-y-6">
        {gtmPhases.map((phase, i) => (
          <motion.div key={i} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 flex gap-6">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center`}>
                <phase.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-white/30 font-mono">{phase.timeline}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                <span className="text-sm text-white/40">— {phase.strategy}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {phase.tactics.map((t, j) => (
                  <p key={j} className="text-sm text-white/60 flex items-start gap-2">
                    <span className="text-emerald-400/60 mt-0.5">▸</span> {t}
                  </p>
                ))}
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400/60">KPI Target: {phase.kpi}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={10} total={TOTAL_SLIDES} />
    </div>
  );
}

function TeamSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">Why Us</h2>
      <p className="text-2xl text-white/50 mb-14">Built by engineers who understand both satellite data and commodity markets</p>
      <div className="grid grid-cols-2 gap-8">
        {[
          { title: "Full-Stack AI Pipeline", desc: "End-to-end autonomous system — from RSS ingestion to trade signal delivery — built in under 4 weeks for the TCC AI Agent Challenge" },
          { title: "Open-Source First", desc: "Transparent, auditable, and extensible. The community can verify our spectral analysis, contribute new data sources, and self-host" },
          { title: "Production-Grade Architecture", desc: "Supabase for real-time data, LangGraph for reliable orchestration, Edge Functions for serverless delivery — scales from 1 to 10,000 users" },
          { title: "Domain Expertise", desc: "Deep understanding of remote sensing (NDVI/NDWI/MSI), commodity market microstructure, and the analyst workflow we're automating" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-8">
            <Shield className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-base text-white/60 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
      <SlideNumber current={11} total={TOTAL_SLIDES} />
    </div>
  );
}

function TractionSlide() {
  return (
    <div className="flex flex-col justify-center h-full px-20">
      <h2 className="text-6xl font-bold text-white mb-4">Traction & Roadmap</h2>
      <p className="text-2xl text-white/50 mb-14">What we've built and what's next</p>
      <div className="grid grid-cols-2 gap-12">
        <div>
          <h3 className="text-2xl font-bold text-emerald-400 mb-6">✅ Built (Hackathon MVP)</h3>
          <ul className="space-y-3">
            {[
              "6-stage autonomous pipeline (Detect → Deliver)",
              "Sentinel-2 spectral analysis (NDVI, NDWI, MSI)",
              "AI-powered intel report generation via Flock AI",
              "Real-time dashboard with Leaflet maps + Recharts",
              "Supabase backend with Auth, RLS, Edge Functions",
              "Slack webhook delivery + notification system",
              "GitHub Actions for automated hourly scans",
              "Watchlist & trade signal tracking",
            ].map((item, i) => (
              <li key={i} className="text-lg text-white/70 flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-amber-400 mb-6">🔜 Next (Post-Hackathon)</h3>
          <ul className="space-y-3">
            {[
              "Historical backfill — 5-year NDVI trend analysis",
              "Commercial satellite integration (Planet Labs, Maxar)",
              "Multi-commodity expansion (soybeans, corn, coffee, palm oil)",
              "Portfolio-level risk scoring for fund managers",
              "Parametric insurance trigger calculations",
              "Mobile app with push notification alerts",
              "Bloomberg Terminal & Refinitiv Eikon plugins",
              "SOC 2 Type II compliance for enterprise",
            ].map((item, i) => (
              <li key={i} className="text-lg text-white/70 flex items-start gap-2">
                <ArrowRight className="w-5 h-5 text-amber-400 mt-1 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <SlideNumber current={12} total={TOTAL_SLIDES} />
    </div>
  );
}

function ClosingSlide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-20">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
        <Satellite className="w-20 h-20 text-emerald-400 mx-auto mb-8" />
        <h2 className="text-7xl font-black text-white mb-6">Let's Talk</h2>
        <p className="text-3xl text-white/50 mb-12 max-w-3xl">
          The future of commodity intelligence is autonomous, satellite-powered, and AI-driven.
        </p>
        <div className="flex items-center justify-center gap-8 text-xl text-white/40">
          <span>🌐 terrasignal.lovable.app</span>
          <span>📧 hello@terrasignal.ai</span>
          <span>🐙 github.com/terrasignal</span>
        </div>
        <div className="mt-12 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-8 py-3 text-emerald-400 text-lg">
          <Zap className="w-5 h-5" />
          TCC AI Agent Challenge 2025
        </div>
      </motion.div>
      <SlideNumber current={13} total={TOTAL_SLIDES} />
    </div>
  );
}

// ─── Slide Registry ──────────────────────────────────────────

const SLIDES = [
  TitleSlide,        // 1
  ProblemSlide,      // 2
  SolutionSlide,     // 3
  PipelineSlide,     // 4
  TechStackSlide,    // 5
  MarketSlide,       // 6
  DemoSlide,         // 7
  CompetitiveLandscapeSlide, // 8 — NEW
  BusinessModelSlide,        // 9 — NEW
  GoToMarketSlide,           // 10 — NEW
  TeamSlide,         // 11
  TractionSlide,     // 12
  ClosingSlide,      // 13
];

// ─── Main Deck Component ────────────────────────────────────

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen?.();
      }
      if (e.key === "f" || e.key === "F5") {
        e.preventDefault();
        document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const CurrentSlide = SLIDES[current];

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] overflow-hidden relative select-none">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          animate={{ width: `${((current + 1) / SLIDES.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Slide container — fixed 1920x1080 scaled to fit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative origin-center"
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${Math.min(
              (typeof window !== "undefined" ? window.innerWidth : 1920) / 1920,
              (typeof window !== "undefined" ? window.innerHeight : 1080) / 1080
            )})`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <CurrentSlide />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <button onClick={prev} disabled={current === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 disabled:opacity-20 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${i === current ? "w-8 bg-emerald-400" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>

        <button onClick={next} disabled={current === SLIDES.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 disabled:opacity-20 transition-all">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Fullscreen toggle */}
      <button onClick={toggleFullscreen}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/40 z-50 transition-all">
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </button>

      {/* Thumbnail strip */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50 opacity-0 hover:opacity-100 transition-opacity">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-sm transition-all ${i === current ? "bg-emerald-400 scale-125" : "bg-white/15 hover:bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
