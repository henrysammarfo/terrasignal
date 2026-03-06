# TerraSignal — Product notes: shared feed & signal quality

## 1. Same live intel for everyone — is that good?

**Yes, for your stage it’s the right choice.**

- **Commodity/ag intel is global.** Traders, insurers, and farmers all care about the same events (e.g. Mato Grosso drought, Punjab wheat, Midwest corn). One curated feed fits the use case.
- **Simpler and cheaper.** One Python agent run serves all users; no per-user pipelines or extra cost. Easy to scale to 10 or 100+ testers.
- **Easier to improve.** You tune relevance, sources, and report quality once; everyone benefits.
- **Good for hackathon and beta.** You demonstrate one clear, live pipeline and get feedback on “is this intel useful?” before adding complexity.

**When you might change it later:**

- **Filters:** e.g. “Show me only Brazil” or “Wheat and corn only” (still one feed, filtered in the UI).
- **Saved regions / alerts:** “Notify me when severity is high in my regions.”
- **Tiers:** power users get more regions or more frequent scans (still shared intel, different cadence or scope).

So: **same feed = good now.** You can add personalization and filters once beta and hackathon validate that the intel is useful.

---

## 2. How good are our signals?

### What we do today (strengths)

| Layer | What we do | Quality impact |
|-------|------------|----------------|
| **Sources** | Reuters business, USDA, FAO newsroom | High — these are real ag/commodity outlets. |
| **Relevance** | Flock scores each item 0–1 for “material crop stress event”; we keep only ≥ `MIN_RELEVANCE_SCORE` (0.65). | Reduces noise; only ag-relevant news gets through. |
| **Signal extraction** | Flock extracts `region_name`, `crop_type`, `severity`; we drop items where `region_name` is null (not ag). | Ensures we only process events that are clearly about crops/regions. |
| **Geocoding** | Flock (or Nominatim fallback) turns region + crop into a bbox. | Good for specific regions (e.g. “Mato Grosso”); vaguer names (“Midwest”) can be broad. |
| **Satellite** | Real Sentinel-2 L2A, NDVI + anomaly vs prior year, cloud filter. | Real data; quality depends on bbox and cloud cover. |
| **Weather** | Open-Meteo 90-day archive, precip/temp anomalies, drought index. | Real data; aligns with bbox. |
| **Report** | Flock synthesizes headline, summary, confidence, market_implication from signal + satellite + weather (+ commodity prices). | Single narrative that ties news + EO + weather together. |

So: **signals are “good” in the sense that they come from real sources, are filtered and structured by an LLM, and are backed by real satellite and weather.** They’re suitable for beta and for showing “live, end-to-end” at the hackathon.

### Where quality can vary

- **Relevance threshold (0.65):** Lower = more signals but more noise; higher = fewer, more focused. You can tune via `MIN_RELEVANCE_SCORE` in `.env`.
- **Geocoding:** Vague or multi-country names can yield a wide or wrong bbox → Sentinel/weather for the wrong area. Improving prompts or adding “preferred bbox” for known regions would help.
- **One signal per run:** We take the first or highest-severity signal per cycle. So we don’t yet “rank” by relevance score or diversity (e.g. one per region).
- **No feedback loop:** We don’t yet use “clicked / dismissed / useful” to improve scoring or filtering.

### Levers to make signals better

1. **Tune `MIN_RELEVANCE_SCORE`** (e.g. 0.7–0.75) if you see too many weak items.
2. **Add more RSS feeds** (e.g. regional ag news, commodity-specific) for more and more relevant events.
3. **Prefer high-severity + high-relevance:** e.g. sort by `severity` then `relevance` and take the top one (or top per region).
4. **Geocoding checks:** validate bbox size or compare to a list of known region bboxes and nudge or reject bad geocodes.
5. **Later:** log which reports get opened or shared and use that to refine relevance or ranking.

**Bottom line:** Signals are **good enough to demo and beta-test** — real sources, real data, clear pipeline. The levers above are how you make them **great** over time.
