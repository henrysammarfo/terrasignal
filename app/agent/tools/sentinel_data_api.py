"""
Sentinel-2 via Planetary Computer Data API only (no rasterio/stackstac).
Use this path on Windows when the native stack crashes, or set USE_SENTINEL_DATA_API=1.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
import planetary_computer
import pystac_client

from app.config import settings
from app.models.schemas import CropSignal, SatelliteAnalysis

logger = logging.getLogger(__name__)

DATA_API_BASE = "https://planetarycomputer.microsoft.com/api/data/v1"
CATALOG_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
COLLECTION = "sentinel-2-l2a"
SENTINEL_RETRIES = 3
SENTINEL_RETRY_DELAY = 2.0


def fetch_preview_thumbnail(
    collection: str,
    item_id: str,
    bbox: list[float],
    output_path: str,
    *,
    size: int = 400,
    item: Any = None,
) -> str | None:
    """
    Fetch Sentinel-2 preview image URL.

    Prefer the STAC item's rendered_preview/visual asset (Planetary Computer signed URL).
    Return the remote URL so Slack/dashboard can render it directly. Does not write to disk.
    """
    # Prefer STAC item's rendered_preview asset (signed URL from PC)
    if item is not None:
        try:
            signed = planetary_computer.sign(item)
            assets = getattr(signed, "assets", {}) or {}
            for name in ("rendered_preview", "visual", "preview"):
                a = assets.get(name)
                href = getattr(a, "href", None)
                if href:
                    return href
        except Exception as e:
            logger.debug("Rendered preview fetch failed: %s", e)
    # Fallback: Data API preview (path or query style) – still returns URL, not a file path
    try:
        import urllib.parse

        path_url = f"{DATA_API_BASE}/collections/{urllib.parse.quote(collection)}/items/{urllib.parse.quote(item_id)}/preview"
        # This preview URL itself is a valid HTTP image URL, so we can return it directly
        return path_url
    except Exception as e:
        logger.warning("Preview thumbnail URL build failed: %s", e)
        return None


def _catalog():
    return pystac_client.Client.open(CATALOG_URL, modifier=planetary_computer.sign_inplace)


def search_sentinel2(
    bbox: list[float],
    date_start: str,
    date_end: str,
    max_cloud_cover: int | None = None,
) -> list[dict]:
    """Search Sentinel-2 L2A; return top 5 items by cloud cover."""
    max_cloud = max_cloud_cover if max_cloud_cover is not None else settings.MAX_CLOUD_COVER
    catalog = _catalog()
    search = catalog.search(
        collections=[COLLECTION],
        bbox=bbox,
        datetime=f"{date_start}/{date_end}",
        query={"eo:cloud_cover": {"lt": max_cloud}},
    )
    items = list(search.items())
    items.sort(key=lambda i: i.properties.get("eo:cloud_cover", 100))
    return [{"id": i.id, "properties": dict(i.properties), "item": i} for i in items[:5]]


def _item_statistics(
    collection: str,
    item_id: str,
    bbox: list[float],
    assets: list[str],
) -> dict[str, Any]:
    """Call Data API item/statistics; returns per-asset band stats (e.g. B04_b1.mean)."""
    bbox_str = ",".join(str(x) for x in bbox)
    url = f"{DATA_API_BASE}/item/statistics"
    params = [("collection", collection), ("item", item_id), ("bbox", bbox_str), ("max_size", "2048")] + [
        ("assets", a) for a in assets
    ]
    with httpx.Client(timeout=60.0) as client:
        r = client.get(url, params=params)
        if r.status_code == 404:
            import urllib.parse
            url2 = f"{DATA_API_BASE}/collections/{urllib.parse.quote(collection)}/items/{urllib.parse.quote(item_id)}/statistics"
            r = client.get(url2, params=[("bbox", bbox_str), ("max_size", "2048")] + [("assets", a) for a in assets])
        r.raise_for_status()
        return r.json()


def _ndvi_from_stats(stats: dict[str, Any]) -> float | None:
    """Compute NDVI from per-band mean. Keys may be B04_b1, B08_b1 or similar."""
    mean_b04 = None
    mean_b08 = None
    for k, v in stats.items():
        if not isinstance(v, dict) or "mean" not in v:
            continue
        if "B04" in k or "b4" in k.lower() or k == "B04":
            mean_b04 = v["mean"]
        if "B08" in k or "b8" in k.lower() or k == "B08":
            mean_b08 = v["mean"]
    if mean_b04 is None and "B04" in stats and isinstance(stats["B04"], dict):
        mean_b04 = stats["B04"].get("mean")
    if mean_b08 is None and "B08" in stats and isinstance(stats["B08"], dict):
        mean_b08 = stats["B08"].get("mean")
    if mean_b04 is None or mean_b08 is None:
        return None
    denom = mean_b08 + mean_b04
    if denom < 1e-8:
        return None
    return float(max(-1.0, min(1.0, (mean_b08 - mean_b04) / denom)))


def get_best_image_data_api(
    bbox: list[float],
    target_date: str,
    signal: CropSignal,
    *,
    days_buffer: int = 30,
    thumb_path: str | None = None,
) -> tuple[SatelliteAnalysis, dict]:
    """Get Sentinel-2 stats via Data API only; returns SatelliteAnalysis and item metadata.
    If thumb_path is set, fetches Data API preview and saves as thumbnail.
    """
    from datetime import datetime as dt
    t = dt.fromisoformat(target_date.replace("Z", "+00:00")) if isinstance(target_date, str) else target_date
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    start = (t - timedelta(days=days_buffer)).strftime("%Y-%m-%d")
    end = (t + timedelta(days=days_buffer)).strftime("%Y-%m-%d")

    last_error = None
    for attempt in range(SENTINEL_RETRIES):
        try:
            results = search_sentinel2(bbox, start, end)
            if not results:
                raise ValueError(f"No Sentinel-2 L2A found for bbox={bbox} in {start} to {end}")
            meta = results[0]
            item = meta["item"]
            item_id = item.id
            cloud = float(meta["properties"].get("eo:cloud_cover", 0))
            acq = meta["properties"].get("datetime")
            acq_str = str(acq)[:10] if acq else None

            stats = _item_statistics(COLLECTION, item_id, bbox, ["B04", "B08", "B03", "B11"])
            ndvi_mean = _ndvi_from_stats(stats)
            if ndvi_mean is None:
                ndvi_mean = 0.0
                logger.warning("Could not compute NDVI from Data API stats keys: %s", list(stats.keys()))

            years_back = settings.BASELINE_YEARS_BACK
            base_start = (t.replace(year=t.year - years_back) - timedelta(days=30)).strftime("%Y-%m-%d")
            base_end = (t.replace(year=t.year - years_back) + timedelta(days=30)).strftime("%Y-%m-%d")
            base_results = search_sentinel2(bbox, base_start, base_end, max_cloud_cover=50)
            ndvi_base_mean = ndvi_mean
            if base_results:
                base_meta = base_results[0]
                base_stats = _item_statistics(COLLECTION, base_meta["item"].id, bbox, ["B04", "B08"])
                ndvi_base = _ndvi_from_stats(base_stats)
                if ndvi_base is not None:
                    ndvi_base_mean = ndvi_base
            ndvi_delta = ndvi_mean - ndvi_base_mean
            b_std = 0.2
            anomaly_score = float(max(-5.0, min(5.0, ndvi_delta / (b_std + 1e-8))))

            thumbnail_path = None
            if thumb_path:
                thumbnail_path = fetch_preview_thumbnail(COLLECTION, item_id, bbox, thumb_path, item=item)

            return (
                SatelliteAnalysis(
                    signal=signal,
                    acquisition_date=acq_str,
                    ndvi_mean=ndvi_mean,
                    ndvi_delta=ndvi_delta,
                    ndwi_mean=0.0,
                    msi_mean=0.0,
                    cloud_cover_pct=cloud,
                    anomaly_score=anomaly_score,
                    thumbnail_path=thumbnail_path,
                ),
                meta["properties"],
            )
        except (httpx.ConnectError, httpx.RemoteProtocolError, OSError, ConnectionError) as e:
            last_error = e
            logger.warning("Sentinel-2 attempt %d/%d failed: %s", attempt + 1, SENTINEL_RETRIES, e)
            if attempt < SENTINEL_RETRIES - 1:
                time.sleep(SENTINEL_RETRY_DELAY * (attempt + 1))
        except ValueError:
            raise
    raise last_error or RuntimeError("Sentinel-2 failed after retries")


def get_baseline_image_data_api(
    bbox: list[float],
    target_date: str,
    signal: CropSignal,
    years_back: int | None = None,
) -> tuple[SatelliteAnalysis, dict]:
    """Baseline year stats via Data API."""
    years_back = years_back or settings.BASELINE_YEARS_BACK
    from datetime import datetime as dt
    t = dt.fromisoformat(target_date.replace("Z", "+00:00")) if isinstance(target_date, str) else target_date
    if hasattr(t, "tzinfo") and t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    baseline_date = (t.replace(year=t.year - years_back)).strftime("%Y-%m-%d")
    return get_best_image_data_api(bbox, baseline_date, signal)
