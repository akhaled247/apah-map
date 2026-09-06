const https = require('https');

function fetch(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

async function scrapeAlbumPage(pageNum) {
  const url = pageNum === 1
    ? 'https://www.flickr.com/photos/profzucker/albums/72157648851606647/'
    : `https://www.flickr.com/photos/profzucker/albums/72157648851606647/page${pageNum}/`;
  const html = await fetch(url);
  const photos = [];
  const re = /href="\/photos\/profzucker\/(\d+)\/in\/album-72157648851606647"\s+title="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) photos.push({ id: m[1], title: m[2] });
  return photos;
}

async function main() {
  const h = await fetch('https://flic.kr/p/p8jDWJ');
  const title = h.match(/property="og:title" content="([^"]+)"/);
  const id = h.match(/photos\/profzucker\/(\d+)/);
  console.log('Menkaura photo:', { title: title?.[1], id: id?.[1] });

  const all = [];
  for (let p = 1; p <= 70; p++) {
    const photos = await scrapeAlbumPage(p);
    if (!photos.length) {
      console.log('empty page', p);
      break;
    }
    all.push(...photos);
    if (p % 10 === 0) console.log('page', p, 'total', all.length);
    await new Promise((r) => setTimeout(r, 150));
  }

  const fs = require('fs');
  fs.writeFileSync('flickr-all-photos.json', JSON.stringify(all, null, 2));
  console.log('Total photos:', all.length);

  const terms = ['menkaura','menkaure','pyramid','sphinx','amun','hatshepsut','akhenaten','tutankhamun','hunefer','lamassu','agora','kouros','peplos','spouses','apadana','minerva','veii','triclinium','niobid','doryphoros','boxer','patrician','augustus','colosseum','pantheon'];
  for (const t of terms) {
    const hits = all.filter((p) => p.title.toLowerCase().includes(t));
    if (hits.length) console.log(t + ':', hits.slice(0, 3).map((h) => h.title + ' [' + h.id + ']').join(' | '));
  }
}

main().catch(console.error);
