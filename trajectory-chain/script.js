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
// 星空背景
// ==========================
const STAR_COUNT = 350;
const stars = [];

function createStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r: Math.random() * 1.3 + 0.3,
      a: Math.random() * 0.6 + 0.2,
      vx: 0.05 + Math.random() * 0.12,
      vy: -0.03 - Math.random() * 0.08
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
// 小惑星生成（重なり防止）
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
  stars.forEach(s => {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x > viewWidth) s.x = 0;
    if (s.y < 0) s.y = viewHeight;
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

  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  });

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