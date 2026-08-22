/**
 * Random Artwork Exploration Control.
 * Picks an artwork at random from the currently filtered dataset and opens its detail panel.
 */

window.AppRandom = (function () {
  'use strict';

  function init() {
    const randomBtn = document.getElementById('random-artwork-btn');
    if (!randomBtn) return;

    randomBtn.addEventListener('click', pickRandomArtwork);

    console.log('AppRandom initialized.');
  }

  function pickRandomArtwork() {
    if (!window.AppState || !window.DataLoader) return;

    const state = window.AppState.getState();
    let candidates = state.filteredArtworks;

    // Fallback to full list if none match
    if (!candidates || candidates.length === 0) {
      candidates = window.DataLoader.getArtworks();
    }

    if (!candidates || candidates.length === 0) return;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];

    console.log(`Random artwork selected: #${chosen.id} (${chosen.title})`);
    window.AppState.selectArtwork(chosen.id);
  }

  return {
    init,
    pickRandomArtwork
  };
})();
