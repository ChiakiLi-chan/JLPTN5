import React, { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import JpText from "./JpText.jsx";
import { buildFlashcards } from "../lib/quizEngine.js";

export function FlashcardsSetup({ pool, onBack, onStart }) {
  const [promptType, setPromptType] = useState("kanji");
  const canStart = pool.length >= 1;

  return (
    <div className="screen setup-screen setup-screen-cta">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Flashcards</span>
        <div className="score-pill">{pool.length}</div>
      </div>

      <div className="setup-body">
        <div className="setup-group">
          <span className="setup-label">Card front</span>
          <div className="option-row segmented">
            <button className={`option-btn${promptType === "kanji" ? " option-btn-active" : ""}`} onClick={() => setPromptType("kanji")}>
              Kanji
            </button>
            <button className={`option-btn${promptType === "kana" ? " option-btn-active" : ""}`} onClick={() => setPromptType("kana")}>
              Kana
            </button>
            <button className={`option-btn${promptType === "romaji" ? " option-btn-active" : ""}`} onClick={() => setPromptType("romaji")}>
              Romaji
            </button>
            <button className={`option-btn${promptType === "mixed" ? " option-btn-active" : ""}`} onClick={() => setPromptType("mixed")}>
              Mixed
            </button>
          </div>
          <p className="setup-hint setup-hint-dim">Tap a card to flip it and reveal the reading and meaning. Kanji entries always front with the character.</p>
        </div>
      </div>

      <button className="btn-primary setup-start" disabled={!canStart} onClick={() => onStart({ cards: buildFlashcards(pool, promptType) })}>
        Start flashcards →
      </button>
    </div>
  );
}

function FlashcardBack({ item }) {
  const isKanji = item.category === "Kanji";
  return (
    <div className="flash-back">
      <div className="flash-back-jp">{item.jp}</div>
      {item.reading && <div className="flash-back-reading">{item.reading}</div>}
      {isKanji && (item.onyomi || item.kunyomi) && (
        <div className="flash-back-yomi">
          {item.onyomi && <span><b>On</b> {item.onyomi}</span>}
          {item.kunyomi && <span><b>Kun</b> {item.kunyomi}</span>}
        </div>
      )}
      {item.meaning && <div className="flash-back-meaning">{item.meaning}</div>}
    </div>
  );
}

export function Flashcards({ config, showFurigana, onExit }) {
  const { cards } = config;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];
  const goTo = (next) => {
    setFlipped(false);
    setIndex(next);
  };

  return (
    <div className="screen flash-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <div className="flash-progress">
          <div className="flash-progress-bar" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
        </div>
        <div className="score-pill">{index + 1}/{cards.length}</div>
      </div>

      <button key={index} className={`flash-card${flipped ? " is-flipped" : ""}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? "Show front" : "Reveal answer"}>
        <div className="flash-card-inner">
          <div className="flash-face flash-front">
            {card.front === "jp" ? (
              <span className="jp-display flash-jp"><JpText item={card.item} showFurigana={showFurigana} /></span>
            ) : card.front === "kana" ? (
              <span className="flash-romaji">{card.item.kana || card.item.jp}</span>
            ) : (
              <span className="flash-romaji">{card.item.reading}</span>
            )}
          </div>
          <div className="flash-face flash-back-face">
            <FlashcardBack item={card.item} />
          </div>
        </div>
      </button>
      <p className="flash-hint">Tap the card to flip</p>

      <div className="flash-nav">
        <button className="btn-ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
          <ChevronLeft size={16} /> Prev
        </button>
        {index < cards.length - 1 ? (
          <button className="btn-primary" onClick={() => goTo(index + 1)}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-primary" onClick={onExit}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
