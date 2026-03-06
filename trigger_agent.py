"""
Minimal HTTP server to run the TerraSignal agent when triggered by an external cron.
Use with cron-job.org or any scheduler that can POST to a URL.

  CRON_SECRET=your-secret python -m trigger_agent

  curl -X POST http://localhost:8080/run -H "Authorization: Bearer your-secret"

Set PORT in env (default 8080). Render and others set PORT automatically.
"""
from __future__ import annotations

import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def run_agent_once() -> tuple[int, str]:
    """Run agent once; return (exit_code, message)."""
    try:
        r = subprocess.run(
            [sys.executable, "main.py", "run", "--once"],
            capture_output=True,
            text=True,
            timeout=600,
            cwd=os.path.dirname(os.path.abspath(__file__)),
            env=os.environ.copy(),
        )
        out = (r.stdout or "") + (r.stderr or "")
        return (r.returncode, out.strip() or "(no output)")
    except subprocess.TimeoutExpired:
        return (124, "Agent run timed out after 600s")
    except Exception as e:
        return (1, str(e))


class TriggerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"ok")
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/run":
            self.send_response(404)
            self.end_headers()
            return

        secret = os.environ.get("CRON_SECRET", "").strip()
        if not secret:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"CRON_SECRET not set")
            return

        auth = self.headers.get("Authorization", "")
        if auth != f"Bearer {secret}":
            self.send_response(401)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Unauthorized")
            return

        code, msg = run_agent_once()
        status = 200 if code == 0 else 502
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(msg.encode("utf-8"))

    def log_message(self, format, *args):
        # Quiet by default; override to log if needed
        pass


def main():
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("", port), TriggerHandler)
    print(f"Trigger server http://0.0.0.0:{port} (POST /run with Authorization: Bearer $CRON_SECRET)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
