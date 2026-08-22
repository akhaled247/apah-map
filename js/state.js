/**
 * Centralized Application State & Event Bus.
 * Synchronizes filter criteria, selected unit, active dates, search, and selected artwork.
 */

window.AppState = (function () {
  'use strict';

  const _state = {
    selectedUnit: 'all', // 'all' or 1..10
    startDate: -30000,
    endDate: 2026,
    searchQuery: '',
    selectedArtworkId: null,
    hoveredArtworkId: null,
    filteredArtworks: []
  };

  const _listeners = {};

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return () => off(event, callback);
  }

  function off(event, callback) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(cb => cb !== callback);
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(cb => {
      try {
        cb(data, _state);
      } catch (e) {
        console.error(`Error in event listener for "${event}":`, e);
      }
    });
  }

  function getState() {
    return { ..._state };
  }

  function setUnit(unitId) {
    const parsed = unitId === 'all' ? 'all' : parseInt(unitId, 10);
    if (_state.selectedUnit === parsed) return;
    _state.selectedUnit = parsed;
    emit('unit:change', _state.selectedUnit);
    applyFilters();
  }

  function setDateRange(startDate, endDate) {
    const s = Math.min(startDate, endDate);
    const e = Math.max(startDate, endDate);
    if (_state.startDate === s && _state.endDate === e) return;
    _state.startDate = s;
    _state.endDate = e;
    emit('date:change', { startDate: s, endDate: e });
    applyFilters();
  }

  function setSearchQuery(query) {
    const q = (query || '').trim();
    if (_state.searchQuery === q) return;
    _state.searchQuery = q;
    emit('search:change', _state.searchQuery);
    applyFilters();
  }

  function selectArtwork(id) {
    const numId = id !== null ? parseInt(id, 10) : null;
    _state.selectedArtworkId = numId;
    emit('artwork:select', numId);
  }

  function setHoveredArtwork(id, coordinates) {
    const numId = id !== null ? parseInt(id, 10) : null;
    _state.hoveredArtworkId = numId;
    emit('artwork:hover', { id: numId, coordinates });
  }

  function resetAll() {
    _state.selectedUnit = 'all';
    _state.startDate = -30000;
    _state.endDate = 2026;
    _state.searchQuery = '';
    _state.selectedArtworkId = null;
    _state.hoveredArtworkId = null;
    emit('reset', _state);
    applyFilters();
  }

  function applyFilters() {
    if (window.ArtworkFilters) {
      _state.filteredArtworks = window.ArtworkFilters.computeFilteredArtworks(_state);
    } else {
      _state.filteredArtworks = window.DataLoader ? window.DataLoader.getArtworks() : [];
    }
    emit('filter:change', _state.filteredArtworks);
  }

  return {
    getState,
    on,
    off,
    emit,
    setUnit,
    setDateRange,
    setSearchQuery,
    selectArtwork,
    setHoveredArtwork,
    resetAll,
    applyFilters
  };
})();
