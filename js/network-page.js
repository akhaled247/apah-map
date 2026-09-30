/**
 * Network page: vis-network rendering for association graphs.
 */

(function () {
  'use strict';

  var _network = null;
  var _nodesDataSet = null;
  var _edgesDataSet = null;
  var _artworks = [];
  var _units = [];
  var _unitColors = {};
  var _viewMode = 'works';
  var _selectedUnits = 'all';
  var _facets = null;
  var _includeCohort = false;
  var _showDirected = true;
  var _selectedTraditions = 'all';
  var _lastGraph = null;
  var _nodeLabels = {};
  var _themeColors = null;
  var _layoutFrozen = false;
  var _listKindFilter = 'all';
  var _listSearchQuery = '';
  var _activePreset = 'explore';
  var LIST_CAP = 400;
  var DENSITY_EDGE_THRESHOLD = 150;

  var FACET_LABELS = {
    function: 'Function',
    form: 'Form',
    period: 'Period',
    typology: 'Typology',
    material: 'Material',
    site: 'Site'
  };

  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('network-graph');
    if (!container || !window.AssociationGraph) return;

    _facets = window.AssociationGraph.FACETS.slice();
    _themeColors = readThemeColors();

    var filtersEl = document.getElementById('network-filters');
    if (filtersEl && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      filtersEl.open = false;
    }

    setupControls();
    loadAndRender();

    if (window.AppSearch) {
      window.AppSearch.init({
        onSelect: function (artworkId) {
          focusArtworkNode(artworkId);
        }
      });
    }
  });

  function readThemeColors() {
    var el = document.createElement('div');
    el.style.display = 'none';
    document.body.appendChild(el);
    function css(name) {
      el.style.color = 'var(' + name + ')';
      return getComputedStyle(el).color;
    }
    var colors = {
      burgundy: css('--accent-burgundy'),
      navy: css('--accent-navy'),
      borderDark: css('--border-dark'),
      border: css('--border-color'),
      bgHeader: css('--bg-header'),
      textMain: css('--text-main')
    };
    document.body.removeChild(el);
    return colors;
  }

  function loadAndRender() {
    window.DataLoader.loadAll().then(function () {
      _artworks = window.DataLoader.getArtworks();
      _units = window.DataLoader.getUnits();
      _unitColors = window.AssociationGraph.unitColorMap(_units);
      buildTraditionFilters();
      renderGraph();
      updateStatus();
    }).catch(function (err) {
      console.error(err);
      var status = document.getElementById('network-status');
      if (status) status.textContent = 'Failed to load data.';
    });
  }

  function getFilter() {
    return {
      selectedUnits: _selectedUnits,
      facets: _facets,
      includeCohort: _includeCohort,
      showDirectedRelations: _showDirected && _viewMode === 'works',
      traditions: _selectedTraditions
    };
  }

  function buildTraditionFilters() {
    var grid = document.getElementById('network-traditions');
    if (!grid) return;
    var relations = window.DataLoader.getAssociationRelations();
    var seen = new Set();
    var ids = [];
    relations.forEach(function (r) {
      if (r.tradition && !seen.has(r.tradition)) {
        seen.add(r.tradition);
        ids.push(r.tradition);
      }
    });
    ids.sort();
    ids.forEach(function (tid) {
      var label = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('data-tradition', tid);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + formatTraditionId(tid)));
      grid.appendChild(label);
    });
  }

  function formatTraditionId(id) {
    return id.replace(/_/g, ' ');
  }

  function buildGraph() {
    var concepts = window.DataLoader.getAssociationConcepts();
    var relations = window.DataLoader.getAssociationRelations();
    var filter = getFilter();
    if (_viewMode === 'concepts') {
      return window.AssociationGraph.buildConceptsGraph(_artworks, concepts, filter, _unitColors);
    }
    return window.AssociationGraph.buildWorksGraph(_artworks, concepts, relations, filter, _unitColors);
  }

  function visNodesFromGraph(graph) {
    _nodeLabels = {};
    var tc = _themeColors || {};
    var marker = window.ArtworkRender && window.ArtworkRender.mapMarkerVisNode;
    return graph.nodes.map(function (n) {
      var isArtwork = n.nodeType === 'artwork' && n.artworkId != null;
      _nodeLabels[n.id] = n.title || n.label;
      var out = {
        id: n.id,
        title: n.title,
        group: n.group
      };
      if (n.nodeType === 'concept') {
        out.label = n.label;
        out.shape = 'box';
        out.color = { background: tc.bgHeader || '#f2efe9', border: tc.burgundy || '#802b2b' };
        out.font = { color: tc.textMain || '#2b2824', size: 12, face: 'Georgia' };
      } else if (isArtwork && marker) {
        var styled = marker(n.artworkId);
        Object.keys(styled).forEach(function (key) { out[key] = styled[key]; });
      } else {
        out.label = isArtwork ? String(n.artworkId) : n.label;
        out.shape = 'circle';
        out.size = 13;
      }
      return out;
    });
  }

  function visEdgesFromGraph(graph) {
    var tc = _themeColors || {};
    var dense = graph.nodes.length > 40;
    return graph.edges.map(function (e) {
      var out = {
        id: e.id,
        from: e.from,
        to: e.to,
        title: e.title
      };
      if (e.edgeType === 'directed') {
        out.dashes = true;
        out.arrows = { to: { enabled: true, scaleFactor: 0.7 } };
        out.color = { color: tc.navy || '#264653', highlight: tc.burgundy || '#802b2b' };
        out.width = 2;
      } else if (e.edgeType === 'membership') {
        out.color = { color: tc.border || '#d8d2c4', highlight: tc.burgundy || '#802b2b' };
        out.width = 1;
      } else {
        out.color = {
          color: tc.borderDark || '#b8af9c',
          highlight: tc.burgundy || '#802b2b',
          opacity: dense && _showDirected ? 0.45 : 0.85
        };
        out.width = dense && _showDirected ? 0.75 : 1;
        out.smooth = { type: 'continuous' };
      }
      return out;
    });
  }

  function physicsOptions(nodeCount) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dense = nodeCount > 50;
    return {
      enabled: !_layoutFrozen && !reduced,
      stabilization: { iterations: reduced ? 0 : (dense ? 80 : 120) },
      barnesHut: {
        gravitationalConstant: dense ? -12000 : -8000,
        springLength: dense ? 160 : 120
      }
    };
  }

  function networkOptions(nodeCount) {
    return {
      nodes: {
        font: { size: 12, face: 'Georgia' },
        borderWidth: 1,
        chosen: {
          node: function (values, id, selected, hovering) {
            if (window.ArtworkRender && window.ArtworkRender.applyMapMarkerChosen) {
              window.ArtworkRender.applyMapMarkerChosen(values, selected, hovering);
            }
          }
        }
      },
      edges: {
        font: { size: 0 }
      },
      physics: physicsOptions(nodeCount),
      interaction: { hover: true, tooltipDelay: 150, hideEdgesOnDrag: true }
    };
  }

  function renderGraph() {
    var container = document.getElementById('network-graph');
    if (!container) return;

    _lastGraph = buildGraph();
    var nodes = visNodesFromGraph(_lastGraph);
    var edges = visEdgesFromGraph(_lastGraph);
    var nodeCount = _lastGraph.nodes.length;

    if (!_nodesDataSet) {
      _nodesDataSet = new vis.DataSet(nodes);
      _edgesDataSet = new vis.DataSet(edges);
      _network = new vis.Network(container, {
        nodes: _nodesDataSet,
        edges: _edgesDataSet
      }, networkOptions(nodeCount));

      _network.on('click', function (params) {
        if (params.nodes.length) {
          showNodeDetail(params.nodes[0]);
        } else if (params.edges.length) {
          showEdgeDetail(params.edges[0]);
        }
      });

      _network.on('stabilizationIterationsDone', function () {
        var btn = document.getElementById('network-freeze-layout');
        if (btn && !_layoutFrozen) btn.textContent = 'Freeze layout';
      });
    } else {
      _nodesDataSet.clear();
      _edgesDataSet.clear();
      _nodesDataSet.add(nodes);
      _edgesDataSet.add(edges);
      _network.setOptions(networkOptions(nodeCount));
      if (!_layoutFrozen) {
        _network.stabilize();
      }
    }

    renderConnectionList(_lastGraph.connectionList);
    updateStatus();
    updateLegendView();
  }

  function updateLegendView() {
    var conceptsOnly = document.querySelector('.network-legend-concepts-only');
    if (conceptsOnly) conceptsOnly.hidden = _viewMode !== 'concepts';
  }

  function updateStatus() {
    var el = document.getElementById('network-status');
    var notice = document.getElementById('network-density-notice');
    if (!el || !_lastGraph) return;
    var s = _lastGraph.stats;
    if (_viewMode === 'concepts') {
      el.textContent = s.artworkCount + ' works · ' + (s.conceptNodeCount || 0) + ' concepts · ' + s.edgeCount + ' links';
    } else {
      var shared = s.sharedEdgeCount != null ? s.sharedEdgeCount : '—';
      var directed = s.directedEdgeCount != null ? s.directedEdgeCount : '—';
      el.textContent = s.artworkCount + ' works · ' + shared + ' shared · ' + directed + ' directed';
    }

    if (notice) {
      if (_viewMode === 'works' && s.edgeCount > DENSITY_EDGE_THRESHOLD) {
        notice.hidden = false;
        notice.textContent = 'Graph is dense (' + s.edgeCount + ' links). Narrow units with the tabs above, turn off directed links in More filters, or use One unit quick view for a clearer layout.';
      } else {
        notice.hidden = true;
        notice.textContent = '';
      }
    }
  }

  function filterConnectionList(list) {
    if (!list) return [];
    return list.filter(function (row) {
      if (_listKindFilter !== 'all' && row.kind !== _listKindFilter) return false;
      if (!_listSearchQuery) return true;
      var q = _listSearchQuery.toLowerCase();
      var hay = [
        row.titleA,
        row.titleB,
        row.label,
        row.tradition ? formatTraditionId(row.tradition) : ''
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderConnectionList(list) {
    var wrap = document.getElementById('network-edge-list');
    if (!wrap) return;
    var filtered = filterConnectionList(list);
    if (!list || !list.length) {
      wrap.innerHTML = '<p class="network-list-empty">No connections for this filter.</p>';
      return;
    }
    if (!filtered.length) {
      wrap.innerHTML = '<p class="network-list-empty">No connections match this list filter.</p>';
      return;
    }
    var html = '<ul class="network-connection-list">';
    var slice = filtered.length > LIST_CAP ? filtered.slice(0, LIST_CAP) : filtered;
    slice.forEach(function (row) {
      var kindClass = row.kind === 'directed' ? ' network-list-row--directed' : ' network-list-row--shared';
      if (row.kind === 'membership') kindClass = ' network-list-row--membership';
      var prefix = row.tradition
        ? '<span class="network-list-tradition">[' + escapeHtml(formatTraditionId(row.tradition)) + ']</span> '
        : '';
      if (row.kind === 'membership') {
        html += '<li class="network-list-row' + kindClass + '">' + prefix + '<a href="../list/' + padId(row.artworkA) + '/">' + escapeHtml(row.titleA) + '</a>' +
          ' <span class="network-list-sep">—</span> ' +
          '<span class="network-list-concept">' + escapeHtml(row.label) + '</span></li>';
      } else if (row.kind === 'directed') {
        var period = '';
        if (row.fromPeriod && row.toPeriod) {
          period = ' <span class="network-list-concept">(' + escapeHtml(row.fromPeriod) + ' → ' + escapeHtml(row.toPeriod) + ')</span>';
        }
        html += '<li class="network-list-row' + kindClass + '">' + prefix + '<a href="../list/' + padId(row.artworkA) + '/">' + escapeHtml(row.titleA) + '</a>' +
          ' <span class="network-list-sep">→</span> ' +
          '<a href="../list/' + padId(row.artworkB) + '/">' + escapeHtml(row.titleB) + '</a>' +
          period +
          ' <span class="network-list-sep">·</span> ' +
          '<span class="network-list-concept">' + escapeHtml(row.label) + '</span></li>';
      } else {
        html += '<li class="network-list-row' + kindClass + '">' + prefix + '<a href="../list/' + padId(row.artworkA) + '/">' + escapeHtml(row.titleA) + '</a>' +
          ' <span class="network-list-sep">↔</span> ' +
          '<a href="../list/' + padId(row.artworkB) + '/">' + escapeHtml(row.titleB) + '</a>' +
          ' <span class="network-list-sep">·</span> ' +
          '<span class="network-list-concept">' + escapeHtml(row.label) + '</span></li>';
      }
    });
    if (filtered.length > LIST_CAP) {
      html += '<li class="network-list-cap-note">Showing first ' + LIST_CAP + ' of ' + filtered.length + ' matching connections (' + list.length + ' total).</li>';
    }
    html += '</ul>';
    wrap.innerHTML = html;
  }

  function artworkMetaLine(artwork) {
    if (window.ArtworkRender) {
      return escapeHtml(window.ArtworkRender.formatArtistCulture(artwork)) +
        '<br>' + escapeHtml(artwork.dateDisplay || '');
    }
    return escapeHtml(artwork.culture || '') + '<br>' + escapeHtml(artwork.dateDisplay || '');
  }

  function showNodeDetail(nodeId) {
    var panel = document.getElementById('network-detail');
    if (!panel) return;

    if (nodeId.indexOf('concept:') === 0) {
      var conceptId = nodeId.slice(8);
      var concept = window.DataLoader.getAssociationConceptById(conceptId);
      if (!concept) {
        panel.innerHTML = '';
        return;
      }
      var links = '';
      var ids = (concept.artworks || []).slice(0, 10);
      if (ids.length) {
        links = '<ul class="network-detail-links">';
        ids.forEach(function (aid) {
          var art = window.DataLoader.getArtworkById(aid);
          if (art) {
            links += '<li><a href="../list/' + padId(art.id) + '/">' + escapeHtml(art.title) + '</a></li>';
          }
        });
        links += '</ul>';
        if ((concept.artworks || []).length > 10) {
          links += '<p class="network-detail-meta">+ ' + ((concept.artworks || []).length - 10) + ' more works</p>';
        }
      }
      panel.innerHTML = '<h2 class="network-detail-title">' + escapeHtml(concept.label) + '</h2>' +
        '<p class="network-detail-meta">Facet: ' + escapeHtml(FACET_LABELS[concept.facet] || concept.facet) + '</p>' +
        '<p class="network-detail-meta">' + (concept.artworks || []).length + ' linked works in dataset</p>' +
        links;
      return;
    }

    var artworkId = window.AssociationGraph.parseArtworkNodeId(nodeId);
    var artwork = window.DataLoader.getArtworkById(artworkId);
    if (!artwork) {
      panel.innerHTML = '';
      return;
    }
    panel.innerHTML = '<h2 class="network-detail-title">' + escapeHtml(artwork.title) + '</h2>' +
      '<p class="network-detail-meta">CED #' + artwork.id + ' · Unit ' + artwork.unit + '</p>' +
      '<p class="network-detail-body">' + artworkMetaLine(artwork) + '</p>' +
      '<p><a class="btn btn-primary" href="../list/' + padId(artwork.id) + '/">Open artwork page</a></p>';
  }

  function parseArtworkIdFromNode(nodeId) {
    return window.AssociationGraph.parseArtworkNodeId(nodeId);
  }

  function showEdgeDetail(edgeId) {
    var panel = document.getElementById('network-detail');
    if (!panel || !_lastGraph) return;
    var edge = _lastGraph.edges.find(function (e) { return e.id === edgeId; });
    if (!edge) return;

    var highlightBtn = '<p><button type="button" class="btn btn-subtle" id="network-highlight-edge">Highlight on graph</button></p>';

    if (edge.edgeType === 'directed') {
      var fromId = parseArtworkIdFromNode(edge.from);
      var toId = parseArtworkIdFromNode(edge.to);
      var fromArt = window.DataLoader.getArtworkById(fromId);
      var toArt = window.DataLoader.getArtworkById(toId);
      var trad = edge.tradition ? '<p class="network-detail-meta">Tradition: ' + escapeHtml(formatTraditionId(edge.tradition)) + '</p>' : '';
      var period = '';
      if (edge.fromPeriod && edge.toPeriod) {
        period = '<p class="network-detail-meta">' + escapeHtml(edge.fromPeriod) + ' → ' + escapeHtml(edge.toPeriod) + '</p>';
      }
      panel.innerHTML = '<h2 class="network-detail-title">Period / precursor link</h2>' +
        '<p class="network-detail-meta">' + escapeHtml(edge.relationType || 'relation') + '</p>' +
        trad + period +
        '<p class="network-detail-body">' +
        (fromArt ? '<a href="../list/' + padId(fromArt.id) + '/">' + escapeHtml(fromArt.title) + '</a>' : '') +
        ' <span class="network-list-sep">→</span> ' +
        (toArt ? '<a href="../list/' + padId(toArt.id) + '/">' + escapeHtml(toArt.title) + '</a>' : '') +
        '</p>' +
        '<p class="network-detail-note">' + escapeHtml(edge.title || '') + '</p>' +
        highlightBtn;
      wireHighlightButton([edge.from, edge.to]);
      return;
    }

    var labels = edge.labels && edge.labels.length ? edge.labels : (edge.title ? edge.title.split('; ') : []);
    var listHtml = '<ul class="network-detail-bullets">';
    labels.forEach(function (lab) {
      listHtml += '<li>' + escapeHtml(lab) + '</li>';
    });
    listHtml += '</ul>';
    panel.innerHTML = '<h2 class="network-detail-title">Shared connection</h2>' + listHtml + highlightBtn;
    wireHighlightButton([edge.from, edge.to]);
  }

  function wireHighlightButton(nodeIds) {
    var btn = document.getElementById('network-highlight-edge');
    if (!btn || !_network) return;
    btn.addEventListener('click', function () {
      _network.selectNodes(nodeIds);
      _network.selectEdges([]);
      if (nodeIds.length === 2) {
        _network.fit({
          nodes: nodeIds,
          animation: { duration: 400 }
        });
      } else if (nodeIds.length === 1) {
        _network.focus(nodeIds[0], { scale: 1.1, animation: true });
      }
    });
  }

  function focusArtworkNode(artworkId) {
    if (!_network) return;
    var nodeId = window.AssociationGraph.artworkNodeId(artworkId);
    _network.selectNodes([nodeId]);
    _network.focus(nodeId, { scale: 1.2, animation: true });
    showNodeDetail(nodeId);
  }

  function syncUnitCheckboxesFromState() {
    var grid = document.getElementById('network-units');
    var allCb = document.getElementById('network-unit-all');
    if (!grid) return;
    if (_selectedUnits === 'all') {
      if (allCb) allCb.checked = true;
      grid.querySelectorAll('input[data-unit]').forEach(function (cb) { cb.checked = false; });
      return;
    }
    if (allCb) allCb.checked = false;
    var set = new Set(_selectedUnits);
    grid.querySelectorAll('input[data-unit]').forEach(function (cb) {
      var u = parseInt(cb.getAttribute('data-unit'), 10);
      cb.checked = set.has(u);
    });
  }

  function syncUnitTabsFromState() {
    var nav = document.getElementById('network-unit-nav');
    if (!nav) return;
    nav.querySelectorAll('[data-network-unit]').forEach(function (btn) {
      var val = btn.getAttribute('data-network-unit');
      var active = false;
      if (val === 'all') {
        active = _selectedUnits === 'all';
      } else if (Array.isArray(_selectedUnits) && _selectedUnits.length === 1) {
        active = _selectedUnits[0] === parseInt(val, 10);
      }
      btn.classList.toggle('active', active);
    });
  }

  function setSelectedUnits(units) {
    _selectedUnits = units;
    syncUnitCheckboxesFromState();
    syncUnitTabsFromState();
    if (_artworks.length) renderGraph();
  }

  function applyPreset(presetId) {
    _activePreset = presetId;
    document.querySelectorAll('.network-preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-network-preset') === presetId);
    });

    var cohortEl = document.getElementById('network-include-cohort');
    var directedEl = document.getElementById('network-show-directed');
    var periodFacet = document.querySelector('#network-facets input[data-facet="period"]');

    if (presetId === 'explore') {
      setSelectedUnits('all');
      _includeCohort = false;
      _showDirected = true;
      _facets = window.AssociationGraph.FACETS.slice();
      _selectedTraditions = 'all';
      if (cohortEl) cohortEl.checked = false;
      if (directedEl) directedEl.checked = true;
      resetFacetCheckboxes();
      resetTraditionAll();
    } else if (presetId === 'study-unit') {
      if (_selectedUnits === 'all') {
        setSelectedUnits([2]);
      }
      _includeCohort = false;
      _showDirected = false;
      if (cohortEl) cohortEl.checked = false;
      if (directedEl) directedEl.checked = false;
      _facets = window.AssociationGraph.FACETS.slice();
      resetFacetCheckboxes();
      renderGraph();
      return;
    } else if (presetId === 'period-threads') {
      _showDirected = true;
      if (directedEl) directedEl.checked = true;
      _includeCohort = false;
      if (cohortEl) cohortEl.checked = false;
      _facets = ['period'];
      setFacetCheckboxesFromFacets();
      if (periodFacet) periodFacet.checked = true;
    }

    renderGraph();
  }

  function resetFacetCheckboxes() {
    var grid = document.getElementById('network-facets');
    if (!grid) return;
    grid.querySelectorAll('input[data-facet]').forEach(function (cb) { cb.checked = true; });
  }

  function setFacetCheckboxesFromFacets() {
    var grid = document.getElementById('network-facets');
    if (!grid || !_facets) return;
    var set = new Set(_facets);
    grid.querySelectorAll('input[data-facet]').forEach(function (cb) {
      cb.checked = set.has(cb.getAttribute('data-facet'));
    });
  }

  function resetTraditionAll() {
    var grid = document.getElementById('network-traditions');
    var allCb = document.getElementById('network-tradition-all');
    if (allCb) allCb.checked = true;
    if (grid) {
      grid.querySelectorAll('input[data-tradition]').forEach(function (cb) { cb.checked = false; });
    }
  }

  function setupControls() {
    var worksBtn = document.getElementById('network-view-works');
    var conceptsBtn = document.getElementById('network-view-concepts');
    if (worksBtn) {
      worksBtn.addEventListener('click', function () {
        setViewMode('works', worksBtn, conceptsBtn);
      });
    }
    if (conceptsBtn) {
      conceptsBtn.addEventListener('click', function () {
        setViewMode('concepts', worksBtn, conceptsBtn);
      });
    }

    setupUnitNav();
    setupUnitControls();
    setupFacetControls();
    setupTraditionControls();
    setupPresets();
    setupListToolbar();

    var cohortEl = document.getElementById('network-include-cohort');
    if (cohortEl) {
      cohortEl.addEventListener('change', function () {
        _includeCohort = cohortEl.checked;
        renderGraph();
      });
    }

    var directedEl = document.getElementById('network-show-directed');
    if (directedEl) {
      directedEl.addEventListener('change', function () {
        _showDirected = directedEl.checked;
        renderGraph();
      });
    }

    var freezeBtn = document.getElementById('network-freeze-layout');
    if (freezeBtn) {
      freezeBtn.addEventListener('click', function () {
        _layoutFrozen = !_layoutFrozen;
        if (_network) {
          _network.setOptions({ physics: physicsOptions(_lastGraph ? _lastGraph.nodes.length : 0) });
        }
        freezeBtn.textContent = _layoutFrozen ? 'Unfreeze layout' : 'Freeze layout';
      });
    }

    var listToggle = document.getElementById('network-list-toggle');
    var listPanel = document.getElementById('network-list-panel');
    if (listToggle && listPanel) {
      listToggle.addEventListener('click', function () {
        var hidden = listPanel.hidden;
        listPanel.hidden = !hidden;
        listToggle.setAttribute('aria-expanded', hidden ? 'true' : 'false');
      });
    }
  }

  function setupUnitNav() {
    var nav = document.getElementById('network-unit-nav');
    if (!nav) return;
    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-network-unit]');
      if (!btn) return;
      var val = btn.getAttribute('data-network-unit');
      document.querySelectorAll('.network-preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      if (val === 'all') {
        setSelectedUnits('all');
      } else {
        setSelectedUnits([parseInt(val, 10)]);
      }
    });
  }

  function setupPresets() {
    document.querySelectorAll('.network-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPreset(btn.getAttribute('data-network-preset'));
      });
    });
  }

  function setupListToolbar() {
    var tabs = document.querySelectorAll('.network-list-tabs [data-list-kind]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        _listKindFilter = tab.getAttribute('data-list-kind');
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (_lastGraph) renderConnectionList(_lastGraph.connectionList);
      });
    });

    var search = document.getElementById('network-list-search');
    if (search) {
      search.addEventListener('input', function () {
        _listSearchQuery = search.value.trim();
        if (_lastGraph) renderConnectionList(_lastGraph.connectionList);
      });
    }
  }

  function setViewMode(mode, worksBtn, conceptsBtn) {
    _viewMode = mode;
    if (worksBtn) {
      worksBtn.classList.toggle('active', mode === 'works');
      worksBtn.setAttribute('aria-selected', mode === 'works' ? 'true' : 'false');
    }
    if (conceptsBtn) {
      conceptsBtn.classList.toggle('active', mode === 'concepts');
      conceptsBtn.setAttribute('aria-selected', mode === 'concepts' ? 'true' : 'false');
    }
    var directedWrap = document.getElementById('network-directed-wrap');
    if (directedWrap) directedWrap.hidden = mode !== 'works';
    var traditionsWrap = document.getElementById('network-traditions-wrap');
    if (traditionsWrap) traditionsWrap.hidden = mode !== 'works';
    updateLegendView();
    if (_artworks.length) renderGraph();
  }

  function setupTraditionControls() {
    var grid = document.getElementById('network-traditions');
    var allCb = document.getElementById('network-tradition-all');
    if (!grid) return;

    grid.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || target.type !== 'checkbox') return;

      if (target.id === 'network-tradition-all') {
        if (target.checked) {
          _selectedTraditions = 'all';
          grid.querySelectorAll('input[data-tradition]').forEach(function (cb) { cb.checked = false; });
        }
      } else {
        var tid = target.getAttribute('data-tradition');
        if (allCb) allCb.checked = false;
        if (target.checked) {
          if (_selectedTraditions === 'all') _selectedTraditions = [];
          if (!Array.isArray(_selectedTraditions)) _selectedTraditions = [];
          if (_selectedTraditions.indexOf(tid) === -1) _selectedTraditions.push(tid);
        } else if (Array.isArray(_selectedTraditions)) {
          _selectedTraditions = _selectedTraditions.filter(function (t) { return t !== tid; });
          if (!_selectedTraditions.length) {
            _selectedTraditions = 'all';
            if (allCb) allCb.checked = true;
          }
        }
      }
      if (_artworks.length) renderGraph();
    });
  }

  function setupUnitControls() {
    var grid = document.getElementById('network-units');
    var allCb = document.getElementById('network-unit-all');
    if (!grid) return;

    grid.addEventListener('change', function (e) {
      var target = e.target;
      if (!target || target.type !== 'checkbox') return;

      document.querySelectorAll('.network-preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });

      if (target.id === 'network-unit-all') {
        if (target.checked) {
          _selectedUnits = 'all';
          grid.querySelectorAll('input[data-unit]').forEach(function (cb) { cb.checked = false; });
        }
      } else {
        var unit = parseInt(target.getAttribute('data-unit'), 10);
        if (allCb) allCb.checked = false;
        if (target.checked) {
          if (_selectedUnits === 'all') _selectedUnits = [];
          if (!Array.isArray(_selectedUnits)) _selectedUnits = [];
          if (_selectedUnits.indexOf(unit) === -1) _selectedUnits.push(unit);
          _selectedUnits.sort(function (a, b) { return a - b; });
        } else if (Array.isArray(_selectedUnits)) {
          _selectedUnits = _selectedUnits.filter(function (u) { return u !== unit; });
          if (!_selectedUnits.length) {
            _selectedUnits = 'all';
            if (allCb) allCb.checked = true;
          }
        }
      }
      syncUnitTabsFromState();
      if (_artworks.length) renderGraph();
    });
  }

  function setupFacetControls() {
    var grid = document.getElementById('network-facets');
    if (!grid) return;
    grid.querySelectorAll('input[data-facet]').forEach(function (cb) {
      cb.checked = true;
      cb.addEventListener('change', function () {
        var selected = [];
        grid.querySelectorAll('input[data-facet]:checked').forEach(function (c) {
          selected.push(c.getAttribute('data-facet'));
        });
        if (!selected.length) {
          cb.checked = true;
          return;
        }
        _facets = selected;
        if (_artworks.length) renderGraph();
      });
    });
  }

  function padId(id) {
    if (window.ArtworkRender) return window.ArtworkRender.padId(id);
    return String(id).padStart(3, '0');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
