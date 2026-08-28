import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORY_ORDER, QUESTION_COUNT_OPTIONS } from "../../shared/leaderboardRules.js";
import { KANA_ONLY_CATEGORIES } from "../data/vocabulary.js";
import {
  defaultWordConfig,
  defaultKanjiConfig,
  defaultKanaConfig,
  summarizeConfig,
  timeLimitFor,
} from "../lib/quizEngine.js";

function ConfigCarousel({ slides, renderSlide }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const scrollTimeout = useRef(null);

  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      setIndex(Math.max(0, Math.min(slides.length - 1, i)));
    }, 60);
  };

  useEffect(() => () => clearTimeout(scrollTimeout.current), []);

  if (slides.length === 0) return null;

  return (
    <div className="carousel-wrap">
      {slides.length > 1 && (
        <div className="carousel-nav">
          <button className="carousel-arrow" onClick={() => scrollToIndex(index - 1)} disabled={index === 0} aria-label="Previous category">
            <ChevronLeft size={16} />
          </button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.key}
                className={`carousel-dot${i === index ? " carousel-dot-active" : ""}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to ${s.key} settings`}
              />
            ))}
          </div>
          <button
            className="carousel-arrow"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next category"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
        {slides.map((s) => (
          <div className="carousel-slide" key={s.key}>
            {renderSlide(s)}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <p className="carousel-hint">
          {index + 1} of {slides.length} — swipe or use the arrows
        </p>
      )}
    </div>
  );
}

function PromptAnswerFields({ cfg, isKanji, isKanaOnly, onChange }) {
  if (isKanaOnly) {
    return (
      <>
        <span className="setup-sublabel">Prompt type</span>
        <div className="option-row segmented">
          <button className={`option-btn${cfg.promptType === "kana" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "kana" })}>
            Kana
          </button>
          <button className={`option-btn${cfg.promptType === "romaji" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "romaji" })}>
            Romaji
          </button>
          <button className={`option-btn${cfg.promptType === "mixed" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "mixed" })}>
            Mixed
          </button>
        </div>
        <p className="setup-hint setup-hint-dim">
          {cfg.promptType === "romaji"
            ? "You'll see the romaji and pick the matching kana."
            : cfg.promptType === "mixed"
            ? "Randomly asks either direction each question."
            : "You'll see the kana and pick the matching romaji."}
        </p>
      </>
    );
  }

  return (
    <>
      {!isKanji && (
        <>
          <span className="setup-sublabel">Prompt type</span>
          <div className="option-row segmented">
            <button className={`option-btn${cfg.promptType === "kanji" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "kanji" })}>
              Kanji
            </button>
            <button className={`option-btn${cfg.promptType === "kana" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "kana" })}>
              Kana
            </button>
            <button className={`option-btn${cfg.promptType === "romaji" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "romaji" })}>
              Romaji
            </button>
            <button className={`option-btn${cfg.promptType === "mixed" ? " option-btn-active" : ""}`} onClick={() => onChange({ promptType: "mixed" })}>
              Mixed
            </button>
          </div>
        </>
      )}

      {(isKanji || cfg.promptType !== "romaji") && (
        <>
          <span className="setup-sublabel">Answer type</span>
          <div className="option-row segmented">
            <button className={`option-btn${cfg.answerType === "romaji" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "romaji" })}>
              Romaji
            </button>
            <button className={`option-btn${cfg.answerType === "meaning" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "meaning" })}>
              Meaning
            </button>
            <button className={`option-btn${cfg.answerType === "mixed" ? " option-btn-active" : ""}`} onClick={() => onChange({ answerType: "mixed" })}>
              Mixed
            </button>
          </div>
        </>
      )}
      {!isKanji && cfg.promptType === "romaji" && <p className="setup-hint">Answer is always Meaning when the prompt is Romaji.</p>}

      {isKanji && cfg.answerType !== "meaning" && (
        <>
          <span className="setup-sublabel">Which readings</span>
          <div className="option-row">
            <button
              className={`option-btn option-btn-check${cfg.includeOnyomi ? " option-btn-active" : ""}`}
              onClick={() => onChange({ includeOnyomi: cfg.includeOnyomi && !cfg.includeKunyomi ? cfg.includeOnyomi : !cfg.includeOnyomi })}
            >
              {cfg.includeOnyomi ? <Check size={13} /> : null} Onyomi
            </button>
            <button
              className={`option-btn option-btn-check${cfg.includeKunyomi ? " option-btn-active" : ""}`}
              onClick={() => onChange({ includeKunyomi: cfg.includeKunyomi && !cfg.includeOnyomi ? cfg.includeKunyomi : !cfg.includeKunyomi })}
            >
              {cfg.includeKunyomi ? <Check size={13} /> : null} Kunyomi
            </button>
          </div>
          <p className="setup-hint setup-hint-dim">
            {cfg.includeOnyomi && cfg.includeKunyomi
              ? "Randomly asks either type per question, with an occasional decoy from the kanji's other reading."
              : `Only ${cfg.includeOnyomi ? "onyomi" : "kunyomi"} questions, no decoys.`}
          </p>
        </>
      )}
    </>
  );
}

