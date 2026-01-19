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
// 背景：星雲 & 星
// ==========================
const STAR_COUNT = 520;
const stars = [];
const nebulas = [];

// 星生成
for (let i = 0; i < STAR_COUNT; i++) {
  const tempShift = Math.random() * 16 - 8; // 色温度の微差

  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 0.7 + 0.25,
    baseAlpha: Math.random() * 0.4 + 0.4,
    glow: Math.random() * 5 + 3,
    speed: Math.random() * 0.12 + 0.04,

    phase: Math.random() * Math.PI * 2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,

    color: {
      r: 245 + tempShift,
      g: 245,
      b: 255 - tempShift
    }
  });
}

// 星雲生成（奥）
for (let i = 0; i < 5; i++) {
  const size = Math.random() * 600 + 500;

  nebulas.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: size,
    color: Math.random() > 0.5 ? "140,170,255" : "180,130,255",
    alpha: Math.random() * 0.015 + 0.012,
    vx: (Math.random() - 0.5) * 0.025,
    vy: (Math.random() - 0.5) * 0.025
  });
}

// ==========================
// ゲーム定数（修正元そのまま）
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
let gameState = "ready"; // ready / playing

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
  if (gameState !== "playing") return;
  if (shotsLeft <= 0) return;
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
  const length = Math.hypot(dx, dy);
  if (length === 0) return;

  const nx = dx / length;
  const ny = dy / length;

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
// 更新処理（修正元維持）
// ==========================
function update() {
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
    s.phase += s.twinkleSpeed;
  });

  nebulas.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
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
      const a = asteroids[i];
      const b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < ASTEROID_RADIUS * 2) {
        a.alive = false;
        b.alive = false;
      }
    }
  }

  if (asteroids.filter(a => a.alive).length === 0) {
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
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 星雲（最奥）
  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
    g.addColorStop(0.6, `rgba(${n.color}, ${n.alpha * 0.25})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 星（前）
  stars.forEach(s => {
    const twinkle = Math.sin(s.phase) * 0.3 + 0.7;

    ctx.shadowBlur = s.glow;
    ctx.shadowColor = `rgb(${s.color.r},${s.color.g},${s.color.b})`;
    ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${s.baseAlpha * twinkle})`;

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