/**
 * Apply Commons FilePath URLs for Unit 3 works still on placeholders.
 */
const fs = require('fs');
const path = require('path');
const {
  COMMONS_FILE_BY_CED,
  commonsFilePathUrl,
  fetchWikipediaImage,
  WIKIPEDIA_BY_CED
} = require('./wikimedia-image');

const imagesPath = path.join(__dirname, '../data/images.json');
const artworksPath = path.join(__dirname, '../data/artworks.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const imagesManifest = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
  const artworks = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  for (let cedId = 48; cedId <= 98; cedId++) {
    const entry = imagesManifest.find((e) => e.id === cedId);
    const artwork = artworkMap.get(cedId);
    if (!entry || !artwork) continue;
    const isPlaceholder = entry.images.some((img) => img.local && img.src.includes('placeholder'));
    if (!isPlaceholder) continue;

    let src = null;
    let source = null;

    if (COMMONS_FILE_BY_CED[cedId]) {
      src = commonsFilePathUrl(COMMONS_FILE_BY_CED[cedId]);
      source = `Wikimedia Commons: ${COMMONS_FILE_BY_CED[cedId]}`;
    } else if (WIKIPEDIA_BY_CED[cedId]) {
      await sleep(2000);
      src = await fetchWikipediaImage(WIKIPEDIA_BY_CED[cedId]);
      source = `Wikimedia Commons (via Wikipedia)`;
    }

    if (!src) {
      console.warn(`Still missing #${cedId}`);
      continue;
    }

    entry.images = [{
      src,
      alt: `${artwork.title} (${artwork.dateDisplay})`,
      source,
      local: false
    }];
    console.log(`Patched #${cedId}`);
  }

  fs.writeFileSync(imagesPath, JSON.stringify(imagesManifest, null, 2) + '\n', 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
