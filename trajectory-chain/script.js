// ==========================
// Canvas & View サイズ
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
// 定数
// ==========================
const ASTEROID_COUNT = 10;
const ASTEROID_RADIUS = 12;
const MAX_SHOTS = 5;

const FORCE_RADIUS = 140;
const FORCE_POWER = 6;

// ==========================
// 星雲レイヤー
// ==========================
const NEBULA_COUNT = 6;
const nebulas = [];

function createNebulas() {
  nebulas.length = 0;
  for (let i = 0; i < NEBULA_COUNT; i++) {
    const r = Math.random() * 500 + 400;
    nebulas.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r,
      blur: r * (Math.random() * 0.4 + 0.8),
      vx: (Math.random() - 0.5) * 0.015,
      vy: (Math.random() - 0.5) * 0.015,
      color: [
        "200,150,255",
        "140,190,255",
        "255,160,200"
      ][Math.floor(Math.random() * 3)],
      alpha: Math.random() * 0.06 + 0.04
    });
  }
}
createNebulas();

// ==========================
// 星空
// ==========================
const STAR_COUNT = 350;
const stars = [];

function createStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r: Math.random() * 0.8 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.3,
      glow: Math.random() * 8 + 2,
      vx: 0.05 + Math.random() * 0.12,
      vy: -0.03 - Math.random() * 0.08,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2
    });
  }
}
createStars();

// ==========================
// 状態
// ==========================
let asteroids = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let waitingNext = false;
let gameState = "title";

const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

// ==========================
// 小惑星生成
// ==========================
function createAsteroids() {
  asteroids = [];
  shotsLeft = MAX_SHOTS;
  waitingNext = false;

  while (asteroids.length < ASTEROID_COUNT) {
    const x = Math.random() * (viewWidth - 100) + 50;
    const y = Math.random() * (viewHeight - 100) + 50;

    const overlap = asteroids.some(a =>
      Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2.5
    );
    if (overlap) continue;

    asteroids.push({
      x, y,
      vx: 0,
      vy: 0,
      alive: true
    });
  }
}

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

  const s = trajectory[0];
  const e = trajectory[trajectory.length - 1];
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const nx = dx / len;
  const ny = dy / len;

  asteroids.forEach(a => {
    if (!a.alive) return;

    let min = Infinity;
    trajectory.forEach(p => {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < min) min = d;
    });

    if (min < FORCE_RADIUS) {
      const f = (FORCE_RADIUS - min) / FORCE_RADIUS;
      a.vx += nx * f * FORCE_POWER;
      a.vy += ny * f * FORCE_POWER;
    }
  });
}

// ==========================
// 更新
// ==========================
function update() {
  nebulas.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < -n.r) n.x = viewWidth + n.r;
    if (n.x > viewWidth + n.r) n.x = -n.r;
    if (n.y < -n.r) n.y = viewHeight + n.r;
    if (n.y > viewHeight + n.r) n.y = -n.r;
  });

  stars.forEach(s => {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x > viewWidth) s.x = 0;
    if (s.y < 0) s.y = viewHeight;
    s.phase += s.twinkleSpeed;
  });

  if (gameState !== "playing") return;

  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;

    if (a.x < ASTEROID_RADIUS || a.x > viewWidth - ASTEROID_RADIUS) a.vx *= -1;
    if (a.y < ASTEROID_RADIUS || a.y > viewHeight - ASTEROID_RADIUS) a.vy *= -1;
  });

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

  if (asteroids.every(a => !a.alive) && !waitingNext) {
    waitingNext = true;
    setTimeout(createAsteroids, 700);
  }

  shotsEl.textContent = `shots ${shotsLeft}`;
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // 星雲（奥）
  nebulas.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.shadowBlur = n.blur;
    ctx.shadowColor = `rgba(${n.color},${n.alpha})`;
    ctx.fillStyle = `rgba(${n.color},${n.alpha})`;
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // 星（加算合成）
  ctx.globalCompositeOperation = "lighter";
  stars.forEach(s => {
    const twinkle = Math.sin(s.phase) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.shadowBlur = s.glow;
    ctx.shadowColor = `rgba(255,255,255,${s.baseAlpha})`;
    ctx.fillStyle = `rgba(255,255,255,${s.baseAlpha * twinkle})`;
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";

  // 惑星
  if (gameState !== "playing") return;

  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.beginPath();
    ctx.arc(a.x, a.y, ASTEROID_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
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

// ==========================
// スタート
// ==========================
startBtn.addEventListener("click", () => {
  gameState = "playing";
  startBtn.style.display = "none";
  messageEl.textContent = "";
  createAsteroids();
});