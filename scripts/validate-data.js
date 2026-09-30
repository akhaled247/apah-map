/**
 * Dataset validation script.
 * Validates all 250 required AP Art History records against schema rules
 * specified in Section 28 of the project requirements.
 */

const fs = require('fs');
const path = require('path');
const dateUtils = require('../js/dateUtils.js');

const errors = [];
const warnings = [];

function padId(id) {
  return String(id).padStart(3, '0');
}

// 1. Load units
const unitsPath = path.join(__dirname, '../data/units.json');
if (!fs.existsSync(unitsPath)) {
  errors.push(`Missing data/units.json`);
}
let units = [];
try {
  units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
  if (units.length !== 10) {
    errors.push(`data/units.json must contain exactly 10 units (found ${units.length})`);
  }
} catch (e) {
  errors.push(`Failed to parse data/units.json: ${e.message}`);
}
const validUnitIds = new Set(units.map(u => u.id));

// 2. Load artworks
const artworksPath = path.join(__dirname, '../data/artworks.json');
if (!fs.existsSync(artworksPath)) {
  errors.push(`Missing data/artworks.json`);
}
let artworks = [];
try {
  artworks = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));
} catch (e) {
  errors.push(`Failed to parse data/artworks.json: ${e.message}`);
}

// Check count
if (artworks.length !== 250) {
  errors.push(`data/artworks.json must contain exactly 250 artworks (found ${artworks.length})`);
}

// 3. Load image manifest
const imagesPath = path.join(__dirname, '../data/images.json');
let imageManifest = new Map();
if (!fs.existsSync(imagesPath)) {
  errors.push(`Missing data/images.json`);
} else {
  try {
    const rawImages = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    imageManifest = new Map(rawImages.map(img => [img.id, img.images]));
  } catch (e) {
    errors.push(`Failed to parse data/images.json: ${e.message}`);
  }
}

// 4. Validate each artwork
const seenIds = new Set();
const contentDir = path.join(__dirname, '../content/affcc');

