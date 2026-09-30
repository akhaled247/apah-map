/**
 * Dev helper: draft association concept stubs from vocabulary.json artwork links.
 * Output to stdout; merge manually into data/association-concepts.json.
 */

const fs = require('fs');
const path = require('path');

const vocabulary = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/vocabulary.json'), 'utf8')
);

const FACET_DEFAULT = 'form';
const MIN_ARTWORKS = 4;

const drafts = vocabulary
  .filter(function (entry) {
    return entry.artworks && entry.artworks.length >= MIN_ARTWORKS;
  })
  .map(function (entry) {
    return {
      id: 'vocab-' + entry.id,
      label: entry.term,
      facet: FACET_DEFAULT,
      units: entry.units || [],
      vocabId: entry.id,
      quizEligible: entry.artworks.length >= 4,
      artworks: entry.artworks.slice().sort(function (a, b) { return a - b; })
    };
  });

console.log(JSON.stringify({ concepts: drafts }, null, 2));
