# TerraSignal — Hackathon Winning Playbook

> **Note:** The hackathon guide `.docx` could not be read (binary format). This playbook is based on **TerraHacks 2025** rules, your codebase, and winning strategy. **Manually open `TerraSignal_Hackathon_Guide.docx`** to check for any event-specific tracks or instructions.

---

## 1. Event snapshot (TerraHacks 2025)

| Item | Detail |
|------|--------|
| **When** | Aug 1–3, 2025 (hacking: 9pm Fri → 8am Sun, 36 hours) |
| **Where** | In-person @ TMU Toronto — **you must be present to qualify for prizes** |
| **Scale** | ~259+ participants |
| **Categories** | Overall Solution, Best Pitch, Best Healthcare Solution, Best Use of Emerging Tech (opt-in), MLH Gemini, MLH MongoDB |

**Judging (from rules):**  
Presentation · Technical Complexity · Feasibility · Impact · Innovation  

**Submission:**  
Project description + reflection, **demo video (max 3 min)**, GitHub repo link, team details. All code must be uploaded before deadline.

---

## 2. What you've built

### React dashboard (Lovable)

- **Landing:** Hero (video bg, Geist/Instrument Serif), Features, Testimonials, Pricing, CTA, Footer  
- **Auth:** Sign up / sign in (Lovable Cloud Auth), protected routes, profiles (Supabase)  
- **Dashboard:**  
  - **Intel Feed** — severity/crop/region filters, sort, confidence badges, satellite anomaly, click-through to detail  
  - **Signal Map** — Leaflet map, severity-colored markers from report bboxes  
  - **Charts** — SignalCharts (recharts)  
  - **Agent Runner** — "Run Agent" triggers `agent-scan` edge function; phases (Detect → Analyze → Report), toast, refetch  
  - **Agent History** — past scans  
  - **Notification Center** — realtime notifications  
- **Settings** — API/settings entry point  
- **Backend:**  
  - Supabase: `profiles`, `crop_signals`, `satellite_analyses`, `weather_contexts`, `intel_reports`, `notifications`, `agent_scans`; RLS; realtime on `intel_reports` / `crop_signals`  
  - Edge functions: **agent-scan** (AI gateway / Gemini-style flow, 6 regions, structured tool-call → DB + notifications), **webhook-receiver**, **openclaw-alert**  

**Tech that scores well:** AI (agent + structured output), real-time updates, maps, charts, clear UX, Supabase + edge functions.

### Python agent (full implementation)
- **News monitor:** RSS (Reuters, USDA, FAO) + Flock AI relevance scoring and signal extraction.
- **Geocoder:** Flock → bbox; fallback Nominatim (free).
- **Sentinel-2:** Microsoft Planetary Computer (free), using STAC + **Data API `item/statistics`** for NDVI and anomaly (and optional stackstac/rasterio on non-Windows).
- **Weather:** Open-Meteo 90-day anomalies (free, httpx-only client).
- **Report generator:** Flock synthesizes headline, summary, confidence, market_implication.
- **Delivery:** Slack webhook + Supabase webhook (so reports appear in the React dashboard).
- **Orchestrator:** LangGraph (news → geocode → Sentinel → weather → report → delivery).
- **Demo:** `python demo.py` (picks a live `CropSignal` from RSS + Flock; no hardcoded event). **Run:** `python main.py run --once` or `python main.py run`.

See [SETUP.md](SETUP.md) for .env and run instructions.

---

## 3. Next steps to win (prioritized)

### A. Submission & compliance (must-do)

- [ ] **Confirm event:** Is this TerraHacks 2025 or another "TerraSignal" event? If different, get that event's rules and deadlines from the .docx or Devpost.  
- [ ] **36-hour rule:** All **code** must be written in the 36-hour window. Ideation and design beforehand are OK. If your repo has pre-hackathon commits, be ready to explain what was done during the window (e.g. "agent-scan and dashboard built during hackathon").  
- [ ] **80% original:** Ensure ≥80% of code is yours; no big copied blocks without clear attribution.  
- [ ] **Single submission:** Only submit to this hackathon on Devpost.  
- [ ] **GitHub:** Repo clean, README with setup + run instructions, link in Devpost.  
- [ ] **Demo video (max 3 min):** Script it: problem → solution → live demo (landing → sign up → run agent → intel feed → map → charts) → impact. Record in one take or edit tightly.  
- [ ] **Description + reflection:** Clear "what / why / how," plus what you learned, what was hard, what you'd do better.

### B. Maximize each judging dimension

