/**
 * Build-time script: Vocabulary.md → content/vocab/*.md + data/vocabulary.json
 * Unit tags 0–2 from __Unit N *.md files; units 3+ preserved from existing frontmatter.
 *
 * Usage: node scripts/generate-vocabulary.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'Vocabulary.md');
const OUT_DIR = path.join(ROOT, 'content', 'vocab');
const AFFCC_DIR = path.join(ROOT, 'content', 'affcc');
const JSON_OUT = path.join(ROOT, 'data', 'vocabulary.json');

const WORD_SPLIT = /([a-zA-Z][a-zA-Z0-9'-]*)/g;

// AFFCC section headers present in every artwork note; excluded from reference lists.
const AFFCC_SECTION_VOCAB_IDS = ['content', 'context', 'form', 'function'];

const UNIT_ALIAS_IDS = {
  'bce': 'b-c-e',
  'b c e': 'b-c-e',
  'b.c.e.': 'b-c-e',
  'bi disk': 'bi',
  'materials or medium': 'materials',
  'hierarchical scale': 'hieratic-scale-hierarchical-scale',
  'canon': 'canon-of-proportions',
  'classicism': 'classical',
  'coffered': 'coffered-ceiling',
  'corinthian': 'corinthian-order',
  'doric': 'doric-order',
  'ionic': 'ionic-order',
  'groin vault': 'vaults',
  'kore': 'kore-plural-korai',
  'kouros': 'kouros-plural-kouroi',
  'pediment': 'pediments',
  'pilasters': 'pilaster',
  'red figure': 'red-figure-pottery',
  'red-figure': 'red-figure-pottery',
  'relief low high sunken': 'relief',
  'post and lintel': 'post-and-lintel',
  'barrel vault': 'barrel-vault',
  'stepped pyramid': 'stepped-pyramid',
  'hypostyle hall': 'hypostyle-hall',
  'crook and flail': 'crook-and-flail',
  'votive figures': 'votive-figures'
};

function cleanMarkdownArtifacts(str) {
  if (!str) return '';
  return str
    .replace(/\\-/g, '-')
    .replace(/\\\*/g, '')
    .replace(/\\_/g, '_')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\\/g, '')
    .trim();
}

function slugify(term) {
  return term
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTermName(str) {
  return str
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[.:(),–—\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(text) {
  const meta = { units: [], aliases: [] };
  if (!text.startsWith('---')) return { meta, body: text };
  const end = text.indexOf('---', 3);
  if (end === -1) return { meta, body: text };
  const block = text.substring(3, end);
  const body = text.substring(end + 3).trim();
  const unitsMatch = block.match(/units:\s*\[([^\]]*)\]/);
  if (unitsMatch) {
    meta.units = unitsMatch[1]
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n <= 10);
  }
  const aliasesMatch = block.match(/aliases:\s*\[([^\]]*)\]/);
  if (aliasesMatch && aliasesMatch[1].trim()) {
    meta.aliases = aliasesMatch[1]
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return { meta, body };
}

function extractTermHeader(line) {
  const trimmed = line.trim();
  const m1 = trimmed.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
  if (m1) return cleanMarkdownArtifacts(m1[1].replace(/:$/, '').trim());
  const m2 = trimmed.match(/^\*\*([^*:]+):\*\*\s*$/);
  if (m2) return cleanMarkdownArtifacts(m2[1].trim());
  const m3 = trimmed.match(/^\*\*([^*]+):\s*$/);
  if (m3) return cleanMarkdownArtifacts(m3[1].trim());
  return null;
}

function parseVocabularyMarkdown(text) {
  const lines = text.split('\n');
  const entries = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const term = extractTermHeader(lines[i]);
    if (term) {
      if (current) entries.push(current);
      current = { term, definitionLines: [] };
      continue;
    }
    if (current) {
      current.definitionLines.push(lines[i]);
    }
  }
  if (current) entries.push(current);

  return entries.map(function (entry) {
    const definition = cleanMarkdownArtifacts(
      entry.definitionLines.join('\n').trim()
    );
    const id = slugify(entry.term);
    return { id, term: entry.term, definition, units: [], aliases: [] };
  }).filter(e => e.id && e.term && e.definition);
}

function parseUnitFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const terms = [];
  text.split('\n').forEach(function (line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('#')) return;
    if (trimmed.startsWith('|')) return;
    if (/^unit\s+\d+/i.test(trimmed)) return;
    terms.push(trimmed);
  });
  return terms;
}

