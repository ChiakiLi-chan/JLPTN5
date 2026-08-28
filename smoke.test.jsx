/* Smoke test: renders every screen and exercises the engine across all
   categories and settings. Catches missing imports and undefined
   identifiers that a bundle-only check would let through.
   Run with: node smoke.mjs (see the esbuild step in the refactor notes). */

import React from "react";
import { renderToString } from "react-dom/server";

import { ALL_ITEMS, CATEGORIES, FIELD_LABELS, poolFor } from "./src/data/vocabulary.js";
import {
  buildQuestions,
  buildFlashcards,
  resolveQuestion,
  buildChoices,
  buildSessionItems,
  shouldShowFurigana,
  summarizeConfig,
  timeLimitFor,
  defaultWordConfig,
  defaultKanjiConfig,
  defaultKanaConfig,
} from "./src/lib/quizEngine.js";
import { qualifiesForLeaderboard } from "./src/lib/leaderboardApi.js";
import { CATEGORY_ORDER } from "./shared/leaderboardRules.js";

import Home from "./src/components/Home.jsx";
import CategoryPicker from "./src/components/CategoryPicker.jsx";
import QuizSetup from "./src/components/QuizSetup.jsx";
import Quiz from "./src/components/Quiz.jsx";
import QuizResults from "./src/components/QuizResults.jsx";
import { FlashcardsSetup, Flashcards } from "./src/components/Flashcards.jsx";
import LeaderboardBrowser from "./src/components/LeaderboardBrowser.jsx";
import JpText from "./src/components/JpText.jsx";

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

console.log("\n-- data --");
check("608 items loaded", () => {
  if (ALL_ITEMS.length !== 608) throw new Error(`got ${ALL_ITEMS.length}`);
});
check("all 10 categories present", () => {
  if (CATEGORIES.length !== 10) throw new Error(`got ${CATEGORIES.length}`);
  const order = CATEGORIES.map((c) => c.key).join(",");
  if (order !== CATEGORY_ORDER.join(",")) throw new Error(`order drifted: ${order}`);
});
check("every item has all fields and a unique id", () => {
  const ids = new Set();
  for (const i of ALL_ITEMS) {
    for (const f of ["id", "category", "jp", "kana", "reading", "meaning", "onyomi", "kunyomi"]) {
      if (!(f in i)) throw new Error(`${i.jp} missing ${f}`);
    }
    if (ids.has(i.id)) throw new Error(`duplicate id ${i.id}`);
    ids.add(i.id);
  }
});
check("kanji entries carry readings", () => {
  const kanji = ALL_ITEMS.filter((i) => i.category === "Kanji");
  if (kanji.length !== 103) throw new Error(`got ${kanji.length}`);
  if (!kanji.every((k) => k.onyomi || k.kunyomi)) throw new Error("a kanji has neither reading");
});

console.log("\n-- engine: question resolution --");
const configFor = (cat) =>
  cat === "Kanji" ? defaultKanjiConfig() : ["Hiragana", "Katakana"].includes(cat) ? defaultKanaConfig() : defaultWordConfig();

check("resolveQuestion yields a non-null answer for every item, every setting", () => {
  const promptTypes = ["kanji", "kana", "romaji", "mixed"];
  const answerTypes = ["romaji", "meaning", "mixed"];
  for (const item of ALL_ITEMS) {
    for (const promptType of promptTypes) {
      for (const answerType of answerTypes) {
        for (const [on, kun] of [[true, true], [true, false], [false, true]]) {
          const cfg = { [item.category]: { promptType, answerType, includeOnyomi: on, includeKunyomi: kun } };
          for (let n = 0; n < 6; n++) {
            const r = resolveQuestion(item, cfg);
            if (r.item[r.answerField] == null) {
              throw new Error(`${item.category} ${item.jp}: null answer on field ${r.answerField}`);
            }
            if (!FIELD_LABELS[r.promptField]) throw new Error(`unlabelled prompt field ${r.promptField}`);
          }
        }
      }
    }
  }
});

