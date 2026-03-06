"""Flock AI API client (OpenAI-compatible; uses x-litellm-api-key)."""
from __future__ import annotations

import json
import os
from typing import Any

import httpx

FLOCK_BASE = "https://api.flock.io/v1"


def _headers(api_key: str) -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-litellm-api-key": api_key,
    }


def chat(
    api_key: str,
    model: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int = 4096,
    temperature: float = 0.3,
) -> str:
    """Call Flock chat/completions; returns content of first choice."""
    url = f"{FLOCK_BASE}/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }
    with httpx.Client(timeout=120.0) as client:
        r = client.post(url, headers=_headers(api_key), json=payload)
        r.raise_for_status()
    data = r.json()
    choice = data.get("choices") or []
    if not choice:
        raise ValueError("Flock API returned no choices")
    content = (choice[0].get("message") or {}).get("content") or ""
    return content.strip()


def chat_json(
    api_key: str,
    model: str,
    system: str,
    user: str,
    *,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    """Same as chat but parses response as JSON. Strips markdown code blocks if present."""
    raw = chat(
        api_key,
        model,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_tokens=max_tokens,
        temperature=0.2,
    )
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)
