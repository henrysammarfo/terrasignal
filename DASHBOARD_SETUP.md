# TerraSignal — Dashboard setup (React + Supabase webhook)

Get the Python agent’s reports showing in the React dashboard.

## 1. Supabase project

- Create or use a Supabase project at [supabase.com](https://supabase.com).
- Note your **Project URL** (e.g. `https://abcdefgh.supabase.co`) and **Project ref** (e.g. `abcdefgh`).
- Deploy Edge Functions so the webhook exists:
  - Install [Supabase CLI](https://supabase.com/docs/guides/cli) and run `supabase login`.
  - From repo root: `supabase link --project-ref YOUR_REF` then `supabase functions deploy webhook-receiver`.
  - In Supabase Dashboard → Project Settings → Edge Functions, set secret **WEBHOOK_API_KEY** (any secret string you’ll use in the Python `.env`).

## 2. React app env (Vite)

In the repo root, create or edit `.env` (or `.env.local`) for the frontend. A template is in `.env.example.react`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

- **VITE_SUPABASE_URL** — Project URL from Supabase dashboard.
- **VITE_SUPABASE_PUBLISHABLE_KEY** — Project → Settings → API → `anon` public key.
- **VITE_SUPABASE_PROJECT_ID** — The ref part of the URL (e.g. `abcdefgh`). Used to build the webhook URL in the Settings page.

Restart the dev server after changing env: `npm run dev`.

## 3. Python agent .env (webhook + user ID)

In the same repo, in `.env` (Python agent), set:

```env
SUPABASE_WEBHOOK_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-receiver
WEBHOOK_API_KEY=your-webhook-secret
SUPABASE_AGENT_USER_ID=your-supabase-auth-user-uuid
```

- **SUPABASE_WEBHOOK_URL** — Replace `YOUR_PROJECT_REF` with your Supabase project ref (same as in the React `VITE_SUPABASE_PROJECT_ID`).
- **WEBHOOK_API_KEY** — Same value as the secret you set in Supabase Edge Function for `webhook-receiver`.
- **SUPABASE_AGENT_USER_ID** — Sign up (or sign in) in the React app, go to **Settings**, and copy **Your User ID** (UUID). Paste it here so reports are attached to your user and show in your dashboard.

## 4. Run and verify

1. Start the React app: `npm run dev`. Open the app and sign in (or sign up).
2. In Settings, confirm the **Webhook Endpoint** matches your `SUPABASE_WEBHOOK_URL` and copy your **User ID** into `.env` as `SUPABASE_AGENT_USER_ID`.
3. Run the Python demo: `python demo.py`. When the run finishes, refresh the dashboard; the new report should appear.

If the webhook returns 401, check that `WEBHOOK_API_KEY` in `.env` matches the Edge Function secret. If reports don’t show, ensure `SUPABASE_AGENT_USER_ID` matches the logged-in user’s ID in the React app.
