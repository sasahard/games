// ==========================
// 背景画像ランダム設定
// ==========================
const BG_COUNT = 5;

function setRandomBackground() {
  const num = Math.floor(Math.random() * BG_COUNT) + 1;
  const url = `images/bg0${num}.jpg`;

  document.body.style.background =
    `linear-gradient(
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15)
    ),
    url("${url}") center / cover no-repeat`;
}

setRandomBackground();

// ==========================
// 定数
// ==========================
const SIZE = 10;
const MAX_TURNS = 15;
const RESULT_DELAY = 2000;

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

let cooldownIndexes;
let cooldownOwner;

// ==========================
// DOM
// ==========================
const boardEl = document.getElementById("board");
const playerAEl = document.getElementById("playerA");
const playerBEl = document.getElementById("playerB");
const countAEl = document.getElementById("countA");
const countBEl = document.getElementById("countB");

// ==========================
// モーダル生成
// ==========================
const modal = document.createElement("div");
modal.style.position = "fixed";
modal.style.inset = "0";
modal.style.display = "none";
modal.style.alignItems = "center";
modal.style.justifyContent = "center";
modal.style.background = "rgba(0,0,0,0.6)";
modal.style.zIndex = "999";

const modalContent = document.createElement("div");
modalContent.style.background = "#fff";
modalContent.style.padding = "24px 32px";
modalContent.style.borderRadius = "12px";
modalContent.style.fontSize = "1.2em";
modalContent.style.fontWeight = "bold";

modal.appendChild(modalContent);
document.body.appendChild(modal);

// ==========================
// 初期化
// ==========================
function init() {
  board = new Array(SIZE * SIZE).fill(EMPTY);
  currentPlayer = P1;

  turnsLeft = {
    [P1]: MAX_TURNS,
    [P2]: MAX_TURNS,
  };

  cooldownIndexes = [];
  cooldownOwner = null;

  boardEl.innerHTML = "";

  board.forEach((_, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.opacity = "0.6"; // 空マスは少し透明
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
// マーキング処理
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
    const cell = cells[i];
    cell.className = "cell";

    if (state === EMPTY) {
      cell.style.opacity = "0.6";
    } else {
      cell.style.opacity = "1";
    }

    if (state === P1) cell.classList.add("p1");
    if (state === P2) cell.classList.add("p2");
    if (state === WEAK_P1) cell.classList.add("p1", "weak");
    if (state === WEAK_P2) cell.classList.add("p2", "weak");

    if (cooldownIndexes.includes(i)) {
      cell.classList.add("cooldown");
    }
  });

  countAEl.textContent = `残り ${turnsLeft[P1]}`;
  countBEl.textContent = `残り ${turnsLeft[P2]}`;

  playerAEl.classList.toggle("active", currentPlayer === P1);
  playerBEl.classList.toggle("active", currentPlayer === P2);

  if (isGameOver()) {
    showResultModal();
  }
}

// ==========================
// 勝敗モーダル
// ==========================
function showResultModal() {
  const a = board.filter(v => v === P1).length;
  const b = board.filter(v => v === P2).length;

  modalContent.textContent =
    a > b ? "Player A Win" :
    b > a ? "Player B Win" :
    "Draw";

  modal.style.display = "flex";

  setTimeout(() => {
    modal.style.display = "none";
    setRandomBackground();
    init();
  }, RESULT_DELAY);
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