export default function QuizSetup({ pool, onBack, onStart }) {
  const [count, setCount] = useState(10);
  const [overflowChoice, setOverflowChoice] = useState(null);
  const [timeAttackOn, setTimeAttackOn] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");
  const mode = timeAttackOn ? difficulty : "normal";
  const timeLimitSeconds = timeLimitFor(mode);


  const nonKanjiCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => c !== "Kanji" && !KANA_ONLY_CATEGORIES.has(c) && pool.some((i) => i.category === c)),
    [pool]
  );
  const kanaOnlyPresent = useMemo(
    () => CATEGORY_ORDER.filter((c) => KANA_ONLY_CATEGORIES.has(c) && pool.some((i) => i.category === c)),
    [pool]
  );
  const kanjiPresent = pool.some((i) => i.category === "Kanji");

  // "Same for all" is the default: one shared config applied to every non-Kanji
  // category. Flip the switch to swipe through each one individually.
  const [customizePerCategory, setCustomizePerCategory] = useState(false);
  const [sharedConfig, setSharedConfig] = useState(defaultWordConfig);
  const [perCategoryConfig, setPerCategoryConfig] = useState(() => {
    const map = {};
    nonKanjiCategories.forEach((c) => {
      map[c] = defaultWordConfig();
    });
    return map;
  });
  const [kanjiConfig, setKanjiConfig] = useState(defaultKanjiConfig);
  const [kanaConfig, setKanaConfig] = useState(defaultKanaConfig);

  const needsOverflowChoice = pool.length < count;

  useEffect(() => {
    setOverflowChoice(null);
  }, [count]);

  const canStart = pool.length >= 2 && (!needsOverflowChoice || overflowChoice);

  const handleStart = () => {
    if (!canStart) return;
    const finalConfig = {};
    nonKanjiCategories.forEach((cat) => {
      finalConfig[cat] = customizePerCategory ? perCategoryConfig[cat] || defaultWordConfig() : sharedConfig;
    });
    if (kanjiPresent) finalConfig["Kanji"] = kanjiConfig;
    kanaOnlyPresent.forEach((cat) => {
      finalConfig[cat] = kanaConfig;
    });
    onStart({ pool, count, overflowChoice, perCategoryConfig: finalConfig, mode, timeLimitSeconds });
  };

  // Slides for the swipeable carousel: each non-Kanji category (only when
  // "Customize each" is on) plus Kanji (always its own slide, if present).
  const slides = [];
  if (customizePerCategory) {
    nonKanjiCategories.forEach((cat) => slides.push({ key: cat, isKanji: false }));
  }
  if (kanjiPresent) slides.push({ key: "Kanji", isKanji: true });

  const renderSlide = (s) => {
    const isKanji = s.isKanji;
    const cfg = isKanji ? kanjiConfig : perCategoryConfig[s.key] || defaultWordConfig();
    const onChange = isKanji
      ? (patch) => setKanjiConfig((prev) => ({ ...prev, ...patch }))
      : (patch) => setPerCategoryConfig((prev) => ({ ...prev, [s.key]: { ...prev[s.key], ...patch } }));
    const itemCount = pool.filter((i) => i.category === s.key).length;
    return (
      <div className="category-config">
        <span className="category-config-label">
          {s.key} <span className="setup-hint-dim">({itemCount})</span>
        </span>
        <PromptAnswerFields cfg={cfg} isKanji={isKanji} onChange={onChange} />
      </div>
    );
  };

  return (
    <div className="screen setup-screen setup-screen-cta">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Quiz setup</span>
        <span className="score-pill">{pool.length}</span>
      </div>

      <div className="setup-body setup-body-scroll">
        <div className="setup-group">
          <span className="setup-label">Number of questions</span>
          <div className="option-row segmented">
            {QUESTION_COUNT_OPTIONS.map((n) => (
              <button key={n} className={`option-btn${count === n ? " option-btn-active" : ""}`} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
          {needsOverflowChoice && (
            <div className="overflow-note">
              <span>Only {pool.length} terms in your selection — fewer than {count}.</span>
              <div className="option-row">
                <button
                  className={`option-btn${overflowChoice === "all" ? " option-btn-active" : ""}`}
                  onClick={() => setOverflowChoice("all")}
                >
                  Use all {pool.length}
                </button>
                <button
                  className={`option-btn${overflowChoice === "repeat" ? " option-btn-active" : ""}`}
                  onClick={() => setOverflowChoice("repeat")}
                >
                  Repeat terms to reach {count}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="setup-group">
          <span className="setup-label">Mode</span>
          <div className="option-row segmented">
            <button className={`option-btn${!timeAttackOn ? " option-btn-active" : ""}`} onClick={() => setTimeAttackOn(false)}>
              Normal
            </button>
            <button className={`option-btn${timeAttackOn ? " option-btn-active" : ""}`} onClick={() => setTimeAttackOn(true)}>
              Time Attack
            </button>
          </div>
          {timeAttackOn && (
            <>
              <span className="setup-sublabel">Difficulty</span>
              <div className="option-row segmented">
                <button className={`option-btn${difficulty === "easy" ? " option-btn-active" : ""}`} onClick={() => setDifficulty("easy")}>
                  Easy — 10s
                </button>
                <button className={`option-btn${difficulty === "hard" ? " option-btn-active" : ""}`} onClick={() => setDifficulty("hard")}>
                  Hard — 5s
                </button>
              </div>
              <p className="setup-hint setup-hint-dim">
                {timeLimitSeconds} seconds per question — running out counts as a miss and moves on automatically.
              </p>
            </>
          )}
        </div>

        {kanaOnlyPresent.length > 0 && (
          <div className="setup-group category-config">
            <span className="category-config-label">{kanaOnlyPresent.join(", ")}</span>
            <PromptAnswerFields cfg={kanaConfig} isKanaOnly onChange={(patch) => setKanaConfig((prev) => ({ ...prev, ...patch }))} />
          </div>
        )}

        {nonKanjiCategories.length >= 2 && (
          <div className="setup-group">
            <span className="setup-label">Word type prompts &amp; answers</span>
            <div className="option-row segmented">
              <button className={`option-btn${!customizePerCategory ? " option-btn-active" : ""}`} onClick={() => setCustomizePerCategory(false)}>
                Same for all
              </button>
              <button className={`option-btn${customizePerCategory ? " option-btn-active" : ""}`} onClick={() => setCustomizePerCategory(true)}>
                Customize each
              </button>
            </div>
          </div>
        )}

        {nonKanjiCategories.length >= 2 && !customizePerCategory && (
          <div className="setup-group category-config">
            <span className="category-config-label">{nonKanjiCategories.join(", ")}</span>
            <PromptAnswerFields cfg={sharedConfig} isKanji={false} onChange={(patch) => setSharedConfig((prev) => ({ ...prev, ...patch }))} />
          </div>
        )}

        {nonKanjiCategories.length === 1 && !customizePerCategory && (
          <div className="setup-group category-config">
            <span className="category-config-label">{nonKanjiCategories[0]}</span>
            <PromptAnswerFields cfg={sharedConfig} isKanji={false} onChange={(patch) => setSharedConfig((prev) => ({ ...prev, ...patch }))} />
          </div>
        )}

        <ConfigCarousel slides={slides} renderSlide={renderSlide} />
      </div>

      <button className="btn-primary setup-start" onClick={handleStart} disabled={!canStart}>
        Start quiz →
      </button>
    </div>
  );
}
