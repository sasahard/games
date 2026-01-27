let sceneMap = {};
let endingMap = {};

async function loadScenario(path) {
  const res = await fetch(path);
  const data = await res.json();

  data.scenes.forEach(scene => {
    sceneMap[scene.id] = scene;
  });

  data.endings.forEach(end => {
    endingMap[end.id] = end;
  });

  return data.scenes[0].id;
}
