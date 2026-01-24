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

let gameState = "idle"; // idle | playing | finished
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
// 初期化（完全待機）
// ==========================
function resetGame() {
  resizeCanvas();
  numbers = shuffle([...Array(TOTAL_NUMBERS)].map((_, i) => i + 1));
  currentNumber = 1;
  penalty = 0;
  pressedIndex = null;
  gameState = "idle";
  timerEl.textContent = "0.000";
  draw();
}

// ==========================
// ゲーム開始
// ==========================
function startGame() {
  startTime = performance.now();
  gameState = "playing";
  requestAnimationFrame(update);
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
// 丸ボタン描画（リアルグロー）
// ==========================
function drawButton(cx, cy, r, num, pressed, cleared) {
  const yOffset = pressed ? 4 : 0;

  // --- 影 ---
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.4 + 6, r, 0, Math.PI * 2);
  ctx.fill();

  // --- 発光（クリア済み）---
  if (cleared) {
    ctx.shadowColor = "rgba(255,220,120,0.9)";
    ctx.shadowBlur = 28;
  } else {
    ctx.shadowBlur = 0;
  }

  // --- 本体 ---
  const grad = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.4,
    r * 0.2,
    cx,
    cy,
    r
  );

  if (cleared) {
    grad.addColorStop(0, "#fff9e0");
    grad.addColorStop(1, "#ffb400");
  } else {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#9b9b9b");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + yOffset, r, 0, Math.PI * 2);
  ctx.fill();

  // --- 数字 ---
  ctx.shadowBlur = 0;
  ctx.fillStyle = cleared ? "#6b4a00" : "#222";
  ctx.font = `bold ${r}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(num, cx, cy + yOffset);
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cell = canvas.clientWidth / GRID_SIZE;
  const r = cell * 0.36;

  numbers.forEach((num, i) => {
    const col = i % GRID_SIZE;
    const row = Math.floor(i / GRID_SIZE);
    const cx = col * cell + cell / 2;
    const cy = row * cell + cell / 2;

    drawButton(
      cx,
      cy,
      r,
      num,
      i === pressedIndex,
      num < currentNumber
    );
  });

  // 初回だけ表示される案内
  if (gameState === "idle") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "TAP ANYWHERE TO START",
      canvas.clientWidth / 2,
      canvas.clientHeight / 2
    );
  }
}

// ==========================
// 入力
// ==========================
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // idle → playing（このタップをそのまま使う）
  if (gameState === "idle") {
    startGame();
  }

  // finished → reset
  if (gameState === "finished") {
    resetGame();
    return;
  }

  if (gameState !== "playing") return;

  const cell = canvas.clientWidth / GRID_SIZE;
  const col = Math.floor(x / cell);
  const row = Math.floor(y / cell);
  const index = row * GRID_SIZE + col;

  pressedIndex = index;
  draw();
});

canvas.addEventListener("pointerup", () => {
  if (gameState !== "playing" || pressedIndex === null) return;

  const tapped = numbers[pressedIndex];

  if (tapped === currentNumber) {
    currentNumber++;
    if (currentNumber > TOTAL_NUMBERS) {
      gameState = "finished";
    }
  } else {
    penalty += PENALTY_TIME;
  }

  pressedIndex = null;
  draw();
});

// ==========================
// タイマー
// ==========================
function update() {
  if (gameState !== "playing") return;

  const elapsed =
    (performance.now() - startTime) / 1000 + penalty;
  timerEl.textContent = elapsed.toFixed(3);

  requestAnimationFrame(update);
}

// ==========================
// 起動
// ==========================
resetGame();