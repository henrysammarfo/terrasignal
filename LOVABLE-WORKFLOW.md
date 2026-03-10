# Lovable + GitHub + Vercel workflow

Lovable is **disconnected from GitHub**. This doc is the single source of truth for how code flows between Lovable, this repo, and Vercel.

---

## Where things live

| Where | What happens |
|-------|-----------------------------|
| **Lovable** | You (or Lovable’s AI) can edit code, deploy Edge Functions (they go live immediately), run DB migrations, manage secrets, and debug. Lovable **cannot** push to your GitHub repo — any code changes made in Lovable must be **manually synced by you** into this repo. |
| **Backend (Edge Functions, DB, secrets)** | Changes in Lovable deploy automatically. Your Vercel app and local dev already call Lovable’s Supabase, so backend updates are used as soon as they’re deployed. **No GitHub push needed** for backend-only changes to take effect. |
| **Frontend** | Frontend code edited in Lovable only appears on Lovable’s preview/published URL. It **does not** appear on your Vercel deployment until you copy those changes into this repo and push to GitHub (so Vercel can rebuild). |
| **This repo (GitHub)** | Edits here (e.g. in Cursor) **do not sync to Lovable**. To get backend changes live, copy the updated code into Lovable and deploy. To get frontend changes live on Vercel, push to GitHub so Vercel rebuilds. |

---

## How it fits TerraSignal (fully realtime on Vercel)

Realtime in this app is **entirely through Supabase** from the browser. Vercel only serves the React app; the app connects directly to Lovable’s Supabase for auth, data, and realtime.

| Piece | Where it runs | Realtime? |
|-------|----------------|-----------|
| React dashboard | Vercel (static build from this repo) | — |
| Auth, DB, Edge Functions, Realtime | Lovable’s Supabase | ✅ |
| Intel feed / notifications | Browser → Supabase Realtime (postgres_changes on `intel_reports`, `crop_signals`, `notifications`) | ✅ |

So when you deploy to Vercel, everything is **fully realtime** as long as:

1. **Vercel env vars** match Lovable’s Supabase (so the built app talks to the same backend):
   - `VITE_SUPABASE_URL` = `https://ufncnuhzqdgefrdkrrhz.supabase.co` (or your project URL)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon key
   - `VITE_SUPABASE_PROJECT_ID` = `ufncnuhzqdgefrdkrrhz` (for webhook URL in Settings)
2. **Frontend in this repo** is what you want on Vercel. If you edit frontend in Lovable, copy those changes here and push so Vercel rebuilds.
3. **Supabase Realtime** is enabled for the tables the app subscribes to (`intel_reports`, `crop_signals`, `notifications`). In Supabase: Database → Replication — ensure those tables are in the publication. (Lovable usually enables this when you use Realtime.)

No extra backend or WebSocket server on Vercel is needed; the browser keeps a single Supabase connection for auth + Realtime.

---

## Summary

- **Backend in Lovable** → Deploy there; works for Vercel immediately.
- **Frontend in Lovable** → Only on Lovable until you sync to this repo and push.
- **This repo** = Source of truth for what’s on GitHub and Vercel; sync from here to Lovable when you want the backend to match.
- **Vercel** = Serves the app; set the three `VITE_*` env vars to Lovable’s Supabase and realtime works.

---

## AI: Flock vs Lovable (market-chat & signal-scoring)

The **market-chat** and **signal-scoring** Edge Functions in this repo support **Flock AI** so they don’t depend on Lovable credits:

- **Preferred:** In **Supabase → Edge Functions → Secrets** (or per-function secrets), set:
  - `FLOCK_API_KEY` = your Flock API key (same as in the Python agent `.env`)
  - `FLOCK_MODEL` = optional; default `qwen3-30b-a3b-instruct-2507`
- If `FLOCK_API_KEY` is set, both functions use Flock. If not set, they fall back to `LOVABLE_API_KEY` (Lovable AI gateway).

After you deploy the updated `market-chat` and `signal-scoring` from this repo (or sync them into Lovable and deploy), add `FLOCK_API_KEY` so the AI Analyst chat and trade-signal scoring keep working without Lovable credits.
