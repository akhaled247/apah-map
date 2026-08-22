/**
 * Artwork Filtering Logic.
 * Computes the active subset of artworks based on timeline overlap,
 * unit selection, and search query.
 */

window.ArtworkFilters = (function () {
  'use strict';

  function computeFilteredArtworks(state) {
    if (!window.DataLoader) return [];
    const all = window.DataLoader.getArtworks();
    if (!all || all.length === 0) return [];

    const selectedUnit = state.selectedUnit;
    const startYear = state.startDate;
    const endYear = state.endDate;
    const query = (state.searchQuery || '').toLowerCase().trim();

    return all.filter(artwork => {
      // 1. Unit filter
      if (selectedUnit !== 'all' && artwork.unit !== selectedUnit) {
        return false;
      }

      // 2. Date range overlap filter (spec section 5)
      if (startYear !== null && endYear !== null) {
        if (artwork.dateStart !== null && artwork.dateEnd !== null) {
          const overlap = artwork.dateStart <= endYear && artwork.dateEnd >= startYear;
          if (!overlap) return false;
        }
      }

      // 3. Search query filter
      if (query) {
        const idStr = String(artwork.id);
        const title = (artwork.title || '').toLowerCase();
        const artist = (artwork.artist || '').toLowerCase();
        const culture = (artwork.culture || '').toLowerCase();
        const location = (artwork.locationDisplay || '').toLowerCase();
        const medium = (artwork.medium || '').toLowerCase();

        const match = idStr === query ||
          title.includes(query) ||
          artist.includes(query) ||
          culture.includes(query) ||
          location.includes(query) ||
          medium.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }

  return {
    computeFilteredArtworks
  };
})();
