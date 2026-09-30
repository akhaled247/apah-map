/**
 * Smoke test for artwork quiz question builder (Node, no browser).
 * Mirrors js/artwork-quiz.js eligibility rules — see docs/QUIZ-DATA-POLICY.md
 */

const fs = require('fs');
const path = require('path');

const artworks = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/artworks.json'), 'utf8')
);

const OPT_IN_QUIZ_FIELDS = ['artist', 'artistCulture'];
const STANDARD_QUIZ_FIELDS = ['culture', 'date', 'medium', 'location', 'title'];
const IMAGE_FIELD_KEYS = ['title', 'culture', 'date', 'medium'];
const ASKABLE_KEYS = ['culture', 'date', 'medium', 'location'];
const MODES = ['imageToField', 'titleToField', 'fieldToTitle'];

function formatArtistCulture(a) {
  return [a.artist, a.culture].filter(Boolean).join(' • ') || '—';
}

function getQuizAnswer(artwork, fieldKey) {
  switch (fieldKey) {
    case 'title':
      return artwork.title || '';
    case 'artist':
      return artwork.artist || '';
    case 'culture':
      return artwork.culture || '';
    case 'location':
      return artwork.locationDisplay || '';
    case 'artistCulture':
      return formatArtistCulture(artwork);
    case 'date':
      return artwork.dateDisplay || '';
    case 'medium':
      return artwork.medium || '—';
    default:
      return '';
  }
}

function isEmptyAnswer(fieldKey, value) {
  const v = (value || '').trim();
  if (!v || v === '—') return true;
  return false;
}

function artworkHasField(artwork, fieldKey) {
  return !isEmptyAnswer(fieldKey, getQuizAnswer(artwork, fieldKey));
}

function canQuizField(artwork, fieldKey) {
  if (!artwork || !fieldKey) return false;
  if (OPT_IN_QUIZ_FIELDS.includes(fieldKey)) {
    if (!artwork.quizFields || artwork.quizFields[fieldKey] !== true) return false;
  } else if (!STANDARD_QUIZ_FIELDS.includes(fieldKey)) {
    return false;
  }
  return artworkHasField(artwork, fieldKey);
}

function getDistinctAnswers(pool, fieldKey) {
  const seen = new Set();
  const distinct = [];
  pool.forEach((artwork) => {
    if (!canQuizField(artwork, fieldKey)) return;
    const answer = getQuizAnswer(artwork, fieldKey).trim();
    if (isEmptyAnswer(fieldKey, answer) || seen.has(answer)) return;
    seen.add(answer);
    distinct.push(answer);
  });
  return distinct;
}

function countArtworksWithValue(pool, fieldKey, value) {
  const target = (value || '').trim();
  let count = 0;
  pool.forEach((artwork) => {
    if (!canQuizField(artwork, fieldKey)) return;
    if (getQuizAnswer(artwork, fieldKey).trim() === target) count += 1;
  });
  return count;
}

function isUniqueClue(pool, fieldKey, value) {
  return countArtworksWithValue(pool, fieldKey, value) === 1;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  const random = rng || Math.random;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, rng) {
  if (!arr.length) return null;
  const random = rng || Math.random;
  return arr[Math.floor(random() * arr.length)];
}

function pickFourChoices(correct, distinctValues, rng) {
  if (distinctValues.length < 4) return null;
  const correctTrim = (correct || '').trim();
  const distractors = shuffle(
    distinctValues.filter((d) => d !== correctTrim),
    rng
  ).slice(0, 3);
  if (distractors.length < 3) return null;
  return shuffle([correctTrim].concat(distractors), rng);
}

function askableKeysForPool(pool) {
  const keys = ASKABLE_KEYS.slice();
  OPT_IN_QUIZ_FIELDS.forEach((optKey) => {
    if (pool.some((a) => canQuizField(a, optKey))) keys.push(optKey);
  });
  return keys;
}

function imageFieldKeysForPool(pool) {
  const keys = IMAGE_FIELD_KEYS.slice();
  OPT_IN_QUIZ_FIELDS.forEach((optKey) => {
    if (pool.some((a) => canQuizField(a, optKey)) && !keys.includes(optKey)) keys.push(optKey);
  });
  return keys;
}

function buildFieldValueQuestion(pool, fieldKey, rng, options) {
  if (!pool.some((a) => canQuizField(a, fieldKey))) return null;

  const distinct = getDistinctAnswers(pool, fieldKey);
  if (distinct.length < 4) return null;

  const random = rng || Math.random;
  const eligible = pool.filter((artwork) => {
    if (!canQuizField(artwork, fieldKey)) return false;
    const a = getQuizAnswer(artwork, fieldKey).trim();
    return distinct.includes(a);
  });
  if (!eligible.length) return null;

  const artwork = pickRandom(eligible, random);
  const correct = getQuizAnswer(artwork, fieldKey).trim();
  const choices = pickFourChoices(correct, distinct, random);
  if (!choices) return null;

  return {
    mode: options.mode,
    showImage: options.showImage === true,
    artwork,
    fieldKey,
    correctAnswer: correct,
    choices
  };
}