check("buildChoices always returns 4 unique choices including the answer", () => {
  for (const item of ALL_ITEMS) {
    const cfg = { [item.category]: configFor(item.category) };
    const r = resolveQuestion(item, cfg);
    const choices = buildChoices(r.item, r.answerField, r.kanjiMixedTrap);
    if (choices.length !== 4) throw new Error(`${item.jp}: ${choices.length} choices`);
    if (new Set(choices).size !== 4) throw new Error(`${item.jp}: duplicate choices`);
    if (!choices.includes(r.item[r.answerField])) throw new Error(`${item.jp}: answer missing from choices`);
  }
});

check("kanji sibling-reading trap still fires under mixed settings", () => {
  const cfg = { Kanji: { answerType: "romaji", includeOnyomi: true, includeKunyomi: true } };
  const withBoth = ALL_ITEMS.filter((i) => i.category === "Kanji" && i.onyomi && i.kunyomi);
  let trapped = 0;
  for (let n = 0; n < 400; n++) {
    const item = withBoth[n % withBoth.length];
    const r = resolveQuestion(item, cfg);
    if (!r.kanjiMixedTrap) continue;
    const choices = buildChoices(r.item, r.answerField, r.kanjiMixedTrap);
    const sibling = r.answerField === "onyomi" ? item.kunyomi : item.onyomi;
    if (choices.includes(sibling) && sibling !== item[r.answerField]) trapped++;
  }
  if (trapped === 0) throw new Error("trap never fired across 400 kanji questions");
});

console.log("\n-- engine: sessions --");
check("session honours count when the pool is large enough", () => {
  const items = buildSessionItems(ALL_ITEMS, 20, null);
  if (items.length !== 20) throw new Error(`got ${items.length}`);
  if (new Set(items.map((i) => i.id)).size !== 20) throw new Error("repeats in a large pool");
});
check("overflow 'repeat' pads to count, 'all' caps at pool size", () => {
  const small = ALL_ITEMS.filter((i) => i.category === "Pre-Noun Adjectivals");
  if (buildSessionItems(small, 50, "repeat").length !== 50) throw new Error("repeat did not pad");
  if (buildSessionItems(small, 50, "all").length !== small.length) throw new Error("all did not cap");
});
check("buildQuestions produces complete questions for a mixed pool", () => {
  const cfg = {};
  CATEGORY_ORDER.forEach((c) => (cfg[c] = configFor(c)));
  const qs = buildQuestions(ALL_ITEMS, 100, null, cfg);
  if (qs.length !== 100) throw new Error(`got ${qs.length}`);
  for (const q of qs) {
    if (!q.choices || q.choices.length !== 4) throw new Error("bad choices");
    if (!q.choices.includes(q.item[q.answerField])) throw new Error("answer not among choices");
  }
});
check("flashcards front-field is always populated", () => {
  for (const promptType of ["kanji", "kana", "romaji", "mixed"]) {
    for (const card of buildFlashcards(ALL_ITEMS, promptType)) {
      if (card.item.category === "Kanji" && card.front !== "jp") throw new Error("kanji not fronted with character");
      // 130 items (already-phonetic words like アパート, だけ) have no separate
      // kana form. Both render paths fall back to jp, so the front is never blank.
      const shown = card.front === "reading" ? card.item.reading : card.item.kana || card.item.jp;
      if (!shown) throw new Error(`${card.item.jp}: blank front for ${card.front}`);
    }
  }
});

console.log("\n-- engine: display + config --");
check("shouldShowFurigana matches the original predicate", () => {
  for (const item of ALL_ITEMS) {
    const expected = Boolean(
      true &&
      ["Nouns", "Verb", "Adjectives", "Adverb", "Pre-Noun Adjectivals", "Particles"].includes(item.category) &&
      item.kana &&
      item.kana !== item.jp
    );
    if (shouldShowFurigana(item, true) !== expected) throw new Error(`${item.jp} mismatch`);
    if (shouldShowFurigana(item, false) !== false) throw new Error("toggle ignored");
  }
});
check("summarizeConfig returns a string for every config shape", () => {
  const out = [
    summarizeConfig("Nouns", { promptType: "kanji", answerType: "meaning" }),
    summarizeConfig("Nouns", { promptType: "romaji", answerType: "romaji" }),
    summarizeConfig("Kanji", { answerType: "meaning", includeOnyomi: true, includeKunyomi: true }),
    summarizeConfig("Kanji", { answerType: "mixed", includeOnyomi: true, includeKunyomi: false }),
  ];
  if (out.some((s) => typeof s !== "string" || !s.length)) throw new Error("empty summary");
});
check("timeLimitFor matches the original mode table", () => {
  if (timeLimitFor("easy") !== 10 || timeLimitFor("hard") !== 5 || timeLimitFor("normal") !== null) {
    throw new Error("time limits drifted");
  }
});
check("qualifiesForLeaderboard enforces the accuracy bar", () => {
  if (qualifiesForLeaderboard([], 30, 4, 10)) throw new Error("40% accuracy accepted");
  if (!qualifiesForLeaderboard([], 30, 5, 10)) throw new Error("50% accuracy rejected");
});

