"""Fetch weather from Open-Meteo historical archive (free, no API key). Uses httpx only."""
from __future__ import annotations

import logging
from datetime import date, timedelta

import httpx

from app.models.schemas import WeatherContext

logger = logging.getLogger(__name__)

BASE_URL = "https://archive-api.open-meteo.com/v1/archive"


def fetch_weather_raw(lat: float, lon: float, start_date: str, end_date: str) -> dict:
    """Raw Open-Meteo archive response for daily precip, temp, evapotranspiration."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "precipitation_sum,temperature_2m_mean,et0_fao_evapotranspiration",
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.get(BASE_URL, params=params)
        r.raise_for_status()
    return r.json()


def fetch_weather(bbox: list[float], end_date: date, days_back: int = 90) -> list[dict]:
    """Fetch daily weather for bbox centroid; return list of daily records."""
    w, s, e, n = bbox[:4]
    lat = (s + n) / 2
    lon = (w + e) / 2
    end = end_date if isinstance(end_date, date) else date.fromisoformat(str(end_date)[:10])
    start = end - timedelta(days=days_back)
    raw = fetch_weather_raw(lat, lon, start.isoformat(), end.isoformat())
    daily = raw.get("daily") or {}
    dates = daily.get("time") or []
    precip = daily.get("precipitation_sum") or [0] * len(dates)
    temp = daily.get("temperature_2m_mean") or [0] * len(dates)
    et0 = daily.get("et0_fao_evapotranspiration") or [0] * len(dates)
    out = []
    for i, d in enumerate(dates):
        out.append({
            "date": d,
            "precip_mm": precip[i] if i < len(precip) else 0,
            "temp_c": temp[i] if i < len(temp) else 0,
            "et0_mm": et0[i] if i < len(et0) else 0,
        })
    return out


def compute_weather_context(
    bbox: list[float],
    target_date: date | str,
    days_back: int = 90,
) -> WeatherContext:
    """Current 90-day vs same period prior year; precip/temp anomalies and drought index."""
    target = target_date if isinstance(target_date, date) else date.fromisoformat(str(target_date)[:10])
    current = fetch_weather(bbox, target, days_back)
    baseline_end = target - timedelta(days=365)
    baseline = fetch_weather(bbox, baseline_end, days_back)
    sum_precip_cur = sum(r["precip_mm"] for r in current)
    sum_precip_base = sum(r["precip_mm"] for r in baseline) or 1
    mean_temp_cur = sum(r["temp_c"] for r in current) / len(current) if current else 0
    mean_temp_base = sum(r["temp_c"] for r in baseline) / len(baseline) if baseline else 0
    precip_anomaly_mm = sum_precip_cur - sum_precip_base
    temp_anomaly_c = mean_temp_cur - mean_temp_base
    if precip_anomaly_mm < -80:
        drought_index = "critical"
    elif precip_anomaly_mm < -30:
        drought_index = "moderate"
    elif abs(precip_anomaly_mm) <= 30:
        drought_index = "normal"
    else:
        drought_index = "wet"
    soil_moisture_percentile = max(0, min(100, 50 + precip_anomaly_mm / 3))
    start = target - timedelta(days=days_back)
    return WeatherContext(
        bbox=bbox,
        date_from=start,
        date_to=target,
        precip_anomaly_mm=precip_anomaly_mm,
        temp_anomaly_c=temp_anomaly_c,
        drought_index=drought_index,
        soil_moisture_percentile=soil_moisture_percentile,
    )
