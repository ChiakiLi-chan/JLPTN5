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

import { LEADERBOARD_MAX_ENTRIES, meetsAccuracyBar, rankingScore } from "../../shared/leaderboardRules.js";

/* Returns the entries on success, or null if the board couldn't be reached.
   The distinction matters: an empty board means "any qualifying score gets
   on", while an unreachable one means we don't know — and treating the
   second as the first would prompt for a name we then can't save. */
export async function loadLeaderboard(category, count, mode) {
  try {
    const params = new URLSearchParams({ category, count: String(count), mode });
    const res = await fetch(`/api/leaderboard?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.entries) ? data.entries : null;
  } catch (e) {
    return null;
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

/* Whether this run would actually make the board — i.e. whether it's worth
   asking the player for a name at all.

   Ranks against the same formula the server sorts by, so the answer here
   matches what the server will do. Comparing on time alone (as this used to)
   meant a fast 6/10 could beat a slow 10/10 on the client, get accepted, and
   then be trimmed off the board immediately, leaving the player thinking
   their score had saved.

   The server enforces all of this independently and remains the source of
   truth; this only decides whether to show the form. */
export function qualifiesForLeaderboard(leaderboard, timeSeconds, score, total) {
  if (!meetsAccuracyBar(score, total)) return false;
  // Board unreachable — don't offer a prompt we can't honour.
  if (!Array.isArray(leaderboard)) return false;
  if (leaderboard.length < LEADERBOARD_MAX_ENTRIES) return true;

  const mine = rankingScore(score, total, timeSeconds);
  const worst = leaderboard[leaderboard.length - 1];
  // A stored entry missing its score/total is from an older submission;
  // fall back to comparing time so it can still be beaten.
  const theirs = Number.isFinite(worst?.score) && Number.isFinite(worst?.total)
    ? rankingScore(worst.score, worst.total, worst.timeSeconds)
    : worst.timeSeconds;
  return mine < theirs;
}