console.log("\n-- components --");
const pool = poolFor(CATEGORY_ORDER);
const noop = () => {};
const cfgAll = {};
CATEGORY_ORDER.forEach((c) => (cfgAll[c] = configFor(c)));

const screens = {
  Home: <Home selectedCategories={CATEGORY_ORDER} pool={pool} showFurigana setShowFurigana={noop} onQuiz={noop} onFlashcards={noop} onViewLeaderboards={noop} onEditCategories={noop} />,
  CategoryPicker: <CategoryPicker selectedCategories={CATEGORY_ORDER} setSelectedCategories={noop} onBack={noop} />,
  QuizSetup: <QuizSetup pool={pool} onBack={noop} onStart={noop} />,
  Quiz: <Quiz config={{ pool, count: 10, overflowChoice: null, perCategoryConfig: cfgAll, mode: "normal", timeLimitSeconds: null }} showFurigana onExit={noop} onFinish={noop} />,
  QuizTimeAttack: <Quiz config={{ pool, count: 10, overflowChoice: null, perCategoryConfig: cfgAll, mode: "hard", timeLimitSeconds: 5 }} showFurigana onExit={noop} onFinish={noop} />,
  QuizResults: <QuizResults result={{ score: 8, total: 10, missed: [], timeSeconds: 42, mode: "normal", categoryKey: "Mixed", count: 10 }} onRetry={noop} onHome={noop} />,
  FlashcardsSetup: <FlashcardsSetup pool={pool} onBack={noop} onStart={noop} />,
  Flashcards: <Flashcards config={{ cards: buildFlashcards(pool, "mixed") }} showFurigana onExit={noop} />,
  LeaderboardBrowser: <LeaderboardBrowser onBack={noop} />,
  JpText: <JpText item={ALL_ITEMS.find((i) => i.category === "Nouns" && i.kana)} showFurigana />,
};

for (const [name, el] of Object.entries(screens)) {
  check(`${name} renders`, () => {
    const html = renderToString(el);
    if (!html || html.length < 10) throw new Error("rendered empty");
  });
}

check("QuizResults renders with missed items", () => {
  const cfg = { Kanji: defaultKanjiConfig() };
  const kanji = ALL_ITEMS.filter((i) => i.category === "Kanji").slice(0, 3);
  const missed = kanji.map((item) => resolveQuestion(item, cfg));
  const html = renderToString(
    <QuizResults result={{ score: 7, total: 10, missed, timeSeconds: 55, mode: "hard", categoryKey: "Kanji", count: 10 }} onRetry={noop} onHome={noop} />
  );
  if (!html.includes("</")) throw new Error("rendered empty");
});

check("JpText emits ruby markup only when appropriate", () => {
  const withKana = ALL_ITEMS.find((i) => i.category === "Nouns" && i.kana && i.kana !== i.jp);
  const kanaOnly = ALL_ITEMS.find((i) => i.category === "Hiragana");
  if (!renderToString(<JpText item={withKana} showFurigana />).includes("<ruby")) throw new Error("missing ruby");
  if (renderToString(<JpText item={withKana} showFurigana={false} />).includes("<ruby")) throw new Error("ruby despite toggle off");
  if (renderToString(<JpText item={kanaOnly} showFurigana />).includes("<ruby")) throw new Error("ruby on kana item");
});

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
