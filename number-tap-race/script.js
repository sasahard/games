// ====== 設定 ======
const MAX_NUMBER = 9;

// ====== 状態管理 ======
let currentNumber = 1;
let startTime = null;
let timerInterval = null;

// ====== 要素取得 ======
const startButton = document.getElementById("startButton");
const countdownEl = document.getElementById("countdown");
const timerEl = document.getElementById("timer");
const gameBoard = document.getElementById("gameBoard");
const resultEl = document.getElementById("result");

// ====== 初期化 ======
createNumbers();
disableNumbers();

// ====== 数字生成 ======
function createNumbers() {
  gameBoard.innerHTML = "";

  // 1〜9を配列に
  const numbers = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1);

  // シャッフル
  numbers.sort(() => Math.random() - 0.5);

  numbers.forEach((num) => {
    const div = document.createElement("div");
    div.textContent = num;
    div.className = "number disabled";
    div.addEventListener("click", () => handleNumberClick(num, div));
    gameBoard.appendChild(div);
  });
}

// ====== 数字クリック処理 ======
function handleNumberClick(num, element) {
  if (num !== currentNumber) return;

  element.classList.add("disabled");
  currentNumber++;

  // 全て押し終わったらクリア
  if (currentNumber > MAX_NUMBER) {
    finishGame();
  }
}

// ====== ゲーム開始 ======
startButton.addEventListener("click", () => {
  startButton.disabled = true;
  resultEl.textContent = "";
  startCountdown();
});

// ====== カウントダウン ======
function startCountdown() {
  let count = 3;
  countdownEl.textContent = count;
  countdownEl.classList.remove("hidden");

  const interval = setInterval(() => {
    count--;

    if (count === 0) {
      countdownEl.textContent = "GO!";
    } else if (count < 0) {
      clearInterval(interval);
      countdownEl.classList.add("hidden");
      startGame();
    } else {
      countdownEl.textContent = count;
    }
  }, 1000);
}

// ====== ゲーム本体開始 ======
function startGame() {
  currentNumber = 1;
  createNumbers();
  enableNumbers();

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 50);
}

// ====== タイマー更新 ======
function updateTimer() {
  const elapsed = (Date.now() - startTime) / 1000;
  timerEl.textContent = `Time: ${elapsed.toFixed(2)}s`;
}

// ====== ゲーム終了 ======
function finishGame() {
  clearInterval(timerInterval);
  const finalTime = (Date.now() - startTime) / 1000;
  resultEl.textContent = `クリア！ ${finalTime.toFixed(2)} 秒`;
  disableNumbers();
  startButton.disabled = false;
}

// ====== 数字操作制御 ======
function disableNumbers() {
  document.querySelectorAll(".number").forEach((el) => {
    el.classList.add("disabled");
  });
}

function enableNumbers() {
  document.querySelectorAll(".number").forEach((el) => {
    el.classList.remove("disabled");
  });
}