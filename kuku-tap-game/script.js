// ===== 効果音 =====
const soundCorrect = document.getElementById("sound-correct");
const soundWrong = document.getElementById("sound-wrong");

// ===== 画面要素 =====
const selectScreen = document.getElementById("select-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

const danButtons = document.getElementById("dan-buttons");
const answerButtons = document.getElementById("answer-buttons");

const questionEl = document.getElementById("question");
const timerEl = document.getElementById("timer");
const resultTimeEl = document.getElementById("result-time");
const retryBtn = document.getElementById("retry");

// ===== ゲーム状態 =====
let dan = 0;
let remaining = [];
let startTime = 0;
let timerId = null;

// ===== 段選択ボタン生成 =====
for (let i = 1; i <= 9; i++) {
  const btn = document.createElement("button");
  btn.textContent = i + "の段";
  btn.onclick = () => startGame(i);
  danButtons.appendChild(btn);
}

// ===== ゲーム開始 =====
function startGame(selectedDan) {
  dan = selectedDan;
  remaining = [];

  for (let i = 1; i <= 9; i++) {
    remaining.push(i);
  }

  selectScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  createAnswerButtons();
  nextQuestion();

  startTime = Date.now();
  timerId = setInterval(updateTimer, 100);
}

// ===== タイマー更新 =====
function updateTimer() {
  const time = (Date.now() - startTime) / 1000;
  timerEl.textContent = time.toFixed(1) + " 秒";
}

// ===== 答えボタン生成 =====
function createAnswerButtons() {
  answerButtons.innerHTML = "";

  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.textContent = dan * i;
    btn.dataset.value = i;
    btn.onclick = () => checkAnswer(btn);
    answerButtons.appendChild(btn);
  }
}

// ===== 次の問題 =====
function nextQuestion() {
  if (remaining.length === 0) {
    finishGame();
    return;
  }

  const index = Math.floor(Math.random() * remaining.length);
  const value = remaining[index];
  questionEl.textContent = `${dan} × ${value} = ?`;
  questionEl.dataset.answer = value;
}

// ===== 正誤判定 =====
function checkAnswer(button) {
  const correct = Number(questionEl.dataset.answer);
  const selected = Number(button.dataset.value);

  if (selected === correct) {
    soundCorrect.play().catch(() => {});
    button.disabled = true;

    remaining = remaining.filter(v => v !== correct);
    nextQuestion();
  } else {
    soundWrong.play().catch(() => {});
  }
}

// ===== 終了処理 =====
function finishGame() {
  clearInterval(timerId);
  gameScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const time = (Date.now() - startTime) / 1000;
  resultTimeEl.textContent = `タイム：${time.toFixed(1)} 秒`;
}

// ===== リトライ =====
retryBtn.onclick = () => {
  resultScreen.classList.add("hidden");
  selectScreen.classList.remove("hidden");
};