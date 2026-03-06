# TerraSignal — Setup

All data in the pipeline is **live**: real RSS feeds, real geocoding, real Sentinel-2 L2A from Planetary Computer, real weather from Open-Meteo, real reports from Flock AI. No mocks or simulations.

## 1. Python (use 3.11 or 3.12 for full pipeline)

The **full pipeline** (Sentinel-2 + weather + Flock) requires **Python 3.11 or 3.12**. On Python 3.14 the EO stack can crash (native libs). Install 3.12 from [python.org](https://www.python.org/downloads/) or run `py install 3.12` (Windows), then:

```bash
py -3.12 -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

Then run the demo (see below). Everything is **live**: Sentinel-2, weather, Flock — no mocks.

**Windows / rasterio crash:** On Windows, the demo automatically uses the **Planetary Computer Data API** for Sentinel-2 (no rasterio/stackstac), so NDVI and anomaly are computed from live API statistics. To force this on other platforms set `USE_SENTINEL_DATA_API=1` in `.env`.

**Windows shortcut:** `run_full_demo.bat` creates a 3.12 venv (if you have `py -3.12`), installs deps, and runs `demo.py`.  
**After pip finishes:** run `.venv\Scripts\python demo.py` (or `run_full_demo.bat`) for the full pipeline.

## 2. Environment (.env)

Copy `.env.example` to `.env` and set:

| Variable | Required | Where to get it |
|----------|----------|------------------|
| **FLOCK_API_KEY** | Yes | [platform.flock.io](https://platform.flock.io/) → API Keys |
| **FLOCK_MODEL** | Yes | e.g. `qwen3-30b-a3b-instruct-2507` or `deepseek-v3.2` |
| **SLACK_WEBHOOK_URL** | Yes | Slack → App → Incoming Webhooks → Add to channel |
| **SUPABASE_WEBHOOK_URL** | For dashboard | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver` |
| **WEBHOOK_API_KEY** | For dashboard | Same value as in Supabase Edge Function secrets |
| **SUPABASE_AGENT_USER_ID** | For dashboard | Sign up once in the React app, copy your user UUID from Supabase Auth |

OpenClaw is optional; leave `OPENCLAW_GATEWAY_URL` empty if not set up.

## 3. Run

- **Demo (full pipeline: geocode + Sentinel-2 + weather + Flock):**  
  `python demo.py`  
  Requires Sentinel deps and **Python 3.11 or 3.12** (see §1). On 3.14 the Sentinel stack may crash — use a 3.12 venv.

- **Agent once:**  
  `python main.py run --once`

- **Agent loop:**  
  `python main.py run`

- **Streamlit UI:**  
  `streamlit run dashboard/app.py`

**Live tests (real RSS, Flock, Sentinel-2, Open-Meteo):**  
`pytest tests/test_live_pipeline.py -v`  
Requires `FLOCK_API_KEY` in `.env`. Uses real APIs only; full-pipeline test skips when no agricultural signals come from RSS.

**E2E when RSS is unavailable:** Set `E2E_USE_SEED_SIGNAL=1` and run `python demo.py` to exercise geocode → Sentinel-2 → weather → Flock → Slack with one seed signal (Mato Grosso soybean). All data is still live; only the signal source is fixed for testing.

The **React dashboard** (Lovable) is the main UI. Run `npm run dev` in the repo root; after you set `SUPABASE_WEBHOOK_URL`, `WEBHOOK_API_KEY`, and `SUPABASE_AGENT_USER_ID`, run the Python agent and reports will appear there. See **[DASHBOARD_SETUP.md](DASHBOARD_SETUP.md)** for step-by-step webhook and React env setup.

## 4. Free tools used (all live)

- **Flock AI** — LLM for relevance scoring, geocoding, and report synthesis (your credits).
- **Microsoft Planetary Computer** — Live Sentinel-2 L2A (no API key).
- **Open-Meteo** — Live historical weather archive (no API key).
- **Slack** — Live alerts (free workspace + webhook).
- **Supabase** — DB + webhook for the React dashboard.
