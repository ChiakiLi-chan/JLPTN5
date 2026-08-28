/* ==============================================================
   VOCABULARY — sourced from JLPT_N5_Database.xlsx.

   Each grammatical category lives in its own JSON file so entries
   stay hand-editable. Vite inlines these at build time, so there is
   no runtime fetch. To refresh the set, edit the relevant JSON file
   (or regenerate all ten from the spreadsheet) — nothing else in the
   app needs to change.

   The JSON rows omit the `category` field (it is implied by the file)
   and omit fields that are null for the whole category. loadCategory
   puts both back, so every item downstream has the same shape.
   ============================================================== */

import { CATEGORY_ORDER } from "../../shared/leaderboardRules.js";

import nouns from "./nouns.json";
import verbs from "./verbs.json";
import adjectives from "./adjectives.json";
import adverbs from "./adverbs.json";
import preNounAdjectivals from "./preNounAdjectivals.json";
import particles from "./particles.json";
import katakanaWords from "./katakanaWords.json";
import hiragana from "./hiragana.json";
import katakana from "./katakana.json";
import kanji from "./kanji.json";

const SOURCES = {
  "Nouns": nouns,
  "Verb": verbs,
  "Adjectives": adjectives,
  "Adverb": adverbs,
  "Pre-Noun Adjectivals": preNounAdjectivals,
  "Particles": particles,
  "Katakana Words": katakanaWords,
  "Hiragana": hiragana,
  "Katakana": katakana,
  "Kanji": kanji,
};

/* Every item carries the same keys regardless of category, so lookups
   like item[answerField] are always safe — absent fields read as null
   rather than undefined. */
function loadCategory(category, rows) {
  return rows.map((row, i) => ({
    id: `${category}-${i}`,
    category,
    jp: row.jp,
    kana: row.kana ?? null,
    reading: row.reading ?? null,
    meaning: row.meaning ?? null,
    onyomi: row.onyomi ?? null,
    kunyomi: row.kunyomi ?? null,
  }));
}

export const ALL_ITEMS = CATEGORY_ORDER.flatMap((category) =>
  loadCategory(category, SOURCES[category] || [])
);

export const CATEGORIES = CATEGORY_ORDER
  .filter((c) => ALL_ITEMS.some((i) => i.category === c))
  .map((c) => ({ key: c, label: c, items: ALL_ITEMS.filter((i) => i.category === c) }));

/* Categories where the jp text can contain kanji with a hiragana reading
   worth showing as furigana. Kanji (tests the reading itself), Katakana
   Words, Hiragana and Katakana (already phonetic) are excluded on purpose. */
export const FURIGANA_CATEGORIES = new Set([
  "Nouns", "Verb", "Adjectives", "Adverb", "Pre-Noun Adjectivals", "Particles",
]);

/* Categories with no separate "meaning" field — pure kana drills.
   These always test kanji/kana → reading regardless of prompt/answer
   settings, since there's no meaning to switch to and the jp text
   already *is* the phonetic form. */
export const KANA_ONLY_CATEGORIES = new Set(["Hiragana", "Katakana"]);

/* Human-readable names for the raw item fields, shown on quiz cards
   and in the setup screen's summaries. */
export const FIELD_LABELS = {
  jp: "Kanji / Kana",
  kana: "Kana",
  reading: "Romaji",
  meaning: "Meaning",
  onyomi: "Onyomi",
  kunyomi: "Kunyomi",
};

export function poolFor(selectedCategories) {
  return ALL_ITEMS.filter((i) => selectedCategories.includes(i.category));
}
