const gameArea = document.getElementById("game-area");
const startBtn = document.getElementById("start-btn");
const countdownEl = document.getElementById("countdown");
const timerEl = document.getElementById("timer");
const diffButtonsEl = document.getElementById("difficulty-buttons");

let numbers = [];
let current = 1;
let startTime = null;
let timerInterval = null;
let difficulty = 9;

/* ===== 難易度生成（9の倍数） ===== */
const difficulties = [9, 18, 27, 36, 45, 54, 63, 72, 81];

difficulties.forEach(value => {
  const btn = document.createElement("button");
  btn.textContent = value;
  btn.className = "diff-btn";
  if (value === difficulty) btn.classList.add("active");

  btn.addEventListener("click", () => {
    difficulty = value;
    document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });

  diffButtonsEl.appendChild(btn);
});

/* ===== ゲーム開始 ===== */
startBtn.addEventListener("click", async () => {
  resetGame();
  await countdown();
  startGame();
});

function resetGame() {
  gameArea.innerHTML = "";
  numbers = shuffle([...Array(difficulty)].map((_, i) => i + 1));
  current = 1;
  timerEl.textContent = "0.00s";
}

/* ===== カウントダウン ===== */
function countdown() {
  return new Promise(resolve => {
    let count = 3;
    countdownEl.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count === 0) {
        countdownEl.textContent = "";
        clearInterval(interval);
        resolve();
      } else {
        countdownEl.textContent = count;
      }
    }, 1000);
  });
}

/* ===== ゲーム本体 ===== */
function startGame() {
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 50);

  numbers.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.className = "number-btn";
    btn.addEventListener("click", () => handleTap(num, btn));
    gameArea.appendChild(btn);
  });
}

function handleTap(num, btn) {
  if (num !== current) return;
  btn.style.visibility = "hidden";
  current++;

  if (current > difficulty) finishGame();
}

function finishGame() {
  clearInterval(timerInterval);
}

/* ===== タイマー ===== */
function updateTimer() {
  const elapsed = (Date.now() - startTime) / 1000;
  timerEl.textContent = elapsed.toFixed(2) + "s";
}

/* ===== ユーティリティ ===== */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}