for (let i = 0; i < artworks.length; i++) {
  const w = artworks[i];
  const prefix = `Artwork index ${i} (ID: ${w ? w.id : '?'})`;

  if (!w) {
    errors.push(`${prefix}: Entry is null or undefined`);
    continue;
  }

  // ID check
  if (typeof w.id !== 'number' || w.id < 1 || w.id > 250) {
    errors.push(`${prefix}: Invalid id "${w.id}" (must be integer 1–250)`);
  } else if (seenIds.has(w.id)) {
    errors.push(`${prefix}: Duplicate CED id ${w.id}`);
  } else {
    seenIds.add(w.id);
  }

  // Title check
  if (!w.title || typeof w.title !== 'string' || !w.title.trim()) {
    errors.push(`${prefix}: Missing or empty title`);
  }

  // Unit check
  if (!validUnitIds.has(w.unit)) {
    errors.push(`${prefix}: Invalid unit ID "${w.unit}" (must be 1–10)`);
  }

  // Date check
  if (!w.dateDisplay || typeof w.dateDisplay !== 'string' || !w.dateDisplay.trim()) {
    errors.push(`${prefix}: Missing dateDisplay`);
  }
  if (typeof w.dateStart !== 'number' || isNaN(w.dateStart)) {
    errors.push(`${prefix}: Invalid or missing dateStart (${w.dateStart})`);
  }
  if (typeof w.dateEnd !== 'number' || isNaN(w.dateEnd)) {
    errors.push(`${prefix}: Invalid or missing dateEnd (${w.dateEnd})`);
  }
  if (typeof w.dateMidpoint !== 'number' || isNaN(w.dateMidpoint)) {
    errors.push(`${prefix}: Invalid or missing dateMidpoint (${w.dateMidpoint})`);
  }
  if (w.dateStart > w.dateEnd) {
    errors.push(`${prefix}: dateStart (${w.dateStart}) > dateEnd (${w.dateEnd})`);
  }

  // Quiz eligibility (see docs/QUIZ-DATA-POLICY.md)
  const allowedQuizFieldKeys = new Set([
    'artist', 'artistCulture', 'culture', 'date', 'medium', 'location', 'title'
  ]);
  if (w.quizFields !== undefined) {
    if (typeof w.quizFields !== 'object' || Array.isArray(w.quizFields)) {
      errors.push(`${prefix}: quizFields must be a plain object when present`);
    } else {
      Object.keys(w.quizFields).forEach(function (key) {
        if (!allowedQuizFieldKeys.has(key)) {
          errors.push(`${prefix}: quizFields.${key} is not an allowed quiz field key`);
        }
        if (w.quizFields[key] !== true) {
          errors.push(`${prefix}: quizFields.${key} must be true when set (opt-in only)`);
        }
        if (key === 'artist' && w.quizFields.artist === true && (!w.artist || !String(w.artist).trim())) {
          errors.push(`${prefix}: quizFields.artist is true but artist is empty`);
        }
        if (key === 'artistCulture' && w.quizFields.artistCulture === true) {
          const hasCulture = w.culture && String(w.culture).trim();
          const hasArtist = w.artist && String(w.artist).trim();
          if (!hasCulture && !hasArtist) {
            errors.push(`${prefix}: quizFields.artistCulture is true but artist and culture are both empty`);
          }
        }
      });
    }
  }

  // Medium check
  if (!w.medium || typeof w.medium !== 'string') {
    warnings.push(`${prefix}: Missing or empty medium description`);
  }

  // Location / Coordinates check
  if (!w.locationDisplay || typeof w.locationDisplay !== 'string') {
    errors.push(`${prefix}: Missing locationDisplay`);
  }

  const validPrecisions = ['exact', 'site', 'city', 'region', 'approximate', 'unknown'];
  if (!validPrecisions.includes(w.locationPrecision)) {
    errors.push(`${prefix}: Invalid locationPrecision "${w.locationPrecision}" (must be one of: ${validPrecisions.join(', ')})`);
  }

  if (w.locationPrecision !== 'unknown') {
    if (typeof w.latitude !== 'number' || isNaN(w.latitude) || w.latitude < -90 || w.latitude > 90) {
      errors.push(`${prefix}: Invalid latitude "${w.latitude}" (must be between -90 and 90)`);
    }
    if (typeof w.longitude !== 'number' || isNaN(w.longitude) || w.longitude < -180 || w.longitude > 180) {
      errors.push(`${prefix}: Invalid longitude "${w.longitude}" (must be between -180 and 180)`);
    }
  }

  // Image manifest check
  const imgs = imageManifest.get(w.id);
  if (!imgs || !Array.isArray(imgs) || imgs.length === 0) {
    errors.push(`${prefix}: Missing image entries in data/images.json`);
  } else {
    for (let imgIdx = 0; imgIdx < imgs.length; imgIdx++) {
      const img = imgs[imgIdx];
      if (!img.src || typeof img.src !== 'string') {
        errors.push(`${prefix}: Image [${imgIdx}] missing "src" attribute`);
      }
      if (!img.alt || typeof img.alt !== 'string') {
        errors.push(`${prefix}: Image [${imgIdx}] missing "alt" text`);
      }
    }
  }

  // AFFCC markdown file check
  const affccFile = path.join(contentDir, `${padId(w.id)}.md`);
  if (!fs.existsSync(affccFile)) {
    errors.push(`${prefix}: Missing AFFCC content file "content/affcc/${padId(w.id)}.md"`);
  }
}

// Verify full sequence 1..250 is covered
for (let id = 1; id <= 250; id++) {
  if (!seenIds.has(id)) {
    errors.push(`Missing artwork with CED ID ${id}`);
  }
}

