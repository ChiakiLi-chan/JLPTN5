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

/* Returns { entries } on success, or { error } with a message worth showing
   the player. Failure isn't always a network problem — the server also
   rejects submissions that are rate-limited (429), or that lost a race
   where someone else's score pushed this one out of qualifying range — so
   the reason gets passed back rather than collapsed into a null. */
export async function submitScore(category, count, mode, entry) {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, count, mode, ...entry }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      // Non-JSON response (a gateway error page, say) — fall through.
    }

    if (res.ok && Array.isArray(data?.entries)) return { entries: data.entries };

    if (res.status === 429) {
      const mins = Math.ceil((Number(data?.retryAfter) || 0) / 60);
      return {
        error: mins > 0
          ? `Too many submissions from here — try again in about ${mins} minute${mins === 1 ? "" : "s"}.`
          : "Too many submissions from here — please try again later.",
      };
    }
    if (data?.error) return { error: data.error };
    return { error: "Couldn't save your score — check your connection and try again." };
  } catch (e) {
    return { error: "Couldn't save your score — check your connection and try again." };
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
