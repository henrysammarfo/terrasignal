# Merge live branch → dashboard 100% live on Lovable

**No fake data.** The dashboard shows **only** live intel from the TerraSignal Python pipeline (Sentinel-2, weather, Flock). Every beta tester (and later every user) sees the **same** live feed — one system agent, everyone sees it.

**Lovable + Supabase:** Lovable connects to **your** Supabase project (Integrations → Connect Supabase). The database you see in Lovable Cloud is that Supabase project. Same tables, same RLS, same Edge Functions.

---

## 1. Merge the live branch into main

- Push your live branch, open a PR, merge into **main** (or merge locally and push).
- **main** after merge should have:
  - Dashboard/React code (Lovable builds from this).
  - Supabase migrations (including **global live intel** RLS) and Edge Functions: **webhook-receiver**, **openclaw-alert**.
  - Python agent: `main.py`, `demo.py`, `app/`, `delivery/`, `requirements.txt`.

---

## 2. Supabase: same project Lovable uses

Use the **same** Supabase project that Lovable is connected to (the one where you see `intel_reports`, `crop_signals`, etc.).

### 2a. Run the new migration (global live feed)

So **every** authenticated user can see live intel (not just one user):

1. In **Supabase Dashboard** → **SQL Editor**, run the migration file:
   `supabase/migrations/20260304120000_global_live_intel_rls.sql`
   (creates `app_config` and RLS policies so everyone can read the system agent’s reports).

2. Create the **TerraSignal system agent** user (one-time):
   - **Authentication** → **Users** → **Add user** → create e.g. `agent@yourdomain.com` with a password (or use “Invite”). Copy the user’s **UUID**.

3. Set that UUID as the system agent in the DB:
   ```sql
   UPDATE public.app_config SET system_agent_user_id = 'paste-the-uuid-here' WHERE id = 1;
   ```
   (If you have no row yet, run `INSERT INTO public.app_config (system_agent_user_id) VALUES ('paste-the-uuid-here');`.)

That UUID is your **SUPABASE_AGENT_USER_ID**: the Python agent sends all reports with this `user_id`. Because of the new RLS policies, **every** logged-in user (all 10 beta testers, then 100+) can see those reports. No per-tester UUID.

### 2b. Deploy Edge Functions

From your machine (after merge):

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy webhook-receiver
npx supabase functions deploy openclaw-alert
```

Replace `YOUR_PROJECT_REF` with your Supabase project ref (Lovable env `VITE_SUPABASE_PROJECT_ID` or the ref in the Supabase URL).

### 2c. Edge Function secrets

**webhook-receiver** → **Secrets**:

| Secret            | Value                  |
|-------------------|------------------------|
| `WEBHOOK_API_KEY` | Strong random string   |

Use the **same** value in the Python agent’s `WEBHOOK_API_KEY` (and in GitHub Actions if you use it).

---

## 3. Lovable

- **No fake “Run Agent”** — the dashboard only shows the live intel feed (no AI-generated placeholders).
- Ensure the app is connected to the **same** Supabase project:
  - **VITE_SUPABASE_URL** = `https://YOUR_PROJECT_REF.supabase.co`
  - **VITE_SUPABASE_PUBLISHABLE_KEY** = anon key
  - **VITE_SUPABASE_PROJECT_ID** = `YOUR_PROJECT_REF`
- Redeploy from **main** after merge so the UI uses the updated code (live-only feed, no Run Agent).

---

## 4. Run the live Python agent

Reports in the dashboard come **only** from the Python agent posting to the **webhook-receiver**. Run the agent in the cloud (e.g. GitHub Actions) or on a server.

### Option A: GitHub Actions (no server)

1. Add the workflow **`.github/workflows/run-agent.yml`** from this repo (see repo root).
2. In **GitHub** → **Settings** → **Secrets and variables** → **Actions**, add:

   | Secret                     | Value                                                                 |
   |----------------------------|-----------------------------------------------------------------------|
   | `SUPABASE_WEBHOOK_URL`     | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver`   |
   | `SUPABASE_AGENT_USER_ID`   | **The system agent user UUID** (from step 2a) — same for everyone    |
   | `WEBHOOK_API_KEY`          | Same as in webhook-receiver secrets                                   |
   | `FLOCK_API_KEY`            | Your Flock API key                                                    |
   | `SLACK_WEBHOOK_URL`        | Optional; for Slack alerts                                            |

3. Push to **main**. The workflow runs on a schedule (e.g. every 6 hours); each run can produce reports and send them to the webhook. **Every** beta tester sees them in the dashboard (same feed).

### Option B: Your own server / cron

On a machine with Python 3.11/3.12:

```bash
pip install -r requirements.txt
```

Create `.env` with:

- `FLOCK_API_KEY`
- `SUPABASE_WEBHOOK_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver`
- `SUPABASE_AGENT_USER_ID=<system-agent-user-uuid-from-step-2a>`
- `WEBHOOK_API_KEY=<same as Supabase>`

Run on a schedule (e.g. cron):

```bash
python main.py run --once
```

---

## 5. Verify

1. Sign in to the **Lovable app** as **any** user (e.g. a beta tester).
2. Open the **Intel Feed**. You should see the **same** live reports (from the system agent). No “Run Agent” button; feed updates as the Python agent runs.
3. In **Lovable Cloud** → **Database** (Supabase), confirm new rows in `crop_signals`, `intel_reports`, etc. with `user_id` = your system agent UUID. All authenticated users see these via RLS.

---

## Quick checklist

- [ ] Merge live branch into main and push.
- [ ] Run migration `20260304120000_global_live_intel_rls.sql` in Supabase.
- [ ] Create system agent user in Supabase Auth; set `app_config.system_agent_user_id` to that UUID.
- [ ] Deploy **webhook-receiver** (and **openclaw-alert** if needed); set **WEBHOOK_API_KEY**.
- [ ] In Lovable, confirm Supabase env vars; redeploy from main.
- [ ] Add GitHub Actions secrets (or server `.env`) with **SUPABASE_AGENT_USER_ID** = system agent UUID; run agent at least once.
- [ ] Sign in as any user and confirm the shared live intel feed appears.

After that, the dashboard is **100% live**, **no fake/mock/placeholder data**, and **everyone** (10 or 100+ testers) sees the same live intel.
