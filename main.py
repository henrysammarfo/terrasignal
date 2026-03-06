"""CLI: run agent once or in loop, or launch dashboard."""
from __future__ import annotations

import asyncio
import sys

import click

# Ensure project root is on path
sys.path.insert(0, ".")


@click.group()
def cli():
    """TerraSignal — Autonomous Commodity Intelligence Agent."""


@cli.command()
@click.option("--once", is_flag=True, help="Run a single cycle then exit.")
@click.option("--interval", type=int, default=None, help="Poll interval in minutes (default from .env).")
def run(once: bool, interval: int | None):
    """Run the agent (news -> satellite -> report -> delivery).

    NOTE: On Python 3.14, LangGraph / langchain-core emit compatibility warnings.
    To keep the demo reliable, this CLI falls back to the demo pipeline when the
    orchestrator cannot run cleanly.
    """
    from app.config import settings

    # Prefer orchestrator when available and stable; otherwise use demo pipeline.
    # On Python 3.14+ the langchain/pydantic stack is not fully compatible, so skip.
    use_orchestrator = sys.version_info < (3, 14)
    if use_orchestrator:
        try:
            from app.agent.orchestrator import run_once_sync, run_loop  # type: ignore
        except Exception:
            use_orchestrator = False

    if once:
        if use_orchestrator:
            result = run_once_sync()
            if result:
                print("Report:", result.headline)
            else:
                print("No signal produced this cycle.")
        else:
            from demo import main as demo_main

            demo_main()
        return

    async def _loop():
        if use_orchestrator:
            await run_loop(interval_minutes=interval or settings.POLL_INTERVAL_MINUTES)
        else:
            from demo import main as demo_main

            while True:
                demo_main()
                await asyncio.sleep((interval or settings.POLL_INTERVAL_MINUTES) * 60)

    asyncio.run(_loop())


@cli.command()
def dashboard():
    """Launch Streamlit dashboard (if installed)."""
    import subprocess
    try:
        subprocess.run(["streamlit", "run", "dashboard/app.py", "--server.headless", "true"], check=True)
    except FileNotFoundError:
        print("Streamlit not found. Install with: pip install streamlit")
        print("Or use the React dashboard: npm run dev (in project root)")


@cli.command()
def demo():
    """Run full pipeline once (live RSS -> geocode -> Sentinel-2 -> weather -> Flock -> Slack/dashboard)."""
    from demo import main
    sys.exit(main())


if __name__ == "__main__":
    cli()
