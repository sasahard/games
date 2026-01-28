let currentCharId = '01'; // MVP: 固定キャラ
let currentProgress, currentAffection, profile, progressData;

async function initGame() {
  profile = await loadProfile(currentCharId);
  const state = loadCharState(currentCharId, profile.initialProgress);
  currentProgress = state.progress;
  currentAffection = state.affection;
  await loadAndPlayProgress();
}

async function loadAndPlayProgress() {
  try {
    progressData = await loadProgressData(currentCharId, currentProgress);
    if (getAffectionLevel(currentAffection, profile.affectionThresholds) < progressData.affectionLevelRequired) {
      alert('好感度が不足しています。');
      return;
    }
    playScenes(progressData.scenes);
  } catch (e) {
    alert('ゲーム終了');
  }
}

function playScenes(scenes, index = 0) {
  if (index >= scenes.length) {
    completeProgress();
    return;
  }

  const scene = scenes[index];
  if (scene.type === 'text') {
    drawMessage(profile.icon, scene.text, true);
    const nextIndex = scenes.findIndex(s => s.id === scene.next);
    playScenes(scenes, nextIndex !== -1 ? nextIndex : index + 1);
  } else if (scene.type === 'choice') {
    drawMessage('', scene.text, false); // プレイヤーの思考
    showChoices(scene.choices, choice => {
      currentAffection += choice.affection;
      drawMessage(profile.icon, choice.response, true);
      saveCharState(currentCharId, currentProgress, currentAffection);
      const nextIndex = scenes.findIndex(s => s.id === choice.next);
      playScenes(scenes, nextIndex !== -1 ? nextIndex : index + 1);
    });
  }
}

function completeProgress() {
  showEndMessage(progressData.end.message);
  currentProgress++;
  saveCharState(currentCharId, currentProgress, currentAffection);
  // 次回起動で自動次Progress
}

initGame();
