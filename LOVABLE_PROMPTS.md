# Everything you do in Lovable — prompts + where to use the secrets

Copy-paste each prompt into **Lovable project chat**. After each step, the doc says what secret or value you get so you can use it in **GitHub Actions** or **.env**.

---

# ✅ Done in Lovable — one manual step left

If you already completed Edge Functions, WEBHOOK_API_KEY, RLS, and env vars in Lovable, do this **once**:

1. **Supabase Dashboard** → **Authentication** → **Users** → **Add user**
   - Email: `agent@terrasignal.local` (or any email)
   - Password: any (you won’t log in with it)
   - Click **Create user**

2. **Copy the user’s UUID** (click the user row or the UUID shown).

3. **Supabase Dashboard** → **SQL Editor** → New query → run **one** of these (replace `PASTE-UUID-HERE` with the UUID):
   - If `app_config` already has a row:  
     `UPDATE public.app_config SET system_agent_user_id = 'PASTE-UUID-HERE' WHERE id = 1;`
   - If not:  
     `INSERT INTO public.app_config (system_agent_user_id) VALUES ('PASTE-UUID-HERE');`

4. **Your `.env`** → set:
   - `WEBHOOK_API_KEY=` the value you entered in Lovable for the webhook-receiver secret
   - `SUPABASE_AGENT_USER_ID=` the UUID you just copied

5. **GitHub** → Repo → **Settings** → **Secrets and variables** → **Actions** → add:
   - `WEBHOOK_API_KEY` = same as in .env  
   - `SUPABASE_AGENT_USER_ID` = same UUID  
   - `SUPABASE_WEBHOOK_URL` = `https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver`  
   - `FLOCK_API_KEY` = your Flock key  

Then run `python demo.py` (or let GitHub Actions run the agent); reports will show in the dashboard for everyone.

---

## PROMPT 1 — Deploy Edge Functions

Paste into Lovable:

```
Deploy all Supabase Edge Functions in this project to our connected Supabase project (ref ufncnuhzqdgefrdkrrhz). We have webhook-receiver, openclaw-alert, and agent-scan in supabase/functions/. The supabase/config.toml already has these functions with verify_jwt = false. Deploy them so they are live at:
- https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver
- https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/openclaw-alert
- https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/agent-scan
```

**If Lovable deploys one by one**, use these in order:

```
Deploy the webhook-receiver Edge Function to our connected Supabase project. Code is in supabase/functions/webhook-receiver/index.ts.
```

```
Deploy the openclaw-alert Edge Function to our connected Supabase project. Code is in supabase/functions/openclaw-alert/index.ts.
```

```
Deploy the agent-scan Edge Function to our connected Supabase project. Code is in supabase/functions/agent-scan/index.ts.
```

**You will use later:** The URLs above (already in your .env as SUPABASE_WEBHOOK_URL). No new secret yet.

---

## PROMPT 2 — Set webhook secret and get the value back

Paste into Lovable:

```
For the webhook-receiver Edge Function, set the secret WEBHOOK_API_KEY to a strong random string. Generate one for me (e.g. 32+ random characters). Tell me the exact value you set so I can use it in my Python .env and in GitHub Actions. I need to copy it once and use it in both places.
```

