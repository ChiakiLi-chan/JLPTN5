/* ==============================================================
   N5道場 — root component.

   This file owns nothing but navigation: which screen is showing,
   the selections that outlive a single screen (categories, furigana,
   the configs handed to a run), and the result of the last quiz.

   All vocabulary lives in src/data, all pure logic in src/lib, and
   every screen is its own component under src/components.
   ============================================================== */

import React, { useState, useMemo } from "react";

import { CATEGORIES, poolFor } from "./data/vocabulary.js";
import Home from "./components/Home.jsx";
import CategoryPicker from "./components/CategoryPicker.jsx";
import QuizSetup from "./components/QuizSetup.jsx";
import Quiz from "./components/Quiz.jsx";
import QuizResults from "./components/QuizResults.jsx";
import { FlashcardsSetup, Flashcards } from "./components/Flashcards.jsx";
import LeaderboardBrowser from "./components/LeaderboardBrowser.jsx";

export default function N5Dojo() {
  const [screen, setScreen] = useState("home");
  const [selectedCategories, setSelectedCategories] = useState(() => CATEGORIES.map((c) => c.key));
  const [showFurigana, setShowFurigana] = useState(true);
  const [quizConfig, setQuizConfig] = useState(null);
  const [flashConfig, setFlashConfig] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const pool = useMemo(() => poolFor(selectedCategories), [selectedCategories]);

  return (
    <div className="dojo-root">
      <div className="grid-veil" aria-hidden="true" />

      {screen === "home" && (
        <Home
          selectedCategories={selectedCategories}
          pool={pool}
          showFurigana={showFurigana}
          setShowFurigana={setShowFurigana}
          onQuiz={() => setScreen("quizSetup")}
          onFlashcards={() => setScreen("flashcardsSetup")}
          onViewLeaderboards={() => setScreen("leaderboards")}
          onEditCategories={() => setScreen("categoryPicker")}
        />
      )}

      {screen === "categoryPicker" && (
        <CategoryPicker
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "leaderboards" && <LeaderboardBrowser onBack={() => setScreen("home")} />}

      {screen === "quizSetup" && (
        <QuizSetup
          pool={pool}
          onBack={() => setScreen("home")}
          onStart={(config) => {
            setQuizConfig(config);
            setScreen("quiz");
          }}
        />
      )}

      {screen === "quiz" && quizConfig && (
        <Quiz
          config={quizConfig}
          showFurigana={showFurigana}
          onExit={() => setScreen("home")}
          onFinish={(res) => {
            const categoriesInPlay = [...new Set(quizConfig.pool.map((i) => i.category))];
            const categoryKey = categoriesInPlay.length === 1 ? categoriesInPlay[0] : "Mixed";
            setLastResult({ ...res, categoryKey, count: quizConfig.count });
            setScreen("quizResults");
          }}
        />
      )}

      {screen === "quizResults" && (
        <QuizResults result={lastResult} onRetry={() => setScreen("quizSetup")} onHome={() => setScreen("home")} />
      )}

      {screen === "flashcardsSetup" && (
        <FlashcardsSetup
          pool={pool}
          onBack={() => setScreen("home")}
          onStart={(config) => {
            setFlashConfig(config);
            setScreen("flashcards");
          }}
        />
      )}

      {screen === "flashcards" && flashConfig && (
        <Flashcards config={flashConfig} showFurigana={showFurigana} onExit={() => setScreen("home")} />
      )}
    </div>
  );
}
