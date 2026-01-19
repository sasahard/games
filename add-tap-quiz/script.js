const questionEl = document.getElementById("question");
const statusEl = document.getElementById("status");
const buttonsEl = document.getElementById("buttons");
const centerArea = document.getElementById("center-area");
const feedbackEl = document.getElementById("feedback");
const resultArea = document.getElementById("result-area");
const timeText = document.getElementById("time-text");
const retryBtn = document.getElementById("retry-btn");

let baseNumber = null;
let problems = [];
let currentIndex = 0;
let startTime = null;

// フィードバック用メッセージ（小1向け、漢字なし）
const correctMessages = ["すごい！", "やった！", "いいね！", "えらい！", "グッド！"];
const wrongMessages   = ["もういちど！", "だいじょうぶ！", "がんばろう！", "つぎにいこう！", "まけない！"];

// 初期表示：段選択
showStageSelect();

function showStageSelect() {
  statusEl.textContent = "どのだんにする？";
  questionEl.textContent = "";
  resultArea.classList.add("hidden");
  feedbackEl.classList.add("hidden");
  buttonsEl.innerHTML = "";

  for (let i = 0; i <= 9; i++) {
    const btn = createButton(i, () => startGame(i));
    buttonsEl.appendChild(btn);
  }
}

function startGame(stage) {
  baseNumber = stage;
  problems = [];
  for (let i = 0; i <= 9; i++) {
    problems.push({ text: `${baseNumber} + ${i}`, answer: baseNumber + i });
  }

  shuffle(problems);
  currentIndex = 0;
  startTime = Date.now();

  setupAnswerButtons();
  showQuestion();
}

function setupAnswerButtons() {
  buttonsEl.innerHTML = "";
  const answers = problems.map(p => p.answer);
  shuffle(answers);

  answers.forEach(num => {
    const btn = createButton(num, () => handleAnswer(num, btn));
    buttonsEl.appendChild(btn);
  });
}

function showQuestion() {
  statusEl.textContent = `のこり ${problems.length - currentIndex} もん`;
  questionEl.textContent = problems[currentIndex].text;
}

function handleAnswer(value, btn) {
  const correct = problems[currentIndex].answer;

  if (value === correct) {

    // 正解音
    const correctSound = new Audio("sounds/correct.mp3");
    correctSound.play().catch(e => console.log("音を再生できません", e));

    btn.classList.add("correct", "disabled");
    showFeedback(true);
    currentIndex++;
    if (currentIndex >= problems.length) {
      setTimeout(finishGame, 600);
    } else {
      setTimeout(showQuestion, 600);
    }

  } else {

    // 不正解音
    const wrongSound = new Audio("sounds/wrong.mp3");
    wrongSound.play().catch(e => console.log("音を再生できません", e));

    btn.classList.add("wrong");
    showFeedback(false);
    setTimeout(() => btn.classList.remove("wrong"), 400);
  }
}

function showFeedback(isCorrect) {
  feedbackEl.classList.remove("correct", "wrong");
  let text = "";

  if (isCorrect) {
    text = correctMessages[Math.floor(Math.random() * correctMessages.length)];
    feedbackEl.classList.add("correct");
  } else {
    text = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
    feedbackEl.classList.add("wrong");
  }

  feedbackEl.textContent = text;
  feedbackEl.classList.remove("hidden");

  setTimeout(() => feedbackEl.classList.add("hidden"), 600);
}

function finishGame() {
  const time = ((Date.now() - startTime) / 1000).toFixed(1);
  resultArea.classList.remove("hidden");
  timeText.textContent = `タイム：${time} 秒`;
  questionEl.textContent = "";
  statusEl.textContent = "";
}

retryBtn.addEventListener("click", showStageSelect);

function createButton(text, onClick) {
  const btn = document.createElement("button");
  btn.className = "answer-btn";
  btn.textContent = text;
  btn.addEventListener("click", onClick);
  return btn;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
