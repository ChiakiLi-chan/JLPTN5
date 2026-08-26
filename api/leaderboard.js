import { createClient } from "redis";
import { LEADERBOARD_MAX_ENTRIES, leaderboardKey, meetsAccuracyBar } from "../shared/leaderboardRules.js";

// Vercel's own KV product is deprecated in favor of Redis integrations from
// the Marketplace (Upstash and others), which land under either naming
// convention depending on how/when the integration was added. Support both
// so this doesn't silently break based on which one your project has.
const redis = createClient({
  url: process.env.REDIS_URL,
});

await redis.connect();

// Redis sorted sets are a natural fit here: score = timeSeconds (lower is
// better), member = JSON blob with the display fields. ZRANGE with no
// REV flag returns ascending by score, i.e. fastest-first, for free.

function parseZRangeResult(raw) {
  const entries = [];
  if (!raw) return entries;

  // @upstash/redis (which @vercel/kv wraps) returns a flat array of
  // alternating [member, score, member, score, ...] for withScores.
  // Handle that shape, and defensively handle an array-of-objects shape too
  // in case the client version differs.
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object" && raw[0] !== null && "member" in raw[0]) {
    for (const r of raw) {
      try {
        entries.push({ ...JSON.parse(r.member), timeSeconds: Number(r.score) });
      } catch {
        // skip a corrupt entry rather than failing the whole request
      }
    }
    return entries;
  }

  for (let i = 0; i < raw.length; i += 2) {
    try {
      entries.push({ ...JSON.parse(raw[i]), timeSeconds: Number(raw[i + 1]) });
    } catch {
      // skip a corrupt entry rather than failing the whole request
    }
  }
  return entries;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { category, count, mode } = req.query;
    if (!category || !count || !mode) {
      return res.status(400).json({ error: "Missing category, count, or mode" });
    }
    const key = leaderboardKey(category, count, mode);
    try {
      const raw = await redis.zrange(key, 0, LEADERBOARD_MAX_ENTRIES - 1, { withScores: true });
      return res.status(200).json({ entries: parseZRangeResult(raw) });
    } catch (err) {
      console.error("leaderboard GET failed", err);
      return res.status(500).json({ error: "Could not load leaderboard" });
    }
  }

  if (req.method === "POST") {
    const { category, count, mode, name, timeSeconds, score, total } = req.body || {};

    if (
      !category ||
      !count ||
      !mode ||
      typeof timeSeconds !== "number" ||
      typeof score !== "number" ||
      typeof total !== "number"
    ) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    // Never trust the client's own qualification check — enforce it here too.
    if (!meetsAccuracyBar(score, total)) {
      return res.status(400).json({ error: "Accuracy too low to qualify for the leaderboard" });
    }
    if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
      return res.status(400).json({ error: "Invalid time" });
    }

    const key = leaderboardKey(category, count, mode);
    const safeName = String(name || "Anonymous").trim().slice(0, 24) || "Anonymous";
    const member = JSON.stringify({ name: safeName, date: Date.now(), score, total });

    try {
      await redis.zadd(key, { score: timeSeconds, member });
      // Keep only the fastest LEADERBOARD_MAX_ENTRIES — ranks beyond that
      // (the slower ones, since ascending order) get dropped.
      await redis.zremrangebyrank(key, LEADERBOARD_MAX_ENTRIES, -1);
      const raw = await redis.zrange(key, 0, LEADERBOARD_MAX_ENTRIES - 1, { withScores: true });
      return res.status(200).json({ entries: parseZRangeResult(raw) });
    } catch (err) {
      console.error("leaderboard POST failed", err);
      return res.status(500).json({ error: "Could not save score" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
