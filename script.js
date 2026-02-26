const flashcards = [
  {
    id: "c1",
    category: "Memory",
    prompt: "What memory trick links names to faces quickly?",
    answer: "Pick one standout feature and connect it to the name with a vivid mental image.",
  },
  {
    id: "c2",
    category: "Productivity",
    prompt: "What is the 2-minute rule?",
    answer: "If a task takes less than two minutes, do it immediately instead of delaying it.",
  },
  {
    id: "c3",
    category: "Coding",
    prompt: "What does DRY stand for?",
    answer: "Don't Repeat Yourself. Avoid duplicated logic by reusing abstractions.",
  },
  {
    id: "c4",
    category: "Health",
    prompt: "Why is short movement during study breaks useful?",
    answer: "It boosts blood flow and attention, making the next focus block sharper.",
  },
  {
    id: "c5",
    category: "Design",
    prompt: "What creates strong visual hierarchy in a UI?",
    answer: "Contrast in size, weight, spacing, and color focus guides user attention.",
  },
  {
    id: "c6",
    category: "Science",
    prompt: "What is a hypothesis?",
    answer: "A testable explanation that can be supported or disproved with evidence.",
  },
  {
    id: "c7",
    category: "Language",
    prompt: "How can you remember new vocabulary faster?",
    answer: "Use the word in your own sentence the same day and review it in spaced intervals.",
  },
  {
    id: "c8",
    category: "Focus",
    prompt: "What is one benefit of monotasking?",
    answer: "Single-tasking lowers context switching and improves depth of understanding.",
  },
  {
    id: "c9",
    category: "Career",
    prompt: "What makes feedback actionable?",
    answer: "Specific observations, clear impact, and one concrete next step.",
  },
  {
    id: "c10",
    category: "Math",
    prompt: "What is the square root of 144?",
    answer: "12.",
  },
  {
    id: "c11",
    category: "Cybersecurity",
    prompt: "What is phishing?",
    answer: "A social engineering attempt to trick users into giving credentials or sensitive data.",
  },
  {
    id: "c12",
    category: "Creativity",
    prompt: "What is a fast way to break creative block?",
    answer: "Create a tiny version first, then iterate with one improvement at a time.",
  },
];

const masteryByCard = new Map();
for (const card of flashcards) {
  masteryByCard.set(card.id, { seen: 0, mastery: 0 });
}

const gradeRules = {
  again: { baseXp: 4, masteryDelta: -1, streakDelta: 0, label: "Again" },
  hard: { baseXp: 9, masteryDelta: 1, streakDelta: 1, label: "Hard" },
  good: { baseXp: 14, masteryDelta: 2, streakDelta: 1, label: "Good" },
  easy: { baseXp: 20, masteryDelta: 3, streakDelta: 2, label: "Easy" },
};

const badgeChecks = [
  { key: "spark-3", label: "Spark Streak: hit 3 in a row", test: (s) => s.streak >= 3 },
  { key: "laser-7", label: "Laser Focus: hit 7 streak", test: (s) => s.streak >= 7 },
  { key: "xp-250", label: "XP Hunter: reach 250 XP", test: (s) => s.xp >= 250 },
  {
    key: "deck-master",
    label: "Deck Master: master all cards",
    test: (s) => s.masteredCount === s.deck.length,
  },
];

const state = {
  deck: [...flashcards],
  index: 0,
  xp: 0,
  streak: 0,
  bestStreak: 0,
  flipped: false,
  answeredAt: Date.now(),
  badges: new Set(),
};

