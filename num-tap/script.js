// ==========================
// 定数・初期設定
// ==========================
const GRID_SIZE = 5;
const TOTAL_NUMBERS = GRID_SIZE * GRID_SIZE;
const PENALTY_TIME = 1.0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");

let numbers = [];
let currentNumber = 1;
let startTime = 0;
let penalty = 0;
let isFinished = false;

// 押下状態管理
let pressedIndex = null;

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
  pressedIndex = null;
  startTime = performance.now();
  requestAnimationFrame(update);
  draw();
}

// ==========================
// シャッフル
// ==========================
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cellSize = canvas.clientWidth / GRID_SIZE;

  numbers.forEach((num, index) => {
    const x = (index % GRID_SIZE) * cellSize;
    const y = Math.floor(index / GRID_SIZE) * cellSize;

    const isPressed = index === pressedIndex;
    const isCleared = num < currentNumber;

    // 本体
    ctx.fillStyle = isCleared ? "#222" : "#444";
    ctx.fillRect(
      x + 2,
      y + 2 + (isPressed ? 4 : 0),
      cellSize - 4,
      cellSize - 4
    );

    // ハイライト
    if (!isPressed && !isCleared) {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize * 0.35);
    }

    // 数字
    if (!isCleared) {
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${cellSize * 0.42}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(num, x + cellSize / 2, y + cellSize / 2);
    }
  });

  if (isFinished) {
    drawFinishOverlay();
  }
}

// ==========================
// 終了オーバーレイ
// ==========================
function drawFinishOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `TIME ${timerEl.textContent}s`,
    canvas.clientWidth / 2,
    canvas.clientHeight / 2
  );

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#aaa";
  ctx.fillText(
    "TAP TO RESTART",
    canvas.clientWidth / 2,
    canvas.clientHeight / 2 + 36
  );
}

// ==========================
// 入力
// ==========================
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isFinished) {
    initGame();
    return;
  }

  const cellSize = canvas.clientWidth / GRID_SIZE;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  const index = row * GRID_SIZE + col;

  pressedIndex = index;
  draw();
});

canvas.addEventListener("pointerup", () => {
  if (pressedIndex === null || isFinished) return;

  const tappedNumber = numbers[pressedIndex];

  if (tappedNumber === currentNumber) {
    currentNumber++;
    if (currentNumber > TOTAL_NUMBERS) {
      isFinished = true;
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
  if (!isFinished) {
    const now = performance.now();
    const elapsed = (now - startTime) / 1000 + penalty;
    timerEl.textContent = elapsed.toFixed(3);
    draw();
    requestAnimationFrame(update);
  }
}

// ==========================
// 起動
// ==========================
initGame();