// ゲーム基本設定
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let gameOver = false;
let score = 0;
let speed = 2;
let tapHold = false;
let obstacles = [];

// 少年キャラクター
const boy = {
  x: window.innerWidth / 2,
  y: window.innerHeight - 100,
  radius: 20,
  color: 'red'
};

// 障害物クラス
class Obstacle {
  constructor() {
    this.width = 40;
    this.height = 40;
    this.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
    this.y = Math.random() * (canvas.height - 100);
    this.speed = 3 + Math.random() * 2;
    this.direction = this.x < 0 ? 1 : -1;
    this.color = 'black';
  }

  update() {
    this.x += this.speed * this.direction;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// 衝突判定
function checkCollision(rect) {
  const distX = Math.abs(boy.x - rect.x - rect.width / 2);
  const distY = Math.abs(boy.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + boy.radius)) return false;
  if (distY > (rect.height / 2 + boy.radius)) return false;

  if (distX <= rect.width / 2) return true;
  if (distY <= rect.height / 2) return true;

  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (boy.radius * boy.radius));
}

// ゲームループ
function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 上昇速度調整
  const currentSpeed = tapHold ? speed * 0.3 : speed;
  boy.y -= currentSpeed;
  score += currentSpeed;

  // スコア表示
  document.getElementById('score').innerText = Math.floor(score) + ' m';

  // 障害物生成
  if (Math.random() < 0.02) {
    obstacles.push(new Obstacle());
  }

  // 障害物更新・描画
  obstacles.forEach((obs, index) => {
    obs.update();
    obs.draw();

    if (checkCollision(obs)) {
      endGame();
    }

    if (obs.x < -100 || obs.x > canvas.width + 100) {
      obstacles.splice(index, 1);
    }
  });

  // 少年描画
  ctx.beginPath();
  ctx.arc(boy.x, boy.y, boy.radius, 0, Math.PI * 2);
  ctx.fillStyle = boy.color;
  ctx.fill();
  ctx.closePath();

  requestAnimationFrame(gameLoop);
}

// ゲームオーバー
function endGame() {
  gameOver = true;
  document.getElementById('game-over').classList.remove('hidden');
}

// リトライ
document.getElementById('retry-button').addEventListener('click', () => {
  resetGame();
  startGame();
});

// タップ操作
canvas.addEventListener('mousedown', () => tapHold = true);
canvas.addEventListener('mouseup', () => tapHold = false);
canvas.addEventListener('touchstart', () => tapHold = true);
canvas.addEventListener('touchend', () => tapHold = false);

// ゲーム開始ボタン
const startScreen = document.getElementById('start-screen');
startScreen.addEventListener('click', () => {
  resetGame();
  startGame();
});

// 初期化
function resetGame() {
  gameOver = false;
  obstacles = [];
  boy.y = canvas.height - 100;
  score = 0;
  document.getElementById('game-over').classList.add('hidden');
  startScreen.classList.add('hidden');
}

// ゲーム開始
function startGame() {
  gameLoop();
}

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  boy.x = canvas.width / 2;
});