// utils.js
export function getAffectionLevel(affection, thresholds) {
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (affection >= thresholds[i]) {
      return i;
    }
  }
  return 0;
}

export function saveState(charId, progress, affection) {
  localStorage.setItem(`char_${charId}_progress`, progress);
  localStorage.setItem(`char_${charId}_affection`, affection);
}

export function loadState(charId) {
  const progress = parseInt(localStorage.getItem(`char_${charId}_progress`)) || 1;
  const affection = parseInt(localStorage.getItem(`char_${charId}_affection`)) || 0;
  return { progress, affection };
}
