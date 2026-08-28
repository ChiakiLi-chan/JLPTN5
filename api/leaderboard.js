import { createClient } from "redis";
import {
  LEADERBOARD_MAX_ENTRIES,
  leaderboardKey,
  meetsAccuracyBar,
  isValidLeaderboardFilters,
  isPlausibleTime,
  rankingScore,
  RATE_LIMIT_SUBMIT,
  RATE_LIMIT_READ,
  GLOBAL_DAILY_WRITE_BUDGET,
} from "../shared/leaderboardRules.js";
import { clientIp, hitLimit, withinGlobalWriteBudget } from "../shared/rateLimit.js";

// Vercel's own KV product is deprecated in favor of Redis integrations from
// the Marketplace (Upstash and others), which land under either naming
// convention depending on how/when the integration was added. Support both
// so this doesn't silently break based on which one your project has.

/* One connection per warm serverless instance, established lazily and
   reused. Connecting at module top-level instead would mean that if the
   socket ever dropped, that instance served errors until it recycled —
   here a dead client is discarded and replaced on the next request.

   The 'error' listener is not optional: without it, node-redis emits an
   unhandled 'error' event on a dropped socket, which takes down the
   whole function instance. */
let clientPromise = null;

async function getRedis(attempt = 0) {
  if (!clientPromise) {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err) => {
      console.error("redis client error", err?.message || err);
    });
    clientPromise = client.connect().catch((err) => {
      clientPromise = null; // let the next request retry rather than caching a failure
      throw err;
    });
  }

  const client = await clientPromise;
  if (!client.isOpen && attempt < 1) {
    clientPromise = null;
    return getRedis(attempt + 1);
  }
  return client;
}

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
  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object" && raw[0] !== null && "value" in raw[0]) {
    for (const r of raw) {
      try {
        const data = JSON.parse(r.value);
        entries.push({ ...data, timeSeconds: Number(data.timeSeconds) });
      } catch {
        // skip a corrupt entry rather than failing the whole request
      }
    }
    return entries;
  }

  for (let i = 0; i < raw.length; i += 2) {
    try {
      // Take timeSeconds from the stored member, NOT from raw[i + 1]: that's
      // the sorted-set score, which encodes accuracy as well as time and
      // would render as a nonsense duration for any imperfect run.
      const data = JSON.parse(raw[i]);
      entries.push({ ...data, timeSeconds: Number(data.timeSeconds) });
    } catch {
      // skip a corrupt entry rather than failing the whole request
    }
  }
  return entries;
}

/* Sends a 429 with the headers a well-behaved client (or a browser
   devtools tab) can actually act on. */
function tooManyRequests(res, retryAfter, message) {
  res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
  return res.status(429).json({ error: message, retryAfter });
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  let redis;
  try {
    redis = await getRedis();
  } catch (err) {
    console.error("redis connect failed", err?.message || err);
    return res.status(503).json({ error: "Leaderboard is temporarily unavailable" });
  }

  const ip = clientIp(req);

  if (req.method === "GET") {
    // Reads fail OPEN: if the limiter itself breaks, showing a leaderboard
    // is better than a dead screen, and reads can't corrupt anything.
    try {
      const gate = await hitLimit(redis, `ratelimit:read:${ip}`, RATE_LIMIT_READ.limit, RATE_LIMIT_READ.windowSeconds);
      if (!gate.allowed) {
        return tooManyRequests(res, gate.retryAfter, "Too many leaderboard requests — please slow down");
      }
    } catch (err) {
      console.error("read rate limit check failed, allowing request", err?.message || err);
    }

    const { category, count, mode } = req.query;
    if (!category || !count || !mode) {
      return res.status(400).json({ error: "Missing category, count, or mode" });
    }
    if (!isValidLeaderboardFilters(category, count, mode)) {
      return res.status(400).json({ error: "Unrecognized category, count, or mode" });
    }
    const key = leaderboardKey(category, count, mode);
    try {
      const raw = await redis.zRangeWithScores(key, 0, LEADERBOARD_MAX_ENTRIES - 1);
      return res.status(200).json({ entries: parseZRangeResult(raw) });
    } catch (err) {
      console.error("leaderboard GET failed", err);
      return res.status(500).json({ error: "Could not load leaderboard" });
    }
  }

  if (req.method === "POST") {
    // Writes fail CLOSED: if we can't confirm this caller is within their
    // limit, we don't write. Protecting the quota matters more than
    // accepting one score, and a rejected submission is recoverable.
    try {
      const gate = await hitLimit(redis, `ratelimit:submit:${ip}`, RATE_LIMIT_SUBMIT.limit, RATE_LIMIT_SUBMIT.windowSeconds);
      if (!gate.allowed) {
        return tooManyRequests(res, gate.retryAfter, "Too many score submissions — please try again later");
      }
      if (!(await withinGlobalWriteBudget(redis, GLOBAL_DAILY_WRITE_BUDGET))) {
        console.warn("global daily write budget exhausted");
        return tooManyRequests(res, 3600, "The leaderboard is busy right now — please try again later");
      }
    } catch (err) {
      console.error("submit rate limit check failed, rejecting", err?.message || err);
      return res.status(503).json({ error: "Leaderboard is temporarily unavailable" });
    }

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
    if (!isValidLeaderboardFilters(category, count, mode)) {
      return res.status(400).json({ error: "Unrecognized category, count, or mode" });
    }
    if (!Number.isInteger(total) || !Number.isInteger(score) || score < 0 || score > total || total <= 0 || total > Number(count)) {
      return res.status(400).json({ error: "Score does not match question count" });
    }
    // Never trust the client's own qualification check — enforce it here too.
    if (!meetsAccuracyBar(score, total)) {
      return res.status(400).json({ error: "Accuracy too low to qualify for the leaderboard" });
    }
    if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) {
      return res.status(400).json({ error: "Invalid time" });
    }
    if (!isPlausibleTime(timeSeconds, total)) {
      return res.status(400).json({ error: "Time is too fast to be plausible for this question count" });
    }

    const key = leaderboardKey(category, count, mode);
    const safeName = String(name || "Anonymous").trim().slice(0, 24) || "Anonymous";
    const member = JSON.stringify({ name: safeName, date: Date.now(), score, total, timeSeconds });

    try {
      await redis.zAdd(key, { score: rankingScore(score, total, timeSeconds), value: member });
      // Keep only the fastest LEADERBOARD_MAX_ENTRIES — ranks beyond that
      // (the slower ones, since ascending order) get dropped.
      await redis.zRemRangeByRank(key, LEADERBOARD_MAX_ENTRIES, -1);
      const raw = await redis.zRangeWithScores(key, 0, LEADERBOARD_MAX_ENTRIES - 1);
      return res.status(200).json({ entries: parseZRangeResult(raw) });
    } catch (err) {
      console.error("leaderboard POST failed", err);
      return res.status(500).json({ error: "Could not save score" });
    }
  }

  // Unreachable: the method check at the top already returned for anything
  // other than GET or POST.
  return res.status(500).json({ error: "Unhandled request" });
}