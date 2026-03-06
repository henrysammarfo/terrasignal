"""Brazil soybean analysis — live Sentinel-2, live weather, live Flock report. No mocks."""
from __future__ import annotations

import json
import logging
import sys
from datetime import date, datetime, timezone
from pathlib import Path

from rich.console import Console
from rich.panel import Panel

from app.agent.tools import geocoder, report_generator, news_monitor
from app.config import settings
from app.models.schemas import CropSignal, NewsEvent
from delivery import send_slack, send_to_supabase_webhook

logging.basicConfig(level=logging.INFO)
console = Console()


def _require_deps():
    """Require deps for full pipeline. On Windows or USE_SENTINEL_DATA_API=1 use Data API (no stackstac)."""
    import os
    missing = []
    try:
        import httpx  # noqa: F401
    except ImportError:
        missing.append("httpx")
    for pkg in ("planetary_computer", "pystac_client"):
        try:
            __import__(pkg)
        except ImportError:
            name = "planetary-computer" if pkg == "planetary_computer" else "pystac-client"
            missing.append(name)
    use_data_api = os.environ.get("USE_SENTINEL_DATA_API", "").lower() in ("1", "true", "yes") or sys.platform == "win32"
    if not use_data_api:
        for pkg in ("stackstac", "xarray"):
            try:
                __import__(pkg)
            except ImportError:
                missing.append(pkg)
    if missing:
        console.print("[red]Missing required packages for full pipeline (Sentinel-2 + weather + Flock):[/red]")
        for m in missing:
            console.print("  • %s" % m)
        console.print("\n[bold]Install:[/bold] pip install -r requirements.txt")
        if not use_data_api:
            console.print("Or set [bold]USE_SENTINEL_DATA_API=1[/bold] to use Data API (no rasterio) on this machine.")
        sys.exit(1)


def _pick_live_signal() -> CropSignal:
    """Pick a live CropSignal from RSS + Flock. No hardcoded fallback."""
    # E2E/CI: use one seed signal so we can test geocode → Sentinel → weather → Flock when RSS is unavailable
    import os
    if os.environ.get("E2E_USE_SEED_SIGNAL", "").strip().lower() in ("1", "true", "yes"):
        from datetime import datetime, timezone
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
    signals = news_monitor.monitor_once()
    if not signals:
        raise RuntimeError("No live agricultural signals found from RSS feeds.")
    for sig in signals:
        if sig.severity in ("high", "critical"):
            return sig
    return signals[0]


