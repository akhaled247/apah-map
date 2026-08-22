/**
 * Client-Side Artwork Search Component.
 * Instant search with typeahead dropdown and keyboard navigation.
 */

window.AppSearch = (function () {
  'use strict';

  let _input = null;
  let _clearBtn = null;
  let _dropdown = null;
  let _currentResults = [];
  let _focusedIndex = -1;

  function init() {
    _input = document.getElementById('artwork-search-input');
    _clearBtn = document.getElementById('search-clear-btn');
    _dropdown = document.getElementById('search-dropdown');

    if (!_input || !_dropdown) return;

    _input.addEventListener('input', handleInput);
    _input.addEventListener('keydown', handleKeyDown);
    _input.addEventListener('focus', () => {
      if (_currentResults.length > 0) openDropdown();
    });

    if (_clearBtn) {
      _clearBtn.addEventListener('click', clearSearch);
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-container')) {
        closeDropdown();
      }
    });

    console.log('AppSearch initialized.');
  }

  function handleInput() {
    const val = _input.value.trim();
    if (_clearBtn) {
      if (val.length > 0) _clearBtn.classList.add('active');
      else _clearBtn.classList.remove('active');
    }

    if (val.length === 0) {
      closeDropdown();
      window.AppState.setSearchQuery('');
      return;
    }

    const all = window.DataLoader.getArtworks();
    const q = val.toLowerCase();

    _currentResults = all.filter(a => {
      const idStr = String(a.id);
      const title = (a.title || '').toLowerCase();
      const artist = (a.artist || '').toLowerCase();
      const culture = (a.culture || '').toLowerCase();
      const location = (a.locationDisplay || '').toLowerCase();
      const medium = (a.medium || '').toLowerCase();

      return idStr === q ||
        title.includes(q) ||
        artist.includes(q) ||
        culture.includes(q) ||
        location.includes(q) ||
        medium.includes(q);
    }).slice(0, 15); // Top 15 matches

    renderDropdown();
  }

  function renderDropdown() {
    _dropdown.innerHTML = '';
    _focusedIndex = -1;

    if (_currentResults.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-result-item';
      empty.style.color = '#888';
      empty.textContent = 'No matching artworks found.';
      _dropdown.appendChild(empty);
      openDropdown();
      return;
    }

    _currentResults.forEach((art, idx) => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.setAttribute('role', 'option');
      item.setAttribute('data-id', art.id);

      const idSpan = document.createElement('span');
      idSpan.className = 'search-item-id';
      idSpan.textContent = art.id;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'search-item-title';
      titleSpan.textContent = art.title;

      const metaSpan = document.createElement('span');
      metaSpan.className = 'search-item-meta';
      metaSpan.textContent = `Unit ${art.unit} • ${art.dateDisplay}`;

      item.appendChild(idSpan);
      item.appendChild(titleSpan);
      item.appendChild(metaSpan);

      item.addEventListener('click', function () {
        selectItem(art.id);
      });

      _dropdown.appendChild(item);
    });

    openDropdown();
  }

  function openDropdown() {
    _dropdown.classList.add('open');
    _input.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    _dropdown.classList.remove('open');
    _input.setAttribute('aria-expanded', 'false');
    _focusedIndex = -1;
  }

  function clearSearch() {
    _input.value = '';
    if (_clearBtn) _clearBtn.classList.remove('active');
    closeDropdown();
    window.AppState.setSearchQuery('');
  }

  function selectItem(artworkId) {
    window.AppState.selectArtwork(artworkId);
    closeDropdown();
  }

  function handleKeyDown(e) {
    const items = _dropdown.querySelectorAll('.search-result-item[data-id]');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _focusedIndex = (_focusedIndex + 1) % items.length;
      updateFocusedItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _focusedIndex = (_focusedIndex - 1 + items.length) % items.length;
      updateFocusedItem(items);
    } else if (e.key === 'Enter') {
      if (_focusedIndex >= 0 && _focusedIndex < items.length) {
        e.preventDefault();
        const id = items[_focusedIndex].getAttribute('data-id');
        selectItem(id);
      } else {
        // Apply text filter to whole map/timeline
        window.AppState.setSearchQuery(_input.value.trim());
        closeDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  }

  function updateFocusedItem(items) {
    items.forEach((it, idx) => {
      if (idx === _focusedIndex) {
        it.classList.add('focused');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('focused');
      }
    });
  }

  return {
    init,
    clearSearch
  };
})();
