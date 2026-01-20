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
let highScore = 0;
let timeLeft = TIME_LIMIT;
let timerActive = false;

// ==========================
// UI
// ==========================
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
startBtn.disabled = true;

for (let i = 1; i <= ASTEROID_IMAGE_COUNT; i++) {
  const img = new Image();
  img.src = `images/asteroid${i}.png`;
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === ASTEROID_IMAGE_COUNT) {
      startBtn.disabled = false;
    }
  };
  asteroidImages.push(img);
}

// ==========================
// 小惑星生成
// ==========================
function createAsteroids() {
  asteroids = [];
  shotsLeft = MAX_SHOTS;
  timeLeft = TIME_LIMIT;
  timerActive = true;

  while (asteroids.length < ASTEROID_COUNT) {
    const radius = ASTEROID_RADIUS * ASTEROID_SCALE;
    const x = Math.random() * (viewWidth - radius * 2) + radius;
    const y = Math.random() * (viewHeight - radius * 2) + radius;

    if (asteroids.some(a => Math.hypot(a.x - x, a.y - y) < radius * 2.2)) continue;

    asteroids.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      img: asteroidImages[Math.floor(Math.random() * ASTEROID_IMAGE_COUNT)],
      angle: Math.random() * Math.PI * 2,
      rot: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
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
// 軌跡 → 力
// ==========================
function applyTrajectoryForce() {
  if (trajectory.length < 2) return;
  const s = trajectory[0];
  const e = trajectory.at(-1);
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
// 粒子生成（軽量炎）
function spawnParticles(x, y, baseRadius) {
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 1.2 + 0.3;
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      r: baseRadius * (Math.random() * 0.6 + 0.7),
      a: 1,
      d: Math.random() * 0.06 + 0.05,
      c: ["#ffd700", "#ff9a00", "#ff4500"][Math.floor(Math.random() * 3)]
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
    sounds.gameover.play();
    asteroids = [];
    gameState = "title";
    startBtn.style.display = "inline-block";
    infoBtn.style.display = "inline-block";
    return;
  }

  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rot;

    if (a.x < a.radius || a.x > viewWidth - a.radius) a.vx *= -1;
    if (a.y < a.radius || a.y > viewHeight - a.radius) a.vy *= -1;
  });

  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i], b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
        a.alive = b.alive = false;
        spawnParticles(a.x, a.y, a.radius);
        sounds.collision.currentTime = 0;
        sounds.collision.play();
        score += 10;
      }
    }
  }

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.a -= p.d;
  });
  particles = particles.filter(p => p.a > 0);

  if (asteroids.every(a => !a.alive) && asteroids.length) {
    sounds.stageclear.play();
    createAsteroids();
  }
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
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.c;
    ctx.shadowBlur = p.r * 1.2;
    ctx.shadowColor = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
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
// ボタン
// ==========================
startBtn.addEventListener("click", () => {
  if (imagesLoaded < ASTEROID_IMAGE_COUNT) return;
  gameState = "playing";
  startBtn.style.display = "none";
  infoBtn.style.display = "none";
  score = 0;
  createAsteroids();
});

infoBtn.addEventListener("click", () => infoModal.style.display = "flex");
closeInfo.addEventListener("click", () => infoModal.style.display = "none");