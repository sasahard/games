const UI = (() => {
  const canvas = document.getElementById("chatCanvas");
  const ctx = canvas.getContext("2d");
  const choicesEl = document.getElementById("choices");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - choicesEl.offsetHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  let y = 20;

  function drawText(text) {
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(text, 20, y);
    y += 30;
  }

  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    y = 20;
  }

  function showChoices(choices, onSelect) {
    choicesEl.innerHTML = "";
    choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice.label;
      btn.onclick = () => onSelect(choice);
      choicesEl.appendChild(btn);
    });
  }

  function clearChoices() {
    choicesEl.innerHTML = "";
  }

  return { drawText, clear, showChoices, clearChoices };
})();
