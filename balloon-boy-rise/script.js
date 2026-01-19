const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameOver = false;
let score = 0;
let baseScrollSpeed = 0.01; // バルーン上昇速度
let tapHold = false;
let obstacles = [];
let animationId = null;
let lastTime = null;

// --- 少年（風船） ---
const boy = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 16,
  color: 'red',
  targetX: canvas.width / 2
};

// --- 障害物クラス ---
class Obstacle {
  constructor() {
    this.width = 32;
    this.height = 32;
    this.y = Math.random() * canvas.height * 0.8; // ランダム
    if (Math.random() < 0.5) {
      this.x = -this.width;
      this.speedX = 0.5 + Math.random() * 0.3; // ゆっくり横移動
    } else {
      this.x = canvas.width;
      this.speedX = -(0.5 + Math.random() * 0.3);
    }
    this.color = 'black';
  }

  update(currentSpeed) {
    this.x += this.speedX; // 横移動
    this.y += currentSpeed; // 下方向に流れる
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  isOutOfScreen() {
    return this.x + this.width < 0 || this.x > canvas.width || this.y > canvas.height + 50;
  }
}

// --- 衝突判定 ---
function checkCollision(rect) {
  const distX = Math.abs(boy.x - rect.x - rect.width / 2);
  const distY = Math.abs(boy.y - rect.y - rect.height / 2);
  if (distX > (rect.width / 2 + boy.radius)) return false;
  if (distY > (rect.height / 2 + boy.radius)) return false;
  if (distX <= rect.width / 2) return true;
  if (distY <= rect.height / 2) return true;
  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return dx * dx + dy * dy <= boy.radius * boy.radius;
}

// --- ゲームループ ---
function gameLoop(timestamp) {
  if (gameOver) return;

  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // バルーン上昇速度（タップで減速）
  const currentSpeed = tapHold ? baseScrollSpeed * 0.5 : baseScrollSpeed;

  // スコア更新
  score += currentSpeed * delta * 60;
  document.getElementById('score').innerText = score.toFixed(2) + ' m';

  // --- 障害物生成 ---
  if (Math.random() < 0.02) obstacles.push(new Obstacle());

  // --- 障害物更新・描画 ---
  obstacles.forEach((obs, index) => {
    obs.update(currentSpeed); // 下に流す
    obs.draw();

    if (checkCollision(obs)) endGame();

    if (obs.isOutOfScreen()) obstacles.splice(index, 1);
  });

  // --- 少年横揺れ（ふわふわ） ---
  if (!boy.targetX || Math.random() < 0.01) {
    boy.targetX = canvas.width / 2 + (Math.random() * 64 - 32); // ±32px
  }
  boy.x += (boy.targetX - boy.x) * 0.05;

  // --- 少年描画 ---
  ctx.beginPath();
  ctx.arc(boy.x, boy.y, boy.radius, 0, Math.PI * 2);
  ctx.fillStyle = boy.color;
  ctx.fill();
  ctx.closePath();

  animationId = requestAnimationFrame(gameLoop);
}

// --- ゲームオーバー ---
function endGame() {
  gameOver = true;
  document.getElementById('game-over').classList.remove('hidden');
  if (animationId) cancelAnimationFrame(animationId);
}

// --- リトライ ---
document.getElementById('retry-button').addEventListener('click', () => {
  resetGame();
  startGame();
});

// --- タップ操作 ---
canvas.addEventListener('mousedown', () => tapHold = true);
canvas.addEventListener('mouseup', () => tapHold = false);
canvas.addEventListener('touchstart', () => tapHold = true);
canvas.addEventListener('touchend', () => tapHold = false);

// --- スタート画面 ---
const startScreen = document.getElementById('start-screen');
startScreen.addEventListener('click', () => {
  resetGame();
  startGame();
});

// --- 初期化 ---
function resetGame() {
  gameOver = false;
  obstacles = [];
  score = 0;
  lastTime = null;
  boy.x = canvas.width / 2;
  boy.targetX = canvas.width / 2;
  startScreen.classList.remove('hidden');
  document.getElementById('game-over').classList.add('hidden');
}

// --- ゲーム開始 ---
function startGame() {
  startScreen.classList.add('hidden');
  animationId = requestAnimationFrame(gameLoop);
}

// 初期表示
resetGame();