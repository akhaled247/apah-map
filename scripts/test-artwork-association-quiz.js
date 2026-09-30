/**
 * Smoke test for association quiz question builder (Node).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const artworks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/artworks.json'), 'utf8')
);
const assocRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/association-concepts.json'), 'utf8')
);
const concepts = assocRaw.concepts || [];
const relations = assocRaw.relations || [];

const sandbox = { window: {}, console: console };
vm.createContext(sandbox);

const quizJs = fs.readFileSync(path.join(__dirname, '../js/artwork-association-quiz.js'), 'utf8');
vm.runInContext(quizJs, sandbox);

const ArtworkAssociationQuiz = sandbox.window.ArtworkAssociationQuiz;

function poolForUnits(unitSpec) {
  if (unitSpec === 'all') return artworks.slice();
  return artworks.filter(function (a) { return a.unit === unitSpec; });
}

let failures = 0;

function assert(name, condition, detail) {
  if (!condition) {
    console.error('FAIL:', name, detail || '');
    failures += 1;
  } else {
    console.log('ok:', name);
  }
}

const quizOpts = { concepts: concepts, relations: relations };

for (let unit = 1; unit <= 10; unit++) {
  const pool = poolForUnits(unit);
  if (pool.length < 4) continue;
  const q = ArtworkAssociationQuiz.buildQuestion(pool, Math.random, quizOpts);
  if (unit <= 2) {
    assert('unit ' + unit + ' builds question', q && !q.error, q && q.error);
  } else {
    assert('unit ' + unit + ' builds or explains', q && (!q.error || q.error === 'insufficient_concepts'), q);
  }
}

const allPool = poolForUnits('all');
const allQ = ArtworkAssociationQuiz.buildQuestion(allPool, function () { return 0.5; }, quizOpts);
assert('all units builds question', allQ && !allQ.error, allQ && allQ.error);

const multiPool = artworks.filter(function (a) { return a.unit === 1 || a.unit === 2; });
const multiQ = ArtworkAssociationQuiz.buildQuestion(multiPool, function () { return 0.5; }, quizOpts);
assert('units 1+2 builds question', multiQ && !multiQ.error, multiQ && multiQ.error);

const unit2Pool = poolForUnits(2);
const inPool = ArtworkAssociationQuiz.relationsInPool(unit2Pool, relations);
assert('unit 2 has directed relations in pool', inPool.length > 0, 'count ' + inPool.length);

const linkQ = ArtworkAssociationQuiz.buildDevelopmentLink(unit2Pool, relations, function () { return 0.42; });
assert('association questions do not show images', linkQ && linkQ.showImage !== true);
assert('buildDevelopmentLink returns question', linkQ && linkQ.mode === 'developmentLink', linkQ);
assert('developmentLink uses relation note', linkQ && linkQ.explanationLabel && linkQ.explanationLabel.length > 10);
assert('developmentLink answer is title of rel.to', linkQ && linkQ.artwork && linkQ.artwork.id);

const greekRel = inPool.find(function (r) { return r.tradition === 'greek_mediterranean'; });
if (greekRel) {
  const forced = ArtworkAssociationQuiz.buildDevelopmentLink(unit2Pool, [greekRel], function () { return 0; });
  const toArt = artworks.find(function (a) { return a.id === greekRel.to; });
  assert('greek progression correct title', forced && forced.correctAnswer === toArt.title.trim());
}

let sawDevelopmentLink = false;
for (let attempt = 0; attempt < 80; attempt++) {
  const q = ArtworkAssociationQuiz.buildQuestion(unit2Pool, Math.random, quizOpts);
  if (q && q.mode === 'developmentLink') {
    sawDevelopmentLink = true;
    break;
  }
}
assert('buildQuestion can emit developmentLink for unit 2', sawDevelopmentLink);

const ziggurat = relations.find(function (r) { return r.from === 12 && r.to === 17; });
assert('ziggurat precursor relation exists', !!ziggurat);
if (ziggurat) {
  const mesoQ = ArtworkAssociationQuiz.buildDevelopmentLink(unit2Pool, [ziggurat], function () { return 0; });
  assert('ziggurat→pyramid question builds', mesoQ && mesoQ.correctAnswer.indexOf('Pyramid') !== -1);
}

if (failures > 0) {
  console.error('\n' + failures + ' association quiz test(s) failed.');
  process.exit(1);
}
console.log('\nAssociation quiz tests passed.\n');