const elements = {
  flipCardBtn: document.getElementById("flipCardBtn"),
  questionText: document.getElementById("questionText"),
  answerText: document.getElementById("answerText"),
  categoryTag: document.getElementById("categoryTag"),
  cardCounter: document.getElementById("cardCounter"),
  progressFill: document.getElementById("progressFill"),
  progressText: document.getElementById("progressText"),
  xpValue: document.getElementById("xpValue"),
  levelValue: document.getElementById("levelValue"),
  streakValue: document.getElementById("streakValue"),
  bestStreakValue: document.getElementById("bestStreakValue"),
  badgeList: document.getElementById("badgeList"),
  toast: document.getElementById("toast"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  gradeButtons: Array.from(document.querySelectorAll("[data-grade]")),
};

let toastTimer;

function currentCard() {
  return state.deck[state.index];
}

function levelFromXp(xp) {
  return Math.floor(xp / 100) + 1;
}

function masteredCount() {
  return state.deck.filter((card) => masteryByCard.get(card.id).mastery >= 6).length;
}

function renderCard() {
  const card = currentCard();
  elements.categoryTag.textContent = card.category;
  elements.questionText.textContent = card.prompt;
  elements.answerText.textContent = card.answer;
  elements.cardCounter.textContent = `${state.index + 1} / ${state.deck.length}`;
  state.flipped = false;
  elements.flipCardBtn.classList.remove("is-flipped");
  state.answeredAt = Date.now();
}

function renderHud() {
  const level = levelFromXp(state.xp);
  const mastered = masteredCount();
  const percent = Math.round((mastered / state.deck.length) * 100);

  elements.xpValue.textContent = String(state.xp);
  elements.levelValue.textContent = String(level);
  elements.streakValue.textContent = String(state.streak);
  elements.bestStreakValue.textContent = String(state.bestStreak);
  elements.progressFill.style.width = `${percent}%`;
  elements.progressText.textContent = `${percent}%`;
}

function renderBadges() {
  if (state.badges.size === 0) {
    elements.badgeList.innerHTML = '<li class="muted">No badges yet. Keep playing!</li>';
    return;
  }

  elements.badgeList.innerHTML = "";
  const sorted = badgeChecks.filter((badge) => state.badges.has(badge.key));
  for (const badge of sorted) {
    const li = document.createElement("li");
    li.textContent = badge.label;
    elements.badgeList.appendChild(li);
  }
}

function showToast(message, tone = "good") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast ${tone} show`;
  toastTimer = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 1750);
}

function checkBadges() {
  const snapshot = {
    xp: state.xp,
    streak: state.streak,
    masteredCount: masteredCount(),
    deck: state.deck,
  };

  for (const badge of badgeChecks) {
    if (!state.badges.has(badge.key) && badge.test(snapshot)) {
      state.badges.add(badge.key);
      showToast(`Badge unlocked: ${badge.label}`, "good");
    }
  }
}

function flashPulse() {
  elements.flipCardBtn.classList.remove("pulse");
  // Trigger reflow so pulse can replay on each answer.
  void elements.flipCardBtn.offsetWidth;
  elements.flipCardBtn.classList.add("pulse");
}

function flipCard() {
  state.flipped = !state.flipped;
  elements.flipCardBtn.classList.toggle("is-flipped", state.flipped);
}

function moveCard(delta) {
  const next = (state.index + delta + state.deck.length) % state.deck.length;
  state.index = next;
  renderCard();
}

function randomizeDeck() {
  for (let i = state.deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
  }
  state.index = 0;
  renderCard();
  showToast("Deck shuffled. New challenge order!", "good");
}

function resetProgress() {
  const ok = window.confirm("Reset XP, streaks, badges and mastery progress?");
  if (!ok) {
    return;
  }

  state.xp = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.badges.clear();
  state.index = 0;
  state.deck = [...flashcards];

  for (const card of flashcards) {
    const progress = masteryByCard.get(card.id);
    progress.mastery = 0;
    progress.seen = 0;
  }

  renderCard();
  renderHud();
  renderBadges();
  showToast("Progress reset. Fresh run started.", "warn");
}

function gradeCurrentCard(grade) {
  const rule = gradeRules[grade];
  if (!rule) {
    return;
  }

  const card = currentCard();
  const progress = masteryByCard.get(card.id);
  const previousMastery = progress.mastery;
  progress.seen += 1;
  progress.mastery = Math.max(0, progress.mastery + rule.masteryDelta);

  const elapsedMs = Date.now() - state.answeredAt;
  const speedBonus = Math.max(0, 8 - Math.floor(elapsedMs / 4000));
  const streakBonus = Math.min(state.streak, 7);
  const gainedXp = rule.baseXp + speedBonus + streakBonus;
  state.xp += gainedXp;

  if (grade === "again") {
    state.streak = 0;
  } else {
    state.streak += rule.streakDelta;
  }
  state.bestStreak = Math.max(state.bestStreak, state.streak);

  if (previousMastery < 6 && progress.mastery >= 6) {
    showToast(`Mastered: ${card.category} card!`, "good");
  } else if (grade === "again") {
    showToast(`+${gainedXp} XP. Streak reset, bounce back!`, "warn");
  } else {
    showToast(`+${gainedXp} XP with ${rule.label}!`, "good");
  }

  checkBadges();
  renderHud();
  renderBadges();
  flashPulse();
  moveCard(1);
}

function bindEvents() {
  elements.flipCardBtn.addEventListener("click", flipCard);

  elements.prevBtn.addEventListener("click", () => moveCard(-1));
  elements.nextBtn.addEventListener("click", () => moveCard(1));
  elements.shuffleBtn.addEventListener("click", randomizeDeck);
  elements.resetBtn.addEventListener("click", resetProgress);

  for (const button of elements.gradeButtons) {
    button.addEventListener("click", () => {
      const grade = button.dataset.grade;
      gradeCurrentCard(grade);
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.repeat) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      flipCard();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCard(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCard(1);
      return;
    }

    if (event.key === "1") {
      gradeCurrentCard("again");
    } else if (event.key === "2") {
      gradeCurrentCard("hard");
    } else if (event.key === "3") {
      gradeCurrentCard("good");
    } else if (event.key === "4") {
      gradeCurrentCard("easy");
    }
  });
}

function init() {
  bindEvents();
  renderCard();
  renderHud();
  renderBadges();
}

init();
