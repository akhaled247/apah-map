/**
 * Mark Unit 2 artworks (12–47) as complete in data/artworks.json
 */
const fs = require('fs');
const path = require('path');

const artworksPath = path.join(__dirname, '../data/artworks.json');
const artworks = JSON.parse(fs.readFileSync(artworksPath, 'utf8'));

for (const artwork of artworks) {
  if (artwork.id >= 12 && artwork.id <= 47) {
    artwork.dataConfidence = 'owner_notes';
    artwork.affccStatus = 'complete';
  }
}

fs.writeFileSync(artworksPath, JSON.stringify(artworks, null, 2) + '\n', 'utf8');
console.log('Updated affccStatus for works 12–47.');
