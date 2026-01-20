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
const GAME_TIME = 60; // 秒

// ==========================
// 背景星雲
// ==========================
const NEBULA_COUNT = 4;
const nebulas = [];

function createNebulas() {
  nebulas.length = 0;
  for (let i = 0; i < NEBULA_COUNT; i++) {
    const r = Math.random() * 500 + 400;
    nebulas.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r,
      color: Math.random() > 0.5 ? "120,160,255" : "180,120,255",
      alpha: Math.random() * 0.02 + 0.015,
      vx: (Math.random() - 0.5) * 0.01,
      vy: (Math.random() - 0.5) * 0.01
    });
  }
}
createNebulas();

// ==========================
// 背景星
// ==========================
const STAR_COUNT = 450;
const stars = [];

function createStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r: Math.random() * 0.8 + 0.2,
      alpha: Math.random() * 0.6 + 0.4,
      glow: Math.random() * 5 + 4,
      speed: Math.random() * 0.03 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      colorOffset: Math.random() * 30 - 15
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
let gameState = "title"; // title / playing
let score = 0;
let highScore = 0;
let currentShotCollisions = 0;
let timeLeft = GAME_TIME;

// ==========================
// DOM
// ==========================
const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");

// ==========================
// 小惑星生成
// ==========================
function createAsteroids(isFullReset = false) {
  asteroids = [];
  if (isFullReset) shotsLeft = MAX_SHOTS;
  waitingNext = false;
  currentShotCollisions = 0;

  while (asteroids.length < ASTEROID_COUNT) {
    const x = Math.random() * (viewWidth - 100) + 50;
    const y = Math.random() * (viewHeight - 100) + 50;

    const overlap = asteroids.some(a =>
      Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2.5
    );
    if (overlap) continue;

    asteroids.push({ x, y, vx: 0, vy: 0, alive: true });
  }

  if (isFullReset) timeLeft = GAME_TIME; 
}

// ==========================
// 入力
// ==========================
canvas.addEventListener("pointerdown", e => {
  if (gameState !== "playing" || shotsLeft <= 0) return;
  drawing = true;
  trajectory = [{ x: e.clientX, y: e.clientY }];
  currentShotCollisions = 0; // 新ショットでボーナスリセット
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
  // 星雲
  nebulas.forEach(n => {
    n.x += n.vx;
    n.y += n.vy;
    if (n.x < -n.r) n.x = viewWidth + n.r;
    if (n.x > viewWidth + n.r) n.x = -n.r;
    if (n.y < -n.r) n.y = viewHeight + n.r;
    if (n.y > viewHeight + n.r) n.y = -n.r;
  });

  // 星
  stars.forEach(s => {
    s.x -= s.speed;
    s.y -= s.speed;
    if (s.x < 0) s.x = viewWidth;
    if (s.y < 0) s.y = viewHeight;
    s.twinklePhase += 0.02;
  });

  if (gameState !== "playing") return;

  // タイマー更新（固定フォント）
  timeLeft -= 1/60;
  if (timeLeft <= 0) {
    messageEl.textContent = "GAMEOVER";
    if (score > highScore) highScore = score;
    gameState = "title";
    startBtn.style.display = "block";
    timeLeft = GAME_TIME;
    return;
  }

  // 惑星移動
  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    if (a.x < ASTEROID_RADIUS || a.x > viewWidth - ASTEROID_RADIUS) a.vx *= -1;
    if (a.y < ASTEROID_RADIUS || a.y > viewHeight - ASTEROID_RADIUS) a.vy *= -1;
  });

  // 惑星衝突
  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i];
      const b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < ASTEROID_RADIUS * 2) {
        a.alive = false;
        b.alive = false;

        currentShotCollisions++;
        const bonusMultiplier = Math.pow(1.5, currentShotCollisions - 1);
        score += Math.round(10 * bonusMultiplier);
      }
    }
  }

  // 全消しで次ステージ生成（指数ボーナスリセット）
  if (asteroids.every(a => !a.alive) && !waitingNext) {
    waitingNext = true;
    setTimeout(() => {
      createAsteroids(false);
      currentShotCollisions = 0; 
      waitingNext = false;
    }, 700);
  }

  shotsEl.textContent = `SHOTS: ${shotsLeft}`;
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  // 星雲
  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color}, ${n.alpha * 1.8})`);
    g.addColorStop(0.5, `rgba(${n.color}, ${n.alpha * 0.6})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 星
  stars.forEach(s => {
    const colorR = 255;
    const colorG = 255 - s.colorOffset;
    const colorB = 255 - s.colorOffset;
    const twinkle = Math.sin(s.twinklePhase) * 0.4 + 0.6;
    ctx.shadowBlur = s.glow;
    ctx.shadowColor = `rgba(255,255,255,${s.alpha * twinkle})`;
    ctx.fillStyle = `rgba(${colorR},${colorG},${colorB},${s.alpha * twinkle})`;
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

  // タイトル
  if (gameState === "title") {
    const text = "Trajectory Chain";
    let fontSize = 56;
    ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
    let textWidth = ctx.measureText(text).width;
    if (textWidth > viewWidth - 40) {
      fontSize *= (viewWidth - 40) / textWidth;
      ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 5; i > 0; i--) {
      ctx.shadowBlur = i * 12;
      ctx.shadowColor = `rgba(150,200,255,${0.05 * i})`;
      ctx.fillStyle = "white";
      ctx.fillText(text, viewWidth / 2, viewHeight / 2 - 20);
    }
    ctx.shadowBlur = 0;
  }

  // SHOTS 左上
  ctx.font = "13px 'Orbitron', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "white";
  ctx.fillText(`SHOTS: ${shotsLeft}`, 20, 16);

  // TIME 中央上（固定フォント）
  ctx.textAlign = "center";
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60).toString().padStart(2, "0");
  const milliseconds = Math.floor((timeLeft % 1) * 100).toString().padStart(2, "0");
  ctx.fillText(`TIME: ${minutes}:${seconds}.${milliseconds}`, viewWidth / 2, 16);

  // SCORE / HIGH SCORE 右上
  ctx.textAlign = "right";
  if (gameState === "title") {
    ctx.fillText(`HIGH SCORE: ${highScore}`, viewWidth - 20, 16);
  } else {
    ctx.fillText(`SCORE: ${score}`, viewWidth - 20, 16);
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

// ==========================
// スタート
// ==========================
startBtn.addEventListener("click", () => {
  gameState = "playing";
  startBtn.style.display = "none";
  messageEl.textContent = "";
  createAsteroids(true);
  currentShotCollisions = 0;
});