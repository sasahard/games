const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const ui = document.getElementById("ui");
const scoreEl = document.getElementById("score");
const triesEl = document.getElementById("tries");

let width, height;
let score = 0;
let tries = 3;
let gameActive = false;

// ブラックホール
const blackHole = {
  x: 0,
  y: 0,
  r: 30
};

// 惑星
let planets = [];

// 入力用
let drawing = false;
let rawPoints = [];

// ==============================
// リサイズ
// ==============================
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  blackHole.x = width / 2;
  blackHole.y = height / 2;
}
window.addEventListener("resize", resize);

// ==============================
// ゲーム開始
// ==============================
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";
  ui.style.display = "flex";

  resize();
  initGame();
  gameActive = true;
  requestAnimationFrame(loop);
});

function initGame() {
  score = 0;
  tries = 3;
  updateUI();

  planets = [];
  for (let i = 0; i < 6; i++) {
    planets.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 12,
      captured: false
    });
  }
}

// ==============================
// 入力処理
// ==============================
canvas.addEventListener("pointerdown", e => {
  if (!gameActive || tries <= 0) return;
  drawing = true;
  rawPoints = [{ x: e.clientX, y: e.clientY }];
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  rawPoints.push({ x: e.clientX, y: e.clientY });
});

canvas.addEventListener("pointerup", () => {
  if (!drawing) return;
  drawing = false;
  tries--;
  checkCapture();
  updateUI();
});

// ==============================
// ベジェ曲線補間
// ==============================
function getBezierPoints(points, segments = 20) {
  if (points.length < 3) return [];

  const result = [];
  for (let i = 0; i < points.length - 2; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];

    for (let t = 0; t <= 1; t += 1 / segments) {
      const x =
        (1 - t) * (1 - t) * p0.x +
        2 * (1 - t) * t * p1.x +
        t * t * p2.x;
      const y =
        (1 - t) * (1 - t) * p0.y +
        2 * (1 - t) * t * p1.y +
        t * t * p2.y;

      result.push({ x, y });
    }
  }
  return result;
}

// ==============================
// 捕捉判定（ベジェ上）
// ==============================
function checkCapture() {
  const curvePoints = getBezierPoints(rawPoints);

  planets.forEach(p => {
    if (p.captured) return;

    curvePoints.forEach(pt => {
      const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (dist < p.r + 6) {
        p.captured = true;
        score += 10;
      }
    });
  });
}

// ==============================
// UI更新
// ==============================
function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  triesEl.textContent = `Tries: ${tries}`;
}

// ==============================
// 描画
// ==============================
function draw() {
  ctx.clearRect(0, 0, width, height);

  // ブラックホール
  ctx.beginPath();
  ctx.arc(blackHole.x, blackHole.y, blackHole.r, 0, Math.PI * 2);
  ctx.fillStyle = "purple";
  ctx.fill();

  // 惑星
  planets.forEach(p => {
    if (p.captured) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "skyblue";
    ctx.fill();
  });

  // ベジェ軌道描画
  if (rawPoints.length >= 3) {
    const curve = getBezierPoints(rawPoints);
    ctx.beginPath();
    ctx.moveTo(curve[0].x, curve[0].y);
    curve.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ==============================
// ループ
// ==============================
function loop() {
  if (!gameActive) return;

  draw();

  if (tries <= 0) {
    gameActive = false;
    setTimeout(() => {
      alert(`Game Over\nScore: ${score}`);
      location.reload();
    }, 300);
    return;
  }

  requestAnimationFrame(loop);
}