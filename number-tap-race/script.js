document.addEventListener("DOMContentLoaded", () => {

  const gameArea = document.getElementById("game-area");
  const startBtn = document.getElementById("start-btn");
  const countdownEl = document.getElementById("countdown");
  const timerEl = document.getElementById("timer");
  const diffButtonsEl = document.getElementById("difficulty-buttons");

  let difficulty = 1;
  let numbers = [];
  let sortedNumbers = [];
  let currentIndex = 0;
  let startTime = null;
  let timerInterval = null;

  /* ===== 難易度ボタン生成（1〜9） ===== */
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "diff-btn";
    if (i === difficulty) btn.classList.add("active");

    btn.addEventListener("click", () => {
      difficulty = i;
      document.querySelectorAll(".diff-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });

    diffButtonsEl.appendChild(btn);
  }

  /* ===== スタート ===== */
  startBtn.addEventListener("click", async () => {
    resetGame();
    await countdown();
    startGame();
  });

  function resetGame() {
    gameArea.innerHTML = "";
    timerEl.textContent = "0.00s";
    currentIndex = 0;

    const maxNumber = difficulty * 9;
    const pool = shuffle([...Array(maxNumber)].map((_, i) => i + 1));

    numbers = pool.slice(0, 9);
    sortedNumbers = [...numbers].sort((a, b) => a - b);
  }

  /* ===== カウントダウン ===== */
  function countdown() {
    return new Promise(resolve => {
      let count = 3;
      countdownEl.textContent = count;

      const interval = setInterval(() => {
        count--;
        if (count === 0) {
          countdownEl.textContent = "";
          clearInterval(interval);
          resolve();
        } else {
          countdownEl.textContent = count;
        }
      }, 1000);
    });
  }

  /* ===== ゲーム開始 ===== */
  function startGame() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 50);

    shuffle(numbers).forEach(num => {
      const btn = document.createElement("button");
      btn.textContent = num;
      btn.className = "number-btn";
      btn.addEventListener("click", () => handleTap(num, btn));
      gameArea.appendChild(btn);
    });
  }

  function handleTap(num, btn) {
    if (num !== sortedNumbers[currentIndex]) return;

    btn.style.visibility = "hidden";
    currentIndex++;

    if (currentIndex === sortedNumbers.length) {
      clearInterval(timerInterval);
    }
  }

  function updateTimer() {
    const elapsed = (Date.now() - startTime) / 1000;
    timerEl.textContent = elapsed.toFixed(2) + "s";
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

});