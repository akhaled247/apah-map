/**
 * Interactive Chronological Timeline Component.
 * Implements dual-handle range dragging, manual year input controls,
 * unit preset buttons, dynamic tick labels, and artwork dot indicators.
 */

window.AppTimeline = (function () {
  'use strict';

  const MIN_YEAR = -30000;
  const MAX_YEAR = 2026;

  let _trackContainer = null;
  let _track = null;
  let _highlightSpan = null;
  let _handleStart = null;
  let _handleEnd = null;
  let _inputStart = null;
  let _inputEnd = null;
  let _ticksContainer = null;
  let _dotsContainer = null;
  let _rangeLabel = null;

  let _isDraggingStart = false;
  let _isDraggingEnd = false;

  /**
   * Piecewise projection for responsive timeline feel:
   * 0% - 35%:  -30,000 to -1,000 BCE (Early Prehistory)
   * 35% - 70%: -1,000 BCE to 1600 CE (Classical & Medieval)
   * 70% - 100%: 1600 CE to 2026 CE (Modern & Contemporary)
   */
  function yearToPercent(year) {
    if (year <= -30000) return 0;
    if (year >= 2026) return 100;

    if (year < -1000) {
      // -30000 to -1000 -> 0% to 35%
      const fraction = (year - (-30000)) / ((-1000) - (-30000));
      return fraction * 35;
    } else if (year < 1600) {
      // -1000 to 1600 -> 35% to 70%
      const fraction = (year - (-1000)) / (1600 - (-1000));
      return 35 + fraction * 35;
    } else {
      // 1600 to 2026 -> 70% to 100%
      const fraction = (year - 1600) / (2026 - 1600);
      return 70 + fraction * 30;
    }
  }

  function percentToYear(pct) {
    pct = Math.max(0, Math.min(100, pct));

    if (pct <= 35) {
      const fraction = pct / 35;
      return Math.round(-30000 + fraction * (-1000 - (-30000)));
    } else if (pct <= 70) {
      const fraction = (pct - 35) / 35;
      return Math.round(-1000 + fraction * (1600 - (-1000)));
    } else {
      const fraction = (pct - 70) / 30;
      return Math.round(1600 + fraction * (2026 - 1600));
    }
  }

  function init() {
    _trackContainer = document.getElementById('timeline-track-container');
    _track = document.getElementById('timeline-track');
    _highlightSpan = document.getElementById('timeline-highlight-span');
    _handleStart = document.getElementById('timeline-handle-start');
    _handleEnd = document.getElementById('timeline-handle-end');
    _inputStart = document.getElementById('input-start-year');
    _inputEnd = document.getElementById('input-end-year');
    _ticksContainer = document.getElementById('timeline-ticks');
    _dotsContainer = document.getElementById('timeline-artwork-dots');
    _rangeLabel = document.getElementById('timeline-range-label');

    if (!_trackContainer) return;

    setupDragEvents();
    setupManualInputs();
    setupUnitPresets();

    renderTicks();
    renderArtworkDots();
    updateHandlePositions(-30000, 2026);

    // Listen to state changes
    window.AppState.on('date:change', function (dates) {
      updateHandlePositions(dates.startDate, dates.endDate);
    });

    window.AppState.on('reset', function (state) {
      updateHandlePositions(state.startDate, state.endDate);
      updateActiveUnitButton('all');
    });

    console.log('AppTimeline initialized.');
  }

  function setupDragEvents() {
    // Pointer / mouse down on handles
    _handleStart.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      _isDraggingStart = true;
      _handleStart.setPointerCapture(e.pointerId);
    });

    _handleEnd.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      _isDraggingEnd = true;
      _handleEnd.setPointerCapture(e.pointerId);
    });

    // Pointer move on track container
    window.addEventListener('pointermove', function (e) {
      if (!_isDraggingStart && !_isDraggingEnd) return;

      const rect = _trackContainer.getBoundingClientRect();
      const clientX = e.clientX;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));

      const newYear = percentToYear(pct);
      const state = window.AppState.getState();

      if (_isDraggingStart) {
        const cappedYear = Math.min(newYear, state.endDate);
        window.AppState.setDateRange(cappedYear, state.endDate);
      } else if (_isDraggingEnd) {
        const cappedYear = Math.max(newYear, state.startDate);
        window.AppState.setDateRange(state.startDate, cappedYear);
      }
    });

    window.addEventListener('pointerup', function (e) {
      _isDraggingStart = false;
      _isDraggingEnd = false;
    });

    window.addEventListener('pointercancel', function (e) {
      _isDraggingStart = false;
      _isDraggingEnd = false;
    });

    // Track click to jump nearest handle
    _trackContainer.addEventListener('click', function (e) {
      if (e.target === _handleStart || e.target === _handleEnd) return;
      const rect = _trackContainer.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clickedYear = percentToYear(pct);
      const state = window.AppState.getState();

      const distToStart = Math.abs(clickedYear - state.startDate);
      const distToEnd = Math.abs(clickedYear - state.endDate);

      if (distToStart < distToEnd) {
        window.AppState.setDateRange(clickedYear, state.endDate);
      } else {
        window.AppState.setDateRange(state.startDate, clickedYear);
      }
    });
  }

  function setupManualInputs() {
    const applyBtn = document.getElementById('btn-apply-years');

    function applyManualValues() {
      const rawStart = _inputStart.value.trim();
      const rawEnd = _inputEnd.value.trim();

      const normStart = window.DateUtils.normalizeDateDisplay(rawStart);
      const normEnd = window.DateUtils.normalizeDateDisplay(rawEnd);

      const s = normStart.dateStart !== null ? normStart.dateStart : parseInt(rawStart, 10);
      const e = normEnd.dateEnd !== null ? normEnd.dateEnd : parseInt(rawEnd, 10);

      if (!isNaN(s) && !isNaN(e)) {
        window.AppState.setDateRange(Math.max(MIN_YEAR, s), Math.min(MAX_YEAR, e));
      }
    }

    if (applyBtn) {
      applyBtn.addEventListener('click', applyManualValues);
    }

    _inputStart.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') applyManualValues();
    });

    _inputEnd.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') applyManualValues();
    });
  }

  function setupUnitPresets() {
    const nav = document.getElementById('unit-presets-nav');
    if (!nav) return;

    nav.addEventListener('click', function (e) {
      const target = e.target.closest('.unit-tab');
      if (!target) return;

      const unitAttr = target.getAttribute('data-unit');
      updateActiveUnitButton(unitAttr);

      if (unitAttr === 'all') {
        window.AppState.setUnit('all');
        window.AppState.setDateRange(MIN_YEAR, MAX_YEAR);
      } else {
        const unitId = parseInt(unitAttr, 10);
        const unit = window.DataLoader.getUnitById(unitId);
        if (unit) {
          window.AppState.setUnit(unitId);
          window.AppState.setDateRange(unit.dateStart, unit.dateEnd);
        }
      }
    });
  }

  function updateActiveUnitButton(unitId) {
    const tabs = document.querySelectorAll('.unit-tab');
    tabs.forEach(tab => {
      const u = tab.getAttribute('data-unit');
      if (String(u) === String(unitId)) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function updateHandlePositions(startDate, endDate) {
    const startPct = yearToPercent(startDate);
    const endPct = yearToPercent(endDate);

    _handleStart.style.left = `${startPct}%`;
    _handleEnd.style.left = `${endPct}%`;

    _highlightSpan.style.left = `${startPct}%`;
    _highlightSpan.style.width = `${endPct - startPct}%`;

    _handleStart.setAttribute('aria-valuenow', startDate);
    _handleEnd.setAttribute('aria-valuenow', endDate);

    // Update label and inputs
    const rangeText = window.DateUtils.formatRange(startDate, endDate);
    if (_rangeLabel) _rangeLabel.textContent = rangeText;

    if (_inputStart && document.activeElement !== _inputStart) {
      _inputStart.value = window.DateUtils.formatYear(startDate);
    }
    if (_inputEnd && document.activeElement !== _inputEnd) {
      _inputEnd.value = window.DateUtils.formatYear(endDate);
    }
  }

  function renderTicks() {
    if (!_ticksContainer) return;
    _ticksContainer.innerHTML = '';

    const majorMilestones = [
      -30000, -20000, -10000, -5000, -3000, -1000, -500, 1, 500, 1000, 1500, 1800, 1900, 2000, 2026
    ];

    majorMilestones.forEach(year => {
      const pct = yearToPercent(year);
      const tick = document.createElement('div');
      tick.className = 'timeline-tick';
      tick.style.left = `${pct}%`;

      const mark = document.createElement('div');
      mark.className = 'timeline-tick-mark';

      const label = document.createElement('div');
      label.className = 'timeline-tick-label';
      label.textContent = formatTickLabel(year);

      tick.appendChild(mark);
      tick.appendChild(label);
      _ticksContainer.appendChild(tick);
    });
  }

  function formatTickLabel(year) {
    if (year === 2026) return 'Present';
    if (year < 0) {
      return `${Math.abs(year).toLocaleString()} BCE`;
    }
    if (year === 1) return '1 CE';
    return `${year} CE`;
  }

  function renderArtworkDots() {
    if (!_dotsContainer || !window.DataLoader) return;
    _dotsContainer.innerHTML = '';

    const artworks = window.DataLoader.getArtworks();
    artworks.forEach(art => {
      if (art.dateMidpoint === null) return;
      const pct = yearToPercent(art.dateMidpoint);
      const dot = document.createElement('div');
      dot.className = 'timeline-art-dot';
      dot.style.left = `${pct}%`;
      dot.title = `#${art.id}. ${art.title} (${art.dateDisplay})`;
      _dotsContainer.appendChild(dot);
    });
  }

  return {
    init,
    updateHandlePositions,
    renderArtworkDots
  };
})();
