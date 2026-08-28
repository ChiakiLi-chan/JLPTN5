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

The word list is baked into the build — there's no live fetch from Google
Sheets (that path doesn't work from a browser-sandboxed context and was
intentionally dropped in favor of embedding the data directly).

Each grammatical category is its own JSON file under `src/data/`, so entries
are hand-editable without touching any code:

```
src/data/nouns.json                (100)   src/data/particles.json       (25)
src/data/verbs.json                (100)   src/data/katakanaWords.json   (61)
src/data/adjectives.json            (84)   src/data/hiragana.json        (46)
src/data/adverbs.json               (35)   src/data/katakana.json        (46)
src/data/preNounAdjectivals.json     (8)   src/data/kanji.json          (103)
```

To fix a single entry, edit its JSON file and redeploy — `src/data/vocabulary.js`
picks it up automatically, assigning ids and filling in any absent fields.

Rows omit the `category` field (implied by the filename) and omit fields that
are null for the whole category: the kana files carry no `meaning`, and only
`kanji.json` carries `onyomi`/`kunyomi`. A row needs `jp` plus whichever
fields its category uses.

To replace the whole set:

1. Re-download your Google Sheet as `.xlsx`.
2. Hand it back to Claude and ask it to regenerate the ten JSON files in
   `src/data/` from the new file.
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

Layered so that each direction of dependency only ever points one way:
`data → lib → components → App`. Nothing in `data/` or `lib/` imports React,
touches the DOM, or knows a screen exists.

```
src/
  App.jsx                    root: screen routing and cross-screen state only
  main.jsx                   React entry point

  data/
    *.json                   the word list, one file per category
    vocabulary.js            loads them, assigns ids, exposes ALL_ITEMS /
                             CATEGORIES / FIELD_LABELS and the category sets

  lib/                       pure logic — no React, no DOM, no network
    quizEngine.js            question resolution, distractor generation,
                             session + flashcard building, config helpers
    leaderboardApi.js        the only module that calls fetch()

  components/
    JpText.jsx               ruby/furigana rendering
    Home.jsx                 mode selection, category summary, furigana toggle
    CategoryPicker.jsx       full-screen category multi-select
    QuizSetup.jsx            + ConfigCarousel, PromptAnswerFields
    Quiz.jsx                 the in-quiz screen and its timer
    QuizResults.jsx          + MissedItemPopup, score submission
    Flashcards.jsx           + FlashcardsSetup, FlashcardBack
    LeaderboardBrowser.jsx   browse any category/count/mode board

  styles/
    index.css                imports the rest, in order
    base.css                 tokens, shell, shared buttons and option rows
    home / setup / quiz / flashcards / results / leaderboard .css
    responsive.css           breakpoints — imported LAST so its overrides win

api/leaderboard.js           serverless function: GET reads a board, POST submits
shared/leaderboardRules.js   constants/helpers shared by the client AND the API,
                             so the qualification rule can't drift between them
```

`shared/` sits outside `src/` on purpose: `api/leaderboard.js` imports from it
too, which is what keeps the accuracy bar and plausibility floor identical on
both sides.

### Where to change what

| To change… | Edit |
| --- | --- |
| A word, reading, or meaning | the matching `src/data/*.json` |
| What a question asks, or how distractors are chosen | `src/lib/quizEngine.js` |
| Time-attack seconds per question | `TIME_LIMITS` in `src/lib/quizEngine.js` |
| Leaderboard qualification rules | `shared/leaderboardRules.js` (client + server both read it) |
| Any single screen's markup | that screen's file in `src/components/` |
| Colors, spacing, fonts | `src/styles/base.css` |
