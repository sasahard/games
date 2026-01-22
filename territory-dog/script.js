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

const COOLDOWN_CLASS = "cooldown";

// ==========================
// 状態
// ==========================
let board = new Array(SIZE * SIZE).fill(EMPTY);
let currentPlayer = P1;
let turnsLeft = {
  [P1]: MAX_TURNS,
  [P2]: MAX_TURNS,
};

// クールダウン管理
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

  // クールダウン中は誰も触れない
  if (cooldownIndexes.includes(index)) return;

  const targets = getCrossIndexes(index);
  let acted = false;

  targets.forEach(i => {
    if (applyMark(i)) acted = true;
  });

  if (!acted) return;

  // クールダウン設定（このターンで影響した5マス）
  setCooldown(targets);

  turnsLeft[currentPlayer]--;
  switchTurn();

  updateUI();
}

// ==========================
// マーキング処理（1マス）
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
// 十字インデックス取得
// ==========================
function getCrossIndexes(index) {
  const x = index % SIZE;
  const y = Math.floor(index / SIZE);

  const positions = [
    { x, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
    { x: x - 1, y },
    { x: x + 1, y },
  ];

  return positions
    .filter(p =>
      p.x >= 0 && p.x < SIZE &&
      p.y >= 0 && p.y < SIZE
    )
    .map(p => p.y * SIZE + p.x);
}

// ==========================
// クールダウン制御
// ==========================
function setCooldown(indexes) {
  clearCooldown();
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

  // 次の「自分の番」に戻ったらクールダウン解除
  if (currentPlayer === cooldownOwner) {
    clearCooldown();
  }
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

    if (cooldownIndexes.includes(i)) {
      cells[i].classList.add(COOLDOWN_CLASS);
    }
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