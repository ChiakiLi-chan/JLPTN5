import React from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { ALL_ITEMS, CATEGORIES, FURIGANA_CATEGORIES } from "../data/vocabulary.js";

export default function Home({ selectedCategories, pool, showFurigana, setShowFurigana, onQuiz, onFlashcards, onViewLeaderboards, onEditCategories }) {
  const allSelected = selectedCategories.length === CATEGORIES.length;
  const furiganaRelevant = pool.some((i) => FURIGANA_CATEGORIES.has(i.category) && i.kana);

  const selectedLabels = CATEGORIES.filter((c) => selectedCategories.includes(c.key)).map((c) => c.label);
  const summaryText =
    selectedCategories.length === 0
      ? "None selected"
      : allSelected
      ? "All categories"
      : selectedLabels.length <= 3
      ? selectedLabels.join(", ")
      : `${selectedLabels.slice(0, 3).join(", ")} +${selectedLabels.length - 3} more`;

  return (
    <div className="screen home-screen">
      <header className="home-header">
        <div className="hanko-mark" aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" />
            <text x="50" y="62" textAnchor="middle">五級</text>
          </svg>
        </div>
        <h1>
          N5<span className="dojo-suffix">道場</span>
        </h1>
        <p className="home-tagline">JLPT N5 practice — from your word list</p>
      </header>

      <button className="category-summary" onClick={onEditCategories}>
        <div className="category-summary-text">
          <span className="category-summary-label">Categories</span>
          <span className={`category-summary-value${selectedCategories.length === 0 ? " category-summary-empty" : ""}`}>
            {summaryText}
          </span>
        </div>
        <ChevronRight size={18} />
      </button>

      <label className={`furigana-toggle${furiganaRelevant ? "" : " furigana-toggle-dim"}`}>
        <input type="checkbox" checked={showFurigana} onChange={(e) => setShowFurigana(e.target.checked)} />
        <span className="furigana-switch" aria-hidden="true" />
        <span className="furigana-label">
          Show furigana <span className="furigana-sub">(hiragana readings on kanji)</span>
        </span>
      </label>

      <section className="mode-grid">
        <button className="mode-card mode-card-alt" onClick={onFlashcards} disabled={pool.length < 1}>
          <span className="mode-jp">単語</span>
          <span className="mode-title">Flashcards</span>
          <span className="mode-desc">Flip through terms, front shown as kanji/kana or romaji.</span>
          <span className="mode-go">Set up →</span>
        </button>
        <button className="mode-card" onClick={onQuiz} disabled={pool.length < 2}>
          <span className="mode-jp">選択</span>
          <span className="mode-title">Quiz</span>
          <span className="mode-desc">Multiple choice — choose your prompt, answer, and question count.</span>
          <span className="mode-go">Set up →</span>
        </button>
      </section>

      <button className="leaderboard-link" onClick={onViewLeaderboards}>
        <Trophy size={14} /> View leaderboards
      </button>

      <footer className="home-footer">{ALL_ITEMS.length} terms total · {pool.length} in your selection</footer>
    </div>
  );
}
