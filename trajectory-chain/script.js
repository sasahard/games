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
const ASTEROID_SCALE = 1.5; // 画像表示倍率
const MAX_SHOTS = 5;
const FORCE_RADIUS = 140;
const FORCE_POWER = 6;
const TIME_LIMIT = 60; // 秒
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
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let waitingNext = false;
let gameState = "title"; // title / playing
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
    const overlap = asteroids.some(a => Math.hypot(a.x - x, a.y - y) < ASTEROID_RADIUS * 2 * ASTEROID_SCALE * 1.2);
    if (overlap) continue;

    const img = asteroidImages[Math.floor(Math.random() * ASTEROID_IMAGE_COUNT)];
    asteroids.push({
      x,
      y,
      vx: 0,
      vy: 0,
      alive: true,
      img,
      radius: ASTEROID_RADIUS * ASTEROID_SCALE, // 当たり判定用半径
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

  // タイマー
  if (timerActive) {
    timeLeft -= 1/60;
    if (timeLeft <= 0) {
      timeLeft = 0;
      timerActive = false;
      messageEl.textContent = "GAME OVER";
      sounds.gameover.currentTime = 0;
      sounds.gameover.play();

      asteroids.forEach(a => a.alive = false);

      setTimeout(() => {
        gameState = "title";
        messageEl.textContent = "";
        if (score > highScore) highScore = score;
        score = 0;
        startBtn.style.display = "inline-block";
        infoBtn.style.display = "inline-block";
      }, 1000);
    }
  }

  // 惑星移動 & 回転
  asteroids.forEach(a => {
    if (!a.alive) return;
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotationSpeed;

    if (a.x < a.radius || a.x > viewWidth - a.radius) a.vx *= -1;
    if (a.y < a.radius || a.y > viewHeight - a.radius) a.vy *= -1;
  });

  // 惑星衝突
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

        currentShotCollisions++;
        const bonusMultiplier = Math.pow(1.5, currentShotCollisions - 1);
        score += Math.round(10 * bonusMultiplier);
      }
    }
  }

  // 全消しで自動再描画
  if (asteroids.every(a => !a.alive) && !waitingNext) {
    waitingNext = true;

    setTimeout(() => {
      sounds.stageclear.currentTime = 0;
      sounds.stageclear.play();

      createAsteroids();
      waitingNext = false;
      timeLeft = TIME_LIMIT;
    }, 10);
  }
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

  // 惑星描画（回転付き）
  asteroids.forEach(a => {
    if (!a.alive || !a.img.complete) return;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.drawImage(
      a.img,
      -a.radius,
      -a.radius,
      a.radius * 2,
      a.radius * 2
    );
    ctx.restore();
  });

  // タイトル
  if (gameState === "title") {
    const text = "Trajectory Chain";
    let fontSize = 56;
    ctx.font = `bold ${fontSize}px 'Orbitron', sans-serif`;
    let textWidth = ctx.measureText(text).width;
    const maxWidth = viewWidth * 0.9;
    if (textWidth > maxWidth) {
      fontSize = fontSize * maxWidth / textWidth;
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

  ctx.font = "13px 'Orbitron',sans-serif";
  ctx.textBaseline = "top";

  // SHOTS 左上
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  if (gameState === "playing") ctx.fillText(`SHOTS: ${shotsLeft}`, 20, 16);

  // TIME 中央
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  if (gameState === "playing") {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60).toString().padStart(2,"0");
    ctx.fillText(`TIME: ${minutes}:${seconds}`, viewWidth / 2, 16);
  }

  // SCORE / HIGH SCORE 右上
  ctx.textAlign = "right";
  ctx.fillStyle = "white";
  if (gameState === "title") ctx.fillText(`HIGH SCORE: ${highScore}`, viewWidth-20,16);
  else ctx.fillText(`SCORE: ${score}`, viewWidth-20,16);
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
  currentShotCollisions = 0;
});

// ==========================
// INFOボタン
// ==========================
infoBtn.addEventListener("click", () => {
  infoModal.style.display = "flex";
});
closeInfo.addEventListener("click", () => {
  infoModal.style.display = "none";
});