function unitNumberFromFilename(filename) {
  const m = filename.match(/^__Unit\s+(\d+)\b/i);
  return m ? parseInt(m[1], 10) : null;
}

function discoverUnitFiles() {
  return fs.readdirSync(ROOT)
    .filter(f => /^__Unit\s+\d+/i.test(f) && /vocabulary/i.test(f) && f.endsWith('.md'))
    .map(f => ({ file: f, unit: unitNumberFromFilename(f) }))
    .filter(x => x.unit !== null)
    .sort((a, b) => a.unit - b.unit);
}

function buildTermLookup(entries) {
  const byId = new Map(entries.map(e => [e.id, e]));
  const byNorm = new Map();
  entries.forEach(function (entry) {
    byNorm.set(normalizeTermName(entry.term), entry.id);
    byNorm.set(entry.id, entry.id);
    (entry.aliases || []).forEach(function (alias) {
      byNorm.set(normalizeTermName(alias), entry.id);
    });
  });
  return { byId, byNorm };
}

function resolveTermId(rawTerm, lookup) {
  const norm = normalizeTermName(rawTerm);
  if (UNIT_ALIAS_IDS[norm]) return UNIT_ALIAS_IDS[norm];
  if (lookup.byNorm.has(norm)) return lookup.byNorm.get(norm);
  const slug = slugify(rawTerm);
  if (lookup.byId.has(slug)) return slug;
  return null;
}

function applyUnitFiles(entries, lookup) {
  const unitFiles = discoverUnitFiles();
  const unmatched = [];
  const idToEntry = new Map(entries.map(e => [e.id, e]));

  entries.forEach(function (entry) {
    entry.units = entry.units.filter(u => u >= 3);
  });

  unitFiles.forEach(function ({ file, unit }) {
    const terms = parseUnitFile(path.join(ROOT, file));
    terms.forEach(function (rawTerm) {
      const id = resolveTermId(rawTerm, lookup);
      if (!id || !idToEntry.has(id)) {
        unmatched.push({ unit, term: rawTerm, file });
        return;
      }
      const entry = idToEntry.get(id);
      if (entry.units.indexOf(unit) === -1) {
        entry.units.push(unit);
      }
    });
  });

  entries.forEach(function (entry) {
    entry.units.sort((a, b) => a - b);
  });

  return { unitFiles, unmatched };
}

function loadExistingMeta(id) {
  const filePath = path.join(OUT_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return { units: [], aliases: [] };
  const text = fs.readFileSync(filePath, 'utf8');
  return parseFrontmatter(text).meta;
}

function buildTermMarkdown(entry) {
  const unitsStr = entry.units.length ? `[${entry.units.join(', ')}]` : '[]';
  const aliasesStr = entry.aliases.length
    ? `[${entry.aliases.map(a => `"${a.replace(/"/g, '\\"')}"`).join(', ')}]`
    : '[]';
  return `---\nid: ${entry.id}\nterm: "${entry.term.replace(/"/g, '\\"')}"\nunits: ${unitsStr}\naliases: ${aliasesStr}\n---\n\n${entry.definition}\n`;
}

