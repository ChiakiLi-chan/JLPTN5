import React, { useState, useEffect } from "react";
import { Trophy, RotateCcw, X } from "lucide-react";
import { formatTime, leaderboardKey } from "../../shared/leaderboardRules.js";
import { KANA_ONLY_CATEGORIES } from "../data/vocabulary.js";
import { loadLeaderboard, submitScore, qualifiesForLeaderboard } from "../lib/leaderboardApi.js";

function MissedItemPopup({ item, onClose }) {
  const isKanji = item.category === "Kanji";
  const isKanaOnly = KANA_ONLY_CATEGORIES.has(item.category);
  const hasKanjiForm = !isKanji && !isKanaOnly && item.kana && item.kana !== item.jp;
  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        {(isKanji || hasKanjiForm) && (
          <div className="popup-row">
            <span className="popup-label">Kanji</span>
            <span className="popup-jp">{item.jp}</span>
          </div>
        )}

        {isKanji ? (
          <>
            {item.onyomi && (
              <div className="popup-row">
                <span className="popup-label">Onyomi</span>
                <span className="popup-kana">{item.onyomi}</span>
              </div>
            )}
            {item.kunyomi && (
              <div className="popup-row">
                <span className="popup-label">Kunyomi</span>
                <span className="popup-kana">{item.kunyomi}</span>
              </div>
            )}
          </>
        ) : isKanaOnly ? (
          <>
            <div className="popup-row">
              <span className="popup-label">{item.category}</span>
              <span className="popup-jp">{item.jp}</span>
            </div>
            <div className="popup-row">
              <span className="popup-label">Romaji</span>
              <span className="popup-kana">{item.reading}</span>
            </div>
          </>
        ) : (
          <>
            <div className="popup-row">
              <span className="popup-label">Kana</span>
              <span className="popup-kana">{item.kana || item.jp}</span>
            </div>
            <div className="popup-row">
              <span className="popup-label">Romaji</span>
              <span className="popup-kana">{item.reading}</span>
            </div>
          </>
        )}

        {item.meaning && (
          <div className="popup-row">
            <span className="popup-label">Meaning</span>
            <span className="popup-meaning">{item.meaning}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizResults({ result, onRetry, onHome }) {
  const pct = Math.round((result.score / result.total) * 100);
  const verdict = pct === 100 ? "合格 — Perfect!" : pct >= 70 ? "合格 — Well done" : "もう一度 — Keep practicing";

  const key = leaderboardKey(result.categoryKey, result.count, result.mode);
  const [leaderboard, setLeaderboard] = useState(null); // null = loading
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedInfo, setSubmittedInfo] = useState(null); // { name, timeSeconds } for highlighting the new row
  const [popupItem, setPopupItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaderboard(result.categoryKey, result.count, result.mode).then((entries) => {
      if (!cancelled) setLeaderboard(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [key, result.categoryKey, result.count, result.mode]);

  const qualifies = leaderboard != null && qualifiesForLeaderboard(leaderboard, result.timeSeconds, result.score, result.total);

  const handleSubmitName = async () => {
    const trimmed = name.trim().slice(0, 24) || "Anonymous";
    setSubmitting(true);
    setSubmitError(null);
    const updated = await submitScore(result.categoryKey, result.count, result.mode, {
      name: trimmed,
      timeSeconds: result.timeSeconds,
      score: result.score,
      total: result.total,
    });
    setSubmitting(false);
    if (updated) {
      setLeaderboard(updated);
      setSubmitted(true);
      setSubmittedInfo({ name: trimmed, timeSeconds: result.timeSeconds });
    } else {
      setSubmitError("Couldn't save your score — check your connection and try again.");
    }
  };

  const modeLabel = result.mode === "easy" ? "Time Attack (Easy)" : result.mode === "hard" ? "Time Attack (Hard)" : "Normal";

  return (
    <div className="screen results-screen">
      <Trophy size={34} className="results-icon" />
      <h2>{verdict}</h2>
      <div className="results-score">
        {result.score}
        <span className="results-of">/{result.total}</span>
      </div>
      <p className="results-time">
        {formatTime(result.timeSeconds)} · {result.categoryKey} · {result.count}Q · {modeLabel}
      </p>

      {result.missed.length > 0 && (
        <div className="missed-list">
          <p className="missed-title">Review</p>
          {result.missed.map((m, i) => (
            <button className="missed-row" key={i} onClick={() => setPopupItem(m.item)}>
              <span className="missed-jp">
                {m.promptField === "jp" ? m.item.jp : m.promptField === "kana" ? m.item.kana || m.item.jp : m.item[m.promptField]}
              </span>
              <span className="missed-answer">{m.item[m.answerField]}</span>
            </button>
          ))}
        </div>
      )}

      {popupItem && <MissedItemPopup item={popupItem} onClose={() => setPopupItem(null)} />}

      <div className="leaderboard-panel">
        <p className="missed-title">Leaderboard — {result.categoryKey} · {result.count}Q · {modeLabel}</p>
        {leaderboard === null ? (
          <p className="setup-hint setup-hint-dim">Loading…</p>
        ) : (
          <>
            {qualifies && !submitted && (
              <div className="name-entry">
                <p className="setup-hint">New best time! Add your name:</p>
                <div className="name-entry-row">
                  <input
                    type="text"
                    className="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={24}
                    disabled={submitting}
                    onKeyDown={(e) => e.key === "Enter" && !submitting && handleSubmitName()}
                  />
                  <button className="btn-primary name-submit" onClick={handleSubmitName} disabled={submitting}>
                    {submitting ? "Saving…" : "Save"}
                  </button>
                </div>
                {submitError && <p className="setup-hint submit-error">{submitError}</p>}
              </div>
            )}
            {leaderboard.length === 0 && !qualifies ? (
              <p className="setup-hint setup-hint-dim">No entries yet — be the first to clear this one.</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((e, i) => (
                  <div
                    className={`leaderboard-row${
                      submitted && submittedInfo && e.name === submittedInfo.name && e.timeSeconds === submittedInfo.timeSeconds
                        ? " leaderboard-row-new"
                        : ""
                    }`}
                    key={i}
                  >
                    <span className="leaderboard-rank">{i + 1}</span>
                    <span className="leaderboard-name">{e.name}</span>
                    <span className="leaderboard-score">{e.score}/{e.total}</span>
                    <span className="leaderboard-time">{formatTime(e.timeSeconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={onRetry}>
          <RotateCcw size={16} /> Try again
        </button>
        <button className="btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}
