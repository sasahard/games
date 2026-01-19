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
let baseScrollSpeed = 3; // 下方向スクロール基本速度
let tapHold = false;
let obstacles = [];
let animationId = null;

const boy = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  color: 'red'
};

// --- 障害物クラス（将来的に画像に置換可能） ---
class Obstacle {
  constructor() {
    this.width = 40;
    this.height = 40;
    this.x = Math.random() * (canvas.width - 40);
    this.y = -50;
    this.verticalSpeed = baseScrollSpeed; // 下方向速度
    // 横方向 ±2~5px/frame
    this.horizontalSpeed = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3);
    this.color = 'black';
  }

  update() {
    const currentSpeed = tapHold ? this.verticalSpeed * 0.5 : this.verticalSpeed;
    this.y += currentSpeed;
    this.x += this.horizontalSpeed;

    // 画面端で跳ね返す
    if (this.x < 0) { this.x = 0; this.horizontalSpeed *= -1; }
    if (this.x + this.width > canvas.width) { this.x = canvas.width - this.width; this.horizontalSpeed *= -1; }
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
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
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentSpeed = tapHold ? baseScrollSpeed * 0.5 : baseScrollSpeed;

  // スコア更新（下方向スクロール距離）
  score += currentSpeed;
  document.getElementById('score').innerText = Math.floor(score) + ' m';

  // 障害物生成
  if (Math.random() < 0.02) obstacles.push(new Obstacle());

  // 障害物更新・描画
  obstacles.forEach((obs, index) => {
    obs.update();
    obs.draw();

    if (checkCollision(obs)) endGame();

    if (obs.y > canvas.height + 50) obstacles.splice(index, 1);
  });

  // 少年描画
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