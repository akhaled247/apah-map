/**
 * Main Application Bootstrap.
 * Loads static datasets, initializes components, and sets up global reset.
 */

(async function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    try {
      console.log('Initializing AP Art History Interactive Map & Timeline...');

      // 1. Load static dataset
      await window.DataLoader.loadAll();

      // 2. Initialize subcomponents
      window.AppMap.init();
      window.AppTimeline.init();
      window.ArtworkPanel.init();
      window.AppSearch.init();
      window.AppRandom.init();

      // 3. Setup global reset button
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          window.AppState.resetAll();
          if (window.AppSearch) window.AppSearch.clearSearch();
        });
      }

      // 4. Initial filter calculation and marker rendering
      window.AppState.applyFilters();

      console.log('AP Art History Application ready.');
    } catch (err) {
      console.error('Fatal initialization error:', err);
      const main = document.querySelector('.map-container');
      if (main) {
        main.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #802b2b;">
            <h2>Initialization Error</h2>
            <p>Failed to load data files. Please ensure you are serving the site from a local HTTP server or GitHub Pages.</p>
            <pre style="margin-top: 10px; font-size: 12px; color: #555;">${err.message}</pre>
          </div>
        `;
      }
    }
  });
})();
