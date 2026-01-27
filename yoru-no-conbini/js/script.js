let currentSceneId = null;

window.addEventListener("load", async () => {
  currentSceneId = await loadScenario("data/day01.json");
  goToScene(currentSceneId);
});

function goToScene(id) {
  if (sceneMap[id]) {
    currentSceneId = id;
    renderScene(sceneMap[id], goToScene);
  } else if (endingMap[id]) {
    renderEnding(endingMap[id]);
  } else {
    logError("Scene not found: " + id);
  }
}
