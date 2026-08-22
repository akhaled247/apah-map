/**
 * Artwork Information Side Panel & Hover Preview Card.
 * Manages image carousels, metadata rendering, and AFFCC study notes.
 */

window.ArtworkPanel = (function () {
  'use strict';

  // Hover Card DOM
  let _hoverCard = null;
  let _hoverImg = null;
  let _hoverPrevBtn = null;
  let _hoverNextBtn = null;
  let _hoverImages = [];
  let _hoverImageIndex = 0;
  let _activeHoverArtworkId = null;

  // Panel DOM
  let _panel = null;
  let _panelCedTag = null;
  let _panelTitle = null;
  let _panelCloseBtn = null;
  let _panelImage = null;
  let _panelImagePrev = null;
  let _panelImageNext = null;
  let _panelImageCaption = null;
  let _panelImageControls = null;
  let _metaCulture = null;
  let _metaDate = null;
  let _metaMedium = null;
  let _metaLocation = null;
  let _metaUnit = null;
  let _affccContainer = null;
  let _panelImages = [];
  let _panelImageIndex = 0;

  function init() {
    // Hover elements
    _hoverCard = document.getElementById('hover-preview-card');
    _hoverImg = document.getElementById('hover-img');
    _hoverPrevBtn = document.getElementById('hover-prev-btn');
    _hoverNextBtn = document.getElementById('hover-next-btn');

    // Panel elements
    _panel = document.getElementById('artwork-panel');
    _panelCedTag = document.getElementById('panel-ced-tag');
    _panelTitle = document.getElementById('panel-title');
    _panelCloseBtn = document.getElementById('panel-close-btn');
    _panelImage = document.getElementById('panel-image');
    _panelImagePrev = document.getElementById('panel-img-prev');
    _panelImageNext = document.getElementById('panel-img-next');
    _panelImageCaption = document.getElementById('panel-image-caption');
    _panelImageControls = document.getElementById('panel-image-controls');
    _metaCulture = document.getElementById('panel-meta-culture');
    _metaDate = document.getElementById('panel-meta-date');
    _metaMedium = document.getElementById('panel-meta-medium');
    _metaLocation = document.getElementById('panel-meta-location');
    _metaUnit = document.getElementById('panel-meta-unit');
    _affccContainer = document.getElementById('panel-affcc-container');

    setupHoverCardEvents();
    setupPanelEvents();

    // Subscribe to state changes
    window.AppState.on('artwork:hover', function (data) {
      if (data.id) {
        showHoverCard(data.id, data.coordinates);
      } else {
        hideHoverCard();
      }
    });

    window.AppState.on('artwork:select', function (id) {
      if (id) {
        openPanel(id);
      } else {
        closePanel();
      }
    });

    console.log('ArtworkPanel initialized.');
  }

  /* ========================================================================
     Hover Preview Card (Spec Section 11 & 12)
     ======================================================================== */

  function setupHoverCardEvents() {
    if (!_hoverCard) return;

    _hoverCard.addEventListener('click', function () {
      if (_activeHoverArtworkId) {
        window.AppState.selectArtwork(_activeHoverArtworkId);
        hideHoverCard();
      }
    });

    if (_hoverPrevBtn) {
      _hoverPrevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        cycleHoverImage(-1);
      });
    }

    if (_hoverNextBtn) {
      _hoverNextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        cycleHoverImage(1);
      });
    }
  }

  function showHoverCard(artworkId, point) {
    if (!_hoverCard || !window.DataLoader) return;
    const artwork = window.DataLoader.getArtworkById(artworkId);
    if (!artwork) return;

    _activeHoverArtworkId = artwork.id;
    _hoverImages = window.DataLoader.getImagesForArtwork(artwork.id);
    _hoverImageIndex = 0;

    updateHoverImageDisplay();

    // Show or hide carousel arrows depending on image count
    if (_hoverImages.length > 1) {
      _hoverPrevBtn.style.display = 'flex';
      _hoverNextBtn.style.display = 'flex';
    } else {
      _hoverPrevBtn.style.display = 'none';
      _hoverNextBtn.style.display = 'none';
    }

    // Position card safely near cursor / marker
    const mapBox = document.querySelector('.map-container').getBoundingClientRect();
    let left = point.x + 15;
    let top = point.y - 85;

    if (left + 260 > mapBox.width) left = point.x - 265;
    if (top + 180 > mapBox.height) top = mapBox.height - 185;
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    _hoverCard.style.left = `${left}px`;
    _hoverCard.style.top = `${top}px`;
    _hoverCard.classList.add('visible');
    _hoverCard.setAttribute('aria-hidden', 'false');
  }

  function hideHoverCard() {
    if (!_hoverCard) return;
    _hoverCard.classList.remove('visible');
    _hoverCard.setAttribute('aria-hidden', 'true');
    _activeHoverArtworkId = null;
  }

  function cycleHoverImage(delta) {
    if (_hoverImages.length <= 1) return;
    _hoverImageIndex = (_hoverImageIndex + delta + _hoverImages.length) % _hoverImages.length;
    updateHoverImageDisplay();
  }

  function updateHoverImageDisplay() {
    if (_hoverImages.length === 0) return;
    const imgObj = _hoverImages[_hoverImageIndex];
    _hoverImg.src = imgObj.src;
    _hoverImg.alt = imgObj.alt || 'Artwork image';
  }

  /* ========================================================================
     Full Artwork Side Panel (Spec Section 13, 14, 18)
     ======================================================================== */

  function setupPanelEvents() {
    if (_panelCloseBtn) {
      _panelCloseBtn.addEventListener('click', function () {
        window.AppState.selectArtwork(null);
      });
    }

    if (_panelImagePrev) {
      _panelImagePrev.addEventListener('click', function () {
        cyclePanelImage(-1);
      });
    }

    if (_panelImageNext) {
      _panelImageNext.addEventListener('click', function () {
        cyclePanelImage(1);
      });
    }

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideHoverCard();
        if (_panel && _panel.classList.contains('open')) {
          window.AppState.selectArtwork(null);
        }
      }
    });
  }

  async function openPanel(artworkId) {
    if (!_panel || !window.DataLoader) return;
    const artwork = window.DataLoader.getArtworkById(artworkId);
    if (!artwork) return;

    hideHoverCard();

    // Populate header & metadata
    _panelCedTag.textContent = `CED #${artwork.id}`;
    _panelTitle.textContent = artwork.title;

    const artistOrCulture = [artwork.artist, artwork.culture].filter(Boolean).join(' • ') || '—';
    _metaCulture.textContent = artistOrCulture;
    _metaDate.textContent = artwork.dateDisplay;
    _metaMedium.textContent = artwork.medium || '—';
    _metaLocation.textContent = artwork.locationDisplay || '—';

    const unitObj = window.DataLoader.getUnitById(artwork.unit);
    _metaUnit.textContent = unitObj ? `Unit ${unitObj.id}: ${unitObj.name}` : `Unit ${artwork.unit}`;

    // Images
    _panelImages = window.DataLoader.getImagesForArtwork(artwork.id);
    _panelImageIndex = 0;
    updatePanelImageDisplay();

    if (_panelImages.length > 1) {
      _panelImageControls.style.display = 'flex';
    } else {
      _panelImageControls.style.display = 'none';
    }

    // Load AFFCC Markdown Content
    _affccContainer.innerHTML = '<div style="padding:12px; color:#777;">Loading study analysis...</div>';
    const affcc = await window.DataLoader.loadAffccContent(artwork.id);
    renderAffccContent(affcc, artwork);

    _panel.classList.add('open');
    _panel.setAttribute('aria-hidden', 'false');
  }

  function closePanel() {
    if (!_panel) return;
    _panel.classList.remove('open');
    _panel.setAttribute('aria-hidden', 'true');
  }

  function cyclePanelImage(delta) {
    if (_panelImages.length <= 1) return;
    _panelImageIndex = (_panelImageIndex + delta + _panelImages.length) % _panelImages.length;
    updatePanelImageDisplay();
  }

  function updatePanelImageDisplay() {
    if (_panelImages.length === 0) return;
    const current = _panelImages[_panelImageIndex];
    _panelImage.src = current.src;
    _panelImage.alt = current.alt || 'Artwork image';

    const countStr = _panelImages.length > 1 ? ` (${_panelImageIndex + 1} of ${_panelImages.length})` : '';
    const srcStr = current.source ? `Source: ${current.source}` : '';
    _panelImageCaption.textContent = [srcStr, countStr].filter(Boolean).join(' • ') || 'AP Art History Image Archive';
  }

  function isPendingSection(rawBody) {
    if (!rawBody || !rawBody.trim()) return true;
    const trimmed = rawBody.trim();
    return /^\*?Source notes pending/i.test(trimmed) ||
           /from owner source notes pending/i.test(trimmed) ||
           /^Source notes pending\b/i.test(trimmed);
  }

  function renderAffccContent(affcc, artwork) {
    _affccContainer.innerHTML = '';

    const sectionsOrder = ['Form', 'Function', 'Content', 'Context'];

    sectionsOrder.forEach(secKey => {
      const secDiv = document.createElement('div');
      secDiv.className = 'affcc-section';

      const heading = document.createElement('h3');
      heading.textContent = secKey;
      secDiv.appendChild(heading);

      const rawBody = affcc.sections && affcc.sections[secKey] ? affcc.sections[secKey] : '';

      if (isPendingSection(rawBody)) {
        const p = document.createElement('p');
        p.style.fontStyle = 'italic';
        p.style.color = '#7a7060';
        p.textContent = `Source notes pending for ${secKey.toLowerCase()}.`;
        secDiv.appendChild(p);
      } else {
        // Render nested lists, bullet points, or paragraphs
        const lines = rawBody.split('\n');
        // Stack of { level: number, ul: HTMLUListElement, lastLi: HTMLLIElement }
        let listStack = [];

        lines.forEach(line => {
          if (!line.trim()) return;

          // Match bullet pattern: indentation followed by '-' or '*'
          const bulletMatch = line.match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);

          if (bulletMatch) {
            const indentSpaces = bulletMatch[1].replace(/\t/g, '  ').length;
            const text = cleanMarkdownArtifacts(bulletMatch[2]);

            if (listStack.length === 0) {
              const ul = document.createElement('ul');
              secDiv.appendChild(ul);
              const li = document.createElement('li');
              li.textContent = text;
              ul.appendChild(li);
              listStack.push({ indent: indentSpaces, ul, lastLi: li });
            } else {
              const current = listStack[listStack.length - 1];

              if (indentSpaces > current.indent) {
                // Nested sub-list under the parent's last <li>
                const parentLi = current.lastLi || current.ul;
                const subUl = document.createElement('ul');
                parentLi.appendChild(subUl);
                const li = document.createElement('li');
                li.textContent = text;
                subUl.appendChild(li);
                listStack.push({ indent: indentSpaces, ul: subUl, lastLi: li });
              } else if (indentSpaces < current.indent) {
                // Pop stack until finding matching or lesser indent
                while (listStack.length > 1 && listStack[listStack.length - 1].indent > indentSpaces) {
                  listStack.pop();
                }
                const target = listStack[listStack.length - 1];
                const li = document.createElement('li');
                li.textContent = text;
                target.ul.appendChild(li);
                target.lastLi = li;
              } else {
                // Sibling at same indent level
                const li = document.createElement('li');
                li.textContent = text;
                current.ul.appendChild(li);
                current.lastLi = li;
              }
            }
          } else {
            // Regular paragraph line
            listStack = [];
            const p = document.createElement('p');
            p.textContent = cleanMarkdownArtifacts(line.trim());
            secDiv.appendChild(p);
          }
        });
      }

      _affccContainer.appendChild(secDiv);
    });

    // If pending, add subtle banner
    if (affcc.status === 'pending') {
      const banner = document.createElement('div');
      banner.className = 'affcc-status-note';
      banner.innerHTML = `<strong>Note:</strong> Detailed AFFCC notes for Unit ${artwork.unit} are queued to be imported from owner source files.`;
      _affccContainer.appendChild(banner);
    }
  }

  function cleanMarkdownArtifacts(str) {
    if (!str) return '';
    return str
      .replace(/\\-/g, '-')
      .replace(/\\\*/g, '')
      .replace(/\\_/g, '_')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\\/g, '')
      .trim();
  }

  return {
    init,
    openPanel,
    closePanel,
    showHoverCard,
    hideHoverCard
  };
})();
