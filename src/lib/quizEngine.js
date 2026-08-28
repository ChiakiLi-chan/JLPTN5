/* ==============================================================
   QUIZ ENGINE — every pure decision the app makes about what to ask,
   what counts as an answer, and what the wrong choices should be.

   Nothing here touches React, the DOM, or the network. Each function
   is input → output, which keeps the components purely presentational
   and makes this layer testable on its own.

   Randomness is threaded through an injectable `rng` parameter that
   defaults to Math.random, so tests can pin behaviour without changing
   how any of it runs in the app.
   ============================================================== */

import { ALL_ITEMS, FURIGANA_CATEGORIES, KANA_ONLY_CATEGORIES } from "../data/vocabulary.js";

/* ------------------------------ randomness ------------------------------ */

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function coinFlip(a, b, rng) {
  return rng() < 0.5 ? a : b;
}

function pickOne(options, rng) {
  return options[Math.floor(rng() * options.length)];
}

/* ------------------------------ display ------------------------------ */

/* Furigana is only worth rendering when the toggle is on, the category is
   one where jp text can hide a reading, and the item actually has a kana
   form distinct from its jp form. Kanji is excluded because the reading is
   the thing being tested; the kana categories are already phonetic. */
export function shouldShowFurigana(item, showFurigana) {
  return Boolean(
    showFurigana &&
    FURIGANA_CATEGORIES.has(item.category) &&
    item.kana &&
    item.kana !== item.jp
  );
}

/* ------------------------------ question resolution ------------------------------ */

const PROMPT_MIXED_POOL = ["kanji", "kana", "romaji"];

/* Resolve what this question actually asks, honoring each category's own
   promptType/answerType, with pure-kana categories forced to kanji→reading
   regardless of settings. For Kanji, includeOnyomi/includeKunyomi control
   which reading kind(s) can be the answer when a reading is asked.

   perCategoryConfig: { [categoryName]: { promptType?, answerType, includeOnyomi?, includeKunyomi? } }
   Kanji entries have answerType + includeOnyomi/includeKunyomi (no promptType — always jp).
   Every other configurable category has promptType + answerType.

   Returns { item, promptField, answerField, kanjiMixedTrap? } — the two
   field names drive everything downstream. */
export function resolveQuestion(item, perCategoryConfig, rng = Math.random) {
  if (KANA_ONLY_CATEGORIES.has(item.category)) {
    const cfg = perCategoryConfig[item.category] || { promptType: "kana" };
    const effective = cfg.promptType === "mixed" ? coinFlip("kana", "romaji", rng) : cfg.promptType;
    return effective === "romaji"
      ? { item, promptField: "reading", answerField: "jp" }
      : { item, promptField: "jp", answerField: "reading" };
  }
  if (!item.meaning) {
    return { item, promptField: "jp", answerField: "reading" };
  }

  const cfg = perCategoryConfig[item.category];
  const isKanji = item.category === "Kanji";

  if (isKanji) {
    const effectiveAnswer = cfg.answerType === "mixed" ? coinFlip("romaji", "meaning", rng) : cfg.answerType;
    if (effectiveAnswer === "meaning") {
      return { item, promptField: "jp", answerField: "meaning" };
    }
    const kanjiReadingType = cfg.includeOnyomi && cfg.includeKunyomi ? "mixed" : cfg.includeOnyomi ? "onyomi" : "kunyomi";
    const wanted = kanjiReadingType === "mixed" ? coinFlip("onyomi", "kunyomi", rng) : kanjiReadingType;
    const sibling = wanted === "onyomi" ? "kunyomi" : "onyomi";
    // Not every kanji has both readings — fall back to the sibling, then to
    // the combined `reading` field, rather than asking for a null answer.
    const readingKind = item[wanted] ? wanted : item[sibling] ? sibling : "reading";
    return { item, promptField: "jp", answerField: readingKind, kanjiMixedTrap: kanjiReadingType === "mixed" };
  }

  const effectivePrompt = cfg.promptType === "mixed" ? pickOne(PROMPT_MIXED_POOL, rng) : cfg.promptType;
  if (effectivePrompt === "romaji") {
    // Romaji → romaji would be a non-question, so the answer is always meaning.
    return { item, promptField: "reading", answerField: "meaning" };
  }
  const promptField = effectivePrompt === "kana" ? "kana" : "jp";
  const effectiveAnswer = cfg.answerType === "mixed" ? coinFlip("romaji", "meaning", rng) : cfg.answerType;
  return { item, promptField, answerField: effectiveAnswer === "meaning" ? "meaning" : "reading" };
}

/* ------------------------------ distractors ------------------------------ */

// How often the sibling-reading decoy actually appears when it's allowed.
const KANJI_TRAP_CHANCE = 0.35;

/* Same-kanji trap: when the Kanji reading-type setting is "Mixed", there's a
   chance one distractor is the SAME kanji's other reading (onyomi vs
   kunyomi) rather than a different kanji entirely — the classic mix-up. */
