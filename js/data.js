/**
 * Data loading and caching layer.
 * Fetches static JSON datasets and individual AFFCC markdown files.
 */

window.DataLoader = (function () {
  'use strict';

  let _artworks = [];
  let _units = [];
  let _imagesMap = new Map();
  let _affccCache = new Map();
  let _vocabulary = null;
  let _vocabById = new Map();
  let _vocabByTerm = new Map();

  function padId(id) {
    return String(id).padStart(3, '0');
  }

  function resolveSitePath(relativePath) {
    const script = document.querySelector('script[src*="js/data.js"]');
    const base = script && script.src
      ? new URL('../', script.src)
      : new URL('./', window.location.href);
    return new URL(relativePath, base).href;
  }

  async function loadAll() {
    try {
      const [artworksRes, unitsRes, imagesRes] = await Promise.all([
        fetch(resolveSitePath('data/artworks.json')),
        fetch(resolveSitePath('data/units.json')),
        fetch(resolveSitePath('data/images.json'))
      ]);

      if (!artworksRes.ok || !unitsRes.ok || !imagesRes.ok) {
        throw new Error('Failed to load core data files');
      }

      _artworks = await artworksRes.json();
      _units = await unitsRes.json();
      const imagesList = await imagesRes.json();
      _imagesMap = new Map(imagesList.map(img => [img.id, img.images]));

      console.log(`Loaded ${_artworks.length} artworks and ${_units.length} units.`);
      return { artworks: _artworks, units: _units };
    } catch (err) {
      console.error('Error in DataLoader.loadAll:', err);
      throw err;
    }
  }

  function getArtworks() {
    return _artworks;
  }

  function getArtworkById(id) {
    const numId = parseInt(id, 10);
    return _artworks.find(a => a.id === numId) || null;
  }

  function getUnits() {
    return _units;
  }

  function getUnitById(id) {
    const numId = parseInt(id, 10);
    return _units.find(u => u.id === numId) || null;
  }

  function getImagesForArtwork(id) {
    const numId = parseInt(id, 10);
    const custom = _imagesMap.get(numId);
    if (custom && custom.length > 0) return custom;
    return [
      {
        src: 'images/placeholder/artwork-placeholder.svg',
        alt: `Artwork #${id}`,
        source: 'College Board AP Art History CED',
        local: true
      }
    ];
  }

  /**
   * Fetches and parses content/affcc/XXX.md into structured sections
   */
  async function loadAffccContent(id) {
    const numId = parseInt(id, 10);
    if (_affccCache.has(numId)) {
      return _affccCache.get(numId);
    }

    const filePath = resolveSitePath(`content/affcc/${padId(numId)}.md`);
    try {
      const res = await fetch(filePath);
      if (!res.ok) {
        return {
          status: 'pending',
          sections: {
            Form: 'Source notes pending.',
            Function: 'Source notes pending.',
            Content: 'Source notes pending.',
            Context: 'Source notes pending.'
          }
        };
      }

      const mdText = await res.text();
      const parsed = parseAffccMarkdownText(mdText);
      _affccCache.set(numId, parsed);
      return parsed;
    } catch (err) {
      console.warn(`Could not load ${filePath}:`, err);
      return {
        status: 'pending',
        sections: {
          Form: 'Source notes pending.',
          Function: 'Source notes pending.',
          Content: 'Source notes pending.',
          Context: 'Source notes pending.'
        }
      };
    }
  }

  function parseAffccMarkdownText(mdText) {
    // Check frontmatter
    let status = 'complete';
    let cleanText = mdText;
    if (mdText.startsWith('---')) {
      const secondFence = mdText.indexOf('---', 3);
      if (secondFence !== -1) {
        const frontmatter = mdText.substring(3, secondFence);
        if (frontmatter.includes('status: "pending"')) {
          status = 'pending';
        }
        cleanText = mdText.substring(secondFence + 3).trim();
      }
    }

    const sections = {};
    const sectionRegex = /##\s+([A-Za-z]+)\n([\s\S]*?)(?=\n##\s+|$)/g;
    let match;

    while ((match = sectionRegex.exec(cleanText)) !== null) {
      const name = match[1].trim();
      const body = match[2].trim();
      sections[name] = body;
    }

    return {
      status,
      sections
    };
  }

  function indexVocabulary(list) {
    _vocabulary = list;
    _vocabById = new Map();
    _vocabByTerm = new Map();
    list.forEach(function (entry) {
      _vocabById.set(entry.id, entry);
      _vocabByTerm.set(entry.term.toLowerCase(), entry);
      (entry.aliases || []).forEach(function (alias) {
        _vocabByTerm.set(alias.toLowerCase(), entry);
      });
    });
    if (window.VocabLinker) {
      window.VocabLinker.resetCache();
    }
  }

  async function loadVocabulary() {
    if (_vocabulary) return _vocabulary;
    const res = await fetch(resolveSitePath('data/vocabulary.json'));
    if (!res.ok) throw new Error('Failed to load vocabulary.json');
    const list = await res.json();
    indexVocabulary(list);
    return _vocabulary;
  }

  function getVocabulary() {
    return _vocabulary || [];
  }

  function getVocabularyById(id) {
    return _vocabById.get(id) || null;
  }

  function getVocabularyByTerm(term) {
    if (!term) return null;
    return _vocabByTerm.get(term.toLowerCase()) || null;
  }

  function filterVocabularyByUnit(unit) {
    const all = getVocabulary();
    if (!unit || unit === 'all') return all.slice();
    const num = parseInt(unit, 10);
    return all.filter(function (e) {
      return e.units && e.units.indexOf(num) !== -1;
    });
  }

  return {
    loadAll,
    getArtworks,
    getArtworkById,
    getUnits,
    getUnitById,
    getImagesForArtwork,
    loadAffccContent,
    loadVocabulary,
    getVocabulary,
    getVocabularyById,
    getVocabularyByTerm,
    filterVocabularyByUnit
  };
})();
