const bgEl = document.getElementById("background");
const charEl = document.getElementById("character");
const textEl = document.getElementById("text");
const choicesEl = document.getElementById("choices");

function renderScene(scene, onNext) {
  bgEl.style.backgroundImage = `url(${scene.bg})`;

  if (scene.character) {
    charEl.style.backgroundImage = `url(${scene.character})`;
    charEl.style.display = "block";
  } else {
    charEl.style.display = "none";
  }

  textEl.textContent = scene.text;
  choicesEl.innerHTML = "";

  if (scene.choices) {
    scene.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.textContent = choice.label;
      btn.onclick = () => onNext(choice.next);
      choicesEl.appendChild(btn);
    });
  } else if (scene.next) {
    const btn = document.createElement("button");
    btn.textContent = "……";
    btn.onclick = () => onNext(scene.next);
    choicesEl.appendChild(btn);
  }
}

function renderEnding(ending) {
  textEl.textContent = ending.text;
  choicesEl.innerHTML = "";

  const btn = document.createElement("button");
  btn.textContent = "最初から";
  btn.onclick = () => location.reload();
  choicesEl.appendChild(btn);
}