// 5. Validate vocabulary
const vocabJsonPath = path.join(__dirname, '../data/vocabulary.json');
const vocabDir = path.join(__dirname, '../content/vocab');
if (!fs.existsSync(vocabJsonPath)) {
  errors.push('Missing data/vocabulary.json (run npm run generate-vocab)');
} else {
  try {
    const vocabulary = JSON.parse(fs.readFileSync(vocabJsonPath, 'utf8'));
    if (!Array.isArray(vocabulary) || vocabulary.length === 0) {
      errors.push('data/vocabulary.json must be a non-empty array');
    } else {
      const vocabIds = new Set();
      const vocabTerms = new Set();
      vocabulary.forEach(function (entry, idx) {
        const prefix = `Vocabulary index ${idx} (id: ${entry ? entry.id : '?'})`;
        if (!entry.id || typeof entry.id !== 'string') {
          errors.push(`${prefix}: Missing or invalid id`);
        } else if (vocabIds.has(entry.id)) {
          errors.push(`${prefix}: Duplicate vocabulary id "${entry.id}"`);
        } else {
          vocabIds.add(entry.id);
        }
        if (!entry.term || typeof entry.term !== 'string' || !entry.term.trim()) {
          errors.push(`${prefix}: Missing or empty term`);
        } else if (vocabTerms.has(entry.term.toLowerCase())) {
          errors.push(`${prefix}: Duplicate vocabulary term "${entry.term}"`);
        } else {
          vocabTerms.add(entry.term.toLowerCase());
        }
        if (!entry.definition || typeof entry.definition !== 'string' || !entry.definition.trim()) {
          errors.push(`${prefix}: Missing or empty definition`);
        }
        if (entry.units && Array.isArray(entry.units)) {
          entry.units.forEach(function (u) {
            if (u === 0) return;
            if (!validUnitIds.has(u)) {
              errors.push(`${prefix}: Invalid unit ID ${u} in units array`);
            }
          });
        }
        if (entry.artworks !== undefined) {
          if (!Array.isArray(entry.artworks)) {
            errors.push(`${prefix}: artworks must be an array`);
          } else {
            entry.artworks.forEach(function (id) {
              if (!Number.isInteger(id) || id < 1 || id > 250) {
                errors.push(`${prefix}: Invalid artwork ID ${id} in artworks array`);
              }
            });
          }
        }
        const vocabFile = path.join(vocabDir, `${entry.id}.md`);
        if (!fs.existsSync(vocabFile)) {
          errors.push(`${prefix}: Missing content file "content/vocab/${entry.id}.md"`);
        }
      });
    }
  } catch (e) {
    errors.push(`Failed to parse data/vocabulary.json: ${e.message}`);
  }
}

// 5b. Validate association concepts
const FACETS = new Set(['function', 'form', 'period', 'typology', 'material', 'site']);
const assocPath = path.join(__dirname, '../data/association-concepts.json');
let vocabIdsForAssoc = new Set();
if (fs.existsSync(vocabJsonPath)) {
  try {
    JSON.parse(fs.readFileSync(vocabJsonPath, 'utf8')).forEach(function (e) {
      if (e && e.id) vocabIdsForAssoc.add(e.id);
    });
  } catch (_) {}
}
if (!fs.existsSync(assocPath)) {
  errors.push('Missing data/association-concepts.json');
} else {
  try {
    const assocRaw = JSON.parse(fs.readFileSync(assocPath, 'utf8'));
    const concepts = assocRaw.concepts;
    const relations = assocRaw.relations;
    if (!Array.isArray(concepts)) {
      errors.push('association-concepts.json must have a concepts array');
    } else {
      const conceptIds = new Set();
      concepts.forEach(function (entry, idx) {
        const prefix = `Association concept index ${idx} (id: ${entry ? entry.id : '?'})`;
        if (!entry.id || typeof entry.id !== 'string') {
          errors.push(`${prefix}: Missing or invalid id`);
        } else if (conceptIds.has(entry.id)) {
          errors.push(`${prefix}: Duplicate concept id "${entry.id}"`);
        } else {
          conceptIds.add(entry.id);
        }
        if (!entry.label || typeof entry.label !== 'string' || !entry.label.trim()) {
          errors.push(`${prefix}: Missing or empty label`);
        }
        if (!entry.facet || !FACETS.has(entry.facet)) {
          errors.push(`${prefix}: Invalid facet "${entry.facet}"`);
        }
        if (!Array.isArray(entry.artworks) || entry.artworks.length === 0) {
          errors.push(`${prefix}: artworks must be a non-empty array`);
        } else {
          entry.artworks.forEach(function (id) {
            if (!Number.isInteger(id) || id < 1 || id > 250) {
              errors.push(`${prefix}: Invalid artwork ID ${id}`);
            }
          });
        }
        if (entry.units && Array.isArray(entry.units)) {
          entry.units.forEach(function (u) {
            if (!validUnitIds.has(u)) {
              errors.push(`${prefix}: Invalid unit ID ${u} in units array`);
            }
          });
        }
        if (entry.vocabId && !vocabIdsForAssoc.has(entry.vocabId)) {
          errors.push(`${prefix}: Unknown vocabId "${entry.vocabId}"`);
        }
        const eligible = entry.quizEligible !== false;
        if (eligible && entry.artworks && entry.artworks.length < 4) {
          errors.push(`${prefix}: quizEligible concepts need at least 4 artworks`);
        }
      });
    }
    if (relations !== undefined && !Array.isArray(relations)) {
      errors.push('association-concepts.json relations must be an array when present');
    } else if (Array.isArray(relations)) {
      const RELATION_TYPES = new Set([
        'architectural_precursor',
        'period_succession',
        'stylistic_development',
        'political_transition',
        'technological_medium_shift',
        'other'
      ]);
      const chronoPath = path.join(__dirname, '../data/relation-chronology-exceptions.json');
      let chronoIds = new Set();
      if (fs.existsSync(chronoPath)) {
        try {
          chronoIds = new Set(JSON.parse(fs.readFileSync(chronoPath, 'utf8')).artworkIds || []);
        } catch (_) {}
      }
      const artworkById = new Map(artworks.map(function (a) { return [a.id, a]; }));

      relations.forEach(function (rel, idx) {
        const prefix = `Association relation index ${idx}`;
        if (!Number.isInteger(rel.from) || rel.from < 1 || rel.from > 250) {
          errors.push(`${prefix}: Invalid from artwork ID`);
        }
        if (!Number.isInteger(rel.to) || rel.to < 1 || rel.to > 250) {
          errors.push(`${prefix}: Invalid to artwork ID`);
        }
        if (rel.from === rel.to) {
          errors.push(`${prefix}: from and to must differ`);
        }
        if (!rel.type || typeof rel.type !== 'string') {
          errors.push(`${prefix}: Missing relation type`);
        } else if (!RELATION_TYPES.has(rel.type)) {
          warnings.push(`${prefix}: Unknown relation type "${rel.type}"`);
        }
        if (!rel.note || typeof rel.note !== 'string' || !rel.note.trim()) {
          warnings.push(`${prefix}: Missing note`);
        }
        if (rel.generated === true && (!rel.tradition || typeof rel.tradition !== 'string')) {
          warnings.push(`${prefix}: generated relation should include tradition`);
        }
        const fromArt = artworkById.get(rel.from);
        const toArt = artworkById.get(rel.to);
        if (
          fromArt && toArt &&
          fromArt.dateMidpoint != null && toArt.dateMidpoint != null &&
          fromArt.dateMidpoint > toArt.dateMidpoint &&
          !chronoIds.has(rel.from) && !chronoIds.has(rel.to)
        ) {
          warnings.push(`${prefix}: from #${rel.from} is later than to #${rel.to} by dateMidpoint`);
        }
      });
    }
  } catch (e) {
    errors.push(`Failed to parse data/association-concepts.json: ${e.message}`);
  }
}

