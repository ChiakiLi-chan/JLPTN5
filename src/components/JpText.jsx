import React from "react";
import { shouldShowFurigana } from "../lib/quizEngine.js";

/* Renders a vocabulary item's Japanese text, wrapping it in <ruby> so the
   kana reading sits above the kanji when furigana is enabled and the item
   has a reading worth showing. */

export default function JpText({ item, showFurigana }) {
  if (!shouldShowFurigana(item, showFurigana)) return <>{item.jp}</>;
  return (
    <ruby>
      {item.jp}
      <rt>{item.kana}</rt>
    </ruby>
  );
}
