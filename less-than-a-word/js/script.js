// script.js
import { loadProfile, loadProgressData } from './dataLoader.js';
import { addMessage, showChoices, clearChoices, showEndMessage } from './ui.js';
import { saveState, loadState, getAffectionLevel } from './utils.js';

let currentCharId = '01'; // MVP: キャラ01固定
let currentProgressData;
let currentSceneIndex = 0;
let currentAffection = 0;
let currentProgress = 1;
let profile;

async function init() {
  const state = loadState(currentCharId);
  currentProgress = state.progress;
  currentAffection = state.affection;

  profile = await loadProfile(currentCharId);
  currentProgressData = await loadProgressData(currentCharId, currentProgress);

  // 好感度レベルチェック（MVPでは簡易分岐なし。将来的に使用）
  const affectionLevel = getAffectionLevel(currentAffection, profile.affectionThresholds);

  playNextScene();
}

function playNextScene() {
  if (currentSceneIndex >= currentProgressData.scenes.length) {
    completeProgress();
    return;
  }

  const scene = currentProgressData.scenes[currentSceneIndex];

  if (scene.type === 'text') {
    addMessage('char', scene.text, profile.icon);
    if (scene.next) {
      currentSceneIndex = currentProgressData.scenes.findIndex(s => s.id === scene.next);
    } else {
      currentSceneIndex++;
    }
    setTimeout(playNextScene, 1000); // 簡易遅延で自然に表示
  } else if (scene.type === 'choice') {
    addMessage('player', scene.text);
    showChoices(scene.choices, handleChoice);
  }
}

function handleChoice(choiceIndex) {
  const choice = currentProgressData.scenes[currentSceneIndex].choices[choiceIndex];
  addMessage('player', choice.label);
  currentAffection += choice.affection;
  addMessage('char', choice.response, profile.icon);
  clearChoices();

  saveState(currentCharId, currentProgress, currentAffection);

  if (choice.next) {
    currentSceneIndex = currentProgressData.scenes.findIndex(s => s.id === choice.next);
  } else {
    currentSceneIndex++;
  }
  setTimeout(playNextScene, 1000);
}

function completeProgress() {
  showEndMessage(currentProgressData.end.message);
  currentProgress++;
  saveState(currentCharId, currentProgress, currentAffection);
  // 次回起動で次のProgressへ（リロードで自動）
}

init();
