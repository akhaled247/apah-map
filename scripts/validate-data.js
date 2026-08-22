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

// Report results
console.log('--------------------------------------------------');
console.log('AP Art History Interactive Map — Dataset Validation');
console.log('--------------------------------------------------');
console.log(`Total artworks checked: ${artworks.length}`);
console.log(`Total units checked:    ${units.length}`);
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
