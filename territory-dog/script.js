// ==========================
// 背景画像ランダム設定
// ==========================
const BG_COUNT = 5;

function setRandomBackground() {
  const num = Math.floor(Math.random() * BG_COUNT) + 1;
  const url = `images/bg0${num}.jpg`;

  const img = new Image();
  img.onload = () => {
    document.body.style.background =
      `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)),
       url("${url}") center / cover no-repeat`;
  };
  img.src = url;
}
setRandomBackground();

// ==========================
// 定数
// ==========================
const SIZE = 10;
const MAX_TURNS = 15;
const MOVE_RANGE = 3;

const EMPTY = 0;
const P1 = 1;
const P2 = 2;
const WEAK_P1 = 3;
const WEAK_P2 = 4;

// ==========================
// 状態
// ==========================
let board;
let currentPlayer;
let turnsLeft;

let playerPos = {
  [P1]: { x: 0, y: SIZE - 1 },
  [P2]: { x: SIZE - 1, y: 0 }
};

let cooldownIndexes = [];
let cooldownOwner = null;

// ==========================
// DOM
// ==========================
const boardEl = document.getElementById("board");
const playerAEl = document.getElementById("playerA");
const playerBEl = document.getElementById("playerB");
const countAEl = document.getElementById("countA");
const countBEl = document.getElementById("countB");
const resultModalEl = document.getElementById("resultModal");

// ==========================
// 初期化
// ==========================
function init() {
  board = new Array(SIZE * SIZE).fill(EMPTY);
  currentPlayer = P1;
  turnsLeft = { [P1]: MAX_TURNS, [P2]: MAX_TURNS };
  clearCooldown();

  playerPos[P1] = { x: 0, y: SIZE - 1 };
  playerPos[P2] = { x: SIZE - 1, y: 0 };

  boardEl.innerHTML = "";

  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.addEventListener("click", () => handleClick(i));
    boardEl.appendChild(cell);
  }

  fixBoardSize();
  updateUI();
}
init();

// ==========================
// 盤面サイズ固定
// ==========================
function fixBoardSize() {
  const w = boardEl.clientWidth;
  boardEl.style.height = `${w}px`;
}
window.addEventListener("resize", fixBoardSize);

// ==========================
// クリック処理
// ==========================
function handleClick(index) {
  if (isGameOver()) return;

  const { x, y } = indexToXY(index);
  if (!isMovable(x, y)) return;
  if (cooldownIndexes.includes(index)) return;

  // 移動確定
  playerPos[currentPlayer] = { x, y };

  // マーキング
  const targets = getCrossIndexes(index);
  let acted = false;
  targets.forEach(i => {
    if (applyMark(i)) acted = true;
  });
  if (acted) setCooldown(targets);

  consumeTurnAndCheckEnd();
}

// ==========================
// ターン消費と終了判定（核）
// ==========================
function consumeTurnAndCheckEnd() {
  turnsLeft[currentPlayer]--;

  updateUI();

  if (isGameOver()) {
    showResult();
    return;
  }

  switchTurn();
  updateUI();
}

// ==========================
// マーキング
// ==========================
function applyMark(index) {
  const state = board[index];

  if (state === EMPTY) {
    board[index] = currentPlayer;
    return true;
  }
  if (state === opponentTerritory()) {
    board[index] = opponentWeak();
    return true;
  }
  if (state === opponentWeak()) {
    board[index] = currentPlayer;
    return true;
  }
  return false;
}

// ==========================
// 十字取得
// ==========================
function getCrossIndexes(index) {
  const { x, y } = indexToXY(index);
  const pos = [
    { x, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y },
  ];

  return pos
    .filter(p => p.x >= 0 && p.x < SIZE && p.y >= 0 && p.y < SIZE)
    .map(p => xyToIndex(p.x, p.y));
}

// ==========================
// 移動可能判定
// ==========================
function isMovable(x, y) {
  const p = playerPos[currentPlayer];
  const dist = Math.abs(x - p.x) + Math.abs(y - p.y);
  return dist <= MOVE_RANGE;
}

// ==========================
// UI更新
// ==========================
function updateUI() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach(c => c.innerHTML = "");

  board.forEach((state, i) => {
    const cell = cells[i];
    cell.className = "cell";

    if (state === P1) cell.classList.add("p1");
    if (state === P2) cell.classList.add("p2");
    if (state === WEAK_P1) cell.classList.add("p1", "weak");
    if (state === WEAK_P2) cell.classList.add("p2", "weak");

    if (cooldownIndexes.includes(i)) cell.classList.add("cooldown");

    const { x, y } = indexToXY(i);
    if (isMovable(x, y)) cell.classList.add("movable");
  });

  drawIcons(cells);

  countAEl.textContent = `残り ${turnsLeft[P1]}`;
  countBEl.textContent = `残り ${turnsLeft[P2]}`;

  playerAEl.classList.toggle("active", currentPlayer === P1);
  playerBEl.classList.toggle("active", currentPlayer === P2);

  fixBoardSize();
}

// ==========================
// アイコン描画（常に不透明）
// ==========================
function drawIcons(cells) {
  [P1, P2].forEach(p => {
    const { x, y } = playerPos[p];
    const idx = xyToIndex(x, y);

    const icon = document.createElement("div");
    icon.className = p === P1 ? "p1-icon" : "p2-icon";

    icon.style.backgroundImage = `url("images/dog.gif")`;
    icon.style.backgroundSize = "contain";
    icon.style.backgroundRepeat = "no-repeat";
    icon.style.backgroundPosition = "center";
    icon.style.width = "40px";
    icon.style.height = "40px";
    icon.style.position = "absolute";
    icon.style.top = "50%";
    icon.style.left = "50%";
    icon.style.transform = "translate(-50%, -50%)";
    icon.style.opacity = "1";

    cells[idx].appendChild(icon);
  });
}

// ==========================
// クールダウン
// ==========================
function setCooldown(indexes) {
  cooldownIndexes = indexes;
  cooldownOwner = currentPlayer;
}
function clearCooldown() {
  cooldownIndexes = [];
  cooldownOwner = null;
}

// ==========================
// ターン切替
// ==========================
function switchTurn() {
  currentPlayer = currentPlayer === P1 ? P2 : P1;
  if (currentPlayer === cooldownOwner) clearCooldown();
}

// ==========================
// 勝敗判定
// ==========================
function showResult() {
  const a = board.filter(v => v === P1).length;
  const b = board.filter(v => v === P2).length;

  resultModalEl.textContent =
    a > b ? "Player A Win" :
    b > a ? "Player B Win" :
    "Draw";

  resultModalEl.classList.add("show");

  setTimeout(() => {
    resultModalEl.classList.remove("show");
    init();
  }, 2000);
}

// ==========================
// ヘルパー
// ==========================
function indexToXY(i) {
  return { x: i % SIZE, y: Math.floor(i / SIZE) };
}
function xyToIndex(x, y) {
  return y * SIZE + x;
}
function opponentTerritory() {
  return currentPlayer === P1 ? P2 : P1;
}
function opponentWeak() {
  return currentPlayer === P1 ? WEAK_P2 : WEAK_P1;
}
function isGameOver() {
  return turnsLeft[P1] === 0 && turnsLeft[P2] === 0;
}