/**
 * Shared artwork rendering: metadata, image captions, and AFFCC markdown.
 * Used by the map side panel, list page, and standalone artwork detail pages.
 */

window.ArtworkRender = (function () {
  'use strict';

  function padId(id) {
    return String(id).padStart(3, '0');
  }

  function artworkPageUrl(id) {
    return `list/${padId(id)}/`;
  }

  function formatArtistCulture(artwork) {
    return [artwork.artist, artwork.culture].filter(Boolean).join(' • ') || '—';
  }

  function formatUnitText(artwork) {
    if (!window.DataLoader) return `Unit ${artwork.unit}`;
    const unitObj = window.DataLoader.getUnitById(artwork.unit);
    return unitObj ? `Unit ${unitObj.id}: ${unitObj.name}` : `Unit ${artwork.unit}`;
  }

  function buildImageCaption(current, index, total) {
    const countStr = total > 1 ? ` (${index + 1} of ${total})` : '';
    const srcStr = current.source ? `Source: ${current.source}` : '';
    return [srcStr, countStr].filter(Boolean).join(' • ') || 'AP Art History Image Archive';
  }

  function populateMetadata(artwork, nodes) {
    if (nodes.culture) nodes.culture.textContent = formatArtistCulture(artwork);
    if (nodes.date) nodes.date.textContent = artwork.dateDisplay;
    if (nodes.medium) nodes.medium.textContent = artwork.medium || '—';
    if (nodes.location) nodes.location.textContent = artwork.locationDisplay || '—';
    if (nodes.unit) nodes.unit.textContent = formatUnitText(artwork);
  }

  function isPendingSection(rawBody) {
    if (!rawBody || !rawBody.trim()) return true;
    const trimmed = rawBody.trim();
    return /^\*?Source notes pending/i.test(trimmed) ||
           /from owner source notes pending/i.test(trimmed) ||
           /^Source notes pending\b/i.test(trimmed);
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

  function renderAffccContent(container, affcc, artwork) {
    if (!container) return;
    container.innerHTML = '';

    const sectionsOrder = ['Form', 'Function', 'Content', 'Context'];

    sectionsOrder.forEach(function (secKey) {
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
        const lines = rawBody.split('\n');
        let listStack = [];

        lines.forEach(function (line) {
          if (!line.trim()) return;

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
              listStack.push({ indent: indentSpaces, ul: ul, lastLi: li });
            } else {
              const current = listStack[listStack.length - 1];

              if (indentSpaces > current.indent) {
                const parentLi = current.lastLi || current.ul;
                const subUl = document.createElement('ul');
                parentLi.appendChild(subUl);
                const li = document.createElement('li');
                li.textContent = text;
                subUl.appendChild(li);
                listStack.push({ indent: indentSpaces, ul: subUl, lastLi: li });
              } else if (indentSpaces < current.indent) {
                while (listStack.length > 1 && listStack[listStack.length - 1].indent > indentSpaces) {
                  listStack.pop();
                }
                const target = listStack[listStack.length - 1];
                const li = document.createElement('li');
                li.textContent = text;
                target.ul.appendChild(li);
                target.lastLi = li;
              } else {
                const li = document.createElement('li');
                li.textContent = text;
                current.ul.appendChild(li);
                current.lastLi = li;
              }
            }
          } else {
            listStack = [];
            const p = document.createElement('p');
            p.textContent = cleanMarkdownArtifacts(line.trim());
            secDiv.appendChild(p);
          }
        });
      }

      container.appendChild(secDiv);
    });

    if (affcc.status === 'pending') {
      const banner = document.createElement('div');
      banner.className = 'affcc-status-note';
      banner.innerHTML = `<strong>Note:</strong> Detailed AFFCC notes for Unit ${artwork.unit} are queued to be imported from owner source files.`;
      container.appendChild(banner);
    }
  }

  /**
   * Binds prev/next controls to an image carousel.
   * Returns { setImages, cycle, updateDisplay }.
   */
  function bindImageCarousel(options) {
    const imgEl = options.imgEl;
    const captionEl = options.captionEl;
    const controlsEl = options.controlsEl;
    const prevBtn = options.prevBtn;
    const nextBtn = options.nextBtn;

    let images = [];
    let index = 0;

    function updateDisplay() {
      if (images.length === 0) return;
      const current = images[index];
      if (imgEl) {
        imgEl.src = current.src;
        imgEl.alt = current.alt || 'Artwork image';
      }
      if (captionEl) {
        captionEl.textContent = buildImageCaption(current, index, images.length);
      }
      if (controlsEl) {
        controlsEl.style.display = images.length > 1 ? 'flex' : 'none';
      }
    }

    function setImages(newImages) {
      images = newImages || [];
      index = 0;
      updateDisplay();
    }

    function cycle(delta) {
      if (images.length <= 1) return;
      index = (index + delta + images.length) % images.length;
      updateDisplay();
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () { cycle(-1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { cycle(1); });
    }

    return { setImages: setImages, cycle: cycle, updateDisplay: updateDisplay };
  }

  return {
    padId: padId,
    artworkPageUrl: artworkPageUrl,
    formatArtistCulture: formatArtistCulture,
    formatUnitText: formatUnitText,
    buildImageCaption: buildImageCaption,
    populateMetadata: populateMetadata,
    renderAffccContent: renderAffccContent,
    bindImageCarousel: bindImageCarousel
  };
})();