def main() -> int:
    _require_deps()
    console.print(Panel("[bold]TerraSignal — Live Brazil Soybean Analysis[/bold]", style="blue"))
    if not settings.FLOCK_API_KEY:
        console.print("[red]FLOCK_API_KEY not set. Copy .env.example to .env and add your key.[/red]")
        return 1

    try:
        signal = _pick_live_signal()
    except Exception as e:
        console.print("[red]No live signals available: %s[/red]" % e)
        return 1
    console.print("  [green]1.[/green] Geocoding region for real bbox...")
    try:
        geo = geocoder.geocode_region(signal.region_name, signal.crop_type)
        bbox = geocoder.validate_bbox(geo["bbox"])
        signal = CropSignal(
            event=signal.event,
            region_name=signal.region_name,
            bbox=bbox,
            crop_type=signal.crop_type,
            severity=signal.severity,
        )
        console.print("    bbox=[%.2f, %.2f, %.2f, %.2f]" % tuple(signal.bbox))
    except Exception as e:
        console.print("[red]Geocode failed (real bbox required): %s[/red]" % e)
        return 1

    console.print("  [green]2.[/green] Fetching live Sentinel-2 L2A from Planetary Computer...")
    satellite = None
    current_ds = None
    use_data_api = getattr(settings, "use_sentinel_data_api", False) or sys.platform == "win32"
    try:
        if use_data_api:
            from app.agent.tools.sentinel_data_api import get_best_image_data_api
            target = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            thumb_dir = Path("data") / "thumbnails"
            thumb_dir.mkdir(parents=True, exist_ok=True)
            thumb_path_str = str(thumb_dir / "demo.jpg")
            satellite, _ = get_best_image_data_api(signal.bbox, target, signal, thumb_path=thumb_path_str)
            if satellite.thumbnail_path:
                console.print("    Thumbnail: %s" % satellite.thumbnail_path)
            console.print("    NDVI mean=%.3f delta=%.3f anomaly=%.2f (live, Data API)" % (
                satellite.ndvi_mean, satellite.ndvi_delta, satellite.anomaly_score,
            ))
        else:
            from app.agent.tools.sentinel_retriever import get_baseline_image, get_best_image, get_preview_url
            from app.agent.tools.spectral_analyzer import analyze as spectral_analyze
            target = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            current_ds, current_meta, current_item = get_best_image(signal.bbox, target)
            baseline_ds, _ = get_baseline_image(signal.bbox, target)
            cloud = float(current_meta.get("eo:cloud_cover", 0))
            acq = current_meta.get("datetime")
            acq_str = str(acq)[:10] if acq else None
            satellite = spectral_analyze(
                current_ds, baseline_ds, signal,
                acquisition_date=acq_str,
                cloud_cover_pct=cloud,
            )
            preview_url = get_preview_url(current_item)
            if preview_url:
                satellite.thumbnail_path = preview_url
            console.print("    NDVI mean=%.3f delta=%.3f anomaly=%.2f (live)" % (
                satellite.ndvi_mean, satellite.ndvi_delta, satellite.anomaly_score,
            ))
    except Exception as e:
        console.print("[red]Sentinel-2 failed (required for full pipeline): %s[/red]" % e)
        return 1

    console.print("  [green]3.[/green] Fetching live weather from Open-Meteo archive...")
    try:
        from app.agent.tools.weather_fetcher import compute_weather_context
        weather = compute_weather_context(signal.bbox, date.today())
        console.print("    Precip anomaly=%.0fmm temp=%.1fC drought=%s (live)" % (
            weather.precip_anomaly_mm, weather.temp_anomaly_c, weather.drought_index,
        ))
    except Exception as e:
        console.print("[red]Weather failed (real data required): %s[/red]" % e)
        return 1

    console.print("  [green]4.[/green] Generating intelligence report (Flock)...")
    report = report_generator.generate_report(signal, satellite, weather)
    console.print(Panel(
        "[bold]%s[/bold]\n\nConfidence: %.0f%%\n\n%s" % (
            report.headline,
            report.confidence * 100,
            report.market_implication or report.summary[:300],
        ),
        title="Intel Report (live)",
        border_style="green",
    ))

    data_dir = Path("data")
    thumb_dir = data_dir / "thumbnails"
    thumb_dir.mkdir(parents=True, exist_ok=True)
    # Slack image block requires a public URL (signed preview URL or Data API URL); local paths won't work
    thumb_path = getattr(satellite, "thumbnail_path", None) if satellite else None
    if thumb_path:
        console.print("  [green]5.[/green] Sentinel preview URL for Slack: %s" % (thumb_path[:70] + "..." if len(thumb_path) > 70 else thumb_path))
    if satellite is not None and current_ds is not None and not thumb_path:
        try:
            from app.agent.tools.spectral_analyzer import generate_rgb_thumbnail
            generate_rgb_thumbnail(current_ds, str(thumb_dir / "demo.jpg"))
            console.print("  [green]5.[/green] Local thumbnail saved (Slack needs a URL, not a file path)")
        except Exception as e:
            console.print("  [yellow]Thumbnail skipped: %s[/yellow]" % e)

    reports_dir = data_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    report_path = reports_dir / "demo.json"
    with open(report_path, "w") as f:
        out = {
            "headline": report.headline,
            "summary": report.summary,
            "confidence": report.confidence,
            "market_implication": report.market_implication,
            "generated_at": report.generated_at.isoformat(),
            "region": report.signal.region_name,
            "crop": report.signal.crop_type,
            "severity": report.signal.severity,
            "precip_anomaly_mm": weather.precip_anomaly_mm,
            "temp_anomaly_c": weather.temp_anomaly_c,
            "drought_index": weather.drought_index,
        }
        if satellite is not None:
            out["ndvi_mean"] = satellite.ndvi_mean
            out["ndvi_delta"] = satellite.ndvi_delta
            out["anomaly_score"] = satellite.anomaly_score
        json.dump(out, f, indent=2)
    console.print("  Report saved: %s" % report_path)

    send_slack(report, thumb_path)
    if settings.SUPABASE_WEBHOOK_URL and settings.SUPABASE_AGENT_USER_ID:
        send_to_supabase_webhook(report)
    else:
        console.print("  [dim]Set SUPABASE_WEBHOOK_URL and SUPABASE_AGENT_USER_ID to push to dashboard.[/dim]")

    console.print("\n[bold green]Done. Live data: geocode + Sentinel-2 + weather + Flock.[/bold green]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
