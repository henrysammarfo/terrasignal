"""Synthesize signal + satellite + weather into IntelReport using Flock."""
from __future__ import annotations

import json
import logging

from app.config import settings
from app.llm_client import chat_json
from app.models.schemas import CropSignal, IntelReport, SatelliteAnalysis, WeatherContext

logger = logging.getLogger(__name__)


def compute_pre_confidence(satellite: SatelliteAnalysis | None, weather: WeatherContext | None) -> float:
    """Base confidence from anomaly strength and weather corroboration."""
    base = 0.50
    if satellite:
        base += min(abs(satellite.anomaly_score) * 0.08, 0.25)
        if weather and weather.drought_index in ("critical", "moderate") and satellite.ndvi_delta < 0:
            base += 0.15
        base += (1 - satellite.cloud_cover_pct / 100) * 0.10
    return min(base, 0.95)


def generate_report(
    signal: CropSignal,
    satellite: SatelliteAnalysis | None,
    weather: WeatherContext | None,
) -> IntelReport:
    """Use Flock to produce headline, summary, confidence, market_implication."""
    pre_conf = compute_pre_confidence(satellite, weather)
    ev = signal.event
    sat_block = "No satellite data."
    if satellite:
        sat_block = (
            f"NDVI: {satellite.ndvi_mean:.3f} (delta vs prior year: {satellite.ndvi_delta:+.3f})\n"
            f"NDWI: {satellite.ndwi_mean:.3f} | MSI: {satellite.msi_mean:.3f}\n"
            f"Anomaly Score: {satellite.anomaly_score:.2f} (negative=worse than baseline)\n"
            f"Cloud Cover: {satellite.cloud_cover_pct:.0f}%"
        )
    wx_block = "No weather data."
    if weather:
        wx_block = (
            f"Precip Anomaly: {weather.precip_anomaly_mm:+.0f}mm\n"
            f"Temp Anomaly: {weather.temp_anomaly_c:+.1f}C\n"
            f"Drought Index: {weather.drought_index}\n"
            f"Pre-computed Confidence: {pre_conf:.2f}"
        )
    try:
        from app.agent.tools.commodity_prices import fetch_commodity_prices, format_prices_for_prompt
        prices = fetch_commodity_prices()
        prices_line = format_prices_for_prompt(prices)
    except Exception as e:
        logger.debug("Commodity prices skipped: %s", e)
        prices_line = "Commodity prices: unavailable."
    user = (
        f"## NEWS TRIGGER\n{ev.title}\nRegion: {signal.region_name}\n"
        f"Crop: {signal.crop_type} | Severity: {signal.severity}\n\n"
        f"## SATELLITE DATA (Sentinel-2)\n{sat_block}\n\n"
        f"## WEATHER CONTEXT (90-day vs prior year)\n{wx_block}\n\n"
        f"## LIVE COMMODITY PRICES\n{prices_line}\n\n"
        "Generate JSON with keys: headline (<=15 words), summary (3-4 sentences, quantitative), "
        "confidence (float 0-1, near pre_confidence unless data suggests otherwise), "
        "market_implication (bearish/bullish/neutral with 1-sentence rationale; mention price context if relevant)."
    )
    system = (
        "You are a senior agricultural commodity analyst at a tier-1 hedge fund. "
        "Convert satellite and weather data into actionable market intelligence. "
        "Be precise, quantitative, commercial. Style: Bloomberg brief. Return ONLY valid JSON, no markdown."
    )
    try:
        data = chat_json(settings.FLOCK_API_KEY, settings.FLOCK_MODEL, system, user, max_tokens=1024)
    except Exception as e:
        logger.error("Report generation failed: %s", e)
        raise
    headline = str(data.get("headline") or "Market intelligence update")[:200]
    summary = str(data.get("summary") or "")[:2000]
    confidence = float(data.get("confidence", pre_conf))
    confidence = max(0.0, min(1.0, confidence))
    market_implication = str(data.get("market_implication") or "")[:500]
    return IntelReport(
        signal=signal,
        satellite=satellite,
        weather=weather,
        headline=headline,
        summary=summary,
        confidence=confidence,
        market_implication=market_implication,
    )


def format_slack_message(report: IntelReport, thumbnail_path: str | None = None) -> dict:
    """Build Slack Block Kit payload. Color by implication: bearish=red, bullish=green, neutral=blue."""
    imp = (report.market_implication or "").lower()
    if "bearish" in imp:
        color = "#dc2626"
    elif "bullish" in imp:
        color = "#16a34a"
    else:
        color = "#2563eb"
    confidence_pct = round(report.confidence * 100)
    blocks = [
        {"type": "header", "text": {"type": "plain_text", "text": report.headline, "emoji": True}},
        {"type": "divider"},
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Region:*\n{report.signal.region_name}"},
                {"type": "mrkdwn", "text": f"*Crop:*\n{report.signal.crop_type}"},
                {"type": "mrkdwn", "text": f"*Confidence:*\n{confidence_pct}%"},
                {"type": "mrkdwn", "text": f"*Severity:*\n{report.signal.severity}"},
            ],
        },
        {"type": "section", "text": {"type": "mrkdwn", "text": report.summary[:1000] or "—"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": f"*Market:* {report.market_implication or '—'}"}},
    ]
    if thumbnail_path:
        blocks.append({"type": "image", "image_url": thumbnail_path, "alt_text": "Satellite thumbnail"})
    return {"blocks": blocks, "attachments": [{"color": color}]}
