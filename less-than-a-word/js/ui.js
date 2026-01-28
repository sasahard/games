// ui.js
const messagesContainer = document.getElementById('chat-messages');
const choicesContainer = document.getElementById('chat-choices');

export function addMessage(sender, text, icon = null) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);

  if (icon && sender === 'char') {
    const iconImg = document.createElement('img');
    iconImg.src = icon;
    iconImg.classList.add('icon');
    messageDiv.appendChild(iconImg);
  }

  const bubbleDiv = document.createElement('div');
  bubbleDiv.classList.add('bubble');
  bubbleDiv.textContent = text;
  messageDiv.appendChild(bubbleDiv);

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function showChoices(choices, onChoiceSelected) {
  choicesContainer.innerHTML = '';
  choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.classList.add('choice-button');
    button.textContent = choice.label;
    button.onclick = () => onChoiceSelected(index);
    choicesContainer.appendChild(button);
  });
}

export function clearChoices() {
  choicesContainer.innerHTML = '';
}

export function showEndMessage(message) {
  addMessage('system', message);
}
