"""Convert region name to WGS84 bounding box for satellite queries."""
from __future__ import annotations

import logging
from functools import lru_cache

from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

from app.config import settings
from app.llm_client import chat_json

logger = logging.getLogger(__name__)

# Nominatim: 1 req/s max for free tier
_geolocator = Nominatim(user_agent="TerraSignal/1.0 (hackathon)")
_geocode_rate_limited = RateLimiter(_geolocator.geocode, min_delay_seconds=1.1)


def validate_bbox(bbox: list[float]) -> list[float]:
    """Ensure [w,s,e,n], max span 8°, min 0.3°, clip to WGS84."""
    if len(bbox) != 4:
        raise ValueError("bbox must have 4 elements [west, south, east, north]")
    w, s, e, n = bbox
    w = max(-180.0, min(180.0, float(w)))
    s = max(-90.0, min(90.0, float(s)))
    e = max(-180.0, min(180.0, float(e)))
    n = max(-90.0, min(90.0, float(n)))
    lon_span = abs(e - w)
    lat_span = abs(n - s)
    if lon_span < 0.3 or lat_span < 0.3:
        raise ValueError("bbox span too small (min 0.3°)")
    if lon_span > 8 or lat_span > 8:
        cx, cy = (w + e) / 2, (s + n) / 2
        half_lon = min(4, lon_span / 2)
        half_lat = min(4, lat_span / 2)
        w, e = cx - half_lon, cx + half_lon
        s, n = cy - half_lat, cy + half_lat
    return [w, s, e, n]


@lru_cache(maxsize=128)
def geocode_region(region_name: str, crop_type: str) -> dict:
    """Return dict with bbox [w,s,e,n], display_name, country. Tries Flock first, then Nominatim."""
    region_name = (region_name or "").strip()
    crop_type = (crop_type or "").strip() or "crops"
    if not region_name:
        raise ValueError("region_name is required")

    # Try Flock first
    if settings.FLOCK_API_KEY:
        try:
            system = (
                "You are a geospatial expert. Return ONLY valid JSON, no markdown or explanation."
            )
            user = (
                f'Give the WGS84 bounding box [west, south, east, north] for the primary '
                f'{crop_type} growing region in: "{region_name}". Focus on the agricultural '
                f'heartland. Box should cover roughly 100–600 km. Return JSON: '
                f'{{"bbox": [w,s,e,n], "display_name": "string", "country": "string"}}'
            )
            data = chat_json(settings.FLOCK_API_KEY, settings.FLOCK_MODEL, system, user, max_tokens=256)
            if isinstance(data, dict) and "bbox" in data:
                bbox = data["bbox"]
                if isinstance(bbox, (list, tuple)) and len(bbox) >= 4:
                    bbox = validate_bbox(list(bbox)[:4])
                    return {
                        "bbox": bbox,
                        "display_name": str(data.get("display_name") or region_name),
                        "country": str(data.get("country") or ""),
                    }
        except Exception as e:
            logger.debug("Flock geocode failed, using Nominatim: %s", e)

    # Fallback: Nominatim
    try:
        location = _geocode_rate_limited(region_name)
        if not location or not location.raw:
            raise ValueError("No result")
        lat = location.latitude
        lon = location.longitude
        delta = 0.5  # ~55 km
        bbox = validate_bbox([lon - delta, lat - delta, lon + delta, lat + delta])
        return {
            "bbox": bbox,
            "display_name": location.address or region_name,
            "country": (location.raw.get("address") or {}).get("country", ""),
        }
    except Exception as e:
        logger.warning("Geocode failed for %s: %s", region_name, e)
        raise


def bbox_to_geojson(bbox: list[float]) -> dict:
    """Return GeoJSON Polygon for the bbox."""
    w, s, e, n = bbox[:4]
    return {
        "type": "Polygon",
        "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
    }
