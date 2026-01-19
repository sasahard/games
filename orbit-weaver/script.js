// ==============================
// 初期設定
// ==============================
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const ui = document.getElementById("ui");
const scoreEl = document.getElementById("score");
const triesEl = document.getElementById("tries");

let width, height;
let score = 0;
let tries = 3;
let gameActive = false;

// ブラックホール
const blackHole = {
  x: 0,
  y: 0,
  r: 30
};

// 惑星
let planets = [];

// 軌道描画用
let drawing = false;
let path = [];

// ==============================
// リサイズ
// ==============================
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  blackHole.x = width / 2;
  blackHole.y = height / 2;
}
window.addEventListener("resize", resize);

// ==============================
// ゲーム開始
// ==============================
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  ui.style.display = "flex";

  resize();
  initGame();
  gameActive = true;
  requestAnimationFrame(loop);
});

function initGame() {
  score = 0;
  tries = 3;
  updateUI();

  planets = [];
  for (let i = 0; i < 6; i++) {
    planets.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 10 + Math.random() * 8,
      captured: false
    });
  }
}

// ==============================
// 入力処理（フリック）
// ==============================
canvas.addEventListener("pointerdown", (e) => {
  if (!gameActive || tries <= 0) return;
  drawing = true;
  path = [{ x: e.clientX, y: e.clientY }];
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  path.push({ x: e.clientX, y: e.clientY });
});

canvas.addEventListener("pointerup", () => {
  if (!drawing) return;
  drawing = false;
  tries--;
  checkCapture();
  updateUI();
});

// ==============================
// 惑星捕捉判定
// ==============================
function checkCapture() {
  planets.forEach(p => {
    if (p.captured) return;

    path.forEach(pt => {
      const dx = p.x - pt.x;
      const dy = p.y - pt.y;
      const dist = Math.hypot(dx, dy);

      if (dist < p.r + 8) {
        p.captured = true;
        score += 10;
      }
    });
  });
}

// ==============================
// UI更新
// ==============================
function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  triesEl.textContent = `Tries: ${tries}`;
}

// ==============================
// 描画
// ==============================
function draw() {
  ctx.clearRect(0, 0, width, height);

  // ブラックホール
  ctx.beginPath();
  ctx.arc(blackHole.x, blackHole.y, blackHole.r, 0, Math.PI * 2);
  ctx.fillStyle = "purple";
  ctx.fill();

  // 惑星
  planets.forEach(p => {
    if (p.captured) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "skyblue";
    ctx.fill();
  });

  // 軌道
  if (path.length > 1) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    path.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ==============================
// ループ
// ==============================
function loop() {
  if (!gameActive) return;

  draw();

  if (tries <= 0) {
    gameActive = false;
    setTimeout(() => {
      alert(`Game Over\nScore: ${score}`);
      location.reload();
    }, 300);
    return;
  }

  requestAnimationFrame(loop);
}