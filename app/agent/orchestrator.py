"""LangGraph orchestrator: news -> geocode -> Sentinel -> weather -> report -> delivery."""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Any

from langgraph.graph import END, StateGraph

from app.agent.state import AgentState
from app.agent.tools import geocoder, news_monitor, report_generator
from app.config import settings
from app.models.schemas import CropSignal, IntelReport, NewsEvent
from delivery import send_slack, send_to_supabase_webhook

logger = logging.getLogger(__name__)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logger.addHandler(console)


def _set_error(state: AgentState, msg: str) -> AgentState:
    state["error"] = msg
    return state


def _seed_signal() -> CropSignal:
    """Fallback when RSS is unreachable (e.g. Modal network). Set E2E_USE_SEED_SIGNAL=1."""
    seed = NewsEvent(
        id="e2e-seed-1",
        title="Drought stress in Mato Grosso raises soybean supply concerns",
        content="Dry conditions in Brazil's main soybean region.",
        published_at=datetime.now(timezone.utc),
        url="https://example.com/e2e-seed",
        source="E2E seed",
    )
    return CropSignal(
        event=seed,
        region_name="Mato Grosso, Brazil",
        bbox=[0.0, 0.0, 0.0, 0.0],
        crop_type="Soybean",
        severity="high",
    )


def news_monitor_node(state: AgentState) -> AgentState:
    try:
        signals = news_monitor.monitor_once()
        if not signals:
            # Only after primary + secondary feeds all failed: optional seed so pipeline still runs.
            if os.environ.get("E2E_USE_SEED_SIGNAL", "").strip().lower() in ("1", "true", "yes"):
                logger.info("No signals from any feed tier; using E2E_USE_SEED_SIGNAL fallback")
                state["active_signal"] = _seed_signal()
                state["error"] = None
                return state
            state["active_signal"] = None
            state["error"] = "No signals found"
            return state
        # Pick highest severity
        order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        best = max(signals, key=lambda s: order.get(s.severity, 0))
        state["active_signal"] = best
        state["error"] = None
        return state
    except Exception as e:
        return _set_error(state, str(e))


def geocoder_node(state: AgentState) -> AgentState:
    sig = state.get("active_signal")
    if not sig:
        return _set_error(state, "No active signal")
    try:
        geo = geocoder.geocode_region(sig.region_name, sig.crop_type)
        bbox = geocoder.validate_bbox(geo["bbox"])
        state["active_signal"] = CropSignal(
            event=sig.event,
            region_name=sig.region_name,
            bbox=bbox,
            crop_type=sig.crop_type,
            severity=sig.severity,
        )
        state["error"] = None
        return state
    except Exception as e:
        return _set_error(state, str(e))


def sentinel_node(state: AgentState) -> AgentState:
    sig = state.get("active_signal")
    if not sig:
        return _set_error(state, "No active signal")
    try:
        from datetime import datetime, timezone
        from pathlib import Path
        target = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        use_data_api = getattr(settings, "use_sentinel_data_api", False)
        if use_data_api:
            from app.agent.tools.sentinel_data_api import get_best_image_data_api
            thumb_dir = Path("data") / "thumbnails"
            thumb_dir.mkdir(parents=True, exist_ok=True)
            thumb_path = str(thumb_dir / "orchestrator.jpg")
            sat, _ = get_best_image_data_api(sig.bbox, target, sig, thumb_path=thumb_path)
        else:
            from app.agent.tools.sentinel_retriever import get_baseline_image, get_best_image, get_preview_url
            from app.agent.tools.spectral_analyzer import analyze as spectral_analyze
            current_ds, current_meta, current_item = get_best_image(sig.bbox, target)
            baseline_ds, _ = get_baseline_image(sig.bbox, target)
            cloud = float(current_meta.get("eo:cloud_cover", 0))
            acq = current_meta.get("datetime")
            if acq:
                acq = str(acq)[:10] if hasattr(acq, "__str__") else None
            sat = spectral_analyze(current_ds, baseline_ds, sig, acquisition_date=acq, cloud_cover_pct=cloud)
            preview_url = get_preview_url(current_item)
            if preview_url:
                sat.thumbnail_path = preview_url
        state["satellite_data"] = sat
        state["error"] = None
        return state
    except Exception as e:
        return _set_error(state, str(e))


