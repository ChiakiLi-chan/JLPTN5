/* ==============================================================
   LEADERBOARD API — the only module in the client that talks to the
   network. Backed by a real server (Upstash Redis via /api/leaderboard)
   so scores are shared across every device and every person who plays
   this deployment.

   One leaderboard per exact combination of category + question count +
   mode, since a 5-second Hard time-attack run and an untimed Normal run
   aren't comparable.

   Both calls swallow failures and return an empty/null result: a
   leaderboard that can't load should degrade quietly, never break the
   screen the player is on.
   ============================================================== */

import { LEADERBOARD_MAX_ENTRIES, meetsAccuracyBar } from "../../shared/leaderboardRules.js";

export async function loadLeaderboard(category, count, mode) {
  try {
    const params = new URLSearchParams({ category, count: String(count), mode });
    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : [];
  } catch (e) {
    return [];
  }
}

// Returns the updated top-10 list on success, or null on failure (network
// error, or the server rejected it — e.g. a race where someone else's
// submission pushed this one back out of qualifying range in the meantime).
export async function submitScore(category, count, mode, entry) {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, count, mode, ...entry }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : null;
  } catch (e) {
    return null;
  }
}

// Client-side pre-check only, so the name-entry form doesn't flash up and
// then get rejected — the server enforces this same rule independently and
// is the actual source of truth.
export function qualifiesForLeaderboard(leaderboard, timeSeconds, score, total) {
  if (!meetsAccuracyBar(score, total)) return false;
  if (leaderboard.length < LEADERBOARD_MAX_ENTRIES) return true;
  return timeSeconds < leaderboard[leaderboard.length - 1].timeSeconds;
}