**Innovation**  
- Emphasize **AI agent that "scans" multiple global ag regions** and produces structured intel (NDVI, weather, market implication).  
- Mention **tool-calling / structured output** (events → crop_signals, satellite_analyses, weather_contexts, intel_reports) as a technical differentiator.  
- If you add one thing: e.g. "**trend line**" or "**risk score**" per region/crop (even simple formula) to show "intelligence" on top of raw signals.

**Impact**  
- Position as **commodity / ag intelligence for traders, insurers, or farmers** (price risk, crop stress, supply shocks).  
- Add a single sentence in app (e.g. Dashboard subtitle or a "Why TerraSignal" tooltip): e.g. "Turn satellite and weather data into actionable market intelligence."  
- In the doc and video: "Who is this for?" (e.g. small ag traders, crop insurers) and "What decision does this improve?" (e.g. when to hedge, where to scout).

**Feasibility**  
- **Demo must work live:** Run agent at least once before the event; ensure LOVABLE_API_KEY (and any Supabase keys) are set so agent-scan succeeds.  
- **Fallback:** Optional "demo mode" with 1–2 pre-seeded intel reports so you can show Feed/Map/Charts even if AI is down.  
- README: "How to run" (npm i, npm run dev, env vars); optional "Demo data" script.

**Technical complexity**  
- **Stack:** React + TypeScript, Supabase (RLS, realtime, migrations), Edge Functions, AI gateway (Gemini-style), Leaflet, Recharts, structured AI → DB pipeline.  
- In README or Devpost: list these; mention "real-time subscriptions," "row-level security," "serverless agent."  
- **Opt-in "Best Use of Emerging Tech":** Your agent is a strong fit (AI + geo/satellite-style data). Consider opting in and saying "Emerging tech: AI-driven ag intelligence with structured tool use and real-time dashboards."

**Presentation**  
- **Best Pitch:** 60–90 sec: problem (ag/commodity uncertainty) → TerraSignal (AI agent + dashboard) → quick live demo → "So you get early signals and market implications in one place."  
- **Video:** Good lighting, clear screen, no long silences. Show one "Run Agent" and then Feed/Map/Charts.  
- **Devpost:** 2–3 screenshots (Dashboard with data, Map, Agent Runner). Clear title: e.g. "TerraSignal – AI-Powered Commodity Intelligence."

### C. Quick product polish (high leverage)

1. **README.md**  
   - Project name, 1-line tagline, "What it does," "Tech stack," "How to run" (clone, npm i, npm run dev, env vars), optional "Demo data," team + hackathon name.

2. **Dashboard empty state**  
   - Already good ("Connect your TerraSignal agent…"). Ensure one "Run Agent" in video so judges see data.

3. **Agent reliability**  
   - If agent-scan can hit rate limits or 402: catch errors, show a friendly message, and optionally "Try again in 30s."  
   - Optional: seed 2–3 reports via SQL or a small script so you have a backup if AI fails during demo.

4. **Opt-in categories**  
   - **Best Use of Emerging Tech:** Opt in and highlight AI + real-time geo/satellite-style pipeline.  
   - **MLH Best Use of Gemini:** If the Lovable AI gateway uses Gemini, say "Powered by Gemini for structured ag event detection." Only claim if you actually use Gemini in your code.

### D. What to avoid

- Don't oversell beyond what you actually do, but you **can now truthfully say** you use live Sentinel-2 L2A from Microsoft Planetary Computer (STAC + Data API) plus real weather and news.  
- Don't leave env vars or API keys in the repo; use .env and document which vars are needed.  
- Don't skip the video or reflection; both matter for presentation and impact.

---

## 4. Pre-event checklist

- [ ] Read **TerraSignal_Hackathon_Guide.docx** (open in Word/Google Docs) for any extra requirements or tracks.  
- [ ] Confirm **exact** hackathon name and Devpost link (TerraHacks 2025 vs other).  
- [ ] Test **agent-scan** in prod (or staging) and confirm intel reports appear in Feed/Map.  
- [ ] Add **README** with run instructions and stack.  
- [ ] Prepare **demo script** (1–2 min live, 1 min for video) and record **demo video** (≤3 min).  
- [ ] Draft **Devpost** description and reflection; add screenshots and GitHub link.  
- [ ] Decide **opt-in** categories (e.g. Best Use of Emerging Tech) and mention them in the submission.

---

## 5. One-line pitch

**TerraSignal is an AI-powered commodity intelligence platform: an agent scans six global crop regions, turns satellite-style and weather data into structured intel, and delivers real-time signals and market implications in a single dashboard so traders and ag stakeholders can act faster.**

Use this in the video, Devpost, and live pitch to stay consistent and memorable.

---

Good luck — you have a strong stack and story; nailing compliance, demo reliability, and clear presentation will maximize your chances among the field.
