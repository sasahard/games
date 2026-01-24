// ==========================
// 定数・初期設定
// ==========================
const GRID_SIZE = 5;
const TOTAL_NUMBERS = GRID_SIZE * GRID_SIZE;
const PENALTY_TIME = 1.0; // ミス時の加算秒

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const resultEl = document.getElementById("result");
const resultTimeEl = document.getElementById("result-time");
const retryBtn = document.getElementById("retry");

let numbers = [];
let currentNumber = 1;
let startTime = 0;
let penalty = 0;
let isFinished = false;

// ==========================
// Canvasサイズ調整
// ==========================
function resizeCanvas() {
  const size = canvas.clientWidth;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

// ==========================
// ゲーム初期化
// ==========================
function initGame() {
  resizeCanvas();
  numbers = shuffle([...Array(TOTAL_NUMBERS)].map((_, i) => i + 1));
  currentNumber = 1;
  penalty = 0;
  isFinished = false;
  resultEl.classList.add("hidden");
  startTime = performance.now();
  requestAnimationFrame(update);
  draw();
}

// ==========================
// 数字シャッフル
// ==========================
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==========================
// 描画処理
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cellSize = canvas.clientWidth / GRID_SIZE;

  numbers.forEach((num, index) => {
    const x = (index % GRID_SIZE) * cellSize;
    const y = Math.floor(index / GRID_SIZE) * cellSize;

    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, cellSize - 2, cellSize - 2);

    ctx.fillStyle = "#fff";
    ctx.font = `${cellSize * 0.4}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(num, x + cellSize / 2, y + cellSize / 2);
  });
}

// ==========================
// 入力判定
// ==========================
canvas.addEventListener("pointerdown", (e) => {
  if (isFinished) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cellSize = canvas.clientWidth / GRID_SIZE;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const index = row * GRID_SIZE + col;

  const tappedNumber = numbers[index];

  if (tappedNumber === currentNumber) {
    currentNumber++;
    if (currentNumber > TOTAL_NUMBERS) {
      finishGame();
    }
  } else {
    penalty += PENALTY_TIME;
  }
});

// ==========================
// タイマー更新
// ==========================
function update() {
  if (isFinished) return;

  const now = performance.now();
  const elapsed = (now - startTime) / 1000 + penalty;
  timerEl.textContent = elapsed.toFixed(3);

  requestAnimationFrame(update);
}

// ==========================
// ゲーム終了
// ==========================
function finishGame() {
  isFinished = true;
  const finalTime = timerEl.textContent;
  resultTimeEl.textContent = `TIME : ${finalTime}s`;
  resultEl.classList.remove("hidden");
}

// ==========================
// リトライ
// ==========================
retryBtn.addEventListener("click", initGame);

// ==========================
// 起動
// ==========================
initGame();