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

// 軌跡による力場
const FORCE_RADIUS = 140;
const FORCE_POWER = 6;

// ==========================
// 状態管理
// ==========================
let asteroids = [];
let shotsLeft = MAX_SHOTS;
let trajectory = [];
let drawing = false;
let gameState = "playing"; // playing / clear / over

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
// 入力：軌跡を描く
// ==========================
canvas.addEventListener("pointerdown", (e) => {
  if (gameState !== "playing") return;
  if (shotsLeft <= 0) return;

  drawing = true;
  trajectory = [{ x: e.clientX, y: e.clientY }];
});

canvas.addEventListener("pointermove", (e) => {
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
// 軌跡 → 力場を適用
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
      const ddx = a.x - p.x;
      const ddy = a.y - p.y;
      const d = Math.hypot(ddx, ddy);
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
// 更新処理
// ==========================
function update() {
  if (gameState !== "playing") return;

  asteroids.forEach(a => {
    if (!a.alive) return;

    a.x += a.vx;
    a.y += a.vy;

    // 画面端反射
    if (a.x < ASTEROID_RADIUS || a.x > canvas.width - ASTEROID_RADIUS) {
      a.vx *= -1;
    }
    if (a.y < ASTEROID_RADIUS || a.y > canvas.height - ASTEROID_RADIUS) {
      a.vy *= -1;
    }
  });

  // 衝突判定
  for (let i = 0; i < asteroids.length; i++) {
    for (let j = i + 1; j < asteroids.length; j++) {
      const a = asteroids[i];
      const b = asteroids[j];
      if (!a.alive || !b.alive) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);

      if (dist < ASTEROID_RADIUS * 2) {
        a.alive = false;
        b.alive = false;
      }
    }
  }

  const aliveCount = asteroids.filter(a => a.alive).length;

  if (aliveCount === 0) {
    gameState = "clear";
    messageEl.textContent = "CLEAR";
  } else if (shotsLeft <= 0) {
    gameState = "over";
    messageEl.textContent = "GAME OVER";
  }

  shotsEl.textContent = `shots: ${shotsLeft}`;
}

// ==========================
// 描画処理
// ==========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 小惑星
  asteroids.forEach(a => {
    if (!a.alive) return;
    ctx.beginPath();
    ctx.arc(a.x, a.y, ASTEROID_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  });

  // 重力フィールド風・軌跡
  if (trajectory.length > 1) {
    ctx.save();

    const layers = [
      { width: 22, alpha: 0.04, blur: 36 },
      { width: 12, alpha: 0.07, blur: 22 },
      { width: 5,  alpha: 0.12, blur: 10 }
    ];

    layers.forEach(layer => {
      ctx.beginPath();
      ctx.moveTo(trajectory[0].x, trajectory[0].y);
      trajectory.forEach(p => ctx.lineTo(p.x, p.y));

      ctx.strokeStyle = `rgba(170, 220, 255, ${layer.alpha})`;
      ctx.lineWidth = layer.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(160, 210, 255, 0.6)";
      ctx.shadowBlur = layer.blur;

      ctx.stroke();
    });

    ctx.restore();
  }
}

// ==========================
// メインループ
// ==========================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();