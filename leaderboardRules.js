// Shared between src/App.jsx (client) and api/leaderboard.js (server).
// Keep these in one place so client-side qualification checks and the
// server's actual enforcement never drift apart.

export const LEADERBOARD_MAX_ENTRIES = 10;
// Guards against a zero-effort speed-click run topping the board — must get
// at least half right for a completion to be eligible at all.
export const LEADERBOARD_MIN_ACCURACY = 0.5;

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
