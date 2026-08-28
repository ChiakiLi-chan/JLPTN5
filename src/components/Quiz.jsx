import React, { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import JpText from "./JpText.jsx";
import { FIELD_LABELS } from "../data/vocabulary.js";
import { buildQuestions } from "../lib/quizEngine.js";

export default function Quiz({ config, showFurigana, onExit, onFinish }) {
  const { pool, count, overflowChoice, perCategoryConfig, mode, timeLimitSeconds } = config;

  const questions = useMemo(
    () => buildQuestions(pool, count, overflowChoice, perCategoryConfig),
    [pool, count, overflowChoice, perCategoryConfig]
  );

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const q = questions[index];
  const isTimeAttack = mode !== "normal" && timeLimitSeconds != null;

  const finishNow = (finalScore, finalMissed) => {
    const timeSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    onFinish({ score: finalScore, total: questions.length, missed: finalMissed, timeSeconds, mode });
  };

  const choose = (choice) => {
    if (feedback) return;
    clearInterval(countdownRef.current);
    const isCorrect = choice != null && choice === q.item[q.answerField];
    setSelected(choice);
    setFeedback(isCorrect ? "correct" : "wrong");
    const nextScore = isCorrect ? score + 1 : score;
    const nextMissed = isCorrect ? missed : [...missed, q];
    if (isCorrect) setScore(nextScore);
    else setMissed(nextMissed);

    timerRef.current = setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        finishNow(nextScore, nextMissed);
      }
    }, 850);
  };

  // Time-attack countdown: resets every question, ticks down, times out as a miss.
  useEffect(() => {
    if (!isTimeAttack) return undefined;
    setTimeLeft(timeLimitSeconds);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownRef.current);
          choose(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearInterval(countdownRef.current);
    },
    []
  );

  if (!q) return null;

  const promptLabel = FIELD_LABELS[q.promptField] || q.promptField;
  const answerLabel = FIELD_LABELS[q.answerField] || q.answerField;
  const promptIsPlainText = q.promptField !== "jp";

  return (
    <div className="screen quiz-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onExit} aria-label="Back to home">
          <ArrowLeft size={18} />
        </button>
        <div className="progress-track">
          {questions.map((_, i) => (
            <span key={i} className={`progress-dot${i < index ? " dot-done" : ""}${i === index ? " dot-current" : ""}`} />
          ))}
        </div>
        <div className="score-pill">{score}</div>
      </div>

      <div className="quiz-card">
        {isTimeAttack && (
          <div className={`countdown${timeLeft <= 3 ? " countdown-urgent" : ""}`} aria-live="polite">
            {timeLeft}s
          </div>
        )}
        <span className="quiz-instruction">{promptLabel} → {answerLabel}</span>
        <div className={`jp-display${promptIsPlainText ? " romaji-display" : ""}`}>
          {q.promptField === "jp" ? (
            <JpText item={q.item} showFurigana={showFurigana} />
          ) : q.promptField === "kana" ? (
            q.item.kana || q.item.jp
          ) : (
            q.item[q.promptField]
          )}
        </div>

        {feedback && (
          <div className={`stamp-layer ${feedback}`} aria-hidden="true">
            {feedback === "correct" ? (
              <div className="hanko-stamp">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" />
                  <text x="50" y="46" textAnchor="middle" className="hanko-line1">正</text>
                  <text x="50" y="70" textAnchor="middle" className="hanko-line2">解</text>
                </svg>
              </div>
            ) : (
              <div className="ink-cross">
                <svg viewBox="0 0 100 100">
                  <path d="M20,20 L80,80" />
                  <path d="M80,20 L20,80" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="choice-grid">
        {q.choices.map((choice) => {
          const isSelected = selected === choice;
          const isAnswer = feedback && choice === q.item[q.answerField];
          return (
            <button
              key={choice}
              className={`choice-btn${isSelected && feedback === "correct" ? " choice-correct" : ""}${
                isSelected && feedback === "wrong" ? " choice-wrong" : ""
              }${isAnswer && !isSelected ? " choice-reveal" : ""}`}
              onClick={() => choose(choice)}
              disabled={!!feedback}
            >
              {choice}
              {isSelected && feedback === "correct" && <Check size={16} />}
              {isSelected && feedback === "wrong" && <X size={16} />}
            </button>
          );
        })}
      </div>

      <div className="quiz-footer">
        Question {index + 1} of {questions.length}
      </div>
    </div>
  );
}
