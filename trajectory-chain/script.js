// ==========================
// Canvas 基本設定
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildBackground(); // 背景再生成
}
window.addEventListener("resize", resize);
resize();

// ==========================
// オフスクリーン背景
// ==========================
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");

const STAR_COUNT = 320;
const stars = [];
const nebulas = [];

function buildBackground() {
  bgCanvas.width = canvas.width;
  bgCanvas.height = canvas.height;
  stars.length = 0;
  nebulas.length = 0;

  // 星雲（超軽量：一度だけ描画）
  for (let i = 0; i < 4; i++) {
    nebulas.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 600 + 500,
      color: Math.random() > 0.5 ? "120,160,255" : "180,120,255",
      alpha: 0.012
    });
  }

  bgCtx.fillStyle = "#000";
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  nebulas.forEach(n => {
    const g = bgCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
    g.addColorStop(0.6, `rgba(${n.color}, ${n.alpha * 0.4})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    bgCtx.fillStyle = g;
    bgCtx.beginPath();
    bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    bgCtx.fill();
  });

  // 星
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 0.9 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005
    });
  }
}

// ==========================
// ゲーム定数（修正元維持）
// ==========================
const ASTEROID_COUNT = 10;
const ASTEROID_RADIUS = 12;
const MAX_SHOTS = 5;

const FORCE_RADIUS = 140;
const FORCE_POWER = 6;

// ==========================
// 状態管理
// ==========================
let asteroids = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let gameState = "ready";

const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

// ==========================
// 小惑星生成
// ==========================
function createAsteroids() {
  asteroids = [];
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    asteroids.push({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      vx: 0,
      vy: 0,
      alive: true
    });
  }
  shotsLeft = MAX_SHOTS;
}

// ==========================
// スタート
// ==========================
startBtn.addEventListener("click", () => {
  createAsteroids();
  gameState = "playing";
  messageEl.textContent = "";
  startBtn.style.display = "none";
});

// ==========================
// 入力（修正元維持）
// ==========================
canvas.addEventListener("pointerdown", e => {
  if (gameState !== "playing" || shotsLeft <= 0) return;
  drawing = true;
  trajectory = [{ x: e.clientX, y: e.clientY }];
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  trajectory.push({ x: e.clientX, y: e.clientY });
});

canvas.addEventListener("pointerup", () => {
  if (!drawing) return;
  drawing = false;
  applyTrajectoryForce();
  trajectory = [];
  shotsLeft--;
});

// ==========================
// 軌跡 → 力場
// ==========================
function applyTrajectoryForce() {
  if (trajectory.length < 2) return;

  const start = trajectory[0];
  const end = trajectory[trajectory.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (!len) return;

  const nx = dx / len;
  const ny = dy / len;

  asteroids.forEach(a => {
    if (!a.alive) return;
    let minDist = Infinity;

    trajectory.forEach(p => {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < minDist) minDist = d;
    });

    if (minDist < FORCE_RADIUS) {
      const f = (FORCE_RADIUS - minDist) / FORCE_RADIUS;
      a.vx += nx * f * FORCE_POWER;
      a.vy += ny * f * FORCE_POWER;
    }
  });
}

// ==========================
// 更新
// ==========================
function update() {
  stars.forEach(s => {
    s.x -= 0.03;
    s.y -= 0.03;
    s.phase += s.speed;
    if (s.x < 0) s.x = canvas.width;
    if (s.y < 0) s.y = canvas.height;
  });

  if (gameState !== "playing") return;

  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;

    if (a.x < ASTEROID_RADIUS || a.x > canvas.width - ASTEROID_RADIUS) a.vx *= -1;
    if (a.y < ASTEROID_RADIUS || a.y > canvas.height - ASTEROID_RADIUS) a.vy *= -1;
  });

  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i], b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < ASTEROID_RADIUS * 2) {
        a.alive = b.alive = false;
      }
    }
  }

  if (asteroids.every(a => !a.alive)) {
    gameState = "ready";
    messageEl.textContent = "CLEAR";
    startBtn.style.display = "block";
  }

  shotsEl.textContent = `shots: ${shotsLeft}`;
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.drawImage(bgCanvas, 0, 0);

  // 星（瞬きのみ）
  stars.forEach(s => {
    const a = s.baseAlpha + Math.sin(s.phase) * 0.4;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 惑星
  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.beginPath();
    ctx.arc(a.x, a.y, ASTEROID_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  });
}

// ==========================
// ループ
// ==========================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
buildBackground();
loop();