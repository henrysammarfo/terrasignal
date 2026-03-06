"""Pytest config for TerraSignal. Sets USE_SENTINEL_DATA_API=1 for live tests (no rasterio)."""
from __future__ import annotations

import os


def pytest_configure(config):
    # Use Data API for Sentinel-2 in tests so they run on Windows/CI without rasterio
    os.environ.setdefault("USE_SENTINEL_DATA_API", "1")