def weather_node(state: AgentState) -> AgentState:
    sig = state.get("active_signal")
    if not sig:
        return _set_error(state, "No active signal")
    try:
        from datetime import date
        from app.agent.tools.weather_fetcher import compute_weather_context
        w = compute_weather_context(sig.bbox, date.today())
        state["weather_data"] = w
        state["error"] = None
        return state
    except Exception as e:
        return _set_error(state, str(e))


def synthesizer_node(state: AgentState) -> AgentState:
    sig = state.get("active_signal")
    if not sig:
        return _set_error(state, "No active signal")
    try:
        report = report_generator.generate_report(
            sig,
            state.get("satellite_data"),
            state.get("weather_data"),
        )
        state["report"] = report
        state["error"] = None
        return state
    except Exception as e:
        return _set_error(state, str(e))


def delivery_node(state: AgentState) -> AgentState:
    report = state.get("report")
    if not report:
        return state
    try:
        thumb = getattr(report.satellite, "thumbnail_path", None) if report.satellite else None
        send_slack(report, thumb)
        send_to_supabase_webhook(report)
    except Exception as e:
        logger.warning("Delivery error: %s", e)
    return state


def error_handler_node(state: AgentState) -> AgentState:
    retry = state.get("retry_count", 0) + 1
    state["retry_count"] = retry
    logger.warning("Error (retry %d): %s", retry, state.get("error"))
    state["error"] = None
    return state


def _has_error(state: AgentState) -> str:
    if state.get("error"):
        return "error"
    return "continue"


def _after_news(state: AgentState) -> str:
    if state.get("error"):
        return "error"
    if state.get("active_signal"):
        return "continue"
    return "end"


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)
    graph.add_node("news_monitor", news_monitor_node)
    graph.add_node("geocoder", geocoder_node)
    graph.add_node("sentinel", sentinel_node)
    graph.add_node("weather", weather_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("delivery", delivery_node)
    graph.add_node("error_handler", error_handler_node)

    graph.set_entry_point("news_monitor")
    graph.add_conditional_edges("news_monitor", _after_news, {"continue": "geocoder", "error": "error_handler", "end": END})
    graph.add_conditional_edges("geocoder", _has_error, {"continue": "sentinel", "error": "error_handler"})
    graph.add_conditional_edges("sentinel", _has_error, {"continue": "weather", "error": "error_handler"})
    graph.add_conditional_edges("weather", _has_error, {"continue": "synthesizer", "error": "error_handler"})
    graph.add_conditional_edges("synthesizer", _has_error, {"continue": "delivery", "error": "error_handler"})
    graph.add_edge("delivery", END)
    graph.add_conditional_edges("error_handler", lambda s: "retry" if s.get("retry_count", 0) < 3 else "end", {"retry": "news_monitor", "end": END})
    return graph


_app = None


def get_app():
    global _app
    if _app is None:
        _app = build_graph().compile()
    return _app


async def run_once() -> IntelReport | None:
    """Run one full pipeline cycle; returns IntelReport or None if no signal."""
    app = get_app()
    initial: AgentState = {"retry_count": 0}
    result = await app.ainvoke(initial)
    return result.get("report")


def run_once_sync() -> IntelReport | None:
    return asyncio.run(run_once())


async def run_loop(interval_minutes: int | None = None):
    """Run pipeline every interval_minutes."""
    interval = interval_minutes or settings.POLL_INTERVAL_MINUTES
    app = get_app()
    while True:
        initial: AgentState = {"retry_count": 0}
        await app.ainvoke(initial)
        await asyncio.sleep(interval * 60)
