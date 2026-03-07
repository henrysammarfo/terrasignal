# TerraSignal — AI-Powered Commodity Intelligence from Space

**TCC AI Agent Challenge · OpenClaw**

An autonomous AI agent that transforms raw Earth observation data into actionable commodity market intelligence. It continuously monitors global agricultural news, retrieves real Sentinel-2 L2A satellite imagery, analyzes vegetation health, cross-references live weather anomalies and commodity prices, and delivers structured intel reports — all without human intervention.

**No mocks, placeholders, or simulated data** — end-to-end real-time pipeline.

---

## How It Works

```
News/RSS ─→ AI Relevance Scoring ─→ Geocoding ─→ Sentinel-2 L2A ─→ Spectral Analysis
                                                                          │
                                                                          ▼
Commodity Prices ←── Weather Anomalies ←── NDVI/NDWI/MSI + Anomaly Detection
        │                    │                         │
        └────────────────────┴─────────────────────────┘
                             │
                      AI Report Synthesis
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        Dashboard       Slack Alert    Webhook/API
```

### Pipeline stages

1. **Detect** — RSS feeds (Reuters, USDA, FAO) are scanned and scored by AI for material crop stress events (drought, flooding, pest outbreaks)
2. **Locate** — Events are geocoded to precise bounding boxes using AI + Nominatim fallback
3. **Observe** — Real Sentinel-2 L2A imagery is retrieved from Microsoft Planetary Computer (STAC API + Data API), cloud-filtered, and analyzed for NDVI, NDWI, and MSI with anomaly detection against prior-year baselines
4. **Contextualize** — Open-Meteo provides 90-day precipitation, temperature, and ET0 anomalies; live commodity futures (corn, wheat, soybean via Yahoo Finance) add market context
5. **Synthesize** — AI fuses all sources into structured intel reports: headline, summary, confidence score, severity, and market implication
6. **Deliver** — Reports flow to a real-time dashboard (WebSocket), Slack alerts, and webhook integrations

---

## Why It Matters

Petabytes of free Sentinel-2 data go unused every year. Meanwhile, commodity traders, crop insurers, and agricultural stakeholders make billion-dollar decisions with incomplete information. TerraSignal bridges this gap — turning satellite pixels into market signals.

A single report answers: *"Is there real crop stress in Mato Grosso? How bad is the NDVI anomaly vs last year? What does the weather say? What does this mean for soybean futures?"* — questions that previously required a team of analysts, now answered autonomously in minutes.

---

## Multi-Source Intelligence Fusion

| Source | What it provides | Alone it's… |
|--------|-----------------|-------------|
| **News/RSS** | Event detection, context | Narrative without verification |
| **Sentinel-2** | Vegetation indices, anomaly | Numbers without context |
| **Weather** | Precipitation/temp anomalies | Climate without crop impact |
| **Commodity prices** | Market state | Prices without cause |
| **Combined** | **Actionable intelligence** | **The full picture** |

---

## TCC Challenge Alignment

| Challenge requirement | TerraSignal implementation |
|------------------------|----------------------------|
| **Detect real-world events** | RSS monitor (Reuters, USDA, FAO) + Flock AI relevance scoring; geocoding (AI → bbox, fallback Nominatim) |
| **Retrieve relevant satellite data** | Microsoft Planetary Computer STAC API + Data API — Sentinel-2 L2A, cloud-filtered, best/baseline image selection |
| **Analyze it** | NDVI, NDWI, MSI from L2A bands; SCL-based quality masking; anomaly vs prior year; RGB thumbnails |
| **Deliver insights customers would pay for** | AI-synthesized intel reports (headline, confidence, market implication); Slack alerts; real-time dashboard |
| **Combine satellite + news + weather + market** | LangGraph pipeline: news → geocode → Sentinel → weather → commodity prices → AI report → delivery |

---

## Judging Criteria

