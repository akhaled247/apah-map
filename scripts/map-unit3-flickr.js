/**
 * Map scraped Flickr album photos to CED IDs 48–98.
 * Reads data/flickr-album-scraped.json, writes data/flickr-unit3-ids.json
 */
const fs = require('fs');
const path = require('path');

const photosPath = path.join(__dirname, '../data/flickr-album-scraped.json');
const outPath = path.join(__dirname, '../data/flickr-unit3-ids.json');
const manualPath = path.join(__dirname, '../data/flickr-unit3-manual.json');

const DEFAULT_MAX = 6;
const MAX_IMAGES = {
  55: 8,
  59: 8,
  63: 8,
  75: 10,
  93: 8
};

const CED_MATCHERS = {
  48: ['catacomb of priscilla', 'priscilla', 'greek chapel, catacomb', 'orant, catacomb'],
  49: ['santa sabina'],
  50: ['vienna genesis', 'rebecca and eliezer', 'jacob wrestling'],
  51: ['san vitale'],
  52: ['hagia sophia', 'aya sofya'],
  53: ['merovingian', 'looped fibulae', 'fibulae'],
  54: ['theotokos', 'virgin and child between saints', 'saint catherine', 'mount sinai'],
  55: ['lindisfarne', 'cross-carpet', 'st. matthew', 'st. luke', 'eadfrith'],
  56: ['great mosque', 'cordoba', 'córdoba', 'cordova'],
  57: ['pyxis of al-mughira', 'al-mughira', 'mughira'],
  58: ['sainte-foy', 'saint foy', 'conques'],
  59: ['bayeux tapestry', 'bayeux'],
  60: ['chartres', 'notre-dame de chartres', 'chartres cathedral'],
  61: ['blanche of castile', 'bibles moralis', 'moralized bible', 'louis ix'],
  62: ['röttgen pieta', 'roettgen pieta', 'rottgen pieta'],
  63: ['arena chapel', 'scrovegni', 'lamentation', 'giotto'],
  64: ['golden haggadah', 'haggadah'],
  65: ['alhambra', 'generalife', 'court of the lions'],
  66: ['merode altarpiece', 'merode', 'campin', 'annunciation triptych'],
  67: ['pazzi chapel', 'pazzi'],
  68: ['arnolfini portrait', 'arnolfini'],
  69: ['donatello', 'david (donatello)', 'david, donatello'],
  70: ['palazzo rucellai', 'rucellai'],
  71: ['madonna and child with two angels', 'filippo lippi', 'lippi'],
  72: ['birth of venus', 'botticelli'],
  73: ['last supper', 'leonardo', 'santa maria delle grazie'],
  74: ['adam and eve', 'dürer', 'durer'],
  75: ['sistine chapel', 'creation of adam', 'last judgment', 'michelangelo, sistine', 'sistine ceiling'],
  76: ['school of athens', 'raphael, stanza'],
  77: ['isenheim altarpiece', 'isenheim', 'grünewald', 'grunewald'],
  78: ['entombment', 'pontormo', 'deposition'],
  79: ['allegory of law and grace', 'law and grace', 'law and gospel', 'cranach'],
  80: ['venus of urbino', 'titian'],
  81: ['codex mendoza', 'mendoza'],
  82: ['il gesu', 'il gesù', 'church of il gesu', 'church of il gesù', 'triumph of the name of jesus', 'gaulli'],
  83: ['hunters in the snow', 'bruegel'],
  84: ['selim ii', 'selim ii mosque', 'edirne', 'mimar sinan'],
  85: ['calling of saint matthew', 'calling of st. matthew', 'caravaggio'],
  86: ['marie de\' medici', 'marie de medici', 'henri iv receives', 'rubens, marie'],
  87: ['self-portrait with saskia', 'rembrandt'],
  88: ['san carlo alle quattro fontane', 'borromini', 'quattro fontane'],
  89: ['ecstasy of saint teresa', 'ecstasy of st. teresa', 'bernini', 'cornaro chapel'],
  90: ['angel with arquebus', 'asiel timor dei', 'calamarca', 'master of calamarca'],
  91: ['las meninas', 'velázquez', 'velazquez'],
  92: ['woman holding a balance', 'vermeer'],
  93: ['versailles', 'palace of versailles', 'hall of mirrors'],
  94: ['siege of belgrade', 'biombo', 'gonzález family', 'gonzalez family'],
  95: ['virgin of guadalupe', 'guadalupe', 'virgen de guadalupe'],
  96: ['fruit and insects', 'ruysch'],
  97: ['spaniard and indian', 'produce a mestizo', 'casta', 'mestizo'],
  98: ['tête à tête', 'tete a tete', 'marriage à la mode', 'marriage a la mode', 'hogarth']
};

