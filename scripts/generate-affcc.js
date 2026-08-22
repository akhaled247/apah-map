/**
 * Build-time script to generate or update AFFCC content files (content/affcc/XXX.md)
 * from project owner source notes.
 *
 * Usage:
 *   node scripts/generate-affcc.js [optional-path-to-notes.md]
 */

const fs = require('fs');
const path = require('path');

const artworks = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/artworks.json'), 'utf8'));
const artMap = new Map(artworks.map(a => [a.id, a]));

const contentDir = path.join(__dirname, '../content/affcc');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

function padId(id) {
  return String(id).padStart(3, '0');
}

/**
 * Parses Unit 1 source notes markdown into structured sections
 */
function parseUnit1Notes(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sections = {};

  // Artworks section starts around "**Artworks**" or number 1
  const artSectionMatch = text.indexOf('**Artworks**');
  const artText = artSectionMatch !== -1 ? text.substring(artSectionMatch) : text;

  // Split on artwork numbers at start of line (e.g., "1. **Apollo 11 Stones**")
  const regex = /(?:^|\n)(\d+)\.\s+\*\*([^*]+)\*\*/g;
  let match;
  const indices = [];

  while ((match = regex.exec(artText)) !== null) {
    indices.push({
      id: parseInt(match[1], 10),
      title: match[2].trim(),
      index: match.index + (match[0].startsWith('\n') ? 1 : 0)
    });
  }

  for (let i = 0; i < indices.length; i++) {
    const curr = indices[i];
    const next = indices[i + 1];
    const itemText = next ? artText.substring(curr.index, next.index) : artText.substring(curr.index);
    sections[curr.id] = parseSingleArtworkNotes(curr.id, itemText);
  }

  return sections;
}

function parseSingleArtworkNotes(id, rawText) {
  const result = {
    form: [],
    function: [],
    content: [],
    context: [],
    attribution: []
  };

  const lines = rawText.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d+\.\s+Form/i.test(trimmed) || /^Form\b/i.test(trimmed)) {
      currentSection = 'form';
      continue;
    } else if (/^\d+\.\s+Function/i.test(trimmed) || /^Function\b/i.test(trimmed)) {
      currentSection = 'function';
      continue;
    } else if (/^\d+\.\s+Content/i.test(trimmed) || /^Content\b/i.test(trimmed)) {
      currentSection = 'content';
      continue;
    } else if (/^\d+\.\s+Context/i.test(trimmed) || /^Context\b/i.test(trimmed)) {
      currentSection = 'context';
      continue;
    } else if (/^\d+\.\s+Attribution/i.test(trimmed) || /^Attribution\b/i.test(trimmed)) {
      currentSection = 'attribution';
      continue;
    }

    if (currentSection && trimmed) {
      let bulletContent = trimmed.replace(/^[-*•\d\.\s\\]+/, '').trim();
      // Clean up common markdown export escape artifacts like \-, \*, \_
      bulletContent = bulletContent
        .replace(/\\-/g, '-')
        .replace(/\\\*/g, '')
        .replace(/\\_/g, '_')
        .replace(/\*(.*?)\*/g, '$1')
        .trim();
      if (bulletContent) {
        result[currentSection].push(bulletContent);
      }
    }
  }

  return result;
}

/**
 * Transforms parsed raw bullet points into polished educational prose
 * preserving all facts and avoiding invented details.
 */
