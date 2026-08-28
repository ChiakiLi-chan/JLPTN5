import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import {
  formatTime,
  leaderboardKey,
  QUESTION_COUNT_OPTIONS,
  LEADERBOARD_CATEGORY_OPTIONS,
  LEADERBOARD_MODE_OPTIONS,
} from "../../shared/leaderboardRules.js";
import { loadLeaderboard } from "../lib/leaderboardApi.js";

export default function LeaderboardBrowser({ onBack }) {
  const [category, setCategory] = useState(LEADERBOARD_CATEGORY_OPTIONS[0]);
  const [count, setCount] = useState(QUESTION_COUNT_OPTIONS[0]);
  const [mode, setMode] = useState("normal");
  const [leaderboard, setLeaderboard] = useState(null);

  const key = leaderboardKey(category, count, mode);

  useEffect(() => {
    let cancelled = false;
    setLeaderboard(null);
    loadLeaderboard(category, count, mode).then((entries) => {
      if (!cancelled) setLeaderboard(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [key, category, count, mode]);

  return (
    <div className="screen setup-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Leaderboards</span>
      </div>

      <div className="setup-body setup-body-scroll lb-body">
        <div className="lb-filters">
          <div className="lb-filter-block">
            <span className="lb-filter-label">Category</span>
            <div className="option-row lb-compact-options">
              {LEADERBOARD_CATEGORY_OPTIONS.map((c) => (
                <button key={c} className={`option-btn${category === c ? " option-btn-active" : ""}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="lb-filter-row-pair">
            <div className="lb-filter-block">
              <span className="lb-filter-label">Questions</span>
              <div className="option-row segmented lb-compact-options">
                {QUESTION_COUNT_OPTIONS.map((n) => (
                  <button key={n} className={`option-btn${count === n ? " option-btn-active" : ""}`} onClick={() => setCount(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="lb-filter-block">
              <span className="lb-filter-label">Mode</span>
              <div className="option-row segmented lb-compact-options">
                {LEADERBOARD_MODE_OPTIONS.map((m) => (
                  <button key={m.key} className={`option-btn${mode === m.key ? " option-btn-active" : ""}`} onClick={() => setMode(m.key)}>
                    {m.key === "normal" ? "Normal" : m.key === "easy" ? "Easy" : "Hard"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="leaderboard-panel lb-panel-main">
          <p className="lb-panel-title">
            {category} <span className="lb-panel-title-dim">· {count}Q · {LEADERBOARD_MODE_OPTIONS.find((m) => m.key === mode).label}</span>
          </p>
          {leaderboard === null ? (
            <p className="setup-hint setup-hint-dim">Loading…</p>
          ) : leaderboard.length === 0 ? (
            <p className="setup-hint setup-hint-dim">No entries yet — play this combination to set the first time.</p>
          ) : (
            <>
              <div className="lb-podium">
                {[1, 0, 2].map((idx) => {
                  const e = leaderboard[idx];
                  const rank = idx + 1;
                  return e ? (
                    <div key={idx} className={`lb-podium-card lb-podium-rank-${rank}`}>
                      <div className="lb-podium-medal">{rank}</div>
                      <div className="lb-podium-avatar">{e.name.slice(0, 2).toUpperCase()}</div>
                      <div className="lb-podium-name">{e.name}</div>
                      <div className="lb-podium-time">{formatTime(e.timeSeconds)}</div>
                    </div>
                  ) : (
                    <div key={idx} className="lb-podium-card lb-podium-empty" />
                  );
                })}
              </div>

              <div className="leaderboard-list">
                {leaderboard.map((e, i) => (
                  <div className={`leaderboard-row${i < 3 ? ` leaderboard-row-top leaderboard-top-${i + 1}` : ""}`} key={i}>
                    <span className="leaderboard-rank">{i + 1}</span>
                    <span className="leaderboard-avatar">{e.name.slice(0, 2).toUpperCase()}</span>
                    <span className="leaderboard-name">{e.name}</span>
                    <span className="leaderboard-score">{e.score}/{e.total}</span>
                    <span className="leaderboard-time">{formatTime(e.timeSeconds)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
