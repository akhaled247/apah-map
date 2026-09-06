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

async function scrapePage(pageNum) {
  const url = pageNum === 1
    ? 'https://www.flickr.com/photos/profzucker/albums/72157648851606647/'
    : `https://www.flickr.com/photos/profzucker/albums/72157648851606647/page${pageNum}/`;
  const html = await fetch(url);
  const patterns = [
    /href="\/photos\/profzucker\/(\d+)\/in\/album-72157648851606647"\s+title="([^"]+)"/g,
    /data-photo-id="(\d+)"[^>]*title="([^"]+)"/g,
    /title="([^"]+)"[^>]*href="\/photos\/profzucker\/(\d+)\/in\/album-72157648851606647"/g,
    /\/photos\/profzucker\/(\d+)\/[^"]*"[^>]*title="([^"]+)"/g
  ];
  const counts = patterns.map((re) => [...html.matchAll(re)].length);
  const menk = html.toLowerCase().includes('menkaura') || html.toLowerCase().includes('menkaure');
  return { pageNum, counts, menk, len: html.length };
}

async function main() {
  for (let p of [1,2,3,4,5,10,15,20,25,30,35,40,45,50,55,60,65,70,71,72]) {
    const r = await scrapePage(p);
    console.log(r);
    await new Promise((x) => setTimeout(x, 100));
  }
}

main();
