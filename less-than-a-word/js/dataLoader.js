const DataLoader = {
  async loadJSON(path) {
    const res = await fetch(path);
    return await res.json();
  },

  async loadCharacter(characterId) {
    const base = `data/characters/${characterId}`;
    const profile = await this.loadJSON(`${base}/profile.json`);

    const state = JSON.parse(
      localStorage.getItem(`state_${characterId}`) ||
      JSON.stringify({
        affection: 0,
        progress: profile.initialProgress
      })
    );

    return { profile, state };
  },

  async loadProgress(characterId, progress) {
    const file = `${characterId}_${String(progress).padStart(4, "0")}.json`;
    return await this.loadJSON(`data/characters/${characterId}/${file}`);
  },

  saveState(characterId, state) {
    localStorage.setItem(`state_${characterId}`, JSON.stringify(state));
  }
};
