"""LangGraph agent state — single TypedDict passed through the graph."""
from typing import TypedDict

from app.models.schemas import (
    CropSignal,
    IntelReport,
    NewsEvent,
    SatelliteAnalysis,
    WeatherContext,
)


class AgentState(TypedDict, total=False):
    news_events: list[NewsEvent]
    active_signal: CropSignal | None
    satellite_data: SatelliteAnalysis | None
    weather_data: WeatherContext | None
    report: IntelReport | None
    error: str | None
    retry_count: int
