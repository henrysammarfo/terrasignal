"""Pydantic models for TerraSignal agent pipeline."""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class NewsEvent(BaseModel):
    """A single news item from RSS."""
    id: str
    title: str
    content: str
    published_at: datetime
    url: str = ""
    source: str = ""


Severity = Literal["low", "medium", "high", "critical"]


class CropSignal(BaseModel):
    """Agricultural signal extracted from news (region, crop, severity)."""
    event: NewsEvent
    region_name: str
    bbox: list[float] = Field(..., min_length=4, max_length=4)  # [west, south, east, north]
    crop_type: str = ""
    severity: Severity = "low"


class SatelliteAnalysis(BaseModel):
    """Sentinel-2 derived indices and anomaly for one signal."""
    signal: CropSignal
    acquisition_date: date | None = None
    ndvi_mean: float = 0.0
    ndvi_delta: float = 0.0
    ndwi_mean: float = 0.0
    msi_mean: float = 0.0
    cloud_cover_pct: float = 0.0
    anomaly_score: float = 0.0
    thumbnail_path: str | None = None


class WeatherContext(BaseModel):
    """90-day weather context vs baseline."""
    bbox: list[float] = Field(..., min_length=4, max_length=4)
    date_from: date | None = None
    date_to: date | None = None
    precip_anomaly_mm: float = 0.0
    temp_anomaly_c: float = 0.0
    drought_index: str = "normal"
    soil_moisture_percentile: float = 50.0


class IntelReport(BaseModel):
    """Final market intelligence report."""
    signal: CropSignal
    satellite: SatelliteAnalysis | None = None
    weather: WeatherContext | None = None
    headline: str
    summary: str = ""
    confidence: float = Field(ge=0.0, le=1.0)
    market_implication: str = ""
    generated_at: datetime = Field(default_factory=datetime.now)
