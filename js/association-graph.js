/**
 * Build network graph nodes/edges from association-concepts.json (no DOM).
 * Used by network page and Node tests.
 */

window.AssociationGraph = (function () {
  'use strict';

  var FACETS = ['function', 'form', 'period', 'typology', 'material', 'site'];
  var CONCEPT_PREFIX = 'concept:';
  var MAX_LABEL_LEN = 36;

  function defaultFilter() {
    return {
      selectedUnits: 'all',
      facets: FACETS.slice(),
      includeCohort: false,
      showDirectedRelations: true,
      traditions: 'all'
    };
  }

  function relationPassesFilter(rel, f) {
    if (!f || f.showDirectedRelations !== true) return false;
    if (!f.traditions || f.traditions === 'all') return true;
    if (!Array.isArray(f.traditions) || !f.traditions.length) return true;
    return f.traditions.indexOf(rel.tradition) !== -1;
  }

  function isCohortConcept(concept) {
    return concept && typeof concept.id === 'string' && concept.id.indexOf('unit-') === 0 && concept.id.indexOf('-cohort') !== -1;
  }

  function filterArtworks(artworks, filter) {
    if (!filter || filter.selectedUnits === 'all' || filter.selectedUnits == null) {
      return artworks.slice();
    }
    var units = filter.selectedUnits;
    if (!Array.isArray(units)) return artworks.slice();
    var set = new Set(units.map(function (u) { return parseInt(u, 10); }));
    return artworks.filter(function (a) { return set.has(a.unit); });
  }

  function filterConcepts(concepts, filter) {
    var facetSet = new Set((filter && filter.facets) ? filter.facets : FACETS);
    return concepts.filter(function (concept) {
      if (!facetSet.has(concept.facet)) return false;
      if (isCohortConcept(concept)) {
        return filter && filter.includeCohort === true;
      }
      if (concept.quizEligible === false && !(filter && filter.includeCohort)) {
        return false;
      }
      return true;
    });
  }

  function truncateLabel(str) {
    var s = (str || '').trim();
    if (s.length <= MAX_LABEL_LEN) return s;
    return s.slice(0, MAX_LABEL_LEN - 1) + '…';
  }

  function artworkNodeId(artworkId) {
    return 'artwork:' + artworkId;
  }

  function parseArtworkNodeId(nodeId) {
    if (typeof nodeId !== 'string' || nodeId.indexOf('artwork:') !== 0) return null;
    return parseInt(nodeId.slice(8), 10);
  }

  function conceptNodeId(conceptId) {
    return CONCEPT_PREFIX + conceptId;
  }

  function buildArtworkNode(artwork, unitColors) {
    var color = unitColors && unitColors[artwork.unit] ? unitColors[artwork.unit] : '#645e54';
    return {
      id: artworkNodeId(artwork.id),
      artworkId: artwork.id,
      nodeType: 'artwork',
      label: truncateLabel(artwork.title),
      title: artwork.title + ' (CED #' + artwork.id + ', Unit ' + artwork.unit + ')',
      unit: artwork.unit,
      group: 'unit-' + artwork.unit,
      color: { background: color, border: color, highlight: { background: color, border: '#2b2824' } }
    };
  }

  function buildConceptNode(concept) {
    return {
      id: conceptNodeId(concept.id),
      conceptId: concept.id,
      nodeType: 'concept',
      label: truncateLabel(concept.label),
      title: concept.label + ' (' + concept.facet + ')',
      facet: concept.facet,
      group: 'facet-' + concept.facet
    };
  }

  function edgeKey(a, b) {
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    return lo + '-' + hi;
  }

  function buildWorksGraph(artworks, concepts, relations, filter, unitColors) {
    var f = filter || defaultFilter();
    var pool = filterArtworks(artworks, f);
    var poolIds = new Set(pool.map(function (a) { return a.id; }));
    var poolById = new Map(pool.map(function (a) { return [a.id, a]; }));
    var conceptPool = filterConcepts(concepts, f);

    var nodes = [];
    var nodeIds = new Set();
    pool.forEach(function (artwork) {
      var n = buildArtworkNode(artwork, unitColors);
      nodes.push(n);
      nodeIds.add(n.id);
    });

    var edgeMap = new Map();
    conceptPool.forEach(function (concept) {
      var members = (concept.artworks || []).filter(function (id) { return poolIds.has(id); });
      var i;
      var j;
      for (i = 0; i < members.length; i++) {
        for (j = i + 1; j < members.length; j++) {
          var a = members[i];
          var b = members[j];
          var key = edgeKey(a, b);
          if (!edgeMap.has(key)) {
            edgeMap.set(key, {
              id: 'shared-' + key,
              from: artworkNodeId(a),
              to: artworkNodeId(b),
              edgeType: 'sharedConcept',
              conceptIds: [],
              labels: [],
              title: ''
            });
          }
          var edge = edgeMap.get(key);
          if (edge.conceptIds.indexOf(concept.id) === -1) {
            edge.conceptIds.push(concept.id);
            edge.labels.push(concept.label);
          }
        }
      }
    });

    var edges = [];
    var sharedEdgeCount = 0;
    edgeMap.forEach(function (edge) {
      edge.title = edge.labels.join('; ');
      edges.push(edge);
      sharedEdgeCount += 1;
    });

    var directedList = [];
    var directedEdgeCount = 0;
    if (relations && relations.length) {
      relations.forEach(function (rel) {
        if (!relationPassesFilter(rel, f)) return;
        if (!poolIds.has(rel.from) || !poolIds.has(rel.to)) return;
        var periodTitle = '';
        if (rel.fromPeriod && rel.toPeriod) {
          periodTitle = rel.fromPeriod + ' → ' + rel.toPeriod + ': ';
        }
        edges.push({
          id: 'relation-' + rel.from + '-' + rel.to + '-' + rel.type,
          from: artworkNodeId(rel.from),
          to: artworkNodeId(rel.to),
          edgeType: 'directed',
          relationType: rel.type,
          tradition: rel.tradition,
          fromPeriod: rel.fromPeriod,
          toPeriod: rel.toPeriod,
          title: periodTitle + (rel.note || rel.type || 'Related').trim(),
          arrows: 'to',
          dashes: true
        });
        directedEdgeCount += 1;
        var fromArt = poolById.get(rel.from);
        var toArt = poolById.get(rel.to);
        if (fromArt && toArt) {
          directedList.push({
            kind: 'directed',
            artworkA: fromArt.id,
            titleA: fromArt.title,
            artworkB: toArt.id,
            titleB: toArt.title,
            label: rel.note || rel.type,
            tradition: rel.tradition,
            fromPeriod: rel.fromPeriod,
            toPeriod: rel.toPeriod,
            relationType: rel.type
          });
        }
      });
    }

    var connectionList = buildConnectionListFromWorks(edgeMap, poolById).concat(directedList);
    connectionList.sort(function (x, y) {
      var ta = (x.tradition || '') + (x.label || '');
      var tb = (y.tradition || '') + (y.label || '');
      return ta.localeCompare(tb);
    });

    return {
      nodes: nodes,
      edges: edges,
      connectionList: connectionList,
      stats: {
        artworkCount: nodes.length,
        edgeCount: edges.length,
        sharedEdgeCount: sharedEdgeCount,
        directedEdgeCount: directedEdgeCount,
        conceptCount: conceptPool.length
      }
    };
  }

  function buildConnectionListFromWorks(edgeMap, poolById) {
    var list = [];
    edgeMap.forEach(function (edge) {
      var aId = parseArtworkNodeId(edge.from);
      var bId = parseArtworkNodeId(edge.to);
      var a = poolById.get(aId);
      var b = poolById.get(bId);
      if (!a || !b) return;
      edge.labels.forEach(function (label, i) {
        list.push({
          artworkA: a.id,
          titleA: a.title,
          artworkB: b.id,
          titleB: b.title,
          conceptId: edge.conceptIds[i],
          label: label,
          kind: 'sharedConcept'
        });
      });
    });
    list.sort(function (x, y) {
      return (x.label + x.titleA).localeCompare(y.label + y.titleA);
    });
    return list;
  }

  function buildConceptsGraph(artworks, concepts, filter, unitColors) {
    var f = filter || defaultFilter();
    var pool = filterArtworks(artworks, f);
    var poolIds = new Set(pool.map(function (a) { return a.id; }));
    var poolById = new Map(pool.map(function (a) { return [a.id, a]; }));
    var conceptPool = filterConcepts(concepts, f);

    var nodes = [];
    var nodeIds = new Set();

    pool.forEach(function (artwork) {
      var n = buildArtworkNode(artwork, unitColors);
      nodes.push(n);
      nodeIds.add(n.id);
    });

    conceptPool.forEach(function (concept) {
      var hasMember = (concept.artworks || []).some(function (id) { return poolIds.has(id); });
      if (!hasMember) return;
      var cn = buildConceptNode(concept);
      nodes.push(cn);
      nodeIds.add(cn.id);
    });

    var edges = [];
    var connectionList = [];

    conceptPool.forEach(function (concept) {
      var cid = conceptNodeId(concept.id);
      if (!nodeIds.has(cid)) return;
      (concept.artworks || []).forEach(function (artworkId) {
        if (!poolIds.has(artworkId)) return;
        var aid = artworkNodeId(artworkId);
        edges.push({
          id: 'member-' + concept.id + '-' + artworkId,
          from: aid,
          to: cid,
          edgeType: 'membership',
          title: concept.label
        });
        var art = poolById.get(artworkId);
        if (art) {
          connectionList.push({
            artworkA: art.id,
            titleA: art.title,
            conceptId: concept.id,
            label: concept.label,
            kind: 'membership'
          });
        }
      });
    });

    connectionList.sort(function (x, y) {
      return (x.label + x.titleA).localeCompare(y.label + y.titleA);
    });

    return {
      nodes: nodes,
      edges: edges,
      connectionList: connectionList,
      stats: {
        artworkCount: pool.length,
        conceptNodeCount: nodes.length - pool.length,
        edgeCount: edges.length
      }
    };
  }

  function unitColorMap(units) {
    var map = {};
    (units || []).forEach(function (u) {
      map[u.id] = u.color || '#645e54';
    });
    return map;
  }

  return {
    FACETS: FACETS,
    defaultFilter: defaultFilter,
    isCohortConcept: isCohortConcept,
    filterArtworks: filterArtworks,
    filterConcepts: filterConcepts,
    relationPassesFilter: relationPassesFilter,
    buildWorksGraph: buildWorksGraph,
    buildConceptsGraph: buildConceptsGraph,
    unitColorMap: unitColorMap,
    artworkNodeId: artworkNodeId,
    parseArtworkNodeId: parseArtworkNodeId,
    conceptNodeId: conceptNodeId
  };
})();
