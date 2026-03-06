"""
Real live end-to-end tests: real RSS, real Flock, real Sentinel-2, real Open-Meteo.
No mocks, no seed signal. Requires FLOCK_API_KEY in env; network required.
Run: pytest tests/test_live_pipeline.py -v
"""
from __future__ import annotations

import os
import sys

import pytest

# Project root on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture(scope="module")
def require_flock():
    """Skip live tests if FLOCK_API_KEY is not set."""
    from app.config import settings
    if not settings.FLOCK_API_KEY:
        pytest.skip("FLOCK_API_KEY not set; live tests require real API key")


@pytest.fixture(scope="module")
def use_data_api():
    """Use Sentinel Data API (no rasterio) so tests run on Windows/CI."""
    os.environ["USE_SENTINEL_DATA_API"] = "1"
    yield
    os.environ.pop("USE_SENTINEL_DATA_API", None)


def test_live_rss_parses_feeds():
    """Real RSS: at least one feed returns entries."""
    from app.agent.tools.news_monitor import parse_feeds
    events = parse_feeds()
    assert isinstance(events, list), "parse_feeds must return a list"
    # We may get 0 if all feeds are down; then we skip the rest
    if len(events) == 0:
        pytest.skip("No RSS events from any feed (feeds may be down or blocked)")
    assert len(events) > 0
    e = events[0]
    assert hasattr(e, "title") and hasattr(e, "url")
    assert e.title
    assert e.url


def test_live_pipeline_full(require_flock, use_data_api):
    """
    Real live pipeline: RSS -> Flock relevance/signal -> geocode -> Sentinel-2 -> weather -> report.
    Uses real APIs only; skips if no live signals from RSS.
    """
    from app.agent.tools import news_monitor, geocoder, report_generator
    from app.agent.tools.weather_fetcher import compute_weather_context
    from app.config import settings
    from app.models.schemas import CropSignal
    from datetime import date, datetime, timezone

    # 1. Live RSS + Flock -> signals
    signals = news_monitor.monitor_once()
    if not signals:
        pytest.skip("No live agricultural signals from RSS + Flock (feeds/API may be down)")
    signal = signals[0]
    assert isinstance(signal, CropSignal)
    assert signal.region_name
    assert signal.event and signal.event.title

    # 2. Geocode (real Flock or Nominatim)
    geo = geocoder.geocode_region(signal.region_name, signal.crop_type)
    bbox = geocoder.validate_bbox(geo["bbox"])
    signal = CropSignal(
        event=signal.event,
        region_name=signal.region_name,
        bbox=bbox,
        crop_type=signal.crop_type,
        severity=signal.severity,
    )
    assert len(bbox) == 4
    assert bbox[0] != 0 or bbox[1] != 0 or bbox[2] != 0 or bbox[3] != 0

    # 3. Sentinel-2 (Data API)
    from app.agent.tools.sentinel_data_api import get_best_image_data_api
    target = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    satellite, _ = get_best_image_data_api(signal.bbox, target, signal)
    assert satellite is not None
    assert hasattr(satellite, "ndvi_mean")
    assert hasattr(satellite, "ndvi_delta")
    assert -1 <= satellite.ndvi_mean <= 1
    assert satellite.acquisition_date or satellite.ndvi_mean is not None

    # 4. Weather (Open-Meteo)
    weather = compute_weather_context(signal.bbox, date.today())
    assert weather is not None
    assert hasattr(weather, "precip_anomaly_mm")
    assert hasattr(weather, "temp_anomaly_c")
    assert hasattr(weather, "drought_index")

    # 5. Report (Flock)
    report = report_generator.generate_report(signal, satellite, weather)
    assert report is not None
    assert report.headline
    assert len(report.headline) >= 5
    assert 0 <= report.confidence <= 1
    assert report.signal is signal
    assert report.satellite is satellite
    assert report.weather is weather
    assert report.market_implication or report.summary


def test_live_sentinel_data_api_returns_ndvi(use_data_api):
    """Real Planetary Computer: Data API returns valid NDVI stats for a known bbox."""
    from app.agent.tools.sentinel_data_api import get_best_image_data_api
    from app.models.schemas import CropSignal, NewsEvent
    from datetime import datetime, timezone

    # Minimal signal for Mato Grosso
    ev = NewsEvent(
        id="live-test",
        title="Test",
        content="Test",
        published_at=datetime.now(timezone.utc),
        url="https://test",
        source="Test",
    )
    signal = CropSignal(
        event=ev,
        region_name="Mato Grosso, Brazil",
        bbox=[-54.0, -13.5, -50.0, -9.0],
        crop_type="Soybean",
        severity="medium",
    )
    target = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    satellite, meta = get_best_image_data_api(signal.bbox, target, signal)
    assert satellite.ndvi_mean is not None
    assert -1 <= satellite.ndvi_mean <= 1
    assert satellite.ndvi_delta is not None
    assert satellite.anomaly_score is not None
    assert "eo:cloud_cover" in meta or "datetime" in meta or meta


def test_live_weather_returns_context():
    """Real Open-Meteo: weather context for a real bbox."""
    from app.agent.tools.weather_fetcher import compute_weather_context
    from datetime import date
    bbox = [-54.0, -13.5, -50.0, -9.0]  # Mato Grosso
    w = compute_weather_context(bbox, date.today())
    assert w is not None
    assert hasattr(w, "precip_anomaly_mm")
    assert hasattr(w, "temp_anomaly_c")
    assert hasattr(w, "drought_index")
    assert isinstance(w.drought_index, str) or w.drought_index is None
