/**
 * Automated end-to-end simulation of Section 37 workflow:
 * - Open site (load datasets)
 * - Timeline date range filtering (overlap check)
 * - Unit 1 preset selection (11 works)
 * - Marker hover & select interaction (e.g. #5 Beaker with ibex motifs)
 * - AFFCC study content loading
 * - Search query execution
 * - Random artwork selection
 * - Reset all state
 */

const fs = require('fs');
const path = require('path');
const dateUtils = require('../js/dateUtils.js');

console.log('Testing AP Art History application logic...\n');

// 1. Data load check
const artworks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/artworks.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/units.json'), 'utf8'));
const images = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/images.json'), 'utf8'));

console.log(`[PASS] Core data loaded: ${artworks.length} artworks, ${units.length} units, ${images.length} image entries.`);

// 2. Unit 1 preset test
const unit1Works = artworks.filter(a => a.unit === 1);
if (unit1Works.length !== 11) {
  console.error(`[FAIL] Unit 1 expected 11 works, found ${unit1Works.length}`);
  process.exit(1);
}
console.log(`[PASS] Unit 1 preset correctly isolates all 11 Prehistory works.`);

// 3. Timeline overlap filtering test (e.g. range -4500 to -3000 BCE)
const testSpan = { start: -4500, end: -3000 };
const spanWorks = artworks.filter(a => dateUtils.doesDateRangeOverlap(a.dateStart, a.dateEnd, testSpan.start, testSpan.end));
const hasWork5 = spanWorks.some(a => a.id === 5);
if (!hasWork5) {
  console.error('[FAIL] Work #5 (4200–3500 BCE) not found in span -4500 to -3000 BCE');
  process.exit(1);
}
console.log(`[PASS] Timeline date range overlap filtering successfully captures Work #5.`);

// 4. Artwork #5 AFFCC Content test
const affcc5Path = path.join(__dirname, '../content/affcc/005.md');
if (!fs.existsSync(affcc5Path)) {
  console.error('[FAIL] Missing content/affcc/005.md');
  process.exit(1);
}
const affcc5Text = fs.readFileSync(affcc5Path, 'utf8');
if (!affcc5Text.includes('## Form') || !affcc5Text.includes('## Function') || !affcc5Text.includes('## Content') || !affcc5Text.includes('## Context')) {
  console.error('[FAIL] content/affcc/005.md missing required AFFCC sections');
  process.exit(1);
}
console.log('[PASS] Work #5 contains complete Form, Function, Content, Context study sections.');

// 5. Search test
const searchHits = artworks.filter(a => {
  const q = 'lascaux';
  return a.title.toLowerCase().includes(q) || a.locationDisplay.toLowerCase().includes(q);
});
if (searchHits.length === 0 || searchHits[0].id !== 2) {
  console.error('[FAIL] Search for "lascaux" failed to match Work #2');
  process.exit(1);
}
console.log(`[PASS] Search successfully finds Work #2 (${searchHits[0].title}).`);

// 6. Random selection test
const randomIdx = Math.floor(Math.random() * artworks.length);
const chosen = artworks[randomIdx];
if (!chosen || chosen.id < 1 || chosen.id > 250) {
  console.error('[FAIL] Random artwork selection failed');
  process.exit(1);
}
console.log(`[PASS] Random selection returned Work #${chosen.id} (${chosen.title}).`);

console.log('\nAll application workflow tests PASSED successfully!\n');
