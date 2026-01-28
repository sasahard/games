// 好感度レベル判定
function getAffectionLevel(affection, thresholds) {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (affection >= thresholds[i]) return i;
  }
  return 0;
}

// LocalStorage操作
function saveCharState(charId, progress, affection) {
  localStorage.setItem(`char_${charId}_progress`, progress);
  localStorage.setItem(`char_${charId}_affection`, affection);
}

function loadCharState(charId, initialProgress) {
  const progress = parseInt(localStorage.getItem(`char_${charId}_progress`)) || initialProgress;
  const affection = parseInt(localStorage.getItem(`char_${charId}_affection`)) || 0;
  return { progress, affection };
}
