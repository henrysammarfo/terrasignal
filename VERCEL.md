# Deploy TerraSignal dashboard to Vercel

The **React dashboard** (Vite + Supabase) can be hosted on Vercel so you have a public URL (e.g. `terrasignal.vercel.app`) in addition to or instead of Lovable’s hosting.

**Note:** The **Python agent** does not run on Vercel (Vercel is for Node/frontend). Keep running the agent via GitHub Actions or your own machine; it will push reports to the same Supabase project your Vercel-deployed dashboard uses.

---

## 1. Connect the repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. **Add New** → **Project** → import your `terrasignal` repo.
3. Pick the repo and branch (e.g. `main` or `changes`).

---

## 2. Configure the project

Vercel will usually detect Vite. Set:

| Setting | Value |
|--------|--------|
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` (default) |

Root directory: leave as `.` (repo root).

---

## 3. Environment variables

In the Vercel project → **Settings** → **Environment Variables**, add (for **Production**, and optionally Preview/Development):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://ufncnuhzqdgefrdkrrhz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon key (same as in `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | `ufncnuhzqdgefrdkrrhz` |

Vite inlines `import.meta.env.VITE_*` at **build time**, so these must be set in Vercel for the build to see them.

---

## 4. Deploy

Click **Deploy**. After the build finishes, Vercel gives you a URL (e.g. `terrasignal-xxx.vercel.app`).

---

## 5. Supabase redirect URL (for auth)

So sign-in/sign-up redirects work from your Vercel URL:

1. **Supabase** → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs** (e.g. `https://terrasignal-xxx.vercel.app/**`)
3. Optionally set **Site URL** to your Vercel URL if that’s your primary app URL

---

## Summary

- **Vercel** = hosts the React dashboard (frontend only).
- **Supabase** = same project as now (auth, DB, Edge Functions, webhook).
- **Python agent** = still runs via GitHub Actions or locally; sends reports to the webhook → they appear in the Vercel-deployed dashboard.

No code changes needed; same `.env` / Vite env vars, just set in Vercel’s UI.
