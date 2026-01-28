async function loadProfile(charId) {
  const response = await fetch(`data/characters/${charId}/profile.json`);
  return await response.json();
}

async function loadProgressData(charId, progress) {
  const paddedProgress = progress.toString().padStart(4, '0');
  const fileName = `${charId}_${paddedProgress}.json`;
  const response = await fetch(`data/characters/${charId}/${fileName}`);
  if (!response.ok) throw new Error('Progress not found');
  return await response.json();
}