| Criterion | Weight | How we score |
|-----------|--------|-------------|
| **Technical implementation** | 35% | Real data only: RSS → AI → geocode → Sentinel-2 (STAC + Data API) + Open-Meteo → reports → Slack + Dashboard. Handles clouds, edge cases, fallbacks. No mocks. |
| **Business case & discovery** | 30% | Commodity/ag intelligence: farmers, insurers, traders need early signals. Actionable intel (headline, confidence, market implication). Clear commercial value. |
| **Self-improvement** | 25% | Configurable relevance thresholds and regions; feedback-loop ready (report engagement → scoring refinement); compounding data moat via domain-specific fusion. |
| **Multi-source intelligence** | 15% | News/RSS + Sentinel-2 (NDVI, anomaly) + weather (precip/temp anomalies, drought index) + commodity prices. Reports fuse all — insights no single source produces alone. |

---

## Tech Stack

### Python Agent
- **Orchestration:** LangGraph state machine with six specialized tools
- **AI:** Flock AI for relevance scoring, signal extraction, geocoding, and report synthesis
- **Satellite:** Microsoft Planetary Computer (STAC + Data API); stackstac/rasterio optional path
- **Spectral:** NDVI, NDWI, MSI from real Sentinel-2 L2A bands (B04, B08, B03, B11)
- **Weather:** Open-Meteo 90-day archive (precipitation, temperature, ET0 anomalies)
- **Prices:** Yahoo Finance (corn, wheat, soybean futures)
- **Delivery:** Slack webhooks + Supabase webhook receiver

### React Dashboard
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Maps:** Leaflet with severity-colored markers from report bounding boxes
- **Charts:** Recharts time-series visualizations
- **Auth:** Email/password + Google OAuth with protected routes
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions + real-time subscriptions)
- **AI Chat:** Lovable AI gateway (Gemini) for market intelligence queries

---

## Repo Structure

```
├── demo.py                    # One-shot live analysis
├── main.py                    # CLI entrypoint for agent loop
├── app/
│   ├── config.py              # Settings from .env
│   ├── llm_client.py          # Flock AI client
│   ├── models/                # Pydantic schemas
│   └── agent/
│       ├── orchestrator.py    # LangGraph pipeline
│       └── tools/             # news, geocoder, sentinel, weather, report
├── delivery/                  # Slack + Supabase webhook delivery
├── src/                       # React dashboard (Lovable)
│   ├── pages/                 # Auth, Dashboard, Settings, Landing
│   ├── components/dashboard/  # Intel Feed, Signal Map, Charts, Agent Runner
│   └── hooks/                 # useIntelReports, useTradeSignals, useWatchlist
├── supabase/
│   ├── migrations/            # Database schema
│   └── functions/             # Edge functions (agent-scan, market-chat, etc.)
└── docs/                      # Product notes, setup guides
```

---

## Quick Start

### React Dashboard

```bash
git clone <repo-url>
cd terrasignal
npm install
npm run dev
```

Environment variables (create `.env`):
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

### Python Agent

```bash
pip install -r requirements.txt
```

Environment variables (create `.env` in project root):
```
FLOCK_API_KEY=<your-flock-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<your-service-key>
SLACK_WEBHOOK_URL=<optional-slack-webhook>
MIN_RELEVANCE_SCORE=0.65
```

Run:
```bash
# One-shot demo (live news → satellite → weather → report)
python demo.py

# Continuous agent loop
python main.py run

# Single scan
python main.py run --once
```

See [SETUP.md](SETUP.md) for detailed Python agent setup and [DASHBOARD_SETUP.md](DASHBOARD_SETUP.md) for dashboard + webhook configuration.

---

## Deployment

- **Dashboard:** Vercel (or Lovable publish) — `npm run build` → `dist/`
- **Edge Functions:** Auto-deployed via Lovable Cloud
- **Python Agent:** Any server, VM, or GitHub Actions (scheduled cron)

---

## Self-Improvement & Moat

- Configurable relevance thresholds (`MIN_RELEVANCE_SCORE`) and region targeting
- Pipeline architecture supports feedback loops (report engagement → scoring refinement)
- Domain-specific fusion (news + EO + weather + market) creates a compounding data moat
- Adding sources (more RSS feeds, Sentinel-1 SAR, soil moisture) improves every downstream report

---

## Built With

Python · LangGraph · Flock AI · Microsoft Planetary Computer · Open-Meteo · Yahoo Finance · React · TypeScript · Vite · Tailwind CSS · Supabase · Leaflet · Recharts · Lovable

---

## License

Built for the TCC AI Agent Challenge.
