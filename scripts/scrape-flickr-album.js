/**
 * Scrape Flickr AP Art History album using multiple /with/{photoId} anchor pages.
 * Flickr serves ~100 photos per context window; different anchors expose different slices.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const ALBUM_ID = '72157648851606647';

// Anchors for overlapping /with/ context windows (Units 2–3 and full album)
const ANCHORS = [
  '15773819026', // White Temple — album start
  '15179060794', // King Menkaura and queen
  '12881170623', // Acropolis cluster
  '16723646646', // Grave stele of Hegeso
  '5605181736',  // Nike of Samothrace
  '7952983798',  // Pergamon Altar
  '16129743933', // House of the Vettii
  '8215878366',  // Alexander Mosaic
  '7751597926',  // Doryphoros / Boxer cluster
  '51883439665', // Ludovisi Battle Sarcophagus
  '34752049742', // Law Code Stele of Hammurabi
  '49980992177', // Column of Trajan
  '6722768291',  // Catacomb of Priscilla cluster
  '14056280179', // Hagia Sophia
  '15744133576', // Chartres Cathedral
  '15232956204', // Bayeux Tapestry
  '16010661862', // Arena (Scrovegni) Chapel
  '8433859102',  // Arnolfini Portrait
  '8433858752',  // Sistine Chapel
  '8433858422',  // Las Meninas
  '8433858072',  // Palace of Versailles
  '8433857712',  // Hogarth Marriage à la Mode
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

async function scrapeAlbumPages(seen) {
  let stalePages = 0;
  for (let pageNum = 1; pageNum <= 80; pageNum++) {
    const url = pageNum === 1
      ? `https://www.flickr.com/photos/profzucker/albums/${ALBUM_ID}/`
      : `https://www.flickr.com/photos/profzucker/albums/${ALBUM_ID}/page${pageNum}/`;
    const html = await fetch(url);
    const batch = parsePhotos(html);
    if (!batch.length) {
      console.log(`Pagination ended at page ${pageNum}`);
      break;
    }
    let added = 0;
    for (const p of batch) {
      if (!seen.has(p.id)) {
        seen.set(p.id, p.title);
        added++;
      }
    }
    console.log(`Page ${pageNum}: +${added} new (${seen.size} total)`);
    if (added === 0) {
      stalePages++;
      if (stalePages >= 3 && pageNum > 16) break;
    } else {
      stalePages = 0;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function scrapeFullAlbum(savePath) {
  const seen = new Map();

  console.log('Scraping album pages...');
  await scrapeAlbumPages(seen);

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

module.exports = { scrapeFullAlbum, parsePhotos, scrapeAlbumPages, ANCHORS, ALBUM_ID };
