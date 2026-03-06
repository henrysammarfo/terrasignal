"""Retrieve Sentinel-2 L2A imagery from Microsoft Planetary Computer."""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta
from typing import Any

import planetary_computer
import pystac_client
import stackstac
import xarray as xr

from app.config import settings

logger = logging.getLogger(__name__)

CATALOG_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
COLLECTION = "sentinel-2-l2a"
BANDS = ["B04", "B08", "B11", "B03"]
RESOLUTION = 20
SCL_VALID = (4, 5, 6, 7)  # veg, non-veg, water, unclassified


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


def load_bands(item, bands: list[str] | None = None, resolution: int = RESOLUTION) -> xr.DataArray:
    """Load selected bands from one STAC item (stackstac returns DataArray)."""
    bands = bands or BANDS
    signed = planetary_computer.sign(item)
    stack = stackstac.stack(
        [signed],
        assets=bands,
        resolution=resolution,
        chunksize=1024,
    )
    ds = stack.compute()
    return ds


def apply_scl_mask(ds: xr.Dataset | xr.DataArray, item) -> xr.Dataset | xr.DataArray:
    """Mask invalid SCL pixels to NaN. Valid: 4,5,6,7. No-op for DataArray."""
    if isinstance(ds, xr.DataArray):
        return ds
    try:
        signed = planetary_computer.sign(item)
        scl = stackstac.stack([signed], assets=["SCL"], resolution=RESOLUTION, chunksize=1024).compute()
        if "SCL" in scl.coords or "band" in scl.dims:
            scl_var = scl if isinstance(scl, xr.DataArray) else scl["SCL"]
            mask = xr.DataArray(
                scl_var.isin(SCL_VALID) if hasattr(scl_var, "isin") else scl_var,
                dims=scl_var.dims,
            )
            for v in list(ds.data_vars):
                if ds[v].dims == mask.dims:
                    ds[v] = ds[v].where(mask)
    except Exception as e:
        logger.warning("SCL mask skipped: %s", e)
    return ds


def get_preview_url(item: Any) -> str | None:
    """Return a public image URL for the STAC item (signed rendered_preview/visual) for Slack/dashboard."""
    try:
        signed = planetary_computer.sign(item)
        assets = getattr(signed, "assets", {}) or {}
        for name in ("rendered_preview", "visual", "preview"):
            a = assets.get(name)
            href = getattr(a, "href", None)
            if href:
                return href
    except Exception as e:
        logger.debug("Preview URL failed: %s", e)
    return None


def get_best_image(
    bbox: list[float],
    target_date: str,
    *,
    days_buffer: int = 30,
) -> tuple[xr.Dataset | xr.DataArray, dict, Any]:
    """Get lowest-cloud image in [target_date ± days_buffer]. Returns (dataset, item_metadata, stac_item)."""
    from datetime import datetime as dt
    t = dt.fromisoformat(target_date.replace("Z", "+00:00")) if isinstance(target_date, str) else target_date
    if t.tzinfo is None:
        from datetime import timezone
        t = t.replace(tzinfo=timezone.utc)
    start = (t - timedelta(days=days_buffer)).strftime("%Y-%m-%d")
    end = (t + timedelta(days=days_buffer)).strftime("%Y-%m-%d")
    results = search_sentinel2(bbox, start, end)
    if not results:
        raise ValueError(f"No Sentinel-2 L2A found for bbox={bbox} in {start} to {end}")
    meta = results[0]
    item = meta["item"]
    for attempt in range(3):
        try:
            ds = load_bands(item)
            ds = apply_scl_mask(ds, item)
            logger.info("Loaded tile %s cloud_cover=%s", item.id, meta["properties"].get("eo:cloud_cover"))
            return ds, meta["properties"], item
        except Exception as e:
            logger.warning("Load attempt %d failed: %s", attempt + 1, e)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to load Sentinel-2 after 3 attempts: {item.id}")


def get_baseline_image(
    bbox: list[float],
    target_date: str,
    years_back: int | None = None,
) -> tuple[xr.Dataset | xr.DataArray, dict]:
    """Same as get_best_image but for target_date - years_back years."""
    from datetime import datetime as dt
    years_back = years_back or settings.BASELINE_YEARS_BACK
    t = dt.fromisoformat(target_date.replace("Z", "+00:00")) if isinstance(target_date, str) else target_date
    if hasattr(t, "tzinfo") and t.tzinfo is None:
        from datetime import timezone
        t = t.replace(tzinfo=timezone.utc)
    baseline_date = (t.replace(year=t.year - years_back)).strftime("%Y-%m-%d")
    ds, meta, item = get_best_image(bbox, baseline_date)
    return ds, meta
