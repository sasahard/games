const soundCorrect = document.getElementById("sound-correct");
const soundWrong = document.getElementById("sound-wrong");

const selectScreen = document.getElementById("select-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

const answerButtons = document.getElementById("answer-buttons");

const questionEl = document.getElementById("question");
const timerEl = document.getElementById("timer");
const resultTimeEl = document.getElementById("result-time");
const retryBtn = document.getElementById("retry");

let dan = 0;
let remaining = [];
let startTime = 0;
let timerId = null;

/* 初期：段選択 */
showDanSelect();

function showDanSelect() {
  answerButtons.innerHTML = "";
  for (let i = 0; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => startGame(i);
    answerButtons.appendChild(btn);
  }
}

function startGame(selectedDan) {
  dan = selectedDan;
  remaining = [...Array(10).keys()];

  selectScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  createAnswerButtons();

  startTime = Date.now();
  timerId = setInterval(updateTimer, 100);

  nextQuestion();
}

function updateTimer() {
  timerEl.textContent =
    ((Date.now() - startTime) / 1000).toFixed(1) + " 秒";
}

function nextQuestion() {
  if (remaining.length === 0) {
    finishGame();
    return;
  }

  const value = remaining[Math.floor(Math.random() * remaining.length)];
  questionEl.textContent = `${dan} + ${value} = ?`;
  questionEl.dataset.answer = dan + value;
}

function createAnswerButtons() {
  answerButtons.innerHTML = "";

  const nums = [];
  for (let i = dan; i <= dan + 9; i++) nums.push(i);
  nums.sort(() => Math.random() - 0.5);

  nums.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.onclick = () => checkAnswer(btn, num);
    answerButtons.appendChild(btn);
  });
}

function checkAnswer(button, selected) {
  const correct = Number(questionEl.dataset.answer);

  if (selected === correct) {
    soundCorrect.play().catch(() => {});
    button.classList.add("correct");
    button.disabled = true;

    remaining = remaining.filter(v => v !== correct - dan);
    setTimeout(nextQuestion, 150);
  } else {
    soundWrong.play().catch(() => {});
    button.classList.add("wrong");
    setTimeout(() => button.classList.remove("wrong"), 250);
  }
}

function finishGame() {
  clearInterval(timerId);
  gameScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  resultTimeEl.textContent =
    `タイム：${((Date.now() - startTime) / 1000).toFixed(1)} 秒`;
}

retryBtn.onclick = () => location.reload();