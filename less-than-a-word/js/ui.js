const UI = (() => {
  const canvas = document.getElementById("chatCanvas");
  const ctx = canvas.getContext("2d");
  const choicesEl = document.getElementById("choices");

  const PADDING = 16;
  const LINE_HEIGHT = 22;
  const BUBBLE_RADIUS = 12;
  const MAX_WIDTH_RATIO = 0.75;

  let messages = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - choicesEl.offsetHeight;
    redraw();
  }
  window.addEventListener("resize", resize);
  resize();

  function wrapText(text, maxWidth) {
    const words = text.split("");
    let lines = [];
    let line = "";

    words.forEach(char => {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawBubble(x, y, width, height, isPlayer) {
    ctx.fillStyle = isPlayer ? "#dcf8c6" : "#eeeeee";
    ctx.beginPath();
    ctx.moveTo(x + BUBBLE_RADIUS, y);
    ctx.lineTo(x + width - BUBBLE_RADIUS, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + BUBBLE_RADIUS);
    ctx.lineTo(x + width, y + height - BUBBLE_RADIUS);
    ctx.quadraticCurveTo(x + width, y + height, x + width - BUBBLE_RADIUS, y + height);
    ctx.lineTo(x + BUBBLE_RADIUS, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - BUBBLE_RADIUS);
    ctx.lineTo(x, y + BUBBLE_RADIUS);
    ctx.quadraticCurveTo(x, y, x + BUBBLE_RADIUS, y);
    ctx.closePath();
    ctx.fill();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px sans-serif";

    let y = canvas.height - PADDING;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const maxWidth = canvas.width * MAX_WIDTH_RATIO;
      const lines = wrapText(msg.text, maxWidth - PADDING * 2);
      const height = lines.length * LINE_HEIGHT + PADDING * 2;
      const width = Math.min(
        maxWidth,
        Math.max(...lines.map(l => ctx.measureText(l).width)) + PADDING * 2
      );

      y -= height;

      const x = msg.isPlayer
        ? canvas.width - width - PADDING
        : PADDING;

      drawBubble(x, y, width, height, msg.isPlayer);

      ctx.fillStyle = "#000";
      lines.forEach((line, idx) => {
        ctx.fillText(
          line,
          x + PADDING,
          y + PADDING + LINE_HEIGHT * (idx + 1) - 6
        );
      });

      y -= 12;
    }
  }

  function addMessage(text, isPlayer = false) {
    messages.push({ text, isPlayer });
    redraw();
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

  function clearAll() {
    messages = [];
    redraw();
  }

  return {
    addMessage,
    showChoices,
    clearChoices,
    clearAll
  };
})();
