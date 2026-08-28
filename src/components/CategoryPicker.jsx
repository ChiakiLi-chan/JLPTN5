import React, { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { CATEGORIES } from "../data/vocabulary.js";

export default function CategoryPicker({ selectedCategories, setSelectedCategories, onBack }) {
  const [draft, setDraft] = useState(selectedCategories);
  const allSelected = draft.length === CATEGORIES.length;

  const toggleCategory = (key) => {
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    setDraft(allSelected ? [] : CATEGORIES.map((c) => c.key));
  };

  const handleConfirm = () => {
    setSelectedCategories(draft);
    onBack();
  };

  return (
    <div className="screen picker-screen">
      <div className="quiz-topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Cancel">
          <ArrowLeft size={18} />
        </button>
        <span className="setup-title">Choose categories</span>
        <button className="picker-select-all" onClick={toggleAll}>
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      <div className="picker-list">
        {CATEGORIES.map((c) => {
          const active = draft.includes(c.key);
          return (
            <button
              key={c.key}
              className={`picker-card${active ? " picker-card-active" : ""}`}
              onClick={() => toggleCategory(c.key)}
              aria-pressed={active}
            >
              <span className="picker-card-text">
                <span className="picker-card-label">{c.label}</span>
                <span className="picker-card-count">{c.items.length} terms</span>
              </span>
              <span className="picker-card-check" aria-hidden="true">
                {active ? <Check size={16} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <button className="btn-primary picker-confirm" onClick={handleConfirm} disabled={draft.length === 0}>
        Confirm · {draft.length} selected
      </button>
    </div>
  );
}
