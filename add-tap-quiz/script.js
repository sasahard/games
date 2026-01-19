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

// ===== 段選択ボタン生成（0〜9）=====
for (let i = 0; i <= 9; i++) {
  const btn = document.createElement("button");
  btn.textContent = `${i}のだん`;
  btn.onclick = () => startGame(i);
  danButtons.appendChild(btn);
}

// ===== ゲーム開始 =====
function startGame(selectedDan) {
  dan = selectedDan;
  remaining = [];

  for (let i = 0; i <= 9; i++) {
    remaining.push(i);
  }

  selectScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTime = Date.now();
  timerId = setInterval(updateTimer, 100);

  nextQuestion();
}

// ===== タイマー =====
function updateTimer() {
  const time = (Date.now() - startTime) / 1000;
  timerEl.textContent = time.toFixed(1) + " 秒";
}

// ===== 次の問題 =====
function nextQuestion() {
  if (remaining.length === 0) {
    finishGame();
    return;
  }

  // 出題する +◯ をランダム選択
  const index = Math.floor(Math.random() * remaining.length);
  const value = remaining[index];

  questionEl.textContent = `${dan} + ${value} = ?`;
  questionEl.dataset.answer = dan + value;

  createAnswerButtons(dan + value);
}

// ===== 解答ボタン生成（ランダム）=====
function createAnswerButtons(correctAnswer) {
  answerButtons.innerHTML = "";

  const min = dan + 0;
  const max = dan + 9;

  const numbers = new Set();
  numbers.add(correctAnswer);

  // 正解を含めつつ、範囲内でランダムに埋める
  while (numbers.size < 10) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(n);
  }

  // シャッフル
  const shuffled = Array.from(numbers).sort(() => Math.random() - 0.5);

  shuffled.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.onclick = () => checkAnswer(btn, num);
    answerButtons.appendChild(btn);
  });
}

// ===== 正誤判定 =====
function checkAnswer(button, selected) {
  const correct = Number(questionEl.dataset.answer);

  if (selected === correct) {
    soundCorrect.play().catch(() => {});
    button.disabled = true;

    // 使用済みの問題を除外
    const used = correct - dan;
    remaining = remaining.filter(v => v !== used);

    nextQuestion();
  } else {
    soundWrong.play().catch(() => {});
  }
}

// ===== 終了 =====
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