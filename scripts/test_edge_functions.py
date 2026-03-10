#!/usr/bin/env python3
"""
Test Edge Functions: signal-scoring (trade signals), market-chat (AI analyst).
Requires: .env with VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY.
For signal-scoring pass a report_id from intel_reports (Supabase Table Editor).
Watchlist and satellite thumbnails are tested in the dashboard UI.
"""
from __future__ import annotations

import os
import sys

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import httpx

BASE = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or ""
ANON = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or ""

if not BASE or not ANON:
    print("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env")
    sys.exit(1)

MARKET_CHAT_URL = f"{BASE.rstrip('/')}/functions/v1/market-chat"
SIGNAL_SCORING_URL = f"{BASE.rstrip('/')}/functions/v1/signal-scoring"


def test_market_chat() -> bool:
    print("Testing market-chat (AI Analyst)...")
    try:
        r = httpx.post(
            MARKET_CHAT_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ANON}",
            },
            json={
                "messages": [
                    {"role": "user", "content": "Analyze the latest Cameroon food insecurity report and give me a trade view on wheat and corn in one short paragraph."},
                ],
            },
            timeout=60.0,
        )
        if r.status_code != 200:
            msg = (r.text[:200] or "").encode("ascii", errors="replace").decode("ascii")
            print(f"  FAIL: {r.status_code} {msg}")
            return False
        # Streaming response: read first chunk
        body = r.content
        if b"data:" in body or len(body) > 0:
            print("  OK: stream or response received")
        else:
            print("  OK: 200")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


def test_signal_scoring(report_id: str) -> bool:
    print("Testing signal-scoring (trade signals)...")
    try:
        r = httpx.post(
            SIGNAL_SCORING_URL,
            headers={"Content-Type": "application/json"},
            json={"report_id": report_id},
            timeout=30.0,
        )
        if r.status_code != 200:
            msg = (r.text[:300] or "").encode("ascii", errors="replace").decode("ascii")
            print(f"  FAIL: {r.status_code} {msg}")
            return False
        data = r.json()
        if data.get("success") and data.get("trade_signal"):
            print("  OK: trade_signal created", data["trade_signal"].get("signal"), data["trade_signal"].get("rationale", "")[:60])
        elif data.get("success") and data.get("message") == "Already scored":
            print("  OK: report already has a trade signal")
        else:
            print("  OK:", data)
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


def main():
    report_id = (sys.argv[1:] or [""])[0].strip()
    chat_ok = test_market_chat()
    if report_id:
        scoring_ok = test_signal_scoring(report_id)
    else:
        print("Skipping signal-scoring (pass report_id from intel_reports, e.g. python scripts/test_edge_functions.py <uuid>)")
        scoring_ok = None
    print()
    print("Manual checks in dashboard:")
    print("  - Watchlist: Dashboard -> Watchlist, add a commodity/region")
    print("  - Satellite: Intel Feed -> open a report -> check thumbnail + NDVI/NDWI/MSI")
    print("  - Feed diversity: MIN_RELEVANCE_SCORE=0.5 in .env; run agent to see more disaster/environment events")
    if chat_ok and (scoring_ok is None or scoring_ok):
        sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    main()
