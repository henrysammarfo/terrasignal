# TerraSignal — Autonomous Commodity Intelligence Agent

**UK AI Agent Hackathon EP4 x OpenClaw — TCC Challenge**

An AI agent that reads **live** commodity news, retrieves **live** Sentinel-2 L2A imagery from Microsoft Planetary Computer, computes **real** NDVI/NDWI/MSI and anomalies, fetches **live** weather from Open-Meteo, and delivers market intelligence via **Flock AI**. **No mocks, placeholders, or simulated data** — end-to-end real-time pipeline.

**All features are live-only.** RSS, geocoding, Sentinel-2, weather, commodity prices, and reports use real APIs. The dashboard shows only intel from the Python pipeline (webhook). The only exception is the optional env var `E2E_USE_SEED_SIGNAL=1`, used only when running the pipeline without RSS (e.g. CI or when feeds are down).

- **React app (Lovable):** `npm i && npm run dev` — dashboard, intel feed, map.
- **Python agent (live data only):** see [SETUP.md](SETUP.md). Run `pip install -r requirements.txt`, then `python demo.py` or `python main.py run --once`. Uses **live** Sentinel-2 (Planetary Computer), **live** weather (Open-Meteo), **live** Flock reports. No mocks.
- **Dashboard** shows only live intel from the Python pipeline (webhook); no fake or AI-generated demo data.

---

## TCC AI Agent Challenge — How TerraSignal Fits

| Challenge requirement | TerraSignal implementation |
|------------------------|----------------------------|
| **Detect real-world events** | RSS monitor (Reuters, USDA, FAO) + Flock AI relevance scoring; geocoding (Flock → bbox, fallback Nominatim). |
| **Retrieve relevant satellite data (Sentinel-2)** | **Microsoft Planetary Computer** STAC API + Data API `item/statistics` — Sentinel-2 L2A, cloud-filtered search, best/baseline image selection (`sentinel_retriever.py` / `sentinel_data_api.py`). |
| **Analyze it** | **NDVI, NDWI, MSI** from L2A bands (stackstac path) or **NDVI + anomaly from Data API stats**; SCL-based quality where stackstac is available; anomaly vs prior year; RGB thumbnails or Planetary Computer preview. |
| **Deliver insights customers would pay for** | Flock-synthesized **intel reports** (headline, confidence, market implication); **Slack** alerts; **Supabase dashboard** (webhook) for commodity/ag use case. |
| **Combine satellite + news + weather + market** | LangGraph pipeline: news → geocode → Sentinel → **Open-Meteo** 90-day weather (precip/temp/ET0) → **live commodity prices** (corn, wheat, soybean via yfinance) → Flock report → delivery. |
| **Use case** | **Commodity / agricultural intelligence** — e.g. Brazil soybean drought/stress, NDVI delta, weather anomaly, supply-risk narrative. |

Starter-kit alignment: we use **Planetary Computer** for Sentinel-2 L2A, **RGB + NDVI + NDWI + MSI**, **SCL masking** for image quality (stackstac path), and **change detection** (current vs baseline year). No Jupyter notebook in-repo; the agent runs as a **production pipeline** (`demo.py`, `main.py run`).

---

## TCC Hack judging — how we score

| Criterion | Weight | TerraSignal |
|-----------|--------|-------------|
| **Technical implementation** | 35% | **Real data only:** RSS → Flock → geocode → Sentinel-2 (STAC + Data API) + Open-Meteo → reports → Slack + Supabase. Handles clouds (cloud filter), edge cases (Data API fallback). Runs continuously (e.g. GitHub Actions). No mocks. |
| **Business case & discovery** | 30% | **Commodity/ag intelligence:** farmers, insurers, traders need early signals. We deliver actionable intel (headline, confidence, market implication) and alerts. Clear "someone would pay for this" use case. |
| **Self-improvement** | 25% | Pipeline is **improvement-ready:** relevance threshold and regions are configurable; we can add feedback (e.g. which reports get used), more sources, and refine Flock prompts from quality reviews. Moat = domain-specific pipeline + multi-source fusion. |
| **Multi-source intelligence** | 15% | **News/RSS** + **Sentinel-2** (NDVI, anomaly) + **weather** (precip/temp anomalies, drought index) + **commodity prices** (corn, wheat, soybean). Reports fuse all — insights no single source could produce alone. |

---

## Repo structure (high level)

- `demo.py` — one-shot live analysis: news → geocode → Sentinel-2 → weather → Flock report → Slack/dashboard.
- `main.py` — CLI entrypoint for running the agent loop.
- `app/` — Python agent:
  - `config.py` — settings from `.env`.
  - `llm_client.py` — Flock client.
  - `models/` — Pydantic schemas.
  - `agent/tools/` — news monitor, geocoder, Sentinel-2 (STAC + Data API), weather, report generator.
  - `agent/orchestrator.py` — LangGraph pipeline wiring tools together.
- `delivery/` — Slack + Supabase webhook delivery.
- `src/` — React dashboard (Lovable) – auth, dashboard, maps, charts.
- `supabase/` — SQL migrations + edge functions (`agent-scan`, `webhook-receiver`, `openclaw-alert`).

See `SETUP.md` for Python agent setup and `DASHBOARD_SETUP.md` for dashboard + webhook configuration.

