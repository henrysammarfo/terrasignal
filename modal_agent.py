"""
Run TerraSignal agent on Modal on a schedule.

Setup:
  1. pip install modal
  2. python -m modal setup   (or: modal token new)
  3. In Modal dashboard: Secrets → Create secret. Name: terrasignal
     Add these key/value pairs (from your .env):
     - FLOCK_API_KEY
     - SUPABASE_WEBHOOK_URL  = https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver
     - SUPABASE_AGENT_USER_ID = 323b750d-d04a-49ea-99e0-ee71e752f2ef
     - WEBHOOK_API_KEY
     - USE_SENTINEL_DATA_API  = 1
     - SLACK_WEBHOOK_URL      (optional)
     - FLOCK_MODEL            (optional, default in code)

  4. Deploy (scheduled runs every 30 min):
     modal deploy modal_agent.py

  5. Or run once now (no schedule):
     modal run modal_agent.py

Logs: Modal dashboard → Apps → terrasignal-agent → Logs
"""
from __future__ import annotations

import os
import subprocess
import sys

import modal

app = modal.App("terrasignal-agent")

# Image: ship the local repo to Modal and install deps.
# This avoids `git clone` failures for private repos / auth prompts.
agent_image = (
    modal.Image.debian_slim(python_version="3.12")
    .add_local_dir(".", remote_path="/root/terrasignal", ignore=[".git", ".venv", "__pycache__", "node_modules", "dist"])
    .run_commands("pip install -r /root/terrasignal/requirements.txt")
)


@app.function(
    image=agent_image,
    secrets=[modal.Secret.from_name("terrasignal")],
    schedule=modal.Cron("*/30 * * * *"),  # every 30 minutes
    timeout=600,  # 10 min max per run
)
def run_agent():
    """Runs the TerraSignal pipeline once. Env vars come from Modal secret 'terrasignal'."""
    result = subprocess.run(
        [sys.executable, "main.py", "run", "--once"],
        cwd="/root/terrasignal",
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        timeout=540,
    )
    out = (result.stdout or "") + (result.stderr or "")
    if out:
        print(out)
    if result.returncode != 0:
        raise RuntimeError(f"Agent exited with code {result.returncode}")
    return result.returncode


@app.local_entrypoint()
def main():
    """Trigger one run now (e.g. modal run modal_agent.py)."""
    run_agent.remote()
    print("Run finished. Check Modal dashboard → Apps → Logs for output.")
