# Run TerraSignal agent in the cloud (no local machine, no GitHub Actions)

If GitHub Actions isn’t an option (billing/limits), run the agent on a **hosted scheduler** instead. No need to run anything on your own machine.

---

## Option 1: Render Cron Job (recommended)

[Render](https://render.com) has **Cron Jobs**: run a command on a schedule. Free tier gives 750 hours/month (enough for every-6-hours).

### Steps

1. **Sign up** at [render.com](https://render.com) and connect your GitHub (or deploy from repo URL).

2. **New → Cron Job**
   - **Name:** `terrasignal-agent`
   - **Region:** pick one (e.g. Oregon).
   - **Build Command:**  
     `pip install -r requirements.txt`
   - **Start Command:**  
     `python main.py run --once`
   - **Schedule:** `0 * * * *` (every hour). For every 30 min use `*/30 * * * *` (if your host allows).

3. **Environment variables** (in the Cron Job’s “Environment” tab):

   | Key | Value |
   |-----|--------|
   | `FLOCK_API_KEY` | Your Flock key |
   | `SUPABASE_WEBHOOK_URL` | `https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver` |
   | `SUPABASE_AGENT_USER_ID` | `323b750d-d04a-49ea-99e0-ee71e752f2ef` |
   | `WEBHOOK_API_KEY` | Same value as in Supabase webhook-receiver secret |
   | `SLACK_WEBHOOK_URL` | Your Slack webhook (optional) |
   | `USE_SENTINEL_DATA_API` | `1` |

4. Render will run the cron on schedule (every hour). You can also trigger “Run now” from the dashboard.

---

## Option 2: External cron + HTTP trigger (free cron, free app host)

Use a **free HTTP cron** (e.g. [cron-job.org](https://cron-job.org)) to call an endpoint that runs the agent. The endpoint must be deployed somewhere (e.g. Render **Web Service**, Railway, Fly.io).

### 2a. Deploy the trigger app

This repo includes a small **trigger server** that runs the agent when it receives a POST request with the right secret.

- **Run the server locally (for testing):**  
  `CRON_SECRET=your-secret python -m trigger_agent`  
  Then: `curl -X POST http://localhost:8080/run -H "Authorization: Bearer your-secret"`

- **Deploy to Render (Web Service):**
  1. New → **Web Service**.
  2. Connect repo, set:
     - **Build:** `pip install -r requirements.txt`
     - **Start:** `python -m trigger_agent`
  3. Add env vars (all the same as Option 1), **plus**:
     - `CRON_SECRET` = a long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)).
  4. Deploy and note the URL, e.g. `https://terrasignal-trigger.onrender.com`.

### 2b. Create the cron job

1. Sign up at [cron-job.org](https://cron-job.org) (free).
2. Create a new cron job:
   - **URL:** `https://your-trigger-app.onrender.com/run`
   - **Schedule:** every hour (or e.g. `*/30 * * * *` for every 30 min).
   - **Request method:** POST.
   - **Headers:**  
     `Authorization: Bearer YOUR_CRON_SECRET`  
     (use the same value as `CRON_SECRET` on Render).

The free tier may put the Render service to sleep after inactivity; the first request after sleep can be slow. For more regular timing, Option 1 (Render Cron Job) is better.

---

## Option 3: Modal (Python-native, free tier)

[Modal](https://modal.com) runs Python on a schedule in the cloud.

1. Install: `pip install modal`.
2. Log in: `modal token new`.
3. Create a file e.g. `modal_agent.py`:

```python
import modal

app = modal.App("terrasignal-agent")

@app.function(
    schedule=modal.Cron("0 * * * *"),  # every hour
    secrets=[
        modal.Secret.from_name("terrasignal-env"),  # you create this in Modal dashboard
    ],
    image=modal.Image.debian_slim().pip_install_from_requirements("requirements.txt"),
)
def run_agent():
    import subprocess
    import os
    # Load env from Modal secret into os.environ, then:
    subprocess.run(["python", "main.py", "run", "--once"], check=True, env=os.environ)
```

4. In Modal dashboard, create a secret `terrasignal-env` with keys: `FLOCK_API_KEY`, `SUPABASE_WEBHOOK_URL`, `SUPABASE_AGENT_USER_ID`, `WEBHOOK_API_KEY`, `USE_SENTINEL_DATA_API=1`, etc.
5. Deploy: `modal deploy modal_agent.py`.

(You’d need to ensure the repo/code is available in the Modal image; e.g. copy `main.py` and `app/` into the image or mount from a Git URL. Omitted here for brevity; Render Cron is simpler for a full repo.)

---

## Summary

| Option | Pros | Cons |
|--------|------|------|
| **Render Cron Job** | No code change, same env as before, free tier | Needs Render account; free tier may limit very frequent runs (e.g. hourly is fine) |
| **cron-job.org + trigger** | Free cron + free web service | Trigger app must stay deployed; free host may sleep |
| **Modal** | Python-native, scalable | Slightly more setup (secrets, image) |

**Recommended:** **Option 1 (Render Cron Job)** — add the cron job, set the same env vars you use in `.env`, and leave it running. No local run, no GitHub billing.