const EXCLUDE = {
  48: ['chartres', 'hagia'],
  49: ['chartres'],
  50: ['lindisfarne'],
  51: ['hagia sophia', 'justinian offering', 'constantinople and justinian'],
  52: ['chartres', 'il gesù', 'gesu'],
  53: ['chartres'],
  54: ['chartres'],
  55: ['vienna genesis'],
  56: ['selim', 'hagia'],
  57: ['chartres'],
  58: ['chartres cathedral exterior only'],
  59: ['tapestry of bayeux wrong'],
  60: ['chartres, france city'],
  61: ['chartres'],
  62: ['chartres'],
  63: ['chartres'],
  64: ['chartres'],
  65: ['chartres'],
  66: ['chartres'],
  67: ['chartres'],
  68: ['chartres'],
  69: ['michelangelo', 'verrocchio', 'david by michelangelo', 'baroque david'],
  70: ['chartres'],
  71: ['raphael madonna'],
  72: ['titian venus of urbino'],
  73: ['tintoretto', 'last supper by tintoretto'],
  74: ['michelangelo adam', 'sistine'],
  75: ['giotto', 'arena chapel'],
  76: ['michelangelo sistine'],
  77: ['chartres'],
  78: ['raphael entombment'],
  79: ['chartres'],
  80: ['botticelli birth'],
  81: ['chartres'],
  82: ['hagia sophia'],
  83: ['hunters in the snow by'],
  84: ['cordoba', 'great mosque'],
  85: ['matthew, caravaggio wrong duplicate'],
  86: ['school of athens'],
  87: ['rembrandt night watch'],
  88: ['st. peter', 'bernini colonnade only'],
  89: ['chartres'],
  90: ['chartres'],
  91: ['velázquez surrender'],
  92: ['girl with a pearl'],
  93: ['louvre'],
  94: ['mendoza'],
  95: ['guadalupe wrong copy only'],
  96: ['sor juana', 'fruit and insects', 'ruysch'],
  97: ['mestizo', 'spaniard and indian'],
  98: ['hogarth gin lane only']
};

function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[^a-z0-9\s'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function score(title, terms, cedId) {
  const t = norm(title);
  const excludes = EXCLUDE[cedId] || [];
  if (excludes.some((e) => t.includes(e))) return 0;
  let s = 0;
  for (const term of terms) {
    if (t.includes(term)) s += term.length;
  }
  return s;
}

function maxForId(cedId) {
  return MAX_IMAGES[cedId] || DEFAULT_MAX;
}

function loadManual() {
  if (!fs.existsSync(manualPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(manualPath, 'utf8'));
  } catch {
    return {};
  }
}

function main() {
  if (!fs.existsSync(photosPath)) {
    console.error(`Missing ${photosPath}. Run: node scripts/scrape-flickr-album.js`);
    process.exit(1);
  }

  const photos = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
  const manual = loadManual();
  const mapping = {};
  const idsOnly = {};

  for (const cedId of Object.keys(CED_MATCHERS).map(Number)) {
    if (manual[cedId] && manual[cedId].length) {
      idsOnly[cedId] = manual[cedId];
      mapping[cedId] = manual[cedId].map((id) => {
        const p = photos.find((x) => x.id === id);
        return { id, title: p ? p.title : '(manual)' };
      });
      continue;
    }

    const terms = CED_MATCHERS[cedId];
    const cap = maxForId(cedId);
    const matches = photos
      .map((p) => ({ ...p, score: score(p.title, terms, cedId) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    const uniqueIds = [];
    const seenIds = new Set();
    const uniqueMatches = [];
    for (const m of matches) {
      if (seenIds.has(m.id)) continue;
      if (uniqueIds.length >= cap) break;
      seenIds.add(m.id);
      uniqueIds.push(m.id);
      uniqueMatches.push({ id: m.id, title: m.title });
    }
    mapping[cedId] = uniqueMatches;
    if (uniqueIds.length) {
      idsOnly[cedId] = uniqueIds;
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(idsOnly, null, 2) + '\n', 'utf8');

  const missing = [];
  for (let id = 48; id <= 98; id++) {
    const m = mapping[id] || [];
    if (!m.length) missing.push(id);
    console.log(id, m.length ? m.map((x) => x.title).join(' | ') : 'MISSING');
  }

  if (missing.length) {
    console.warn('No Flickr matches (Smarthistory fallback in update-unit3-images):', missing.join(', '));
  }
}

main();
