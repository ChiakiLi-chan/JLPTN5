/* ==============================================================
   RATE LIMITING — protects the free-tier quota on Vercel (function
   invocations) and Upstash (commands per month) from a script that
   just hammers /api/leaderboard.

   Deliberately built on the same node-redis client the API already
   uses, so there's no second database, no extra credentials, and no
   new dependency to keep in sync.

   Two independent layers:

   1. Per-IP fixed windows. Cheap and stops the ordinary case — one
      person with a loop.
   2. A global daily write budget. The backstop for the case layer 1
      can't see: a distributed flood, or someone spoofing the address
      header. Even in the worst case, writes can't run away with the
      month's quota.

   Cost: 2 Redis commands on the first request in a window, 1 on each
   one after. A denied request costs 1 and never touches a board.
   ============================================================== */

/* Vercel terminates the connection and sets these itself, so the
   values it writes are trustworthy — but `x-forwarded-for` can also
   carry client-supplied entries ahead of the real address, and taking
   the leftmost one would let anyone mint a fresh identity per request
   just by setting a header. `x-real-ip` is set by the proxy alone, so
   prefer it, and fall back to the RIGHTMOST forwarded entry (the hop
   nearest us) rather than the leftmost. */
export function clientIp(req) {
  const realIp = req.headers?.["x-real-ip"];
  if (realIp) return String(realIp).trim();

  const fwd = req.headers?.["x-forwarded-for"];
  if (fwd) {
    const parts = String(fwd).split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || "unknown";
}

/* Fixed-window counter. INCR creates the key at 1, and only that first
   call pays for an EXPIRE — so a caller being actively rate-limited
   costs us a single command per rejected request.

   A fixed window (rather than sliding) can allow up to 2x the limit
   across a window boundary. That's fine here: the limits are already
   far above real use, and the point is stopping runaway scripts, not
   metering precisely. */
export async function hitLimit(redis, key, limit, windowSeconds) {
  const hits = await redis.incr(key);
  if (hits === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (hits <= limit) {
    return { allowed: true, remaining: limit - hits, retryAfter: 0 };
  }
  // Only ask Redis for the TTL when we're actually rejecting.
  let ttl = await redis.ttl(key);
  if (ttl < 0) {
    // Key exists without a TTL (an EXPIRE that failed, or a race).
    // Repair it rather than letting the block last forever.
    await redis.expire(key, windowSeconds);
    ttl = windowSeconds;
  }
  return { allowed: false, remaining: 0, retryAfter: ttl };
}

/* Global write budget, keyed by UTC day. Independent of any address,
   so it holds even when per-IP limits are evaded. Sized well above
   any plausible real day of studying but far below the monthly quota. */
export async function withinGlobalWriteBudget(redis, budget) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `ratelimit:global:writes:${day}`;
  const used = await redis.incr(key);
  if (used === 1) {
    await redis.expire(key, 172800); // two days, so the key always clears itself
  }
  return used <= budget;
}
