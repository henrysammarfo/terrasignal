"""Compute NDVI, NDWI, MSI and anomaly from Sentinel-2 xr.Dataset."""
from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import xarray as xr

from app.config import settings
from app.models.schemas import CropSignal, SatelliteAnalysis

logger = logging.getLogger(__name__)


def _get_band(ds: xr.Dataset | xr.DataArray, name: str) -> xr.DataArray:
    """Get a band by name from Dataset or DataArray (stackstac) with dim 'band'."""
    if isinstance(ds, xr.DataArray):
        if "band" in ds.dims:
            return ds.sel(band=name, drop=True).squeeze()
        return ds
    if name in ds.data_vars:
        return ds[name]
    if "band" in ds.coords:
        idx = list(ds.coords["band"].values).index(name) if name in ds.coords["band"].values else None
        if idx is not None and len(ds.data_vars) > 0:
            v = list(ds.data_vars)[0]
            return ds[v].isel(band=idx)
    for v in ds.data_vars:
        if name in str(ds[v].dims):
            return ds[v]
    raise KeyError(f"Band {name} not found in dataset")


def compute_ndvi(ds: xr.Dataset | xr.DataArray) -> xr.DataArray:
    """NDVI = (B08 - B04) / (B08 + B04 + 1e-8), clipped [-1, 1]."""
    try:
        b08 = _get_band(ds, "B08")
        b04 = _get_band(ds, "B04")
    except KeyError:
        b08 = _get_band(ds, "B8")
        b04 = _get_band(ds, "B4")
    ndvi = (b08 - b04) / (b08 + b04 + 1e-8)
    ndvi = ndvi.clip(-1.0, 1.0)
    return ndvi


def compute_ndwi(ds: xr.Dataset | xr.DataArray) -> xr.DataArray:
    """NDWI = (B03 - B08) / (B03 + B08 + 1e-8), clipped [-1, 1]."""
    try:
        b03 = _get_band(ds, "B03")
        b08 = _get_band(ds, "B08")
    except KeyError:
        b03 = _get_band(ds, "B3")
        b08 = _get_band(ds, "B8")
    ndwi = (b03 - b08) / (b03 + b08 + 1e-8)
    return ndwi.clip(-1.0, 1.0)


def compute_msi(ds: xr.Dataset | xr.DataArray) -> xr.DataArray:
    """MSI = B11 / (B08 + 1e-8). Higher = more water stress."""
    try:
        b11 = _get_band(ds, "B11")
        b08 = _get_band(ds, "B08")
    except KeyError:
        b11 = _get_band(ds, "B11")
        b08 = _get_band(ds, "B8")
    return b11 / (b08 + 1e-8)


def compute_anomaly_score(current: xr.DataArray, baseline: xr.DataArray) -> float:
    """Standardized anomaly (current - baseline) / (std(baseline) + 1e-8), clipped [-5, 5]."""
    c_mean = float(np.nanmean(current))
    b_mean = float(np.nanmean(baseline))
    b_std = float(np.nanstd(baseline)) + 1e-8
    score = (c_mean - b_mean) / b_std
    return float(np.clip(score, -5.0, 5.0))


def analyze(
    current_ds: xr.Dataset | xr.DataArray,
    baseline_ds: xr.Dataset | xr.DataArray,
    signal: CropSignal,
    *,
    acquisition_date: str | None = None,
    cloud_cover_pct: float = 0.0,
) -> SatelliteAnalysis:
    """Compute indices for current vs baseline and build SatelliteAnalysis."""
    ndvi_cur = compute_ndvi(current_ds)
    ndvi_base = compute_ndvi(baseline_ds)
    ndwi_cur = compute_ndwi(current_ds)
    msi_cur = compute_msi(current_ds)
    ndvi_mean = float(np.nanmean(ndvi_cur))
    ndvi_base_mean = float(np.nanmean(ndvi_base))
    ndvi_delta = ndvi_mean - ndvi_base_mean
    anomaly_score = compute_anomaly_score(ndvi_cur, ndvi_base)
    ndwi_mean = float(np.nanmean(ndwi_cur))
    msi_mean = float(np.nanmean(msi_cur))
    return SatelliteAnalysis(
        signal=signal,
        acquisition_date=acquisition_date,
        ndvi_mean=ndvi_mean,
        ndvi_delta=ndvi_delta,
        ndwi_mean=ndwi_mean,
        msi_mean=msi_mean,
        cloud_cover_pct=cloud_cover_pct,
        anomaly_score=anomaly_score,
    )


def generate_rgb_thumbnail(ds: xr.Dataset | xr.DataArray, output_path: str, size: int = 400) -> str:
    """Save RGB thumbnail (B04=R, B03=G, B08=B) as JPEG. Handle DataArray with band dim."""
    try:
        r = _get_band(ds, "B04")
        g = _get_band(ds, "B03")
        b = _get_band(ds, "B08")
    except KeyError:
        r = _get_band(ds, "B4")
        g = _get_band(ds, "B3")
        b = _get_band(ds, "B8")
    stack = np.stack([np.asarray(r).squeeze(), np.asarray(g).squeeze(), np.asarray(b).squeeze()], axis=-1)
    p2, p98 = np.nanpercentile(stack, (2, 98))
    stack = np.clip((stack - p2) / (p98 - p2 + 1e-8), 0, 1)
    stack = (stack * 255).astype(np.uint8)
    from PIL import Image
    img = Image.fromarray(stack)
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "JPEG", quality=85)
    return output_path
