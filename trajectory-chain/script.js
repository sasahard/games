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
// 衝撃波・フラッシュ
// ==========================
const shockwaves = [];
let flashAlpha = 0;

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
let gameState = "title";
let score = 0;
let currentShotCollisions = 0;
let highScore = 0;
let timeLeft = TIME_LIMIT;
let timerActive = false;

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
  waitingNext = false;
  currentShotCollisions = 0;
  timeLeft = TIME_LIMIT;
  timerActive = true;

  while (asteroids.length < ASTEROID_COUNT) {
    const x = Math.random() * (viewWidth - 100) + 50;
    const y = Math.random() * (viewHeight - 100) + 50;
    const overlap = asteroids.some(a => Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2 * ASTEROID_SCALE * 1.2);
    if (overlap) continue;

    const img = asteroidImages[Math.floor(Math.random() * ASTEROID_IMAGE_COUNT)];
    asteroids.push({
      x, y, vx: 0, vy: 0, alive: true, img,
      radius: ASTEROID_RADIUS * ASTEROID_SCALE,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1)
    });
  }
}

// ==========================
// 衝撃波生成
// ==========================
function spawnShockwave(x, y) {
  shockwaves.push({ x, y, r: 0, life: 0 });
  flashAlpha = 0.35;
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
    s.x -= s.speed;
    s.y -= s.speed;
    if (s.x < 0) s.x = viewWidth;
    if (s.y < 0) s.y = viewHeight;
    s.twinklePhase += 0.02;
  });

  flashAlpha *= 0.85;

  shockwaves.forEach(w => {
    w.life++;
    w.r += 6;
  });
  while (shockwaves.length && shockwaves[0].life > 30) shockwaves.shift();

  if (gameState !== "playing") return;

  timeLeft -= 1 / 60;
  if (timeLeft <= 0) {
    timeLeft = 0;
    gameState = "title";
    messageEl.textContent = "GAME OVER";
    sounds.gameover.play();
    asteroids.forEach(a => a.alive = false);
    startBtn.style.display = "inline-block";
    infoBtn.style.display = "inline-block";
  }

  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotationSpeed;
  });

  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i];
      const b = asteroids[j];
      if (!a.alive || !b.alive) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
        a.alive = b.alive = false;
        sounds.collision.currentTime = 0;
        sounds.collision.play();
        spawnShockwave((a.x + b.x) / 2, (a.y + b.y) / 2);
        currentShotCollisions++;
        score += Math.round(10 * Math.pow(1.5, currentShotCollisions - 1));
      }
    }
  }
}

// ==========================
// 描画
// ==========================
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(${n.color},${n.alpha})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();
  });

  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.drawImage(a.img, -a.radius, -a.radius, a.radius * 2, a.radius * 2);
    ctx.restore();
  });

  shockwaves.forEach(w => {
    const p = w.life / 30;
    const alpha = Math.sin(p * Math.PI);
    ctx.strokeStyle = `rgba(200,220,255,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  if (flashAlpha > 0.01) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  ctx.fillStyle = "white";
  ctx.font = "13px Orbitron";
  if (gameState === "playing") {
    ctx.fillText(`SHOTS: ${shotsLeft}`, 20, 16);
    ctx.fillText(`TIME: ${Math.floor(timeLeft)}`, viewWidth / 2, 16);
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${score}`, viewWidth - 20, 16);
  }
}

// ==========================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// ==========================
startBtn.disabled = true;
startBtn.addEventListener("click", () => {
  if (imagesLoaded < ASTEROID_IMAGE_COUNT) return;
  gameState = "playing";
  startBtn.style.display = "none";
  infoBtn.style.display = "none";
  messageEl.textContent = "";
  createAsteroids();
});