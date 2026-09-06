/**
 * Standalone artwork detail page bootstrap (NNN/index.html).
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const body = document.body;
    const artworkId = parseInt(body.getAttribute('data-artwork-id'), 10);
    if (!artworkId || isNaN(artworkId)) {
      showError('Invalid artwork ID.');
      return;
    }

    try {
      await window.DataLoader.loadAll();
      const artwork = window.DataLoader.getArtworkById(artworkId);
      if (!artwork) {
        showError(`Artwork #${artworkId} not found.`);
        return;
      }

      document.title = `${window.ArtworkRender.padId(artwork.id)} - ${artwork.title}`;
      setupNavigation(artwork);
      await renderDetail(artwork);
    } catch (err) {
      console.error('Artwork page initialization error:', err);
      showError(err.message);
    }
  });

  function setupNavigation(artwork) {
    const prevLink = document.getElementById('nav-prev');
    const nextLink = document.getElementById('nav-next');
    const cedTag = document.getElementById('page-ced-tag');
    const titleEl = document.getElementById('page-title');

    if (cedTag) cedTag.textContent = `CED #${artwork.id}`;
    if (titleEl) titleEl.textContent = artwork.title;

    if (prevLink) {
      if (artwork.id > 1) {
        const prevId = window.ArtworkRender.padId(artwork.id - 1);
        prevLink.href = `${prevId}/`;
        prevLink.textContent = `← ${prevId}`;
        prevLink.style.visibility = 'visible';
      } else {
        prevLink.style.visibility = 'hidden';
      }
    }

    if (nextLink) {
      if (artwork.id < 250) {
        const nextId = window.ArtworkRender.padId(artwork.id + 1);
        nextLink.href = `${nextId}/`;
        nextLink.textContent = `${nextId} →`;
        nextLink.style.visibility = 'visible';
      } else {
        nextLink.style.visibility = 'hidden';
      }
    }
  }

  async function renderDetail(artwork) {
    window.ArtworkRender.populateMetadata(artwork, {
      culture: document.getElementById('page-meta-culture'),
      date: document.getElementById('page-meta-date'),
      medium: document.getElementById('page-meta-medium'),
      location: document.getElementById('page-meta-location'),
      unit: document.getElementById('page-meta-unit')
    });

    const images = window.DataLoader.getImagesForArtwork(artwork.id);
    const carousel = window.ArtworkRender.bindImageCarousel({
      imgEl: document.getElementById('page-image'),
      captionEl: document.getElementById('page-image-caption'),
      controlsEl: document.getElementById('page-image-controls'),
      prevBtn: document.getElementById('page-img-prev'),
      nextBtn: document.getElementById('page-img-next')
    });
    carousel.setImages(images);

    const affccContainer = document.getElementById('page-affcc-container');
    if (affccContainer) {
      affccContainer.innerHTML = '<div class="loading-note">Loading study analysis...</div>';
      const affcc = await window.DataLoader.loadAffccContent(artwork.id);
      window.ArtworkRender.renderAffccContent(affccContainer, affcc, artwork);
    }
  }

  function showError(message) {
    const main = document.querySelector('.artwork-page-main');
    if (main) {
      main.innerHTML = `
        <div class="list-error">
          <h2>Error</h2>
          <p>${message}</p>
          <p><a href="../">Back to artwork list</a></p>
        </div>
      `;
    }
  }
})();
