const soundCorrect = document.getElementById("sound-correct");
const soundWrong = document.getElementById("sound-wrong");

const selectScreen = document.getElementById("select-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

const danButtons = document.getElementById("dan-buttons");
const answerButtons = document.getElementById("answer-buttons");

const questionEl = document.getElementById("question");
const timerEl = document.getElementById("timer");
const resultTimeEl = document.getElementById("result-time");
const retryBtn = document.getElementById("retry");

let dan = 0;
let remaining = [];
let startTime = 0;
let timerId = null;

// 段選択
for (let i = 0; i <= 9; i++) {
  const btn = document.createElement("button");
  btn.textContent = `${i}のだん`;
  btn.onclick = () => startGame(i);
  danButtons.appendChild(btn);
}

function startGame(selectedDan) {
  dan = selectedDan;
  remaining = [...Array(10).keys()]; // 0〜9

  selectScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  createAnswerButtons(); // ★ 最初に一度だけ生成

  startTime = Date.now();
  timerId = setInterval(updateTimer, 100);

  nextQuestion();
}

function updateTimer() {
  const t = (Date.now() - startTime) / 1000;
  timerEl.textContent = t.toFixed(1) + " 秒";
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

  const min = dan;
  const max = dan + 9;

  const nums = [];
  for (let i = min; i <= max; i++) nums.push(i);

  nums.sort(() => Math.random() - 0.5); // 初回のみシャッフル

  nums.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.dataset.value = num;
    btn.onclick = () => checkAnswer(btn, num);
    answerButtons.appendChild(btn);
  });
}

function checkAnswer(button, selected) {
  const correct = Number(questionEl.dataset.answer);

  if (selected === correct) {
    soundCorrect.play().catch(() => {});
    button.disabled = true;

    const used = correct - dan;
    remaining = remaining.filter(v => v !== used);

    nextQuestion();
  } else {
    soundWrong.play().catch(() => {});
  }
}

function finishGame() {
  clearInterval(timerId);
  gameScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const t = (Date.now() - startTime) / 1000;
  resultTimeEl.textContent = `タイム：${t.toFixed(1)} 秒`;
}

retryBtn.onclick = () => {
  resultScreen.classList.add("hidden");
  selectScreen.classList.remove("hidden");
};