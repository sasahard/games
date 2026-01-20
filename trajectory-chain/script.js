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
const ASTEROID_SCALE = 1.5;
const MAX_SHOTS = 5;
const FORCE_RADIUS = 140;
const FORCE_POWER = 6;
const TIME_LIMIT = 60;
const ASTEROID_IMAGE_COUNT = 5;

// ==========================
// 効果音
// ==========================
const sounds = {
  collision: new Audio("sounds/collision.wav"),
  stageclear: new Audio("sounds/clear.wav"),
  gameover: new Audio("sounds/gameover.wav")
};

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
let particles = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let waitingNext = false;
let gameState = "title";
let score = 0;
let currentShotCollisions = 0;
let highScore = 0;
let timeLeft = TIME_LIMIT;
let timerActive = false;

const shotsEl = document.getElementById("shots");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeInfo = document.getElementById("closeInfo");

// ==========================
// 惑星画像ロード
// ==========================
const asteroidImages = [];
let imagesLoaded = 0;
for (let i = 1; i <= ASTEROID_IMAGE_COUNT; i++) {
  const img = new Image();
  img.src = `images/asteroid${i}.png`;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === ASTEROID_IMAGE_COUNT) startBtn.disabled = false;
  };
  asteroidImages.push(img);
}

// ==========================
// 小惑星生成
// ==========================
function createAsteroids() {
  asteroids = [];
  shotsLeft = MAX_SHOTS;
  waitingNext = false;
  currentShotCollisions = 0;
  timeLeft = TIME_LIMIT;
  timerActive = true;

  while (asteroids.length < ASTEROID_COUNT) {
    const x = Math.random() * (viewWidth - 100) + 50;
    const y = Math.random() * (viewHeight - 100) + 50;
    const overlap = asteroids.some(a =>
      Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2 * ASTEROID_SCALE * 1.2
    );
    if (overlap) continue;

    const img = asteroidImages[Math.floor(Math.random() * ASTEROID_IMAGE_COUNT)];
    asteroids.push({
      x, y,
      vx: 0, vy: 0,
      alive: true,
      img,
      radius: ASTEROID_RADIUS * ASTEROID_SCALE,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1)
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
  currentShotCollisions = 0;
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
  if (!len) return;

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
// 粒子生成（炎・軽量）
// ==========================
function spawnParticles(x, y, baseRadius) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.2 + 0.4;
    const size = baseRadius * (Math.random() * 0.4 + 0.6);

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: size,
      alpha: 1,
      decay: Math.random() * 0.04 + 0.03,
      stretch: Math.random() * 0.8 + 0.6
    });
  }
}

// ==========================
// 更新
// ==========================
function update() {
  if (gameState !== "playing") return;

  timeLeft -= 1 / 60;
  if (timeLeft <= 0) {
    timeLeft = 0;
    sounds.gameover.currentTime = 0;
    sounds.gameover.play();
    asteroids.forEach(a => a.alive = false);
    gameState = "title";
    startBtn.style.display = "inline-block";
    infoBtn.style.display = "inline-block";
  }

  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotationSpeed;
    if (a.x < a.radius || a.x > viewWidth - a.radius) a.vx *= -1;
    if (a.y < a.radius || a.y > viewHeight - a.radius) a.vy *= -1;
  });

  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i], b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
        a.alive = false;
        b.alive = false;

        sounds.collision.currentTime = 0;
        sounds.collision.play();

        spawnParticles(a.x, a.y, a.radius);
        spawnParticles(b.x, b.y, b.radius);

        score += 10;
      }
    }
  }

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
  });
  particles = particles.filter(p => p.alpha > 0);
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.drawImage(a.img, -a.radius, -a.radius, a.radius * 2, a.radius * 2);
    ctx.restore();
  });

  ctx.globalCompositeOperation = "lighter";
  particles.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.scale(1, p.stretch);

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
    g.addColorStop(0, `rgba(255,255,220,${p.alpha})`);
    g.addColorStop(0.4, `rgba(255,140,60,${p.alpha * 0.8})`);
    g.addColorStop(1, "rgba(255,60,0,0)");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.globalCompositeOperation = "source-over";
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
startBtn.disabled = true;
startBtn.addEventListener("click", () => {
  if (imagesLoaded < ASTEROID_IMAGE_COUNT) return;
  gameState = "playing";
  startBtn.style.display = "none";
  infoBtn.style.display = "none";
  createAsteroids();
});

// ==========================
// INFO
// ==========================
infoBtn.addEventListener("click", () => {
  infoModal.style.display = "flex";
});
closeInfo.addEventListener("click", () => {
  infoModal.style.display = "none";
});