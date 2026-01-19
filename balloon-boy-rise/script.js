const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

/********************
 * Canvas resize
 ********************/
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/********************
 * Game state
 ********************/
let gameOver = false;
let score = 0;
let animationId = null;
let lastTime = null;
let tapHold = false;

/********************
 * Physics
 ********************/
// 半径16px = 1m と仮定
// 分速20m → 秒速0.333m
const BASE_ASCENT_SPEED = 0.333; // px / sec
const BRAKE_RATIO = 0.4;         // タップ中は減速

/********************
 * Player (Boy + Balloon)
 ********************/
const boy = {
  x: canvas.width / 2,
  y: canvas.height / 2, // 常に画面中央
  radius: 16,
  targetX: canvas.width / 2
};

/********************
 * Obstacles
 ********************/
const obstacles = [];

class Obstacle {
  constructor() {
    this.width = 32;
    this.height = 32;

    this.y = Math.random() * canvas.height * 0.8;

    if (Math.random() < 0.5) {
      this.x = -this.width;
      this.speedX = 1.0;
    } else {
      this.x = canvas.width;
      this.speedX = -1.0;
    }
  }

  update(scrollSpeed) {
    this.x += this.speedX;      // 横移動
    this.y += scrollSpeed;      // バルーン上昇に合わせて下に流れる
  }

  draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  isOut() {
    return (
      this.x + this.width < -50 ||
      this.x > canvas.width + 50 ||
      this.y > canvas.height + 50
    );
  }
}

/********************
 * Collision
 ********************/
function checkCollision(rect) {
  const dx = Math.abs(boy.x - (rect.x + rect.width / 2));
  const dy = Math.abs(boy.y - (rect.y + rect.height / 2));

  if (dx > rect.width / 2 + boy.radius) return false;
  if (dy > rect.height / 2 + boy.radius) return false;

  return true;
}

/********************
 * Game loop
 ********************/
function gameLoop(timestamp) {
  if (gameOver) return;

  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const currentSpeed =
    (tapHold ? BASE_ASCENT_SPEED * BRAKE_RATIO : BASE_ASCENT_SPEED) * delta * 60;

  // score
  score += currentSpeed;
  document.getElementById('score').textContent =
    score.toFixed(1) + ' m';

  // spawn obstacles
  if (Math.random() < 0.02) {
    obstacles.push(new Obstacle());
  }

  // update obstacles
  obstacles.forEach((obs, i) => {
    obs.update(currentSpeed);
    obs.draw();

    if (checkCollision(obs)) endGame();
    if (obs.isOut()) obstacles.splice(i, 1);
  });

  // boy sway ±32px
  if (Math.random() < 0.01) {
    boy.targetX = canvas.width / 2 + (Math.random() * 64 - 32);
  }
  boy.x += (boy.targetX - boy.x) * 0.05;

  // draw boy
  ctx.beginPath();
  ctx.arc(boy.x, boy.y, boy.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.fill();

  animationId = requestAnimationFrame(gameLoop);
}

/********************
 * Control
 ********************/
function startGame() {
  document.getElementById('start-screen').classList.add('hidden');
  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  document.getElementById('game-over').classList.remove('hidden');
  cancelAnimationFrame(animationId);
}

function resetGame() {
  gameOver = false;
  score = 0;
  obstacles.length = 0;
  lastTime = null;
  boy.x = canvas.width / 2;
  boy.targetX = canvas.width / 2;
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
}

/********************
 * Input
 ********************/
canvas.addEventListener('mousedown', () => tapHold = true);
canvas.addEventListener('mouseup', () => tapHold = false);
canvas.addEventListener('touchstart', () => tapHold = true);
canvas.addEventListener('touchend', () => tapHold = false);

document.getElementById('start-screen').addEventListener('click', () => {
  resetGame();
  startGame();
});

document.getElementById('retry-button').addEventListener('click', () => {
  resetGame();
  startGame();
});

// 初期表示
resetGame();