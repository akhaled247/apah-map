/**
 * Adds a light shadow to the site header after the page scrolls slightly.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.app-header');
    if (!header) return;

    function updateHeader() {
      header.classList.toggle('is-scrolled', window.scrollY > 6);
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  });
})();
