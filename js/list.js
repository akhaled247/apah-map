/**
 * CED-ordered artwork list page.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    const listContainer = document.getElementById('artwork-list');
    if (!listContainer) return;

    try {
      await window.DataLoader.loadAll();
      renderList(listContainer);
    } catch (err) {
      console.error('List page initialization error:', err);
      listContainer.innerHTML = `
        <div class="list-error">
          <h2>Failed to load artworks</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
  });

  function resolveAssetPath(src) {
    if (!src || /^https?:\/\//i.test(src)) return src;
    return `../${src.replace(/^\//, '')}`;
  }

  function renderList(container) {
    const artworks = window.DataLoader.getArtworks()
      .slice()
      .sort(function (a, b) { return a.id - b.id; });

    container.innerHTML = '';

    artworks.forEach(function (artwork) {
      const paddedId = window.ArtworkRender.padId(artwork.id);
      const images = window.DataLoader.getImagesForArtwork(artwork.id);
      const thumb = images[0];

      const card = document.createElement('article');
      card.className = 'artwork-list-card';
      card.id = `ced-${paddedId}`;

      const link = `${paddedId}/`;

      card.innerHTML = `
        <a class="list-card-thumb" href="${link}" aria-label="View ${artwork.title}">
          <img src="${escapeAttr(resolveAssetPath(thumb.src))}" alt="${escapeAttr(thumb.alt || artwork.title)}" loading="lazy">
        </a>
        <div class="list-card-body">
          <div class="list-card-heading">
            <span class="list-card-ced">${paddedId}</span>
            <h2 class="list-card-title">
              <a href="${link}">${escapeHtml(artwork.title)}</a>
            </h2>
          </div>
          <dl class="list-card-attribution">
            <div><dt>Artist / Culture</dt><dd>${escapeHtml(window.ArtworkRender.formatArtistCulture(artwork))}</dd></div>
            <div><dt>Date</dt><dd>${escapeHtml(artwork.dateDisplay)}</dd></div>
            <div><dt>Medium</dt><dd>${escapeHtml(artwork.medium || '—')}</dd></div>
            <div><dt>Location</dt><dd>${escapeHtml(artwork.locationDisplay || '—')}</dd></div>
          </dl>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }
})();
