const Utils = {
  calcAffectionLevel(affection, thresholds) {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (affection >= thresholds[i]) return i;
    }
    return 0;
  }
};
