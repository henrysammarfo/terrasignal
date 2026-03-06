# TerraSignal — Beta testers: sign up and use the dashboard

**Goal:** Beta testers sign up once, get into the dashboard, and see **live** intel. No fake data, no mocks, no placeholders. Everything is **hosted** — no local setup.

---

## Lovable + Supabase

- **Lovable** hosts your app (dashboard UI). In project settings you **Connect Supabase** — that’s your own Supabase project.
- **Lovable Cloud → Database** is that same Supabase project: same tables, auth, and Edge Functions. So when we say “Supabase,” that’s the backend Lovable is already using.

---

## What beta testers see

- **One shared live intel feed.** The TerraSignal Python pipeline (Sentinel-2, weather, Flock) runs in the cloud and pushes reports to Supabase. Those reports are visible to **every** logged-in user (RLS is set so everyone can read the “system agent” feed). So:
  - Tester 1, Tester 2, … Tester 10 (and later 100+) all see the **same** live reports.
- **No “Run Agent” button.** The dashboard does not use any AI-generated or fake data. New reports appear automatically as the pipeline runs.
- They can use **Intel Feed**, **Map**, and **Charts** to explore; **Settings** for API info; **Sign out** when done.

---

## What beta testers do (simple steps)

1. **Get the link**  
   You send them your **Lovable app URL** (e.g. `https://your-app.lovable.app`).

2. **Sign up**  
   They open the link → **Sign up** → email + password (or Google if enabled).

3. **Confirm email**  
   They confirm via the link in email (unless you disabled “Confirm email” in Supabase).

4. **Use the dashboard**  
   After login they see the **live intel feed** (and Map, Charts). No extra steps — the feed updates as the TerraSignal pipeline runs in the cloud.

---

## Your checklist (once, for all testers)

| Step | Where | What to do |
|------|--------|------------|
| 1 | **Lovable** | Copy your app’s **public URL** and share it with beta testers. |
| 2 | **Supabase** → Authentication → Providers | Enable **Email** (and optionally Google) for sign-up. |
| 3 | **Supabase** → Authentication → URL Configuration | Set **Site URL** to your Lovable app URL so redirects work after login. |
| 4 | **Supabase** → Edge Functions | **webhook-receiver** deployed with **WEBHOOK_API_KEY** set. |
| 5 | **Supabase** + **Python agent** | Migration run, system agent user created, `app_config.system_agent_user_id` set; Python agent (e.g. GitHub Actions) runs with that UUID as `SUPABASE_AGENT_USER_ID` so reports land in the shared feed. |

After this, beta testers **sign up → see the same live feed → use the dashboard**. No fake data; everything is live and working for everyone.
