const canvas = document.getElementById('chat-canvas');
const ctx = canvas.getContext('2d');
const choicesContainer = document.getElementById('choices-container');

let messages = []; // 描画メッセージリスト
let yOffset = 20; // 吹き出しのY位置

function drawMessage(iconSrc, text, isLeft = true) {
  const img = new Image();
  img.src = iconSrc;
  img.onload = () => {
    ctx.drawImage(img, isLeft ? 10 : canvas.width - 60, yOffset, 50, 50);
    ctx.fillStyle = isLeft ? '#e0f7fa' : '#fff3e0';
    ctx.fillRect(isLeft ? 70 : 10, yOffset, canvas.width - 80, 50);
    ctx.fillStyle = '#000';
    ctx.fillText(text, isLeft ? 80 : 20, yOffset + 30);
    yOffset += 60;
    if (yOffset > canvas.height - 100) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      yOffset = 20; // 簡易スクロール（MVPなのでリセット）
    }
  };
}

function showChoices(choices, callback) {
  choicesContainer.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-button';
    btn.textContent = choice.label;
    btn.onclick = () => {
      callback(choice);
      choicesContainer.innerHTML = '';
    };
    choicesContainer.appendChild(btn);
  });
}

function showEndMessage(message) {
  drawMessage('', message, false); // プレイヤー側として表示
}