function normalizeWord(word) {
  return word.toLowerCase().replace(/[''`]/g, '');
}

function registerWord(map, word, id) {
  const key = normalizeWord(word);
  if (!key || map.has(key)) return;
  map.set(key, id);
}

function buildVocabWordMap(entries) {
  const map = new Map();
  entries.forEach(function (entry) {
    registerWord(map, entry.term, entry.id);
    (entry.aliases || []).forEach(function (alias) {
      registerWord(map, alias, entry.id);
    });
  });
  return map;
}

function lookupWord(word, wordMap) {
  const key = normalizeWord(word);
  if (!key) return null;

  if (wordMap.has(key)) return wordMap.get(key);

  if (key.length > 3 && key.endsWith('es')) {
    const stem = key.slice(0, -2);
    if (wordMap.has(stem)) return wordMap.get(stem);
  }
  if (key.length > 2 && key.endsWith('s')) {
    const stem = key.slice(0, -1);
    if (wordMap.has(stem)) return wordMap.get(stem);
  }

  return null;
}

function stripAffccFrontmatter(text) {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('---', 3);
  if (end === -1) return text;
  return text.substring(end + 3).trim();
}

function scanAffccForVocab(text, wordMap) {
  const matchedIds = new Set();
  const parts = text.split(WORD_SPLIT);
  parts.forEach(function (part) {
    if (/^[a-zA-Z][a-zA-Z0-9'-]*$/.test(part)) {
      const id = lookupWord(part, wordMap);
      if (id) matchedIds.add(id);
    }
  });
  return matchedIds;
}

function buildArtworkReferences(entries) {
  const wordMap = buildVocabWordMap(entries);
  const idToArtworks = new Map();
  const artworkCounts = new Map();
  entries.forEach(function (entry) {
    idToArtworks.set(entry.id, new Set());
    artworkCounts.set(entry.id, 0);
  });

  if (!fs.existsSync(AFFCC_DIR)) {
    entries.forEach(function (entry) {
      entry.artworks = [];
    });
    return { excluded: [] };
  }

  const files = fs.readdirSync(AFFCC_DIR).filter(f => /^\d{3}\.md$/.test(f));
  files.forEach(function (file) {
    const artworkId = parseInt(file.replace('.md', ''), 10);
    const text = fs.readFileSync(path.join(AFFCC_DIR, file), 'utf8');
    const body = stripAffccFrontmatter(text);
    const matchedIds = scanAffccForVocab(body, wordMap);
    matchedIds.forEach(function (vocabId) {
      idToArtworks.get(vocabId).add(artworkId);
      artworkCounts.set(vocabId, artworkCounts.get(vocabId) + 1);
    });
  });

  const totalArtworks = files.length;
  const universalIds = new Set(
    entries
      .filter(function (entry) {
        return artworkCounts.get(entry.id) === totalArtworks;
      })
      .map(function (entry) {
        return entry.id;
      })
  );
  AFFCC_SECTION_VOCAB_IDS.forEach(function (id) {
    universalIds.add(id);
  });

  const excluded = [];
  entries.forEach(function (entry) {
    if (universalIds.has(entry.id)) {
      entry.artworks = [];
      excluded.push(entry.term);
    } else {
      entry.artworks = Array.from(idToArtworks.get(entry.id)).sort((a, b) => a - b);
    }
  });

  return { excluded: excluded.sort() };
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing Vocabulary.md at project root.');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const raw = fs.readFileSync(SOURCE, 'utf8');
  const parsed = parseVocabularyMarkdown(raw);
  const seenIds = new Set();
  const seenTerms = new Set();
  const duplicates = [];

  parsed.forEach(function (entry) {
    if (seenIds.has(entry.id)) duplicates.push(`duplicate id: ${entry.id} (${entry.term})`);
    if (seenTerms.has(entry.term.toLowerCase())) duplicates.push(`duplicate term: ${entry.term}`);
    seenIds.add(entry.id);
    seenTerms.add(entry.term.toLowerCase());

    const existing = loadExistingMeta(entry.id);
    entry.units = existing.units.filter(u => u >= 3);
    entry.aliases = existing.aliases;
  });

  const lookup = buildTermLookup(parsed);
  const { unitFiles, unmatched } = applyUnitFiles(parsed, lookup);
  const { excluded: excludedReferences } = buildArtworkReferences(parsed);

  parsed.forEach(function (entry) {
    fs.writeFileSync(
      path.join(OUT_DIR, `${entry.id}.md`),
      buildTermMarkdown(entry),
      'utf8'
    );
  });

  const json = parsed.map(function (e) {
    return {
      id: e.id,
      term: e.term,
      definition: e.definition,
      units: e.units,
      aliases: e.aliases,
      artworks: e.artworks || []
    };
  });

  fs.writeFileSync(JSON_OUT, JSON.stringify(json, null, 2) + '\n', 'utf8');

  console.log(`Generated ${json.length} vocabulary entries.`);
  if (excludedReferences.length) {
    console.log(`Excluded from artwork references (${excludedReferences.length} universal terms): ${excludedReferences.join(', ')}`);
  }
  unitFiles.forEach(function ({ file, unit }) {
    const count = json.filter(e => e.units.indexOf(unit) !== -1).length;
    console.log(`  Unit ${unit} (${file}): ${count} terms tagged`);
  });
  if (unmatched.length) {
    console.warn(`Unmatched unit terms (${unmatched.length}):`);
    unmatched.forEach(u => console.warn(`  Unit ${u.unit}: "${u.term}"`));
  }
  if (duplicates.length) {
    console.warn('Warnings:');
    duplicates.forEach(d => console.warn(`  ${d}`));
  }
}

main();
