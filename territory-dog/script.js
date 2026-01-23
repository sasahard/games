// ==========================
// 背景画像ランダム設定（白チラ防止・簡単版）
// ==========================
const BG_COUNT = 5;

function setRandomBackground() {
  const num = Math.floor(Math.random() * BG_COUNT) + 1;
  const url = `images/bg0${num}.jpg`;

  const img = new Image();
  img.onload = () => {
    document.body.style.background =
      `linear-gradient(
        rgba(0, 0, 0, 0.15),
        rgba(0, 0, 0, 0.15)
      ),
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
const resultModalEl = document.getElementById("resultModal");

// ==========================
// 初期化
// ==========================
function init() {
  boardEl.innerHTML = "";

  board = new Array(SIZE * SIZE).fill(EMPTY);
  currentPlayer = P1;
  turnsLeft[P1] = MAX_TURNS;
  turnsLeft[P2] = MAX_TURNS;
  clearCooldown();

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

  // クールダウン中は操作不可
  if (cooldownIndexes.includes(index)) return;

  const targets = getCrossIndexes(index);
  let acted = false;

  targets.forEach(i => {
    if (applyMark(i)) acted = true;
  });

  if (!acted) return;

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

  // 次の自分の番で解除
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
      cells[i].classList.add("cooldown");
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
// 勝敗判定（モーダル）
// ==========================
function showResult() {
  const a = board.filter(v => v === P1).length;
  const b = board.filter(v => v === P2).length;

  const text =
    a > b ? "Player A Win" :
    b > a ? "Player B Win" :
    "Draw";

  resultModalEl.textContent = text;
  resultModalEl.classList.add("show");

  setTimeout(() => {
    resultModalEl.classList.remove("show");
    init(); // 次の試合へ
  }, 2000);
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