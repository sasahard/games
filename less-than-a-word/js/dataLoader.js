// dataLoader.js
export async function loadProfile(charId) {
  const response = await fetch(`data/characters/${charId}/profile.json`);
  return await response.json();
}

export async function loadProgressData(charId, progress) {
  const paddedProgress = progress.toString().padStart(4, '0');
  const fileName = `${charId}_${paddedProgress}.json`;
  const response = await fetch(`data/characters/${charId}/${fileName}`);
  return await response.json();
}
