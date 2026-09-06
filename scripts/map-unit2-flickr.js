/**
 * Map scraped Flickr album photos to CED IDs 12–47.
 * Reads data/flickr-album-scraped.json, writes data/flickr-unit2-ids.json
 */
const fs = require('fs');
const path = require('path');

const photosPath = path.join(__dirname, '../data/flickr-album-scraped.json');
const outPath = path.join(__dirname, '../data/flickr-unit2-ids.json');

const CED_MATCHERS = {
  12: ['white temple', 'ziggurat', 'uruk'],
  13: ['palette', 'narmer'],
  14: ['votive', 'worshipper', 'tell asmar', 'eshnunna', 'standing male'],
  15: ['seated scribe'],
  16: ['standard of ur'],
  17: ['pyramid of khafre', 'great sphinx', 'great pyramids plan', 'pyramids of giza', 'giza'],
  18: ['menkaura and queen', 'menkaure and queen', 'king menkaura', 'king menkaure'],
  19: ['hammurabi', 'law code stele of king hammurabi'],
  20: ['hypostyle', 'karnak', 'amun-re', 'amun re', 'temple complex, karnak'],
  21: ['hatshepsut', 'mortuary temple'],
  22: ['akhenaten', 'nefertiti', 'three daughters', 'house altar'],
  23: ['tutankhamun', 'innermost coffin', 'tutankhamen'],
  24: ['hunefer', 'book of the dead'],
  25: ['lamassu', 'sargon'],
  26: ['athenian agora', 'agora from the acropolis', 'model of the athenian agora'],
  27: ['anavysos', 'kouros'],
  28: ['peplos kore', 'peplos'],
  29: ['sarcophagus of the spouses', 'sarcophagus of the spouse'],
  30: ['apadana', 'persepolis', 'audience hall', 'capital of a column from the audience hall'],
  31: ['apollo (aplu)', 'aplu', 'etruscan temple', 'temple of minerva', 'veii'],
  32: ['tomb of the triclinium', 'triclinium'],
  33: ['niobid krater', 'niobides'],
  34: ['doryphoros', 'spear bearer', 'polykleitos'],
  35: ['parthenon', 'acropolis', 'ergastines', 'athena nike', 'victory adjusting', 'helios', 'plaque of the ergastines'],
  36: ['hegeso', 'grave stele'],
  37: ['samothrace', 'winged victory'],
  38: ['pergamon', 'pergamon altar', 'great altar'],
  39: ['house of the vettii', 'vettii'],
  40: ['alexander mosaic', 'house of the faun'],
  41: ['boxer at rest', 'seated boxer', 'apollonius, boxer'],
  42: ['roman patrician', 'head of a roman'],
  43: ['augustus of primaporta', 'prima porta', 'augustus of prima'],
  44: ['colosseum', 'flavian amphitheater'],
  45: ['column of trajan', 'forum of trajan', 'trajan'],
  46: ['pantheon'],
  47: ['ludovisi', 'battle sarcophagus']
};

const EXCLUDE = {
  17: ['velasco', 'valley of mexico'],
  24: ['giotto', 'arena chapel'],
  26: ['raphael', 'school of athens', 'pythagoras'],
  37: ['adjusting her sandal'],
  44: ['il gesù', 'gesu', 'arch of titus and'],
  45: ['marcus aurelius', 'equestrian'],
  46: ['il gesù', 'gesu', 'hagia sophia']
};

function norm(s) {
  return (s || '')
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

function main() {
  if (!fs.existsSync(photosPath)) {
    console.error(`Missing ${photosPath}. Run: node scripts/scrape-flickr-album.js`);
    process.exit(1);
  }

  const photos = JSON.parse(fs.readFileSync(photosPath, 'utf8'));
  const mapping = {};
  const idsOnly = {};

  for (const cedId of Object.keys(CED_MATCHERS).map(Number)) {
    const terms = CED_MATCHERS[cedId];
    const matches = photos
      .map((p) => ({ ...p, score: score(p.title, terms, cedId) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    mapping[cedId] = matches.slice(0, 4).map((m) => ({ id: m.id, title: m.title }));
    if (mapping[cedId].length) {
      idsOnly[cedId] = mapping[cedId].map((m) => m.id);
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(idsOnly, null, 2) + '\n', 'utf8');

  const missing = [];
  for (let id = 12; id <= 47; id++) {
    const m = mapping[id] || [];
    if (!m.length) missing.push(id);
    console.log(id, m.length ? m.map((x) => x.title).join(' | ') : 'MISSING');
  }

  if (missing.length) {
    console.error('Unmapped CED IDs:', missing.join(', '));
    process.exitCode = 1;
  }
}

main();
