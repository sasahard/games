const bgEl = document.getElementById("background");
const charEl = document.getElementById("character");
const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");

// ==========================
// 演出設定
// ==========================
const TYPE_SPEED = 30;     // 1文字あたり(ms)
const CHOICE_DELAY = 400; // テキスト後の間(ms)

let typingTimer = null;

// ==========================
// Typewriter
// ==========================
function typeText(text, onComplete) {
  clearInterval(typingTimer);
  textEl.textContent = "";

  let index = 0;

  typingTimer = setInterval(() => {
    textEl.textContent += text[index];
    index++;

    if (index >= text.length) {
      clearInterval(typingTimer);
      typingTimer = null;
      onComplete && onComplete();
    }
  }, TYPE_SPEED);
}

// ==========================
// Scene Render
// ==========================
function renderScene(scene, onNext) {
  bgEl.style.backgroundImage = `url(${scene.bg})`;

  if (scene.character) {
    charEl.style.backgroundImage = `url(${scene.character})`;
    charEl.style.display = "block";
  } else {
    charEl.style.display = "none";
  }

  choicesEl.innerHTML = "";

  typeText(scene.text, () => {
    setTimeout(() => {
      // 選択肢がある場合
      if (scene.choices) {
        scene.choices.forEach(choice => {
          const btn = document.createElement("button");
          btn.textContent = choice.label;
          btn.onclick = () => onNext(choice.next);
          choicesEl.appendChild(btn);
        });
      }
      // 自動遷移の場合
      else if (scene.next) {
        const btn = document.createElement("button");
        btn.textContent = "……";
        btn.onclick = () => onNext(scene.next);
        choicesEl.appendChild(btn);
      }
    }, CHOICE_DELAY);
  });
}

// ==========================
// Ending Render
// ==========================
function renderEnding(ending) {
  choicesEl.innerHTML = "";

  typeText(ending.text, () => {
    setTimeout(() => {
      const btn = document.createElement("button");
      btn.textContent = "最初から";
      btn.onclick = () => location.reload();
      choicesEl.appendChild(btn);
    }, CHOICE_DELAY);
  });
}