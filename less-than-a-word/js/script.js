(async function main() {
  const characterId = "01";

  const { profile, state } = await DataLoader.loadCharacter(characterId);
  const progressData = await DataLoader.loadProgress(characterId, state.progress);

  UI.clear();

  let currentSceneId = progressData.scenes[0].id;
  const sceneMap = Object.fromEntries(
    progressData.scenes.map(s => [s.id, s])
  );

  async function playScene(id) {
    const scene = sceneMap[id];
    if (!scene) return;

    if (scene.type === "text") {
      UI.drawText(scene.text);
      if (scene.next) playScene(scene.next);
    }

    if (scene.type === "choice") {
      UI.showChoices(scene.choices, choice => {
        state.affection += choice.affection;
        UI.clearChoices();
        UI.drawText(choice.response);
        if (choice.next) playScene(choice.next);
      });
    }
  }

  playScene(currentSceneId);

  window.addEventListener("beforeunload", () => {
    DataLoader.saveState(characterId, state);
  });
})();
