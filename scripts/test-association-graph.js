/**
 * Tests for association-graph.js (Node).
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
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '../js/association-graph.js'), 'utf8'),
  sandbox
);
const AG = sandbox.window.AssociationGraph;

let failures = 0;

function assert(name, condition, detail) {
  if (!condition) {
    console.error('FAIL:', name, detail || '');
    failures += 1;
  } else {
    console.log('ok:', name);
  }
}

function hasDirectedEdge(graph, from, to) {
  return graph.edges.some(function (e) {
    return e.edgeType === 'directed' &&
      e.from === AG.artworkNodeId(from) &&
      e.to === AG.artworkNodeId(to);
  });
}

const filter = AG.defaultFilter();
const works = AG.buildWorksGraph(artworks, concepts, relations, filter);

const register = concepts.find(function (c) { return c.id === 'register-composition'; });
const regIds = register.artworks.filter(function (id) {
  return artworks.some(function (a) { return a.id === id; });
});
const expectedPairs = (regIds.length * (regIds.length - 1)) / 2;

const regEdges = works.edges.filter(function (e) {
  return e.edgeType === 'sharedConcept' && e.conceptIds && e.conceptIds.indexOf('register-composition') !== -1;
});
assert('register-composition pair edges', regEdges.length === expectedPairs, 'got ' + regEdges.length + ' expected ' + expectedPairs);

const cohortInPool = concepts.filter(function (c) { return AG.isCohortConcept(c); }).length;
const conceptsFiltered = AG.filterConcepts(concepts, filter);
assert('cohort excluded by default', conceptsFiltered.length === concepts.length - cohortInPool);

const withCohort = Object.assign({}, filter, { includeCohort: true });
const conceptsWithCohort = AG.filterConcepts(concepts, withCohort);
assert('cohort included when flag on', conceptsWithCohort.length === concepts.length);

const bipartite = AG.buildConceptsGraph(artworks, concepts, filter);
const conceptNodes = bipartite.nodes.filter(function (n) { return n.nodeType === 'concept'; });
assert('bipartite has concept nodes', conceptNodes.length > 0);
assert('bipartite membership edges', bipartite.edges.length > 0);

const unit2 = AG.buildWorksGraph(
  artworks,
  concepts,
  relations,
  Object.assign({}, filter, { selectedUnits: [2] })
);
assert('unit 2 subgraph smaller', unit2.nodes.length < works.nodes.length);

const directed = works.edges.filter(function (e) { return e.edgeType === 'directed'; });
assert('directed relation count >= 50', directed.length >= 50, 'got ' + directed.length);
assert('stats split shared vs directed', works.stats.sharedEdgeCount >= 0 && works.stats.directedEdgeCount === directed.length);
assert('greek archaic to classical sample', hasDirectedEdge(works, 27, 35));
assert('egypt predynastic to old kingdom', hasDirectedEdge(works, 13, 17));
assert('egypt old to new kingdom bridge', hasDirectedEdge(works, 17, 20));

assert('no self-loops in relations', relations.every(function (r) { return r.from !== r.to; }));

const greekOnly = AG.buildWorksGraph(
  artworks,
  concepts,
  relations,
  Object.assign({}, filter, { traditions: ['greek_mediterranean'] })
);
const greekDirected = greekOnly.edges.filter(function (e) { return e.edgeType === 'directed'; });
assert('tradition filter reduces directed edges', greekDirected.length < directed.length);
assert('greek filter keeps greek edge', hasDirectedEdge(greekOnly, 27, 35));

const directedRows = works.connectionList.filter(function (r) { return r.kind === 'directed'; });
assert('connection list includes directed rows', directedRows.length > 0);

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed.');
  process.exit(1);
}
console.log('\nAssociation graph tests passed.\n');
