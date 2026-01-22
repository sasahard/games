// ==========================
// 定数
// ==========================
const SIZE = 10;
const MAX_TURNS = 15;

const EMPTY = 0;
const P1 = 1;
const P2 = 2;
const WEAK_P1 = 3;
const WEAK_P2 = 4;

// ==========================
// 状態
// ==========================
let board = new Array(SIZE * SIZE).fill(EMPTY);
let currentPlayer = P1;
let turnsLeft = {
  [P1]: MAX_TURNS,
  [P2]: MAX_TURNS,
};

// ==========================
// DOM
// ==========================
const boardEl = document.getElementById("board");
const playerAEl = document.getElementById("playerA");
const playerBEl = document.getElementById("playerB");
const countAEl = document.getElementById("countA");
const countBEl = document.getElementById("countB");
const resultEl = document.getElementById("result");

// ==========================
// 初期化
// ==========================
function init() {
  boardEl.innerHTML = "";

  board.forEach((_, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.addEventListener("click", () => handleClick(index));
    boardEl.appendChild(cell);
  });

  updateUI();
}

init();

// ==========================
// クリック処理（十字マーキング）
// ==========================
function handleClick(index) {
  if (isGameOver()) return;

  const targets = getCrossIndexes(index);
  let acted = false;

  targets.forEach(i => {
    if (applyMark(i)) acted = true;
  });

  if (!acted) return;

  turnsLeft[currentPlayer]--;
  currentPlayer = currentPlayer === P1 ? P2 : P1;

  updateUI();
}

// ==========================
// マーキング処理（1マス）
// ==========================
function applyMark(index) {
  const state = board[index];

  // 空白 → 取得
  if (state === EMPTY) {
    board[index] = currentPlayer;
    return true;
  }

  // 相手陣地 → 弱体化
  if (state === opponentTerritory()) {
    board[index] = opponentWeak();
    return true;
  }

  // 相手の弱体化 → 奪取
  if (state === opponentWeak()) {
    board[index] = currentPlayer;
    return true;
  }

  return false;
}

// ==========================
// 十字インデックス取得
// ==========================
function getCrossIndexes(index) {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);

  const positions = [
    { x, y },         // 中心
    { x, y: y - 1 },  // 上
    { x, y: y + 1 },  // 下
    { x: x - 1, y },  // 左
    { x: x + 1, y },  // 右
  ];

  return positions
    .filter(p =>
      p.x >= 0 && p.x < SIZE &&
      p.y >= 0 && p.y < SIZE
    )
    .map(p => p.y * SIZE + p.x);
}

// ==========================
// UI更新
// ==========================
function updateUI() {
  const cells = document.querySelectorAll(".cell");

  board.forEach((state, i) => {
    cells[i].className = "cell";

    if (state === P1) cells[i].classList.add("p1");
    if (state === P2) cells[i].classList.add("p2");
    if (state === WEAK_P1) cells[i].classList.add("p1", "weak");
    if (state === WEAK_P2) cells[i].classList.add("p2", "weak");
  });

  countAEl.textContent = `残り ${turnsLeft[P1]}`;
  countBEl.textContent = `残り ${turnsLeft[P2]}`;

  playerAEl.classList.toggle("active", currentPlayer === P1);
  playerBEl.classList.toggle("active", currentPlayer === P2);

  if (isGameOver()) {
    showResult();
  }
}

// ==========================
// 勝敗判定
// ==========================
function showResult() {
  const a = board.filter(v => v === P1).length;
  const b = board.filter(v => v === P2).length;

  resultEl.textContent =
    a > b ? "Player A Win" :
    b > a ? "Player B Win" :
    "Draw";
}

// ==========================
// ヘルパー
// ==========================
function opponentTerritory() {
  return currentPlayer === P1 ? P2 : P1;
}

function opponentWeak() {
  return currentPlayer === P1 ? WEAK_P2 : WEAK_P1;
}

function isGameOver() {
  return turnsLeft[P1] === 0 && turnsLeft[P2] === 0;
}