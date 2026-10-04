/**
 * Mark Unit 3 CED artworks (48–98) as complete in data/artworks.json
 */
const fs = require('fs');
const path = require('path');

const artworksPath = path.join(__dirname, '../data/artworks.json');
const artworks = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));

for (const artwork of artworks) {
  if (artwork.id >= 48 && artwork.id <= 98) {
    artwork.dataConfidence = 'owner_notes';
    artwork.affccStatus = 'complete';
  }
}

fs.writeFileSync(artworksPath, JSON.stringify(artworks, null, 2) + '\n', 'utf8');
console.log('Updated affccStatus for works 48–98.');