function buildImageToFieldQuestion(pool, rng) {
  const random = rng || Math.random;
  for (const fieldKey of shuffle(imageFieldKeysForPool(pool), random)) {
    const q = buildFieldValueQuestion(pool, fieldKey, random, {
      mode: 'imageToField',
      showImage: true
    });
    if (q) return q;
  }
  return null;
}

function buildTitleToFieldQuestion(pool, rng) {
  const random = rng || Math.random;
  for (const fieldKey of shuffle(askableKeysForPool(pool), random)) {
    const q = buildFieldValueQuestion(pool, fieldKey, random, {
      mode: 'titleToField',
      showImage: false
    });
    if (q) return q;
  }
  return null;
}

function buildFieldToTitleQuestion(pool, rng) {
  if (getDistinctAnswers(pool, 'title').length < 4) return null;

  const random = rng || Math.random;
  const keys = askableKeysForPool(pool);
  for (let attempt = 0; attempt < 40; attempt++) {
    const fieldKey = pickRandom(keys, random);
    const withField = pool.filter((a) => canQuizField(a, fieldKey));
    if (!withField.length) continue;

    const artwork = pickRandom(withField, random);
    const clue = getQuizAnswer(artwork, fieldKey).trim();
    if (!isUniqueClue(pool, fieldKey, clue)) continue;

    const correct = artwork.title.trim();
    const titleDistinct = getDistinctAnswers(pool, 'title');
    const choices = pickFourChoices(correct, titleDistinct, random);
    if (!choices) continue;

    return {
      mode: 'fieldToTitle',
      showImage: false,
      artwork,
      fieldKey,
      correctAnswer: correct,
      choices
    };
  }
  return null;
}

function buildQuestion(pool, rng) {
  if (!pool || pool.length < 4) return { error: 'pool_too_small' };

  const random = rng || Math.random;
  for (const mode of shuffle(MODES.slice(), random)) {
    let q = null;
    if (mode === 'imageToField') q = buildImageToFieldQuestion(pool, random);
    else if (mode === 'titleToField') q = buildTitleToFieldQuestion(pool, random);
    else if (mode === 'fieldToTitle') q = buildFieldToTitleQuestion(pool, random);
    if (q) return q;
  }
  return { error: 'insufficient_distinct_answers' };
}

function assertQuestion(q, label) {
  if (q.error) {
    throw new Error(`${label}: unexpected error ${q.error}`);
  }
  if (!q.mode || !MODES.includes(q.mode)) {
    throw new Error(`${label}: invalid mode ${q.mode}`);
  }
  if (typeof q.showImage !== 'boolean') {
    throw new Error(`${label}: missing showImage`);
  }
  if (!q.choices || q.choices.length !== 4) {
    throw new Error(`${label}: expected 4 choices`);
  }
  if (!q.correctAnswer || !q.choices.includes(q.correctAnswer)) {
    throw new Error(`${label}: correctAnswer not in choices`);
  }
  if (OPT_IN_QUIZ_FIELDS.includes(q.fieldKey)) {
    if (!canQuizField(q.artwork, q.fieldKey)) {
      throw new Error(`${label}: opt-in field ${q.fieldKey} used without quizFields opt-in`);
    }
  } else if (!STANDARD_QUIZ_FIELDS.includes(q.fieldKey)) {
    throw new Error(`${label}: disallowed fieldKey ${q.fieldKey}`);
  }
  if (!canQuizField(q.artwork, q.fieldKey)) {
    throw new Error(`${label}: artwork not eligible for field ${q.fieldKey}`);
  }
}

// No artwork may be quizzed on artist without explicit opt-in
artworks.forEach((w) => {
  if (w.artist && (!w.quizFields || w.quizFields.artist !== true)) {
    if (canQuizField(w, 'artist')) {
      throw new Error(`Artwork ${w.id}: artist must not be quiz-eligible without quizFields.artist`);
    }
  }
});

const TRIALS = 100;
let failures = 0;
const modeCounts = { imageToField: 0, titleToField: 0, fieldToTitle: 0 };

function runPool(pool, label) {
  let errors = 0;
  for (let t = 0; t < TRIALS; t++) {
    const q = buildQuestion(pool);
    if (q.error) {
      errors += 1;
      continue;
    }
    try {
      assertQuestion(q, label);
      modeCounts[q.mode] += 1;
      if (q.fieldKey === 'artist' && (!q.artwork.quizFields || !q.artwork.quizFields.artist)) {
        throw new Error(`${label}: artist question without opt-in`);
      }
    } catch (e) {
      failures += 1;
      console.error(e.message);
    }
  }
  if (errors === TRIALS) {
    console.warn(`WARN ${label}: all ${TRIALS} trials returned error (small or sparse pool)`);
  } else if (errors > TRIALS * 0.05) {
    console.warn(`WARN ${label}: ${errors}/${TRIALS} trials failed to build`);
  }
}

runPool(artworks, 'all');
for (let u = 1; u <= 10; u++) {
  runPool(artworks.filter((a) => a.unit === u), `unit-${u}`);
}

console.log('Mode distribution (approx):', modeCounts);

if (failures > 0) {
  console.error(`FAILED: ${failures} assertion errors`);
  process.exit(1);
}

console.log('Artwork quiz smoke test PASSED');
