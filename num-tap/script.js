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
// 初期化（待機状態）
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
// 丸ボタン描画
// ==========================
function drawButton(cx, cy, r, num, pressed, cleared) {
  // 影
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.arc(cx, cy + 8, r, 0, Math.PI * 2);
  ctx.fill();

  // 本体
  let grad;
  if (cleared) {
    grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    grad.addColorStop(0, "#ffffcc");
    grad.addColorStop(1, "#ffcc33");
  } else {
    grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#9a9a9a");
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy + (pressed ? 4 : 0), r, 0, Math.PI * 2);
  ctx.fill();

  // 発光（クリア済み）
  if (cleared) {
    ctx.strokeStyle = "rgba(255,255,200,0.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 数字
  ctx.fillStyle = cleared ? "#664400" : "#222";
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

  // 待機・終了メッセージ
  if (gameState !== "playing") {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      gameState === "idle" ? "TAP TO START" : "TAP TO RETRY",
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

  if (gameState === "idle") {
    startGame();
    return;
  }

  if (gameState === "finished") {
    resetGame();
    return;
  }

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