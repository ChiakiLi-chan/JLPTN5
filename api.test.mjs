/* Integration test for api/leaderboard.js against a real Redis.
   Start one first:  redis-server --daemonize yes --port 6379 --save ''
   Then:             REDIS_URL=redis://127.0.0.1:6379 node api.test.mjs   */

import { createClient } from "redis";
import handler from "./api/leaderboard.js";
import {
  RATE_LIMIT_SUBMIT,
  RATE_LIMIT_READ,
  GLOBAL_DAILY_WRITE_BUDGET,
  leaderboardKey,
} from "./shared/leaderboardRules.js";
import { clientIp } from "./shared/rateLimit.js";

const admin = createClient({ url: process.env.REDIS_URL });
await admin.connect();

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${name}\n        ${e.message}`);
  }
};

// Minimal stand-ins for Vercel's req/res objects.
function call(method, { query = {}, body = {}, ip = "10.0.0.1" } = {}) {
  const req = { method, query, body, headers: { "x-real-ip": ip }, socket: {} };
  let statusCode = 200;
  const headers = {};
  return new Promise((resolve) => {
    const res = {
      setHeader: (k, v) => (headers[k] = v),
      status(code) {
        statusCode = code;
        return this;
      },
      json: (payload) => resolve({ status: statusCode, headers, body: payload }),
    };
    handler(req, res);
  });
}

const validScore = { category: "Nouns", count: 10, mode: "normal", name: "tester", timeSeconds: 30, score: 9, total: 10 };
const wipe = async () => {
  for (const pattern of ["ratelimit:*", "leaderboard:*"]) {
    const keys = await admin.keys(pattern);
    if (keys.length) await admin.del(keys);
  }
};

console.log("\n-- ip resolution --");
check("prefers x-real-ip", () => {
  const ip = clientIp({ headers: { "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" } });
  if (ip !== "1.2.3.4") throw new Error(`got ${ip}`);
});
check("spoofed leftmost x-forwarded-for entry is ignored", () => {
  // An attacker sets x-forwarded-for; the proxy appends the real address.
  const ip = clientIp({ headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.7" } });
  if (ip !== "203.0.113.7") throw new Error(`took the spoofable value: ${ip}`);
});

console.log("\n-- normal operation still works --");
await wipe();
{
  const post = await call("POST", { body: validScore });
  check("a valid score is accepted", () => {
    if (post.status !== 200) throw new Error(`status ${post.status}: ${JSON.stringify(post.body)}`);
    if (!post.body.entries?.length) throw new Error("no entries returned");
    if (post.body.entries[0].name !== "tester") throw new Error("entry not stored");
  });

  const get = await call("GET", { query: { category: "Nouns", count: "10", mode: "normal" } });
  check("the board reads back", () => {
    if (get.status !== 200) throw new Error(`status ${get.status}`);
    if (get.body.entries[0].timeSeconds !== 30) throw new Error(`time came back as ${get.body.entries[0].timeSeconds}`);
  });

  const bad = await call("POST", { body: { ...validScore, score: 2, total: 10 } });
  check("low accuracy is still rejected", () => {
    if (bad.status !== 400) throw new Error(`status ${bad.status}`);
  });

  const fast = await call("POST", { body: { ...validScore, timeSeconds: 1 } });
  check("implausible time is still rejected", () => {
    if (fast.status !== 400) throw new Error(`status ${fast.status}`);
  });

  const junk = await call("GET", { query: { category: "Nonsense", count: "10", mode: "normal" } });
  check("unknown category is still rejected", () => {
    if (junk.status !== 400) throw new Error(`status ${junk.status}`);
  });
}

console.log("\n-- submission rate limit --");
await wipe();
{
  const ip = "198.51.100.5";
  let accepted = 0;
  let limited = 0;
  let firstLimitedAt = null;
  for (let i = 0; i < RATE_LIMIT_SUBMIT.limit + 15; i++) {
    const r = await call("POST", { body: { ...validScore, name: `flood${i}` }, ip });
    if (r.status === 200) accepted++;
    else if (r.status === 429) {
      limited++;
      if (firstLimitedAt === null) firstLimitedAt = i;
    }
  }
  check(`exactly ${RATE_LIMIT_SUBMIT.limit} submissions get through, the rest are blocked`, () => {
    if (accepted !== RATE_LIMIT_SUBMIT.limit) throw new Error(`accepted ${accepted}`);
    if (limited !== 15) throw new Error(`blocked ${limited}, expected 15`);
    if (firstLimitedAt !== RATE_LIMIT_SUBMIT.limit) throw new Error(`blocking started at ${firstLimitedAt}`);
  });

  const blocked = await call("POST", { body: validScore, ip });
  check("a blocked request returns 429 with Retry-After", () => {
    if (blocked.status !== 429) throw new Error(`status ${blocked.status}`);
    const ra = Number(blocked.headers["Retry-After"]);
    if (!(ra > 0 && ra <= RATE_LIMIT_SUBMIT.windowSeconds)) throw new Error(`Retry-After was ${ra}`);
  });

  const entries = await admin.zRangeWithScores(leaderboardKey("Nouns", 10, "normal"), 0, -1);
  check("board still holds at most 10 entries", () => {
    if (entries.length > 10) throw new Error(`board has ${entries.length} entries`);
  });

  const other = await call("POST", { body: validScore, ip: "198.51.100.99" });
  check("a different address is unaffected", () => {
    if (other.status !== 200) throw new Error(`status ${other.status}`);
  });
}

console.log("\n-- read rate limit --");
await wipe();
{
  const ip = "203.0.113.44";
  const query = { category: "Nouns", count: "10", mode: "normal" };
  let ok = 0;
  for (let i = 0; i < RATE_LIMIT_READ.limit; i++) {
    const r = await call("GET", { query, ip });
    if (r.status === 200) ok++;
  }
  const over = await call("GET", { query, ip });
  check(`${RATE_LIMIT_READ.limit} reads allowed, the next is blocked`, () => {
    if (ok !== RATE_LIMIT_READ.limit) throw new Error(`only ${ok} succeeded`);
    if (over.status !== 429) throw new Error(`status ${over.status}`);
  });
}

console.log("\n-- global write budget --");
await wipe();
{
  // Pre-load the day's counter to just under the cap rather than sending
  // thousands of real requests.
  const day = new Date().toISOString().slice(0, 10);
  await admin.set(`ratelimit:global:writes:${day}`, String(GLOBAL_DAILY_WRITE_BUDGET - 1));

  const last = await call("POST", { body: validScore, ip: "192.0.2.1" });
  const overBudget = await call("POST", { body: validScore, ip: "192.0.2.2" });
  check("the budget stops writes even from fresh addresses", () => {
    if (last.status !== 200) throw new Error(`final in-budget write got ${last.status}`);
    if (overBudget.status !== 429) throw new Error(`over-budget write got ${overBudget.status}`);
  });

  const stillReads = await call("GET", { query: { category: "Nouns", count: "10", mode: "normal" }, ip: "192.0.2.3" });
  check("reads keep working when the write budget is spent", () => {
    if (stillReads.status !== 200) throw new Error(`status ${stillReads.status}`);
  });
}

console.log("\n-- command cost --");
await wipe();
{
  const ip = "203.0.113.90";
  await call("POST", { body: validScore, ip });
  const key = `ratelimit:submit:${ip}`;
  const ttl = await admin.ttl(key);
  check("the limiter key carries a TTL so it self-clears", () => {
    if (!(ttl > 0 && ttl <= RATE_LIMIT_SUBMIT.windowSeconds)) throw new Error(`ttl was ${ttl}`);
  });
  const count = Number(await admin.get(key));
  check("one submission counts once", () => {
    if (count !== 1) throw new Error(`counter was ${count}`);
  });
}

console.log("\n-- method handling --");
{
  const del = await call("DELETE");
  check("unsupported methods return 405", () => {
    if (del.status !== 405) throw new Error(`status ${del.status}`);
    if (!del.headers["Allow"]) throw new Error("missing Allow header");
  });
}

await wipe();
await admin.quit();
console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
