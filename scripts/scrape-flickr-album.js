/**
 * Scrape Flickr AP Art History album using multiple /with/{photoId} anchor pages.
 * Flickr serves ~100 photos per context window; different anchors expose different slices.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const ALBUM_ID = '72157648851606647';

// Anchors chosen to cover Unit 2 in overlapping /with/ context windows
const ANCHORS = [
  '15773819026', // White Temple — album start
  '15179060794', // King Menkaura and queen (user-provided link)
  '12881170623', // Nike Adjusting Her Sandal / Acropolis cluster
  '16723646646', // Grave stele of Hegeso
  '5605181736',  // Nike of Samothrace
  '7952983798',  // Pergamon Altar
  '16129743933', // House of the Vettii
  '8215878366',  // Alexander Mosaic
  '7751597926',  // Doryphoros / Boxer cluster
  '51883439665', // Ludovisi Battle Sarcophagus
  '34752049742', // Law Code Stele of Hammurabi
  '49980992177', // Column of Trajan
];

function fetch(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; APAH-Interactive-Map/1.0)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects > 8) return reject(new Error('Too many redirects'));
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetch(next, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parsePhotos(html) {
  const photos = [];
  const re = new RegExp(
    `href="/photos/profzucker/(\\d+)/in/album-${ALBUM_ID}"\\s+title="([^"]+)"`,
    'g'
  );
  let m;
  while ((m = re.exec(html)) !== null) {
    photos.push({ id: m[1], title: m[2] });
  }
  return photos;
}

async function scrapeFullAlbum(savePath) {
  const seen = new Map();

  for (const anchor of ANCHORS) {
    const url = `https://www.flickr.com/photos/profzucker/albums/${ALBUM_ID}/with/${anchor}/`;
    const html = await fetch(url);
    const batch = parsePhotos(html);
    let added = 0;
    for (const p of batch) {
      if (!seen.has(p.id)) {
        seen.set(p.id, p.title);
        added++;
      }
    }
    console.log(`Anchor ${anchor}: +${added} new (${seen.size} total)`);
    await new Promise((r) => setTimeout(r, 200));
  }

  const photos = [...seen.entries()].map(([id, title]) => ({ id, title }));

  if (savePath) {
    fs.writeFileSync(savePath, JSON.stringify(photos, null, 2) + '\n', 'utf8');
  }

  return photos;
}

async function main() {
  const out = path.join(__dirname, '../data/flickr-album-scraped.json');
  const photos = await scrapeFullAlbum(out);
  console.log(`Saved ${photos.length} unique photos to ${out}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { scrapeFullAlbum, parsePhotos, ANCHORS };
