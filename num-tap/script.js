// ==========================
// 定数
// ==========================
const GRID_SIZE = 5;
const TOTAL_NUMBERS = GRID_SIZE * GRID_SIZE;
const PENALTY_TIME = 1.0;

// ==========================
// DOM
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");

// ==========================
// 状態
// ==========================
let numbers = [];
let currentNumber = 1;
let startTime = 0;
let penalty = 0;
let isFinished = false;
let pressedIndex = null;

// ==========================
// Canvasリサイズ
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
// 初期化
// ==========================
function initGame() {
  resizeCanvas();
  numbers = shuffle([...Array(TOTAL_NUMBERS)].map((_, i) => i + 1));
  currentNumber = 1;
  penalty = 0;
  isFinished = false;
  pressedIndex = null;
  startTime = performance.now();
  requestAnimationFrame(update);
  draw();
}

// ==========================
// シャッフル
// ==========================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==========================
// 丸ボタン描画（立体）
// ==========================
function drawButton(cx, cy, r, num, pressed, cleared) {
  if (cleared) return;

  // 影
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.arc(cx, cy + 8, r, 0, Math.PI * 2);
  ctx.fill();

  // 本体グラデーション
  const grad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    r * 0.2,
    cx,
    cy,
    r
  );
  grad.addColorStop(0, pressed ? "#e0e0e0" : "#ffffff");
  grad.addColorStop(1, "#9a9a9a");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + (pressed ? 4 : 0), r, 0, Math.PI * 2);
  ctx.fill();

  // 数字
  ctx.fillStyle = "#222";
  ctx.font = `bold ${r}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(num, cx, cy + (pressed ? 4 : 0));
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cell = canvas.clientWidth / GRID_SIZE;
  const radius = cell * 0.36;

  numbers.forEach((num, i) => {
    const col = i % GRID_SIZE;
    const row = Math.floor(i / GRID_SIZE);
    const cx = col * cell + cell / 2;
    const cy = row * cell + cell / 2;

    drawButton(
      cx,
      cy,
      radius,
      num,
      i === pressedIndex,
      num < currentNumber
    );
  });
}

// ==========================
// 入力
// ==========================
canvas.addEventListener("pointerdown", (e) => {
  if (isFinished) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const cell = canvas.clientWidth / GRID_SIZE;
  const col = Math.floor(x / cell);
  const row = Math.floor(y / cell);
  const index = row * GRID_SIZE + col;

  if (numbers[index] !== currentNumber) return;

  pressedIndex = index;
  draw();
});

canvas.addEventListener("pointerup", () => {
  if (pressedIndex === null || isFinished) return;

  currentNumber++;

  if (currentNumber > TOTAL_NUMBERS) {
    isFinished = true; // タイマーは自然停止
  }

  pressedIndex = null;
  draw();
});

// ==========================
// タイマー更新
// ==========================
function update() {
  if (isFinished) return;

  const elapsed =
    (performance.now() - startTime) / 1000 + penalty;

  timerEl.textContent = elapsed.toFixed(3);
  requestAnimationFrame(update);
}

// ==========================
// 起動
// ==========================
initGame();