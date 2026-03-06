"""Poll RSS feeds and use Flock to score relevance and extract crop signals."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

import feedparser
import httpx

from app.config import settings
from app.llm_client import chat_json
from app.models.schemas import CropSignal, NewsEvent

logger = logging.getLogger(__name__)

# Tier 1: often blocked or slow in restricted networks (e.g. Modal)
RSS_FEEDS_PRIMARY = [
    "https://feeds.reuters.com/reuters/businessNews",
    "https://www.usda.gov/rss/home.xml",
]

# Tier 2: different hosts; try when tier 1 fails so we still get real live news
RSS_FEEDS_SECONDARY = [
    "https://www.fao.org/feeds/fao-newsroom-rss",
    "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
    "https://reliefweb.int/updates/rss.xml",
]

# Timeout and retries for fetching feeds
FEED_TIMEOUT = 15.0
FEED_RETRIES = 2


def _fetch_feed(url: str) -> str | None:
    """Fetch feed XML with timeout and retries. Returns None on failure."""
    for attempt in range(FEED_RETRIES + 1):
        try:
            with httpx.Client(timeout=FEED_TIMEOUT, follow_redirects=True) as client:
                r = client.get(url, headers={"User-Agent": "TerraSignal/1.0 (Agri Intel)"})
                r.raise_for_status()
                return r.text
        except Exception as e:
            logger.warning("Feed %s attempt %d failed: %s", url, attempt + 1, e)
            if attempt < FEED_RETRIES:
                time.sleep(1.0 * (attempt + 1))
    return None


def _parse_feed_list(urls: list[str], seen: set[str], out: list[NewsEvent]) -> None:
    """Fetch and parse a list of feed URLs; append to out, update seen."""
    for url in urls:
        raw = _fetch_feed(url)
        if not raw:
            continue
        try:
            parsed = feedparser.parse(raw)
        except Exception as e:
            logger.warning("Feed parse %s failed: %s", url, e)
            continue
        for entry in getattr(parsed, "entries", []):
            link = (entry.get("link") or "").strip()
            if not link or link in seen:
                continue
            seen.add(link)
            title = (entry.get("title") or "").strip() or "(No title)"
            content = (entry.get("summary") or entry.get("description") or "").strip()
            if hasattr(entry.get("published_parsed"), "__iter__") and entry.published_parsed:
                try:
                    from time import mktime
                    pub_dt = datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)
                except Exception:
                    pub_dt = datetime.now(timezone.utc)
            else:
                pub_dt = datetime.now(timezone.utc)
            source = getattr(parsed.feed, "title", None) or url
            out.append(
                NewsEvent(
                    id=link[:64] + str(hash(link) % 10**8),
                    title=title,
                    content=content[:2000],
                    published_at=pub_dt,
                    url=link,
                    source=source,
                )
            )


def parse_feeds() -> list[NewsEvent]:
    """Try primary feeds first; if none return events, try secondary (real live feeds only)."""
    seen: set[str] = set()
    out: list[NewsEvent] = []
    _parse_feed_list(RSS_FEEDS_PRIMARY, seen, out)
    if not out:
        logger.info("Primary feeds returned no events; trying secondary feeds")
        _parse_feed_list(RSS_FEEDS_SECONDARY, seen, out)
    out.sort(key=lambda e: e.published_at, reverse=True)
    return out[:50]


def score_relevance(event: NewsEvent) -> float:
    """Use Flock to score 0.0–1.0 how likely this is a material crop stress event."""
    if not settings.FLOCK_API_KEY:
        return 0.5
    system = (
        "You are an agricultural commodity analyst. Score 0.0 to 1.0 how likely this "
        "news headline indicates a material crop stress event (drought, flood, frost, "
        "disease, harvest disruption) affecting commodity prices. Return ONLY a single float, no explanation."
    )
    user = f"{event.title}\n{event.content[:500]}"
    try:
        raw = chat_json(settings.FLOCK_API_KEY, settings.FLOCK_MODEL, system, user, max_tokens=32)
        if isinstance(raw, dict):
            raw = raw.get("score", raw.get("relevance", 0.5))
        score = float(raw) if isinstance(raw, (int, float)) else 0.5
        return max(0.0, min(1.0, score))
    except Exception as e:
        logger.warning("Relevance score failed for %s: %s", event.title[:40], e)
        return 0.0


def extract_signal(event: NewsEvent) -> CropSignal | None:
    """Use Flock to extract region_name, crop_type, severity. Returns None if not agricultural."""
    if not settings.FLOCK_API_KEY:
        return None
    system = (
        "Extract agricultural signal from this news item. Return JSON only: "
        '{"region_name": "<place>", "crop_type": "<crop>", "severity": "low"|"medium"|"high"|"critical"}. '
        "If the article is not clearly about crops/agriculture/commodity supply, return {\"region_name\": null}."
    )
    user = f"{event.title}\n{event.content[:600]}"
    try:
        data = chat_json(settings.FLOCK_API_KEY, settings.FLOCK_MODEL, system, user, max_tokens=256)
        if not isinstance(data, dict):
            return None
        region = data.get("region_name")
        if region is None or (isinstance(region, str) and region.lower() in ("null", "n/a", "")):
            return None
        region_name = str(region).strip() or "Unknown"
        crop_type = str(data.get("crop_type") or "unknown").strip()
        sev = str(data.get("severity") or "low").lower()
        if sev not in ("low", "medium", "high", "critical"):
            sev = "low"
        # Geocoder node fills bbox in next pipeline step before Sentinel query.
        return CropSignal(
            event=event,
            region_name=region_name,
            bbox=[0.0, 0.0, 0.0, 0.0],
            crop_type=crop_type,
            severity=sev,
        )
    except Exception as e:
        logger.warning("Extract signal failed for %s: %s", event.title[:40], e)
        return None


def monitor_once() -> list[CropSignal]:
    """Parse feeds, filter by relevance, extract signals. Returns list of CropSignal."""
    events = parse_feeds()
    logger.info("Parsed %d news events", len(events))
    signals: list[CropSignal] = []
    for event in events:
        if score_relevance(event) < settings.MIN_RELEVANCE_SCORE:
            continue
        sig = extract_signal(event)
        if sig:
            signals.append(sig)
    return signals
