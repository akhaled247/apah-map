/**
 * Generate directed relations[] from data/period-traditions.json (rich mesh).
 * Usage: node scripts/generate-period-relations.js [--write] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTWORKS_PATH = path.join(ROOT, 'data/artworks.json');
const TRADITIONS_PATH = path.join(ROOT, 'data/period-traditions.json');
const ASSOC_PATH = path.join(ROOT, 'data/association-concepts.json');
const CHRONO_EXCEPTIONS_PATH = path.join(ROOT, 'data/relation-chronology-exceptions.json');

const writeMode = process.argv.includes('--write');

const artworks = JSON.parse(fs.readFileSync(ARTWORKS_PATH, 'utf8'));
const byId = new Map(artworks.map(function (a) { return [a.id, a]; }));
const config = JSON.parse(fs.readFileSync(TRADITIONS_PATH, 'utf8'));
const chronoEx = JSON.parse(fs.readFileSync(CHRONO_EXCEPTIONS_PATH, 'utf8'));
const chronoSet = new Set(chronoEx.artworkIds || []);

const warnings = [];

function defaultNote(tradition, fromPeriod, toPeriod) {
  return tradition.label + ': ' + fromPeriod.label + ' → ' + toPeriod.label + ' (AP period progression).';
}

function relationKey(rel) {
  return rel.from + '|' + rel.to + '|' + rel.type;
}

function addRelation(map, rel) {
  if (rel.from === rel.to) return;
  if (!byId.has(rel.from) || !byId.has(rel.to)) {
    warnings.push('Invalid artwork id in relation ' + rel.from + ' -> ' + rel.to);
    return;
  }
  const fromArt = byId.get(rel.from);
  const toArt = byId.get(rel.to);
  if (
    fromArt.dateMidpoint != null &&
    toArt.dateMidpoint != null &&
    fromArt.dateMidpoint > toArt.dateMidpoint &&
    !chronoSet.has(rel.from) &&
    !chronoSet.has(rel.to)
  ) {
    warnings.push(
      'Chronology: ' + rel.from + ' (' + fromArt.dateMidpoint + ') -> ' + rel.to + ' (' + toArt.dateMidpoint + ')'
    );
  }
  const key = relationKey(rel);
  if (!map.has(key)) {
    map.set(key, rel);
  }
}

function sortByDate(ids) {
  return ids.slice().sort(function (a, b) {
    const da = byId.get(a).dateMidpoint;
    const db = byId.get(b).dateMidpoint;
    if (da == null && db == null) return a - b;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}

function generateFromTraditions() {
  const map = new Map();

  (config.manualRelations || []).forEach(function (rel) {
    addRelation(map, {
      from: rel.from,
      to: rel.to,
      type: rel.type,
      tradition: rel.tradition,
      note: rel.note,
      generated: false
    });
  });

  (config.traditions || []).forEach(function (tradition) {
    const intraType = tradition.intraType || 'period_succession';
    const interType = tradition.interType || 'period_succession';
    const tiers = tradition.tiers || [];

    tiers.forEach(function (tier, ti) {
      const sorted = sortByDate(tier.artworks || []);
      for (let i = 0; i < sorted.length - 1; i++) {
        addRelation(map, {
          from: sorted[i],
          to: sorted[i + 1],
          type: intraType,
          tradition: tradition.id,
          fromPeriod: tier.id,
          toPeriod: tier.id,
          note: tradition.label + ': within ' + tier.label + ', later work follows earlier.',
          generated: true
        });
      }

      if (ti < tiers.length - 1) {
        const nextTier = tiers[ti + 1];
        (tier.artworks || []).forEach(function (fromId) {
          (nextTier.artworks || []).forEach(function (toId) {
            addRelation(map, {
              from: fromId,
              to: toId,
              type: interType,
              tradition: tradition.id,
              fromPeriod: tier.id,
              toPeriod: nextTier.id,
              note: defaultNote(tradition, tier, nextTier),
              generated: true
            });
          });
        });
      }
    });
  });

  return Array.from(map.values()).sort(function (a, b) {
    if (a.tradition !== b.tradition) return (a.tradition || '').localeCompare(b.tradition || '');
    if (a.from !== b.from) return a.from - b.from;
    return a.to - b.to;
  });
}

const relations = generateFromTraditions();

const byTradition = {};
relations.forEach(function (r) {
  const t = r.tradition || 'unknown';
  byTradition[t] = (byTradition[t] || 0) + 1;
});

console.log('Generated ' + relations.length + ' directed relations.');
console.log('By tradition:', byTradition);
if (warnings.length) {
  console.warn('\nWarnings (' + warnings.length + '):');
  warnings.slice(0, 30).forEach(function (w) { console.warn('  ' + w); });
  if (warnings.length > 30) console.warn('  ... and ' + (warnings.length - 30) + ' more');
}

if (writeMode) {
  const assoc = JSON.parse(fs.readFileSync(ASSOC_PATH, 'utf8'));
  assoc.relations = relations;
  fs.writeFileSync(ASSOC_PATH, JSON.stringify(assoc, null, 2) + '\n');
  console.log('\nWrote relations to ' + ASSOC_PATH);
} else {
  console.log('\nDry run (pass --write to update association-concepts.json).');
}