// 6. Validate generated artwork detail pages
for (let id = 1; id <= 250; id++) {
  const pageDir = path.join(__dirname, '..', 'list', padId(id));
  const pageFile = path.join(pageDir, 'index.html');
  if (!fs.existsSync(pageFile)) {
    errors.push(`Missing artwork page "list/${padId(id)}/index.html" (run npm run generate-pages)`);
    continue;
  }
  const pageHtml = fs.readFileSync(pageFile, 'utf8');
  const idMatch = pageHtml.match(/data-artwork-id="(\d+)"/);
  if (!idMatch || parseInt(idMatch[1], 10) !== id) {
    errors.push(`Artwork page list/${padId(id)}/index.html has mismatched data-artwork-id (expected ${id})`);
  }
}

// Report results
console.log('--------------------------------------------------');
console.log('AP Art History Interactive Map — Dataset Validation');
console.log('--------------------------------------------------');
let vocabCount = 0;
if (fs.existsSync(vocabJsonPath)) {
  try { vocabCount = JSON.parse(fs.readFileSync(vocabJsonPath, 'utf8')).length; } catch (_) {}
}
console.log(`Total artworks checked: ${artworks.length}`);
console.log(`Total vocabulary:       ${vocabCount}`);
console.log(`Total units checked:    ${units.length}`);
let assocConceptCount = 0;
if (fs.existsSync(assocPath)) {
  try {
    const ac = JSON.parse(fs.readFileSync(assocPath, 'utf8'));
    assocConceptCount = (ac.concepts && ac.concepts.length) || 0;
  } catch (_) {}
}
console.log(`Association concepts:   ${assocConceptCount}`);
console.log(`Warnings:               ${warnings.length}`);
console.log(`Errors:                 ${errors.length}`);
console.log('--------------------------------------------------');

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.warn(`  [WARN] ${w}`));
}

if (errors.length > 0) {
  console.error('\nValidation FAILED with errors:');
  errors.forEach(e => console.error(`  [ERROR] ${e}`));
  process.exit(1);
} else {
  console.log('\nValidation PASSED! All 250 required works are valid and compliant with specifications.\n');
  process.exit(0);
}
