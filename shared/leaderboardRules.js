// Shared between src/App.jsx (client) and api/leaderboard.js (server).
// Keep these in one place so client-side qualification checks and the
// server's actual enforcement never drift apart.

export const LEADERBOARD_MAX_ENTRIES = 10;
// Guards against a zero-effort speed-click run topping the board — must get
// at least half right for a completion to be eligible at all.
export const LEADERBOARD_MIN_ACCURACY = 0.5;

export const CATEGORY_ORDER = [
  "Nouns", "Verb", "Adjectives", "Adverb", "Pre-Noun Adjectivals",
  "Particles", "Katakana Words", "Hiragana", "Katakana", "Kanji",
];
export const LEADERBOARD_CATEGORY_OPTIONS = [...CATEGORY_ORDER, "Mixed"];
export const QUESTION_COUNT_OPTIONS = [10, 20, 50, 100];
export const LEADERBOARD_MODE_OPTIONS = [
  { key: "normal", label: "Normal" },
  { key: "easy", label: "Easy (10s)" },
  { key: "hard", label: "Hard (5s)" },
];
const LEADERBOARD_MODE_KEYS = LEADERBOARD_MODE_OPTIONS.map((m) => m.key);

// Rough floor on how fast a legitimate run could possibly be — rejects
// obviously fabricated submissions (e.g. a script posting timeSeconds: 1
// for a 10-question run). Not rigorous anti-cheat, just a sanity check.
const MIN_SECONDS_PER_QUESTION = 0.6;

export function leaderboardKey(category, count, mode) {
  return `leaderboard:${category}:${count}:${mode}`;
}

export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function meetsAccuracyBar(score, total) {
  return total > 0 && score / total >= LEADERBOARD_MIN_ACCURACY;
}

// Rejects anything the client couldn't legitimately have produced — an
// unrecognized category/count/mode combo, which would otherwise let a
// direct API call spam arbitrary Redis keys.
export function isValidLeaderboardFilters(category, count, mode) {
  return (
    LEADERBOARD_CATEGORY_OPTIONS.includes(category) &&
    QUESTION_COUNT_OPTIONS.includes(Number(count)) &&
    LEADERBOARD_MODE_KEYS.includes(mode)
  );
}

export function isPlausibleTime(timeSeconds, count) {
  return Number.isFinite(timeSeconds) && timeSeconds >= Number(count) * MIN_SECONDS_PER_QUESTION;
}