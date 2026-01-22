// ==========================
// 定数定義
// ==========================
const SIZE = 10;
const MAX_TURNS = 15;

// マス状態
const EMPTY = 0;
const P1 = 1;
const P2 = 2;
const WEAK_P1 = 3;
const WEAK_P2 = 4;

// ==========================
// 状態管理
// ==========================
let board = new Array(SIZE * SIZE).fill(EMPTY);
let currentPlayer = P1;
let turn = 1;
let turnsLeft = {
  [P1]: MAX_TURNS,
  [P2]: MAX_TURNS,
};

const boardEl = document.getElementById("board");
const turnInfoEl = document.getElementById("turnInfo");
const turnCountEl = document.getElementById("turnCount");
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
// クリック処理
// ==========================
function handleClick(index) {
  if (isGameOver()) return;

  const state = board[index];

  // マーキングルール
  if (state === EMPTY) {
    board[index] = currentPlayer;
  } else if (state === opponentTerritory()) {
    board[index] = opponentWeak();
  } else if (state === currentWeak()) {
    board[index] = currentPlayer;
  } else {
    return; // それ以外は何も起きない
  }

  endTurn();
}

// ==========================
// ターン終了処理
// ==========================
function endTurn() {
  turnsLeft[currentPlayer]--;

  if (!isGameOver()) {
    currentPlayer = currentPlayer === P1 ? P2 : P1;
    turn++;
  }

  updateUI();
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

  turnInfoEl.textContent =
    currentPlayer === P1 ? "プレイヤーAのターン" : "プレイヤーBのターン";

  turnCountEl.textContent =
    `A残り:${turnsLeft[P1]} / B残り:${turnsLeft[P2]}`;

  if (isGameOver()) {
    showResult();
  }
}

// ==========================
// 勝敗判定
// ==========================
function showResult() {
  const p1Count = board.filter(v => v === P1).length;
  const p2Count = board.filter(v => v === P2).length;

  if (p1Count > p2Count) {
    resultEl.textContent = "プレイヤーAの勝利！";
  } else if (p2Count > p1Count) {
    resultEl.textContent = "プレイヤーBの勝利！";
  } else {
    resultEl.textContent = "引き分け！";
  }
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

function currentWeak() {
  return currentPlayer === P1 ? WEAK_P1 : WEAK_P2;
}

function isGameOver() {
  return turnsLeft[P1] === 0 && turnsLeft[P2] === 0;
}