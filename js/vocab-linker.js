/**
 * Auto-link vocabulary terms in plain text (AFFCC study notes).
 */

window.VocabLinker = (function () {
  'use strict';

  const WORD_SPLIT = /([a-zA-Z][a-zA-Z0-9'-]*)/g;

  let _wordMap = null;
  let _cachedLength = 0;

  function normalizeWord(word) {
    return word.toLowerCase().replace(/[''`]/g, '');
  }

  function registerWord(map, word, entry) {
    const key = normalizeWord(word);
    if (!key || map.has(key)) return;
    map.set(key, { id: entry.id, term: entry.term });
  }

  function buildWordMap(vocabulary) {
    const map = new Map();
    (vocabulary || []).forEach(function (entry) {
      registerWord(map, entry.term, entry);
      (entry.aliases || []).forEach(function (alias) {
        registerWord(map, alias, entry);
      });
    });
    return map;
  }

  function lookupWord(word, wordMap) {
    const key = normalizeWord(word);
    if (!key) return null;

    if (wordMap.has(key)) return wordMap.get(key);

    if (key.length > 3 && key.endsWith('es')) {
      const stem = key.slice(0, -2);
      if (wordMap.has(stem)) return wordMap.get(stem);
    }
    if (key.length > 2 && key.endsWith('s')) {
      const stem = key.slice(0, -1);
      if (wordMap.has(stem)) return wordMap.get(stem);
    }

    return null;
  }

  function buildPatterns(vocabulary) {
    return buildWordMap(vocabulary);
  }

  function getWordMap(vocabulary) {
    if (!vocabulary || !vocabulary.length) return new Map();
    if (!_wordMap || _cachedLength !== vocabulary.length) {
      _wordMap = buildWordMap(vocabulary);
      _cachedLength = vocabulary.length;
    }
    return _wordMap;
  }

  function getPatterns(vocabulary) {
    const map = getWordMap(vocabulary);
    return map.size > 0 ? [{ _wordMap: map }] : [];
  }

  function resetCache() {
    _wordMap = null;
    _cachedLength = 0;
  }

  function appendLinkedText(parentEl, text, options) {
    if (!parentEl || !text) return;
    options = options || {};

    let wordMap = options.wordMap;
    if (!wordMap && options.patterns && options.patterns[0] && options.patterns[0]._wordMap) {
      wordMap = options.patterns[0]._wordMap;
    }
    if (!wordMap || wordMap.size === 0) {
      parentEl.textContent = text;
      return;
    }

    const basePath = options.basePath || 'vocab/';
    const parts = text.split(WORD_SPLIT);
    const fragment = document.createDocumentFragment();

    parts.forEach(function (part) {
      if (!part) return;

      if (/^[a-zA-Z][a-zA-Z0-9'-]*$/.test(part)) {
        const match = lookupWord(part, wordMap);
        if (match) {
          const a = document.createElement('a');
          a.className = 'vocab-link';
          a.href = basePath + '#vocab-' + match.id;
          a.textContent = part;
          a.setAttribute('data-vocab-id', match.id);
          fragment.appendChild(a);
          return;
        }
      }

      fragment.appendChild(document.createTextNode(part));
    });

    parentEl.appendChild(fragment);
  }

  return {
    buildPatterns: buildPatterns,
    buildWordMap: buildWordMap,
    getWordMap: getWordMap,
    appendLinkedText: appendLinkedText,
    getPatterns: getPatterns,
    resetCache: resetCache
  };
})();
