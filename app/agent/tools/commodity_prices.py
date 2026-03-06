"""Fetch live commodity prices (corn, wheat, soybean) for report context. Optional: no API key required with yfinance."""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# CME/CBOT front-month futures symbols (yahoo finance)
SYMBOLS = {
    "corn": "ZC=F",
    "wheat": "ZW=F",
    "soybean": "ZS=F",
}


def fetch_commodity_prices() -> dict[str, Any]:
    """
    Return current prices for corn, wheat, soybean (USD per bushel where applicable).
    Keys: corn, wheat, soybean; values: float or None if fetch failed.
    """
    result: dict[str, Any] = {k: None for k in SYMBOLS}
    try:
        import yfinance as yf
    except ImportError:
        logger.debug("yfinance not installed; skip commodity prices. pip install yfinance")
        return result
    for name, symbol in SYMBOLS.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            last = getattr(info, "last_price", None)
            if last is not None:
                result[name] = round(float(last), 2)
        except Exception as e:
            logger.debug("Commodity price %s failed: %s", name, e)
    return result


def format_prices_for_prompt(prices: dict[str, Any]) -> str:
    """One-line string for Flock prompt, e.g. 'Corn $4.20, Wheat $5.10, Soybean $11.50'."""
    parts = []
    for name, val in prices.items():
        if val is not None:
            parts.append("%s $%s" % (name.capitalize(), val))
    if not parts:
        return "Commodity prices: unavailable (optional)."
    return "Commodity prices (futures): " + ", ".join(parts) + "."
