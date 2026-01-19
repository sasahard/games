// ==========================
// Canvas 基本設定
// ==========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// ==========================
// ゲーム定数
// ==========================
const ASTEROID_COUNT = 10;
const ASTEROID_RADIUS = 12;
const MAX_SHOTS = 5;

const FORCE_RADIUS = 140;
const FORCE_POWER = 6;

// ==========================
// 星空背景
// ==========================
const STAR_COUNT = 300;
let stars = [];

function createStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.8 + 0.2
    });
  }
}
createStars();

// ==========================
// 状態管理
// ==========================
let asteroids = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let gameState = "playing";

const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");

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
}
createAsteroids();

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
  if (gameState !== "playing") return;

  asteroids.forEach(a => {
    if (!a.alive) return;

    a.x += a.vx;
    a.y += a.vy;

    if (a.x < ASTEROID_RADIUS || a.x > canvas.width - ASTEROID_RADIUS) {
      a.vx *= -1;
    }
    if (a.y < ASTEROID_RADIUS || a.y > canvas.height - ASTEROID_RADIUS) {
      a.vy *= -1;
    }
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

  const alive = asteroids.filter(a => a.alive).length;
  if (alive === 0) {
    gameState = "clear";
    messageEl.textContent = "CLEAR";
  } else if (shotsLeft <= 0) {
    gameState = "over";
    messageEl.textContent = "GAME OVER";
  }

  shotsEl.textContent = `shots: ${shotsLeft}`;
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 黒背景
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 星空
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  });

  // 惑星
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