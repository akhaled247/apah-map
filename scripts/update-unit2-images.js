/**
 * Update data/images.json for Unit 2 (CED 12–47) from Flickr album.
 *
 * Pipeline:
 *   1. node scripts/scrape-flickr-album.js   — scrape album via /with/ anchors
 *   2. node scripts/map-unit2-flickr.js      — map photos → CED IDs
 *   3. node scripts/update-unit2-images.js   — resolve URLs and write images.json
 *
 * Or run this script alone (runs steps 1–3).
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { scrapeFullAlbum } = require('./scrape-flickr-album');

const FLICKR_ATTRIBUTION = 'Steven Zucker / Smarthistory (Flickr, CC BY-NC-SA 2.0)';
const ALBUM_URL = 'https://www.flickr.com/photos/profzucker/albums/72157648851606647/';

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getFlickrImageUrl(photoId) {
  const jsonText = await fetch(
    `https://www.flickr.com/services/oembed?url=https://www.flickr.com/photos/profzucker/${photoId}&format=json`
  );
  const data = JSON.parse(jsonText);
  return (data.url || '')
    .replace('_z.jpg', '_b.jpg')
    .replace('_c.jpg', '_b.jpg')
    .replace('_m.jpg', '_b.jpg');
}

function runMapScript() {
  require('child_process').execSync('node scripts/map-unit2-flickr.js', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
}

async function main() {
  const skipScrape = process.argv.includes('--skip-scrape');

  const scrapedPath = path.join(__dirname, '../data/flickr-album-scraped.json');

  if (!skipScrape) {
    console.log('Scraping Flickr album...');
    await scrapeFullAlbum(scrapedPath);
    console.log('Mapping photos to CED IDs...');
    runMapScript();
  }

  const idsPath = path.join(__dirname, '../data/flickr-unit2-ids.json');
  const flickrPhotos = JSON.parse(fs.readFileSync(idsPath, 'utf8'));

  const imagesPath = path.join(__dirname, '../data/images.json');
  const artworksPath = path.join(__dirname, '../data/artworks.json');
  const imagesManifest = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
  const artworks = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));
  const artworkMap = new Map(artworks.map((a) => [a.id, a]));

  for (let cedId = 12; cedId <= 47; cedId++) {
    const photoIds = flickrPhotos[cedId] || [];
    const artwork = artworkMap.get(cedId);
    const entry = imagesManifest.find((e) => e.id === cedId);
    if (!entry || !artwork) continue;

    const imageEntries = [];
    for (const photoId of photoIds) {
      await sleep(120);
      const src = await getFlickrImageUrl(photoId);
      if (!src) continue;
      imageEntries.push({
        src,
        alt: `${artwork.title} (${artwork.dateDisplay})`,
        source: `${FLICKR_ATTRIBUTION}: ${ALBUM_URL}`,
        local: false
      });
    }

    if (imageEntries.length === 0) {
      console.warn(`Warning: no images resolved for CED #${cedId}`);
      continue;
    }

    entry.images = imageEntries;
    console.log(`#${cedId}: ${imageEntries.length} Flickr image(s)`);
  }

  fs.writeFileSync(imagesPath, JSON.stringify(imagesManifest, null, 2) + '\n', 'utf8');
  console.log(`Updated ${imagesPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
