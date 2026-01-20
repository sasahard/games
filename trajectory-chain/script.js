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
// 演出用
// ==========================
let screenFlash = 0;
const shockwaves = [];

// ==========================
// 背景星雲
// ==========================
const NEBULA_COUNT = 4;
const nebulas = [];
function createNebulas() {
  nebulas.length = 0;
  for (let i = 0; i < NEBULA_COUNT; i++) {
    nebulas.push({
      x: Math.random() * viewWidth,
      y: Math.random() * viewHeight,
      r: Math.random() * 500 + 400,
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
    const overlap = asteroids.some(a => Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2 * ASTEROID_SCALE);
    if (overlap) continue;

    asteroids.push({
      x,
      y,
      vx: 0,
      vy: 0,
      alive: true,
      img: asteroidImages[Math.floor(Math.random() * ASTEROID_IMAGE_COUNT)],
      radius: ASTEROID_RADIUS * ASTEROID_SCALE,
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1)
    });
  }
}

// ==========================
// 更新
// ==========================
function update() {
  if (screenFlash > 0) screenFlash -= 0.08;

  shockwaves.forEach(w => {
    w.r += w.speed;
    w.life -= 1;
  });
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
  }

  if (gameState !== "playing") return;

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
        a.alive = false;
        b.alive = false;

        sounds.collision.currentTime = 0;
        sounds.collision.play();

        screenFlash = 1;
        shockwaves.push({ x: a.x, y: a.y, r: 0, speed: 6, life: 25 });
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

  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.drawImage(a.img, -a.radius, -a.radius, a.radius * 2, a.radius * 2);
    ctx.restore();
  });

  shockwaves.forEach(w => {
    const alpha = Math.sin((w.life / 25) * Math.PI);
    ctx.strokeStyle = `rgba(180,220,255,${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.stroke();
  });

  if (screenFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${screenFlash * 0.25})`;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
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
startBtn.disabled = true;
startBtn.addEventListener("click", () => {
  if (imagesLoaded < ASTEROID_IMAGE_COUNT) return;
  gameState = "playing";
  startBtn.style.display = "none";
  infoBtn.style.display = "none";
  messageEl.textContent = "";
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