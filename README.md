# N5道場 — JLPT N5 Practice

Vite + React frontend, with a Vercel serverless API (`/api/leaderboard`) backed
by Redis for a real, shared leaderboard across every device and person who
plays this deployment.

## Deploy to Vercel

1. **Push this folder to a GitHub repo**, then import it in the
   [Vercel dashboard](https://vercel.com/new) (or run `vercel` from this
   folder with the [Vercel CLI](https://vercel.com/docs/cli) if you'd rather
   skip GitHub). Vercel auto-detects the Vite framework and the `api/`
   folder — no extra config needed for that part.

2. **Add a Redis database** (this is the one manual step):
   - In your Vercel project → **Storage** tab → **Create Database** (or
     **Browse Marketplace** on newer dashboards) → choose a **Redis**
     option (Upstash is the common one).
   - Connect it to this project. Vercel will automatically add the
     required environment variables for you — you don't need to copy
     anything by hand.
   - **Redeploy** the project so the new environment variables actually
     reach the running app (Vercel usually prompts you to do this
     automatically after connecting storage).

3. **Verify the env var names match** (only needed if something doesn't
   work). Go to Project Settings → Environment Variables and check for
   either pair:
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` (legacy naming, still common), or
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`

   `api/leaderboard.js` already checks both pairs, so either naming works
   without editing code. If your integration used a *different* prefix
   entirely (some do, e.g. a custom store name), update the two `process.env`
   lines at the top of `api/leaderboard.js` to match.

That's it — visiting the deployed URL should now show a working app with a
persistent, shared leaderboard.

## Local development

Plain `npm run dev` only serves the frontend — `/api/leaderboard` calls will
fail locally with that alone, since Vite doesn't run serverless functions.
To test the full thing locally:

```bash
npm install -g vercel        # once
vercel link                  # links this folder to your Vercel project
vercel env pull .env.development.local
vercel dev                   # runs both the frontend and /api together
```

## Updating the word list

The full word list lives as a big embedded JSON array (`RAW_ITEMS`) near the
top of `src/App.jsx` — there's no live fetch from Google Sheets (that path
doesn't work from a browser-sandboxed context and was intentionally dropped
in favor of baking the data in directly). To refresh it:

1. Re-download your Google Sheet as `.xlsx`.
2. Hand it back to Claude (in the same conversation this project came from,
   or a fresh one referencing this file) and ask it to regenerate the
   `RAW_ITEMS` block in `src/App.jsx` from the new file.
3. Redeploy.

## Leaderboard rules

- One leaderboard per exact combination of **category + question count +
  mode** (e.g. "Nouns · 10Q · Normal" and "Mixed · 20Q · Hard" are separate).
- Ranked by **time to complete**, fastest first, top 10 kept.
- Requires **at least 50% accuracy** to qualify at all, to stop a
  zero-effort speed-click run from topping the board — this is enforced on
  the server (`api/leaderboard.js`), not just the client, so it can't be
  bypassed. Change `LEADERBOARD_MIN_ACCURACY` in `shared/leaderboardRules.js`
  if you want a different threshold (or none).
- Names are free text, capped at 24 characters, defaulting to "Anonymous"
  if left blank.

## Project structure

```
src/App.jsx              the whole app (data + all screens)
src/main.jsx             React entry point
api/leaderboard.js       serverless function: GET reads a leaderboard, POST submits a score
shared/leaderboardRules.js  constants/helpers shared by both the client and the API,
                            so the qualification rule can't drift between the two
```
