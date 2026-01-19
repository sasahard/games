const questionEl = document.getElementById("question");
const statusEl = document.getElementById("status");
const buttonsEl = document.getElementById("buttons");
const resultArea = document.getElementById("result-area");
const timeText = document.getElementById("time-text");
const retryBtn = document.getElementById("retry-btn");

let baseNumber = null;
let problems = [];
let currentIndex = 0;
let startTime = null;
let comboCount = 0; // 連続正解カウント

// 初期表示：段選択
showStageSelect();

function showStageSelect() {
  statusEl.textContent = "どのだんにする？";
  questionEl.textContent = "";
  resultArea.classList.add("hidden");
  buttonsEl.innerHTML = "";
  comboCount = 0;

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
  comboCount = 0;

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
    btn.classList.add("correct", "disabled");

    // 連続正解ボーナス（最大5個）
    comboCount++;
    const starsToSpawn = Math.min(comboCount, 5);
    for (let i = 0; i < starsToSpawn; i++) {
      spawnStar();
    }

    currentIndex++;
    resultArea.classList.add("hidden");

    if (currentIndex >= problems.length) {
      finishGame();
    } else {
      showQuestion();
    }
  } else {
    btn.classList.add("wrong");
    setTimeout(() => btn.classList.remove("wrong"), 400);
    comboCount = 0; // リセット
  }
}

function spawnStar() {
  const star = document.createElement("div");
  star.className = "star";
  star.textContent = "⭐";

  // 星の大きさランダム化（16px〜48px）
  const size = Math.floor(Math.random() * (48 - 16 + 1)) + 16;
  star.style.fontSize = `${size}px`;

  // アニメーション時間ランダム化（0.7〜1.2秒）
  const duration = (Math.random() * (1.2 - 0.7) + 0.7).toFixed(2);

  const centerArea = document.getElementById("center-area");
  const centerRect = centerArea.getBoundingClientRect();

  // ランダムXスタート位置
  const startX = Math.random() * (centerRect.width - size);
  star.style.left = `${startX}px`;
  star.style.top = `0px`;

  // ランダム左右移動量（-30px〜30px）
  const deltaX = Math.floor(Math.random() * 61) - 30;

  centerArea.appendChild(star);

  // JSで左右+上へのアニメーション
  star.animate(
    [
      { transform: `translateX(0) translateY(0) scale(1)`, opacity: 1 },
      { transform: `translateX(${deltaX}px) translateY(-60px) scale(1.3)`, opacity: 1 },
      { transform: `translateX(${deltaX/2}px) translateY(-120px) scale(0.8)`, opacity: 0 }
    ],
    {
      duration: duration * 1000,
      easing: "ease-out",
      fill: "forwards"
    }
  );

  star.addEventListener("animationend", () => star.remove());
}

function finishGame() {
  const time = ((Date.now() - startTime) / 1000).toFixed(1);
  resultArea.classList.remove("hidden");
  timeText.textContent = `タイム：${time} 秒`;
  questionEl.textContent = "";
  statusEl.textContent = "";
  comboCount = 0;
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