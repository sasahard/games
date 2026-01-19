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
// 定数
// ==========================
const ASTEROID_COUNT = 10;
const ASTEROID_RADIUS = 12;
const MAX_SHOTS = 5;

const FORCE_RADIUS = 140;
const FORCE_POWER = 6;

// ==========================
// 背景: 星雲 & 星
// ==========================
const STAR_COUNT = 350;
const stars = [];
const nebulas = [];

// 星生成
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * viewWidth,
    y: Math.random() * viewHeight,
    r: Math.random() * 0.8 + 0.3,
    alpha: Math.random() * 0.6 + 0.4,
    glow: Math.random() * 8 + 4,
    speedX: -0.02 - Math.random() * 0.03,
    speedY: -0.01 - Math.random() * 0.02,
    twinklePhase: Math.random() * Math.PI * 2
  });
}

// 星雲生成
for (let i = 0; i < 5; i++) {
  nebulas.push({
    x: Math.random() * viewWidth,
    y: Math.random() * viewHeight,
    r: Math.random() * 600 + 400,
    color: Math.random() > 0.5 ? "120,160,255" : "180,120,255",
    alpha: Math.random() * 0.03 + 0.02,
    vx: (Math.random() - 0.5) * 0.01,
    vy: (Math.random() - 0.5) * 0.01
  });
}

// ==========================
// 状態
// ==========================
let asteroids = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let gameState = "title"; // title / playing / ready

const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

// ==========================
// 小惑星生成
// ==========================
function createAsteroids() {
  asteroids = [];
  shotsLeft = MAX_SHOTS;

  while (asteroids.length < ASTEROID_COUNT) {
    const x = Math.random() * (viewWidth - 100) + 50;
    const y = Math.random() * (viewHeight - 100) + 50;
    const overlap = asteroids.some(a => Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2.5);
    if (overlap) continue;

    asteroids.push({ x, y, vx: 0, vy: 0, alive: true });
  }
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
// 更新
// ==========================
function update() {
  // 背景更新
  stars.forEach(s => {
    s.x += s.speedX;
    s.y += s.speedY;
    if (s.x < 0) s.x = viewWidth;
    if (s.y < 0) s.y = viewHeight;
    s.twinklePhase += 0.05;
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

  if (asteroids.filter(a => a.alive).length === 0 && gameState === "playing") {
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
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // 星雲（最奥）
  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.alpha * 2})`);
    g.addColorStop(0.5, `rgba(${n.color}, ${n.alpha * 0.6})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 星（前）
  stars.forEach(s => {
    const alpha = s.alpha * (Math.sin(s.twinklePhase) * 0.3 + 0.7); // sinで瞬き
    ctx.shadowBlur = s.glow;
    ctx.shadowColor = "white";
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // タイトル
  if (gameState === "title") {
    const t = "Trajectory Chain";
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 中心白
    ctx.fillStyle = "#ffffff";
    ctx.fillText(t, viewWidth / 2, viewHeight * 0.35);

    // 青白グロー
    ctx.shadowColor = "rgba(150,220,255,0.7)";
    ctx.shadowBlur = 20 + Math.sin(Date.now() * 0.005) * 10;
    ctx.fillText(t, viewWidth / 2, viewHeight * 0.35);
    ctx.shadowBlur = 0;
  }

  // 惑星
  if (gameState === "playing") {
    asteroids.forEach(a => {
      if (!a.alive) return;
      ctx.beginPath();
      ctx.arc(a.x, a.y, ASTEROID_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });
  }
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