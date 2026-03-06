"""Delivery: Slack webhook + Supabase webhook (for React dashboard)."""
from __future__ import annotations

import logging
from datetime import date, datetime

import httpx

from app.config import settings
from app.models.schemas import IntelReport

logger = logging.getLogger(__name__)


def _report_to_webhook_payload(report: IntelReport, user_id: str | None) -> dict:
    """Build JSON body for Supabase webhook-receiver."""
    sig = report.signal
    ev = sig.event
    signal_payload = {
        "event_title": ev.title,
        "event_content": ev.content[:5000] if ev.content else None,
        "event_url": ev.url or None,
        "event_source": ev.source or None,
        "published_at": ev.published_at.isoformat() if hasattr(ev.published_at, "isoformat") else str(ev.published_at),
        "region_name": sig.region_name,
        "bbox": sig.bbox,
        "crop_type": sig.crop_type or None,
        "severity": sig.severity,
    }
    satellite_payload = None
    if report.satellite:
        s = report.satellite
        satellite_payload = {
            "acquisition_date": s.acquisition_date.isoformat() if isinstance(s.acquisition_date, date) else str(s.acquisition_date) if s.acquisition_date else None,
            "ndvi_mean": s.ndvi_mean,
            "ndvi_delta": s.ndvi_delta,
            "ndwi_mean": s.ndwi_mean,
            "msi_mean": s.msi_mean,
            "cloud_cover_pct": s.cloud_cover_pct,
            "anomaly_score": s.anomaly_score,
            "thumbnail_url": getattr(s, "thumbnail_path", None) or None,
        }
    weather_payload = None
    if report.weather:
        w = report.weather
        weather_payload = {
            "date_from": w.date_from.isoformat() if w.date_from else None,
            "date_to": w.date_to.isoformat() if w.date_to else None,
            "precip_anomaly_mm": w.precip_anomaly_mm,
            "temp_anomaly_c": w.temp_anomaly_c,
            "drought_index": w.drought_index or None,
            "soil_moisture_percentile": w.soil_moisture_percentile,
        }
    report_payload = {
        "headline": report.headline,
        "summary": report.summary or None,
        "confidence": report.confidence,
        "market_implication": report.market_implication or None,
    }
    body = {
        "user_id": user_id or settings.SUPABASE_AGENT_USER_ID or None,
        "signal": signal_payload,
        "satellite": satellite_payload,
        "weather": weather_payload,
        "report": report_payload,
    }
    return body


def send_slack(report: IntelReport, thumbnail_path: str | None = None) -> bool:
    """Post Block Kit message to Slack. Returns True if sent."""
    if not settings.SLACK_WEBHOOK_URL:
        logger.debug("SLACK_WEBHOOK_URL not set, skip Slack")
        return False
    from app.agent.tools.report_generator import format_slack_message
    payload = format_slack_message(report, thumbnail_path)
    # Webhook accepts blocks in top-level or under "attachments"
    data = {"blocks": payload.get("blocks", [])}
    if payload.get("attachments"):
        data["attachments"] = payload["attachments"]
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.post(settings.SLACK_WEBHOOK_URL, json=data)
            r.raise_for_status()
        logger.info("Slack alert sent: %s", report.headline[:50])
        return True
    except Exception as e:
        logger.warning("Slack delivery failed: %s", e)
        return False


def send_to_supabase_webhook(report: IntelReport, user_id: str | None = None) -> bool:
    """POST report to webhook-receiver so the React dashboard shows it. Requires user_id (Supabase Auth UUID)."""
    uid = user_id or settings.SUPABASE_AGENT_USER_ID
    if not uid:
        logger.debug("SUPABASE_AGENT_USER_ID not set; webhook needs a user UUID to attach reports. Skipping.")
        return False
    if not settings.SUPABASE_WEBHOOK_URL:
        logger.debug("SUPABASE_WEBHOOK_URL not set, skip webhook")
        return False
    body = _report_to_webhook_payload(report, uid)
    headers = {"Content-Type": "application/json"}
    if settings.WEBHOOK_API_KEY:
        headers["x-api-key"] = settings.WEBHOOK_API_KEY
    try:
        with httpx.Client(timeout=30.0) as client:
            r = client.post(settings.SUPABASE_WEBHOOK_URL, headers=headers, json=body)
            r.raise_for_status()
        logger.info("Webhook accepted: %s", report.headline[:50])
        return True
    except Exception as e:
        logger.warning("Webhook delivery failed: %s", e)
        return False
