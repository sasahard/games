// ==========================
// Canvas 基本設定
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  viewWidth = window.innerWidth;
  viewHeight = window.innerHeight;

  canvas.width = viewWidth * dpr;
  canvas.height = viewHeight * dpr;
  canvas.style.width = viewWidth + "px";
  canvas.style.height = viewHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// ==========================
// 背景星雲（負荷軽減：一層）
// ==========================
const NEBULA_COUNT = 1;
const nebulas = [];

for (let i = 0; i < NEBULA_COUNT; i++) {
  const r = Math.random() * 600 + 500;
  nebulas.push({
    x: Math.random() * viewWidth,
    y: Math.random() * viewHeight,
    r,
    color: "180,120,255",
    alpha: Math.random() * 0.02 + 0.015,
    vx: (Math.random() - 0.5) * 0.01,
    vy: (Math.random() - 0.5) * 0.01
  });
}

// 背景星（前面）
const STAR_COUNT = 400;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * viewWidth,
    y: Math.random() * viewHeight,
    r: Math.random() * 0.6 + 0.2, // 少し小さめ
    alpha: Math.random() * 0.6 + 0.6, // 輝度強め
    glow: Math.random() * 6 + 2,
    vx: -0.02 - Math.random() * 0.05, // 右下→左上
    vy: -0.01 - Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.02 + 0.005
  });
}

// ==========================
// ゲーム定数
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
let waitingNext = false;
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
      x: Math.random() * (viewWidth - 100) + 50,
      y: Math.random() * (viewHeight - 100) + 50,
      vx: 0,
      vy: 0,
      alive: true
    });
  }
  shotsLeft = MAX_SHOTS;
  waitingNext = false;
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
// 入力
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
  if (len === 0) return;

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
      const influence = (FORCE_RADIUS - minDist) / FORCE_RADIUS;
      a.vx += nx * influence * FORCE_POWER;
      a.vy += ny * influence * FORCE_POWER;
    }
  });
}

// ==========================
// 更新処理
// ==========================
function update() {
  // 背景星雲
  nebulas.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
  });

  // 背景星
  stars.forEach(s => {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < 0) s.x = viewWidth;
    if (s.y < 0) s.y = viewHeight;
    s.phase += s.twinkleSpeed;
  });

  if (gameState !== "playing") return;

  // 惑星
  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    if (a.x < ASTEROID_RADIUS || a.x > viewWidth - ASTEROID_RADIUS) a.vx *= -1;
    if (a.y < ASTEROID_RADIUS || a.y > viewHeight - ASTEROID_RADIUS) a.vy *= -1;
  });

  // 衝突判定
  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i];
      const b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < ASTEROID_RADIUS * 2) {
        a.alive = false;
        b.alive = false;
      }
    }
  }

  // 全破壊後、自動再生成
  if (asteroids.filter(a => a.alive).length === 0 && !waitingNext && gameState === "playing") {
    waitingNext = true;
    setTimeout(createAsteroids, 700);
  }

  shotsEl.textContent = `shots: ${shotsLeft}`;
}

// ==========================
// 描画
// ==========================
function draw() {
  // 背景
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // 星雲
  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
    g.addColorStop(0.5, `rgba(${n.color}, ${n.alpha * 0.4})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 星
  stars.forEach(s => {
    const twinkle = Math.sin(s.phase) * 0.3 + 0.7;
    ctx.shadowBlur = s.glow;
    ctx.shadowColor = `rgba(255,255,255,${s.alpha})`;
    ctx.fillStyle = `rgba(255,255,255,${s.alpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

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
loop();