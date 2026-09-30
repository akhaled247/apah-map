/**
 * Association / grouping quiz: parametric questions from association-concepts.json.
 * DATA POLICY: docs/ASSOCIATION-DATA-POLICY.md
 */

window.ArtworkAssociationQuiz = (function () {
  'use strict';

  var MODES = ['oddOneOut', 'sharedConcept', 'clusterMatch', 'developmentLink'];
  var MIN_POOL = 4;
  var MIN_CONCEPT_MEMBERS = 3;

  function shuffle(arr, rng) {
    var a = arr.slice();
    var random = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function pickRandom(arr, rng) {
    if (!arr.length) return null;
    var random = rng || Math.random;
    return arr[Math.floor(random() * arr.length)];
  }

  function pickN(arr, n, rng) {
    return shuffle(arr, rng).slice(0, n);
  }

  function pickFourChoices(correct, distinctValues, rng) {
    if (distinctValues.length < 4) return null;
    var correctTrim = (correct || '').trim();
    var distractors = shuffle(
      distinctValues.filter(function (d) { return d !== correctTrim; }),
      rng
    ).slice(0, 3);
    if (distractors.length < 3) return null;
    return shuffle([correctTrim].concat(distractors), rng);
  }

  function getEligibleConcepts(pool, conceptsOverride) {
    if (conceptsOverride) {
      return filterEligibleFromList(pool, conceptsOverride, MIN_CONCEPT_MEMBERS);
    }
    if (window.DataLoader && window.DataLoader.eligibleConceptsForPool) {
      return window.DataLoader.eligibleConceptsForPool(pool, MIN_CONCEPT_MEMBERS);
    }
    return [];
  }

  function filterEligibleFromList(pool, concepts, minMembers) {
    var poolIds = new Set(pool.map(function (a) { return a.id; }));
    return concepts.filter(function (concept) {
      if (concept.quizEligible !== true) return false;
      var count = 0;
      (concept.artworks || []).forEach(function (id) {
        if (poolIds.has(id)) count += 1;
      });
      return count >= minMembers;
    });
  }

  function artworksInPoolForConcept(pool, concept) {
    var poolById = new Map(pool.map(function (a) { return [a.id, a]; }));
    var list = [];
    (concept.artworks || []).forEach(function (id) {
      if (poolById.has(id)) list.push(poolById.get(id));
    });
    return list;
  }

  function distractorArtworks(pool, concept, count, rng, eligible) {
    var inConcept = new Set((concept.artworks || []));
    var candidates = pool.filter(function (a) {
      if (inConcept.has(a.id)) return false;
      return true;
    });
    candidates = shuffle(candidates, rng);
    var picked = [];
    var i;
    for (i = 0; i < candidates.length && picked.length < count; i++) {
      picked.push(candidates[i]);
    }
    return picked;
  }

  function conceptLabelChoices(correctConcept, eligible, rng) {
    var correct = correctConcept.label.trim();
    var sameFacet = eligible.filter(function (c) {
      return c.id !== correctConcept.id && c.facet === correctConcept.facet;
    });
    var other = eligible.filter(function (c) { return c.id !== correctConcept.id; });
    var pool = sameFacet.length >= 3 ? sameFacet : other;
    var labels = [];
    var seen = new Set();
    seen.add(correct);
    pool.forEach(function (c) {
      var lab = c.label.trim();
      if (!seen.has(lab)) {
        seen.add(lab);
        labels.push(lab);
      }
    });
    if (labels.length < 3) {
      eligible.forEach(function (c) {
        if (c.id === correctConcept.id) return;
        var lab = c.label.trim();
        if (!seen.has(lab)) {
          seen.add(lab);
          labels.push(lab);
        }
      });
    }
    return pickFourChoices(correct, [correct].concat(labels), rng);
  }

  function formatTitleList(artworks) {
    return artworks.map(function (a) { return a.title; }).join('; ');
  }

  function buildOddOneOut(pool, eligible, rng) {
    var random = rng || Math.random;
    var concepts = shuffle(eligible.filter(function (c) {
      return artworksInPoolForConcept(pool, c).length >= MIN_CONCEPT_MEMBERS;
    }), random);
    var ci;
    for (ci = 0; ci < concepts.length; ci++) {
      var concept = concepts[ci];
      var members = pickN(artworksInPoolForConcept(pool, concept), MIN_CONCEPT_MEMBERS, random);
      var outsiders = distractorArtworks(pool, concept, 1, random, eligible);
      if (!outsiders.length) continue;

      var group = shuffle(members.concat(outsiders), random);
      var correct = outsiders[0].title.trim();
      var titles = group.map(function (a) { return a.title.trim(); });
      var choices = pickFourChoices(correct, titles, random);
      if (!choices) continue;

      return {
        mode: 'oddOneOut',
        showImage: false,
        prompt: 'Which work does not belong with the others?',
        promptDetail: formatTitleList(group),
        artworks: group,
        artwork: outsiders[0],
        conceptId: concept.id,
        explanationLabel: concept.label,
        correctAnswer: correct,
        choices: choices
      };
    }
    return null;
  }

  function buildSharedConcept(pool, eligible, rng) {
    var random = rng || Math.random;
    var concepts = shuffle(eligible, random);
    var ci;
    for (ci = 0; ci < concepts.length; ci++) {
      var concept = concepts[ci];
      var members = artworksInPoolForConcept(pool, concept);
      if (members.length < 2) continue;
      var sample = pickN(members, Math.min(3, members.length), random);
      var choices = conceptLabelChoices(concept, eligible, random);
      if (!choices) continue;

      return {
        mode: 'sharedConcept',
        showImage: false,
        prompt: 'What best connects these works?',
        promptDetail: formatTitleList(sample),
        artworks: sample,
        artwork: sample[0],
        conceptId: concept.id,
        explanationLabel: concept.label,
        correctAnswer: concept.label.trim(),
        choices: choices
      };
    }
    return null;
  }

  function getRelations(options) {
    if (options && options.relations) {
      return options.relations;
    }
    if (window.DataLoader && window.DataLoader.getAssociationRelations) {
      return window.DataLoader.getAssociationRelations();
    }
    return [];
  }

  function relationsInPool(pool, relations) {
    var poolIds = new Set(pool.map(function (a) { return a.id; }));
    return (relations || []).filter(function (rel) {
      return poolIds.has(rel.from) && poolIds.has(rel.to) &&
        rel.note && String(rel.note).trim();
    });
  }

  function buildDevelopmentLink(pool, relations, rng) {
    var random = rng || Math.random;
    var eligible = relationsInPool(pool, relations);
    if (!eligible.length) return null;

    var poolById = new Map(pool.map(function (a) { return [a.id, a]; }));
    var rel = pickRandom(shuffle(eligible, random), random);
    var fromArt = poolById.get(rel.from);
    var toArt = poolById.get(rel.to);
    if (!fromArt || !toArt) return null;

    var correct = toArt.title.trim();
    var distractorArts = pool.filter(function (a) {
      return a.id !== rel.from && a.id !== rel.to;
    });
    if (distractorArts.length < 3) return null;

    var distractorTitles = pickN(distractorArts, 3, random).map(function (a) {
      return a.title.trim();
    });
    var choices = pickFourChoices(correct, [correct].concat(distractorTitles), random);
    if (!choices) return null;

    return {
      mode: 'developmentLink',
      showImage: false,
      prompt: 'Which work comes later in this historical or stylistic progression?',
      promptDetail: 'After: ' + fromArt.title,
      artworks: [fromArt, toArt],
      artwork: toArt,
      relationType: rel.type,
      tradition: rel.tradition,
      fromPeriod: rel.fromPeriod,
      toPeriod: rel.toPeriod,
      explanationLabel: rel.note.trim(),
      correctAnswer: correct,
      choices: choices
    };
  }

  function buildClusterMatch(pool, eligible, rng) {
    var random = rng || Math.random;
    var concepts = shuffle(eligible, random);
    var ci;
    for (ci = 0; ci < concepts.length; ci++) {
      var concept = concepts[ci];
      var members = artworksInPoolForConcept(pool, concept);
      if (members.length < MIN_CONCEPT_MEMBERS + 1) continue;

      var anchors = pickN(members, MIN_CONCEPT_MEMBERS, random);
      var anchorIds = new Set(anchors.map(function (a) { return a.id; }));
      var extraMembers = members.filter(function (a) { return !anchorIds.has(a.id); });
      if (!extraMembers.length) continue;
      var correctArt = pickRandom(extraMembers, random);
      var correct = correctArt.title.trim();

      var distractorPool = distractorArtworks(pool, concept, 3, random, eligible);
      if (distractorPool.length < 3) continue;

      var choiceTitles = [correct].concat(distractorPool.map(function (a) { return a.title.trim(); }));
      var choices = pickFourChoices(correct, choiceTitles, random);
      if (!choices) continue;

      return {
        mode: 'clusterMatch',
        showImage: false,
        prompt: 'Which work belongs in the same group as these?',
        promptDetail: formatTitleList(anchors),
        artworks: anchors.concat([correctArt]),
        artwork: correctArt,
        conceptId: concept.id,
        explanationLabel: concept.label,
        correctAnswer: correct,
        choices: choices
      };
    }
    return null;
  }

  function buildQuestion(pool, rng, options) {
    if (!pool || pool.length < MIN_POOL) {
      return { error: 'pool_too_small' };
    }

    options = options || {};
    var conceptsOverride = options.concepts;
    var relations = getRelations(options);
    var eligible = getEligibleConcepts(pool, conceptsOverride);
    var hasDirected = relationsInPool(pool, relations).length > 0;

    if (!eligible.length && !hasDirected) {
      return { error: 'insufficient_concepts' };
    }

    var random = rng || Math.random;
    var modeOrder = shuffle(MODES.slice(), random);
    var i;
    for (i = 0; i < modeOrder.length; i++) {
      var q = null;
      if (modeOrder[i] === 'oddOneOut') {
        q = buildOddOneOut(pool, eligible, random);
      } else if (modeOrder[i] === 'sharedConcept') {
        q = buildSharedConcept(pool, eligible, random);
      } else if (modeOrder[i] === 'clusterMatch') {
        q = buildClusterMatch(pool, eligible, random);
      } else if (modeOrder[i] === 'developmentLink') {
        q = buildDevelopmentLink(pool, relations, random);
      }
      if (q) return q;
    }

    if (hasDirected) {
      var fallback = buildDevelopmentLink(pool, relations, random);
      if (fallback) return fallback;
    }

    return { error: 'insufficient_concepts' };
  }

  return {
    MODES: MODES,
    buildQuestion: buildQuestion,
    buildDevelopmentLink: buildDevelopmentLink,
    getEligibleConcepts: getEligibleConcepts,
    filterEligibleFromList: filterEligibleFromList,
    relationsInPool: relationsInPool,
    getRelations: getRelations
  };
})();