function buildKanjiReadingChoices(item, readingKind, allowTrap, rng = Math.random) {
  const correct = item[readingKind];
  const otherKind = readingKind === "onyomi" ? "kunyomi" : "onyomi";

  let trap = null;
  if (allowTrap) {
    const siblingValue = item[otherKind];
    if (siblingValue && siblingValue !== correct && rng() < KANJI_TRAP_CHANCE) trap = siblingValue;
  }

  const sameKindPool = ALL_ITEMS.filter(
    (i) => i.category === "Kanji" && i.id !== item.id && i[readingKind] && i[readingKind] !== correct && i[readingKind] !== trap
  ).map((i) => i[readingKind]);
  let candidates = [...new Set(sameKindPool)];
  if (candidates.length < (trap ? 2 : 3)) {
    const wider = ALL_ITEMS.filter((i) => i.id !== item.id && i[readingKind] && i[readingKind] !== correct && i[readingKind] !== trap).map(
      (i) => i[readingKind]
    );
    candidates = [...new Set([...candidates, ...wider])];
  }

  const neededRandom = trap ? 2 : 3;
  const randomDistractors = shuffle(candidates, rng).slice(0, neededRandom);
  const distractors = trap ? [trap, ...randomDistractors] : randomDistractors;
  return shuffle([correct, ...distractors], rng);
}

/* Four choices for one question. Distractors come from the same category
   first so the wrong answers stay plausible, widening to the full set only
   when a small category can't supply three. */
export function buildChoices(item, answerField, kanjiMixedTrap, rng = Math.random) {
  if (answerField === "onyomi" || answerField === "kunyomi") {
    return buildKanjiReadingChoices(item, answerField, !!kanjiMixedTrap, rng);
  }
  const correct = item[answerField];
  const sameCategory = ALL_ITEMS.filter(
    (i) => i.id !== item.id && i.category === item.category && i[answerField] && i[answerField] !== correct
  ).map((i) => i[answerField]);

  let candidates = [...new Set(sameCategory)];
  if (candidates.length < 3) {
    const wider = ALL_ITEMS.filter((i) => i.id !== item.id && i[answerField] && i[answerField] !== correct).map((i) => i[answerField]);
    candidates = [...new Set([...candidates, ...wider])];
  }
  const distractors = shuffle(candidates, rng).slice(0, 3);
  return shuffle([correct, ...distractors], rng);
}

/* ------------------------------ session building ------------------------------ */

/* Build the exact ordered list of items a quiz session will ask, honoring
   the overflow choice when the selected pool is smaller than the requested
   question count. */
export function buildSessionItems(pool, count, overflowChoice, rng = Math.random) {
  if (pool.length >= count) return shuffle(pool, rng).slice(0, count);
  if (overflowChoice === "all") return shuffle(pool, rng);
  // "repeat": cycle through re-shuffled laps of the pool until count is reached
  let result = [];
  while (result.length < count) result = result.concat(shuffle(pool, rng));
  return result.slice(0, count);
}

/* One call to produce a whole session: pick the items, decide what each one
   asks, and generate its choices. */
export function buildQuestions(pool, count, overflowChoice, perCategoryConfig, rng = Math.random) {
  return buildSessionItems(pool, count, overflowChoice, rng).map((item) => {
    const resolved = resolveQuestion(item, perCategoryConfig, rng);
    return { ...resolved, choices: buildChoices(resolved.item, resolved.answerField, resolved.kanjiMixedTrap, rng) };
  });
}

/* ------------------------------ flashcards ------------------------------ */

/* Which field goes on the front of a flashcard. Only actual Kanji items
   always front with the character. Everything else follows the chosen
   prompt type — Kanji, Kana, Romaji, or Mixed (random across all three) —
   resolved once per card at build time so "Mixed" doesn't re-roll on every
   re-render. */
export function resolveFlashFront(item, promptType, rng = Math.random) {
  if (item.category === "Kanji") return "jp";
  const effective = promptType === "mixed" ? pickOne(PROMPT_MIXED_POOL, rng) : promptType;
  if (effective === "romaji") return "reading";
  if (effective === "kana") return "kana";
  return "jp";
}

export function buildFlashcards(pool, promptType, rng = Math.random) {
  return shuffle(pool, rng).map((item) => ({ item, front: resolveFlashFront(item, promptType, rng) }));
}

/* ------------------------------ quiz configuration ------------------------------ */

export const defaultWordConfig = () => ({ promptType: "kanji", answerType: "meaning" });
export const defaultKanjiConfig = () => ({ answerType: "meaning", includeOnyomi: true, includeKunyomi: true });
export const defaultKanaConfig = () => ({ promptType: "kana" });

// Seconds per question in time-attack; null means untimed.
export const TIME_LIMITS = { easy: 10, hard: 5, normal: null };

export function timeLimitFor(mode) {
  return TIME_LIMITS[mode] ?? null;
}

/* One-line description of a category's settings, shown on the setup screen
   so the choices are readable without opening each slide. */
export function summarizeConfig(cat, cfg) {
  if (cat === "Kanji") {
    if (cfg.answerType === "meaning") return "Meaning";
    const kinds = [cfg.includeOnyomi && "Onyomi", cfg.includeKunyomi && "Kunyomi"].filter(Boolean).join(" + ");
    return cfg.answerType === "mixed" ? `Meaning / ${kinds}` : kinds;
  }
  const promptLabel = cfg.promptType === "kanji" ? "Kanji/Kana" : cfg.promptType === "romaji" ? "Romaji" : "Mixed";
  const answerLabel = cfg.promptType === "romaji" ? "Meaning" : cfg.answerType === "mixed" ? "Mixed" : cfg.answerType === "romaji" ? "Romaji" : "Meaning";
  return `${promptLabel} → ${answerLabel}`;
}
