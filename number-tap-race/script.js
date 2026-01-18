let multiplier = 1;
let maxNumber = 9;

let currentNumber = 1;
let startTime = null;
let timerInterval = null;

const startButton = document.getElementById("startButton");
const countdownEl = document.getElementById("countdown");
const timerEl = document.getElementById("timer");
const gameBoard = document.getElementById("gameBoard");
const resultEl = document.getElementById("result");
const difficultyButtons = document.querySelectorAll(".difficulty button");

difficultyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (startButton.disabled) return;

    difficultyButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    multiplier = Number(btn.dataset.multiplier);
    maxNumber = 9 * multiplier;

    createNumbers();
    disableNumbers();
  });
});

createNumbers();
disableNumbers();

function createNumbers() {
  gameBoard.innerHTML = "";

  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  numbers.sort(() => Math.random() - 0.5);

  numbers.forEach((num) => {
    const div = document.createElement("div");
    div.textContent = num;
    div.className = "number disabled";
    div.addEventListener("click", () => handleNumberClick(num, div));
    gameBoard.appendChild(div);
  });
}

function handleNumberClick(num, element) {
  if (num !== currentNumber) return;

  element.classList.add("disabled");
  currentNumber++;

  if (currentNumber > maxNumber) {
    finishGame();
  }
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  resultEl.textContent = "";
  startCountdown();
});

function startCountdown() {
  let count = 3;
  countdownEl.textContent = count;

  const interval = setInterval(() => {
    count--;

    if (count === 0) {
      countdownEl.textContent = "GO!";
    } else if (count < 0) {
      clearInterval(interval);
      countdownEl.textContent = "";
      startGame();
    } else {
      countdownEl.textContent = count;
    }
  }, 1000);
}

function startGame() {
  currentNumber = 1;
  createNumbers();
  enableNumbers();

  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 50);
}

function updateTimer() {
  const elapsed = (Date.now() - startTime) / 1000;
  timerEl.textContent = `Time: ${elapsed.toFixed(2)}s`;
}

function finishGame() {
  clearInterval(timerInterval);
  const finalTime = (Date.now() - startTime) / 1000;
  resultEl.textContent = `クリア！ ${finalTime.toFixed(2)} 秒`;
  disableNumbers();
  startButton.disabled = false;
}

function disableNumbers() {
  document.querySelectorAll(".number").forEach((el) => {
    el.classList.add("disabled");
  });
}

function enableNumbers() {
  document.querySelectorAll(".number").forEach((el) => {
    el.classList.remove("disabled");
  });
}