**You will receive:** A string like `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (the WEBHOOK_API_KEY).

**Where to use it:**
- **.env** → `WEBHOOK_API_KEY=<paste that value>`
- **GitHub** → Repo → Settings → Secrets and variables → Actions → New repository secret → Name: `WEBHOOK_API_KEY`, Value: `<paste that value>`
- **Supabase** (if you set it yourself): Edge Functions → webhook-receiver → Secrets → WEBHOOK_API_KEY = same value

---

## PROMPT 3 — Run the migration (global live feed)

Paste into Lovable:

```
Run this SQL on our connected Supabase project. Create the app_config table and add RLS policies so all authenticated users can see the system agent's reports. Use the contents of supabase/migrations/20260304120000_global_live_intel_rls.sql. If you cannot run SQL, tell me to run it in Supabase Dashboard → SQL Editor and paste the file contents.
```

**If Lovable can’t run SQL:** Open **Supabase Dashboard** → **SQL Editor** → New query → paste the full contents of `supabase/migrations/20260304120000_global_live_intel_rls.sql` → Run.

**You will use later:** Nothing to copy; the migration just creates tables and policies.

---

## PROMPT 4 — Create system agent user and get UUID

Paste into Lovable:

```
In our connected Supabase project, create a new Auth user for the TerraSignal system agent (e.g. email agent@terrasignal.local or agent@myproject.com, any password). Then run: UPDATE public.app_config SET system_agent_user_id = '<that-user-uuid>' WHERE id = 1; Use the UUID of the user you created. If you cannot create users, tell me to do it in Supabase Dashboard → Authentication → Users → Add user, then run the UPDATE in SQL Editor with that user's UUID.
```

**You will receive:** The **UUID** of the system agent user (e.g. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

**Where to use it:**
- **.env** → `SUPABASE_AGENT_USER_ID=<paste that UUID>`
- **GitHub** → Repo → Settings → Secrets and variables → Actions → New repository secret → Name: `SUPABASE_AGENT_USER_ID`, Value: `<paste that UUID>`

---

## PROMPT 5 — Confirm app env vars (dashboard)

Paste into Lovable:

```
Our React app needs these environment variables for the dashboard to work with Supabase. Ensure they are set for production and preview: VITE_SUPABASE_URL=https://ufncnuhzqdgefrdkrrhz.supabase.co, VITE_SUPABASE_PUBLISHABLE_KEY=<our anon key>, VITE_SUPABASE_PROJECT_ID=ufncnuhzqdgefrdkrrhz. If they are already set in the project, confirm and tell me. If not, set them and tell me so I can use the same values in .env and Vercel if needed.
```

**You will receive:** Confirmation (and the anon key if you didn’t have it). Use the same values in **.env** and in **Vercel** (if you deploy there).

---

## PROMPT 6 — (Optional) LOVABLE_API_KEY for agent-scan

If you use the agent-scan function (AI-generated scan from the dashboard):

```
For the agent-scan Edge Function we need LOVABLE_API_KEY. Where do I get this value? Set it in the function's secrets and tell me the value so I can store it for reference, or tell me the exact place in Lovable or Supabase to copy it from.
```

**You will receive:** Where to find or what value to use for LOVABLE_API_KEY. Use only if you rely on agent-scan.

---

# Secrets checklist — where to use what

After you finish the prompts above, use this list to set **GitHub Actions** and **.env**:

| Secret / value        | Where you got it              | Put in .env              | Put in GitHub Actions (Secrets) |
|-----------------------|-------------------------------|--------------------------|----------------------------------|
| WEBHOOK_API_KEY       | Lovable (Prompt 2) or Supabase webhook-receiver Secrets | `WEBHOOK_API_KEY=...`    | Name: `WEBHOOK_API_KEY`          |
| SUPABASE_AGENT_USER_ID| Lovable (Prompt 4) or Supabase Auth → Users → agent user UUID | `SUPABASE_AGENT_USER_ID=...` | Name: `SUPABASE_AGENT_USER_ID`   |
| SUPABASE_WEBHOOK_URL  | Fixed URL (below)             | Already set              | Name: `SUPABASE_WEBHOOK_URL`, Value: `https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver` |
| FLOCK_API_KEY         | You already have it           | Already set              | Name: `FLOCK_API_KEY`, Value: your key |
| SLACK_WEBHOOK_URL     | Optional                      | Already set              | Name: `SLACK_WEBHOOK_URL` (optional) |

**Fixed URLs (no secret):**
- Webhook: `https://ufncnuhzqdgefrdkrrhz.supabase.co/functions/v1/webhook-receiver`
- Supabase project: `https://ufncnuhzqdgefrdkrrhz.supabase.co`

---

# If Lovable can’t do something

- **Deploy Edge Functions:** Supabase Dashboard → Edge Functions → deploy from GitHub or create function and paste code from `supabase/functions/webhook-receiver/index.ts` (and openclaw-alert, agent-scan).
- **Secrets:** Supabase Dashboard → Edge Functions → webhook-receiver → Secrets → add WEBHOOK_API_KEY (generate a strong random string and copy it into .env and GitHub).
- **Migration:** Supabase Dashboard → SQL Editor → paste `supabase/migrations/20260304120000_global_live_intel_rls.sql` → Run.
- **System agent user:** Supabase Dashboard → Authentication → Users → Add user → copy UUID → SQL Editor: `UPDATE public.app_config SET system_agent_user_id = 'uuid-here' WHERE id = 1;`

Then use the **Secrets checklist** above to fill .env and GitHub Actions.
