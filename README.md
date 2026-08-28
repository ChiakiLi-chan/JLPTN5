# N5道場 — JLPT N5 Practice

A JLPT N5 vocabulary trainer: multiple-choice quizzes, card matching,
flashcards, and Time Attack, across 608 words in ten grammatical categories.

Vite + React frontend, with a serverless API (`/api/leaderboard`) backed by
Redis for a shared leaderboard across every device and person who plays this
deployment.

## Running locally

```bash
npm install
npm run dev
```

That serves the frontend only. The quiz, flashcards and Time Attack all work
fully offline — the word list is bundled into the build — but leaderboard
calls will fail, since Vite doesn't run serverless functions.

To exercise `/api/leaderboard` locally you need a Redis instance and a
`REDIS_URL` environment variable pointing at it. The API test script (below)
does exactly this against a local `redis-server`.

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

To fix a single entry, edit its JSON file — `src/data/vocabulary.js` picks it
up automatically, assigning ids and filling in any absent fields.

Rows omit the `category` field (implied by the filename) and omit fields that
are null for the whole category: the kana files carry no `meaning`, and only
`kanji.json` carries `onyomi`/`kunyomi`. A row needs `jp` plus whichever
fields its category uses.

To replace the whole set, re-download the source spreadsheet as `.xlsx` and
regenerate the ten JSON files from it.

## Leaderboard rules

- One leaderboard per exact combination of **category + question count +
  mode** (e.g. "Nouns · 10Q · Normal" and "Mixed · 20Q · Hard" are separate).
- Ranked by **accuracy first, then time** — a 10/10 always beats a 9/10, and
  time breaks ties within the same score. `rankingScore()` in
  `shared/leaderboardRules.js` is the one definition of this; the server sorts
  by it and the client uses it to decide whether a run would place. Top 10 kept.
- The name prompt only appears when the run would **actually make the board**.
  If the leaderboard can't be reached, no prompt appears at all rather than
  asking for a name that can't be saved.
- Requires **at least 50% accuracy** to qualify at all, to stop a
  zero-effort speed-click run from topping the board — this is enforced on
  the server (`api/leaderboard.js`), not just the client, so it can't be
  bypassed. Change `LEADERBOARD_MIN_ACCURACY` in `shared/leaderboardRules.js`
  if you want a different threshold (or none).
- Names are free text, capped at 24 characters, defaulting to "Anonymous"
  if left blank.

## Abuse protection

`/api/leaderboard` is a public endpoint with no authentication, so anyone who
watches the network tab can replay a submission from curl. There's no private
data to leak, but an unthrottled endpoint could burn the free-tier quota
(Upstash allows 500K commands/month; a submission costs 3) and leave the
leaderboard dead for the rest of the month. Two layers guard against that:

- **Per-IP limits** — 20 submissions and 300 reads per hour, in
  `shared/leaderboardRules.js`. Far above real use: a 10-question run takes
  ~30 seconds, so nobody legitimately produces 20 scores in an hour.
- **A global daily write budget** — 5,000 writes/day, the backstop for a
  distributed flood or a spoofed address header. Reads keep working even
  when it's spent, so the app degrades to read-only rather than breaking.

Reads fail **open** (if the limiter itself errors, serve the board anyway);
writes fail **closed** (if we can't verify the limit, don't write). Blocked
callers get a 429 with `Retry-After`, and the results screen shows how long
to wait.

The caller's address comes from `x-real-ip`, falling back to the *rightmost*
`x-forwarded-for` entry. The leftmost entry is client-supplied and would let
anyone mint a fresh identity per request just by setting a header.

**Known limitation — shared networks.** The per-IP limit pools everyone
behind one public address, so a classroom or a mobile carrier's CGNAT shares
a single budget. A group studying together could trip it while doing nothing
wrong. Raise `RATE_LIMIT_SUBMIT` before sharing the app with a large group.

**What this does not do:** stop cheating. Someone can still submit a
fabricated perfect run, just 20 times an hour instead of thousands. Closing
that needs signed session tokens — the server issues a token at quiz start
and verifies the elapsed time on submit. Worth doing only if people actually
start gaming it.

There's also no admin path for deleting a poisoned board; you'd remove the
key (`leaderboard:{category}:{count}:{mode}`) in the Redis console.

## Tests

Neither is wired to a test runner — they're standalone scripts.

```bash
# Frontend: renders every screen, exercises the quiz engine over all 608 items
npx esbuild smoke.test.jsx --bundle --platform=node --format=cjs \
  --loader:.json=json --jsx=automatic --outfile=smoke.cjs && node smoke.cjs

# API: runs the real handler against a local Redis
redis-server --daemonize yes --port 6379 --save ''
REDIS_URL=redis://127.0.0.1:6379 node api.test.mjs
```

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
shared/rateLimit.js          per-IP limits and the global write budget (server-only)
```

`shared/` sits outside `src/` on purpose: `api/leaderboard.js` imports from it
too, which is what keeps the ranking rule, accuracy bar and plausibility floor
identical on both sides.

The API reads its connection string from `REDIS_URL`.

### Where to change what

| To change… | Edit |
| --- | --- |
| A word, reading, or meaning | the matching `src/data/*.json` |
| What a question asks, or how distractors are chosen | `src/lib/quizEngine.js` |
| Time-attack seconds per question | `TIME_LIMITS` in `src/lib/quizEngine.js` |
| Leaderboard ranking and qualification | `shared/leaderboardRules.js` (client + server both read it) |
| Rate limit thresholds | `RATE_LIMIT_SUBMIT` / `RATE_LIMIT_READ` / `GLOBAL_DAILY_WRITE_BUDGET` in `shared/leaderboardRules.js` |
| Any single screen's markup | that screen's file in `src/components/` |
| Colors, spacing, fonts | `src/styles/base.css` |