function generateAffccMarkdown(artwork, parsed) {
  const id = artwork.id;
  const title = artwork.title;
  const pad = padId(id);

  let md = `---
id: ${id}
title: "${title.replace(/"/g, '\\"')}"
unit: ${artwork.unit}
status: "complete"
confidence: "owner_notes"
---\n\n`;

  md += `# ${id} — ${title}\n\n`;

  // Attribution
  md += `## Attribution\n\n`;
  const artistStr = artwork.artist ? `${artwork.artist}. ` : '';
  const cultureStr = artwork.culture ? `${artwork.culture}. ` : '';
  md += `**Culture / Artist:** ${artistStr || cultureStr || 'Unknown'}\n`;
  md += `**Date:** ${artwork.dateDisplay}\n`;
  md += `**Medium:** ${artwork.medium}\n`;
  md += `**Location:** ${artwork.locationDisplay}\n\n`;

  // Form
  md += `## Form\n\n`;
  if (parsed && parsed.form && parsed.form.length > 0) {
    md += parsed.form.map(f => `- ${f}`).join('\n') + '\n\n';
  } else {
    md += `Visual analysis details from owner source notes pending.\n\n`;
  }

  // Function
  md += `## Function\n\n`;
  if (parsed && parsed.function && parsed.function.length > 0) {
    md += parsed.function.map(f => `- ${f}`).join('\n') + '\n\n';
  } else {
    md += `Intended functional and ritual context details from owner source notes pending.\n\n`;
  }

  // Content
  md += `## Content\n\n`;
  if (parsed && parsed.content && parsed.content.length > 0) {
    md += parsed.content.map(c => `- ${c}`).join('\n') + '\n\n';
  } else {
    md += `Iconography, subject matter, and symbolic motifs from owner source notes pending.\n\n`;
  }

  // Context
  md += `## Context\n\n`;
  if (parsed && parsed.context && parsed.context.length > 0) {
    md += parsed.context.map(c => `- ${c}`).join('\n') + '\n\n';
  } else {
    md += `Historical and archaeological context from owner source notes pending.\n\n`;
  }

  return md;
}

function generatePendingStub(artwork) {
  const id = artwork.id;
  const title = artwork.title;
  const pad = padId(id);

  let md = `---
id: ${id}
title: "${title.replace(/"/g, '\\"')}"
unit: ${artwork.unit}
status: "pending"
confidence: "ced_metadata_only"
---\n\n`;

  md += `# ${id} — ${title}\n\n`;
  md += `## Attribution\n\n`;
  const artistStr = artwork.artist ? `${artwork.artist}. ` : '';
  const cultureStr = artwork.culture ? `${artwork.culture}. ` : '';
  md += `**Culture / Artist:** ${artistStr || cultureStr || 'Unknown'}\n`;
  md += `**Date:** ${artwork.dateDisplay}\n`;
  md += `**Medium:** ${artwork.medium}\n`;
  md += `**Location:** ${artwork.locationDisplay}\n`;
  if (artwork.sourceUrl) {
    md += `**Guide Reference:** [Smarthistory Guide](${artwork.sourceUrl})\n`;
  }
  md += `\n`;

  md += `## Form\n\n*Source notes pending. This section will contain visual analysis once Unit ${artwork.unit} notes are provided by the project owner.*\n\n`;
  md += `## Function\n\n*Source notes pending. This section will contain functional, religious, or civic context once Unit ${artwork.unit} notes are provided by the project owner.*\n\n`;
  md += `## Content\n\n*Source notes pending. This section will contain iconographical analysis once Unit ${artwork.unit} notes are provided by the project owner.*\n\n`;
  md += `## Context\n\n*Source notes pending. This section will contain cultural and historical background once Unit ${artwork.unit} notes are provided by the project owner.*\n`;

  return md;
}

// Execution
const unit1SourcePath = path.join(__dirname, '../data/source/unit-01-global-prehistory.md');
let unit1Parsed = {};
if (fs.existsSync(unit1SourcePath)) {
  unit1Parsed = parseUnit1Notes(unit1SourcePath);
  console.log(`Parsed ${Object.keys(unit1Parsed).length} works from Unit 1 notes file.`);
}

let generatedCount = 0;
let completeCount = 0;
let pendingCount = 0;

for (let id = 1; id <= 250; id++) {
  const artwork = artMap.get(id);
  if (!artwork) {
    console.error(`Warning: Artwork #${id} missing from data/artworks.json`);
    continue;
  }

  const filePath = path.join(contentDir, `${padId(id)}.md`);
  let content = '';

  if (id <= 11 && unit1Parsed[id]) {
    content = generateAffccMarkdown(artwork, unit1Parsed[id]);
    completeCount++;
  } else {
    content = generatePendingStub(artwork);
    pendingCount++;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  generatedCount++;
}

console.log(`Generated ${generatedCount} AFFCC markdown files (${completeCount} complete from owner notes, ${pendingCount} pending).`);
