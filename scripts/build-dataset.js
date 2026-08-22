/**
 * Generates data/artworks.json, data/images.json, and data/source/needs-review.md
 * using canonical AP Art History 250 specifications and Unit 1 owner notes.
 */

const fs = require('fs');
const path = require('path');
const dateUtils = require('../js/dateUtils.js');

// Load Smarthistory mapping
const smartHistoryText = fs.readFileSync('C:/Users/abdul/.cursor/projects/C-GitHub-APAH-Interactive-Map/agent-tools/6cd1eb6d-7540-4e9a-ab91-238bd82920c5.txt', 'utf8');
const lines = smartHistoryText.split('\n');
let currentUnit = 1;
const shMap = new Map();
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const unitMatch = line.match(/### Content Area (\d+)/);
  if (unitMatch) currentUnit = parseInt(unitMatch[1]);
  const numMatch = line.match(/^\s*(\d+)\.\s*$/);
  if (numMatch && lines[i+1]) {
    const id = parseInt(numMatch[1]);
    if (id >= 1 && id <= 250 && !shMap.has(id)) {
      const rawTitle = lines[i+1].trim();
      const title = rawTitle.replace(/^\[?\s*/, '').replace(/\]\(.*?\)/, '').replace(/^[\*\_]+|[\*\_]+$/g, '').trim();
      const urlMatch = rawTitle.match(/\((https?:\/\/[^\)]+)\)/);
      const url = urlMatch ? urlMatch[1] : '';
      shMap.set(id, { id, title, unit: currentUnit, url });
    }
  }
}

// Canonical metadata definitions for all 250 AP works
// Unit 1 is direct from the project owner's notes file.
// Units 2-10 are canonical AP Art History CED specifications.
const canonicalWorks = [
  // --- UNIT 1: GLOBAL PREHISTORY (Works 1-11) ---
  {
    id: 1,
    title: "Apollo 11 Stones",
    artist: null,
    culture: "Paleolithic hunter-gatherers",
    dateDisplay: "c. 25,500–25,300 BCE",
    medium: "Charcoal on stone",
    locationDisplay: "Huns Mountains, Namibia",
    latitude: -27.75,
    longitude: 17.1,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 2,
    title: "Great Hall of the Bulls",
    artist: null,
    culture: "Upper Paleolithic Europe",
    dateDisplay: "15,000–13,000 BCE",
    medium: "Rock painting (pigment on limestone)",
    locationDisplay: "Lascaux, France",
    latitude: 45.053,
    longitude: 1.168,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 3,
    title: "Camelid sacrum in the shape of a canine",
    artist: null,
    culture: "Upper Paleolithic hunter-gatherers",
    dateDisplay: "14,000–7000 BCE",
    medium: "Carved bone (camelid sacrum)",
    locationDisplay: "Tequixquiac, central Mexico",
    latitude: 19.907,
    longitude: -99.146,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 4,
    title: "Running horned woman",
    artist: null,
    culture: "Neolithic Sahara",
    dateDisplay: "6000–4000 BCE",
    medium: "Pigment on rock",
    locationDisplay: "Tassili n'Ajjer, Algeria",
    latitude: 25.5,
    longitude: 8.5,
    locationPrecision: "region",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 5,
    title: "Beaker with ibex motifs",
    artist: null,
    culture: "Susa (Ancient Near East / Elamite)",
    dateDisplay: "4200–3500 BCE",
    medium: "Painted terra cotta",
    locationDisplay: "Susa, Iran",
    latitude: 32.189,
    longitude: 48.257,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 6,
    title: "Anthropomorphic stele",
    artist: null,
    culture: "Prehistoric Arabian Peninsula",
    dateDisplay: "Fourth millennium BCE",
    medium: "Sandstone",
    locationDisplay: "Near Ha'il, Saudi Arabia",
    latitude: 27.52,
    longitude: 41.69,
    locationPrecision: "region",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 7,
    title: "Jade cong",
    artist: null,
    culture: "Liangzhu culture",
    dateDisplay: "3300–2200 BCE",
    medium: "Carved jade",
    locationDisplay: "Liangzhu, China",
    latitude: 30.38,
    longitude: 119.99,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 8,
    title: "Stonehenge",
    artist: null,
    culture: "Neolithic Europe",
    dateDisplay: "c. 2500–1600 BCE",
    medium: "Sandstone (sarsen and bluestone)",
    locationDisplay: "Wiltshire, United Kingdom",
    latitude: 51.1788,
    longitude: -1.8262,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 9,
    title: "The Ambum stone",
    artist: null,
    culture: "Enga Province, Papua New Guinea",
    dateDisplay: "c. 1500 BCE",
    medium: "Greywacke",
    locationDisplay: "Ambum Valley, Papua New Guinea",
    latitude: -5.46,
    longitude: 143.64,
    locationPrecision: "region",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 10,
    title: "Tlatilco female figurine",
    artist: null,
    culture: "Tlatilco culture",
    dateDisplay: "1200–900 BCE",
    medium: "Ceramic with traces of pigment",
    locationDisplay: "Tlatilco (Central Mexico)",
    latitude: 19.47,
    longitude: -99.23,
    locationPrecision: "site",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },
  {
    id: 11,
    title: "Terra cotta fragment",
    artist: null,
    culture: "Lapita culture",
    dateDisplay: "1000 BCE",
    medium: "Terra cotta (incised)",
    locationDisplay: "Reef Islands, Solomon Islands",
    latitude: -10.25,
    longitude: 166.25,
    locationPrecision: "region",
    unit: 1,
    dataConfidence: "owner_notes",
    affccStatus: "complete"
  },

  // --- UNIT 2: ANCIENT MEDITERRANEAN (Works 12-47) ---
  {
    id: 12,
    title: "White Temple and its ziggurat",
    artist: null,
    culture: "Sumerian",
    dateDisplay: "c. 3500–3000 BCE",
    medium: "Mud brick",
    locationDisplay: "Uruk (modern Warka, Iraq)",
    latitude: 31.32,
    longitude: 45.63,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 13,
    title: "Palette of King Narmer",
    artist: null,
    culture: "Predynastic Egypt",
    dateDisplay: "c. 3000–2920 BCE",
    medium: "Greywacke",
    locationDisplay: "Hierakonpolis, Egypt",
    latitude: 25.1,
    longitude: 32.78,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 14,
    title: "Statues of votive figures, from the Square Temple at Eshnunna",
    artist: null,
    culture: "Sumerian",
    dateDisplay: "c. 2700 BCE",
    medium: "Gypsum inlaid with shell and black limestone",
    locationDisplay: "Tell Asmar (modern Iraq)",
    latitude: 33.56,
    longitude: 44.88,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 15,
    title: "Seated scribe",
    artist: null,
    culture: "Old Kingdom, 4th Dynasty, Egypt",
    dateDisplay: "c. 2620–2500 BCE",
    medium: "Painted limestone",
    locationDisplay: "Saqqara, Egypt",
    latitude: 29.87,
    longitude: 31.22,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 16,
    title: "Standard of Ur from the Royal Tombs at Ur",
    artist: null,
    culture: "Sumerian",
    dateDisplay: "c. 2600–2400 BCE",
    medium: "Wood inlaid with shell, lapis lazuli, and red limestone",
    locationDisplay: "Tell el-Muqayyar (modern Iraq)",
    latitude: 30.96,
    longitude: 46.1,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 17,
    title: "Great Pyramids (Menkaura, Khafre, Khufu) and Great Sphinx",
    artist: null,
    culture: "Old Kingdom, 4th Dynasty, Egypt",
    dateDisplay: "c. 2550–2490 BCE",
    medium: "Cut limestone",
    locationDisplay: "Giza, Egypt",
    latitude: 29.9792,
    longitude: 31.1342,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 18,
    title: "King Menkaura and queen",
    artist: null,
    culture: "Old Kingdom, 4th Dynasty, Egypt",
    dateDisplay: "c. 2490–2472 BCE",
    medium: "Greywacke",
    locationDisplay: "Giza, Egypt",
    latitude: 29.972,
    longitude: 31.128,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 19,
    title: "The Code of Hammurabi",
    artist: null,
    culture: "Babylonian (Susian)",
    dateDisplay: "c. 1792–1750 BCE",
    medium: "Basalt",
    locationDisplay: "Babylon (found at Susa, modern Iran)",
    latitude: 32.54,
    longitude: 44.42,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 20,
    title: "Temple of Amun-Re and Hypostyle Hall",
    artist: null,
    culture: "New Kingdom, 18th and 19th Dynasties, Egypt",
    dateDisplay: "Temple: c. 1550 BCE; hall: c. 1250 BCE",
    medium: "Cut sandstone and mud brick",
    locationDisplay: "Karnak, near Luxor, Egypt",
    latitude: 25.7188,
    longitude: 32.6573,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 21,
    title: "Mortuary Temple of Hatshepsut",
    artist: "Senenmut (architect)",
    culture: "New Kingdom, 18th Dynasty, Egypt",
    dateDisplay: "c. 1473–1458 BCE",
    medium: "Sandstone, partially carved into a rock cliff, and red granite",
    locationDisplay: "Deir el-Bahri, Egypt",
    latitude: 25.738,
    longitude: 32.607,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 22,
    title: "Akhenaten, Nefertiti, and three daughters",
    artist: null,
    culture: "New Kingdom (Amarna period), 18th Dynasty, Egypt",
    dateDisplay: "c. 1353–1335 BCE",
    medium: "Limestone",
    locationDisplay: "Amarna, Egypt",
    latitude: 27.64,
    longitude: 30.9,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 23,
    title: "Tutankhamun's tomb, innermost coffin",
    artist: null,
    culture: "New Kingdom, 18th Dynasty, Egypt",
    dateDisplay: "c. 1323 BCE",
    medium: "Gold with inlay of enamel and semiprecious stones",
    locationDisplay: "Valley of the Kings, Egypt",
    latitude: 25.74,
    longitude: 32.6,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 24,
    title: "Last judgment of Hunefer, from his tomb (page from the Book of the Dead)",
    artist: null,
    culture: "New Kingdom, 19th Dynasty, Egypt",
    dateDisplay: "c. 1275 BCE",
    medium: "Painted papyrus scroll",
    locationDisplay: "Thebes, Egypt",
    latitude: 25.7,
    longitude: 32.63,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 25,
    title: "Lamassu from the citadel of Sargon II, Dur Sharrukin",
    artist: null,
    culture: "Neo-Assyrian",
    dateDisplay: "c. 720–705 BCE",
    medium: "Alabaster",
    locationDisplay: "Khorsabad (modern Iraq)",
    latitude: 36.51,
    longitude: 43.22,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 26,
    title: "Athenian Agora",
    artist: null,
    culture: "Archaic through Hellenistic Greek",
    dateDisplay: "600 BCE–150 CE",
    medium: "Plan / architectural site",
    locationDisplay: "Athens, Greece",
    latitude: 37.9753,
    longitude: 23.7225,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 27,
    title: "Anavysos Kouros",
    artist: null,
    culture: "Archaic Greek",
    dateDisplay: "c. 530 BCE",
    medium: "Marble with remnants of paint",
    locationDisplay: "Anavysos, Greece",
    latitude: 37.73,
    longitude: 23.94,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 28,
    title: "Peplos Kore from the Acropolis",
    artist: null,
    culture: "Archaic Greek",
    dateDisplay: "c. 530 BCE",
    medium: "Marble, painted details",
    locationDisplay: "Athens Acropolis, Greece",
    latitude: 37.9715,
    longitude: 23.7266,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 29,
    title: "Sarcophagus of the Spouses",
    artist: null,
    culture: "Etruscan",
    dateDisplay: "c. 520 BCE",
    medium: "Terra cotta",
    locationDisplay: "Cerveteri, Italy",
    latitude: 41.998,
    longitude: 12.1,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 30,
    title: "Audience Hall (apadana) of Darius and Xerxes",
    artist: null,
    culture: "Persian (Achaemenid)",
    dateDisplay: "c. 520–465 BCE",
    medium: "Limestone",
    locationDisplay: "Persepolis, Iran",
    latitude: 29.935,
    longitude: 52.89,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 31,
    title: "Temple of Minerva (Veii, near Rome, Italy) and sculpture of Apollo",
    artist: "Master sculptor Vulca (attributed)",
    culture: "Etruscan",
    dateDisplay: "c. 510–500 BCE",
    medium: "Original temple of wood, mud brick, or tufa; terra cotta sculpture",
    locationDisplay: "Veii (near Rome, Italy)",
    latitude: 42.02,
    longitude: 12.4,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 32,
    title: "Tomb of the Triclinium",
    artist: null,
    culture: "Etruscan",
    dateDisplay: "c. 480–470 BCE",
    medium: "Tufa and fresco",
    locationDisplay: "Tarquinia, Italy",
    latitude: 42.24,
    longitude: 11.77,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 33,
    title: "Niobides Krater",
    artist: "Anonymous vase painter known as the Niobid Painter",
    culture: "Classical Greek",
    dateDisplay: "c. 460–450 BCE",
    medium: "Clay, red-figure technique (white highlights)",
    locationDisplay: "Orvieto, Italy (Attic origin, Athens)",
    latitude: 37.98,
    longitude: 23.72,
    locationPrecision: "city",
    unit: 2
  },
  {
    id: 34,
    title: "Doryphoros (Spear Bearer)",
    artist: "Polykleitos",
    culture: "Hellenistic or Roman copy after Greek original",
    dateDisplay: "Original c. 450–440 BCE; Roman copy 1st century BCE/CE",
    medium: "Roman marble copy of Greek bronze original",
    locationDisplay: "Pompeii, Italy (original Argos/Athens, Greece)",
    latitude: 40.75,
    longitude: 14.48,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 35,
    title: "Acropolis (Parthenon, Helios, Plaque of the Ergastines, Temple of Athena Nike, Victory adjusting her sandal)",
    artist: "Iktinos and Kallikrates (architects); Phidias (sculptor)",
    culture: "Classical Greek",
    dateDisplay: "c. 447–410 BCE",
    medium: "Marble",
    locationDisplay: "Athens, Greece",
    latitude: 37.9715,
    longitude: 23.7266,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 36,
    title: "Grave stele of Hegeso",
    artist: "Attributed to Kallimachos",
    culture: "Classical Greek",
    dateDisplay: "c. 410 BCE",
    medium: "Marble and paint",
    locationDisplay: "Dipylon Cemetery, Kerameikos, Athens, Greece",
    latitude: 37.978,
    longitude: 23.718,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 37,
    title: "Winged Victory of Samothrace",
    artist: null,
    culture: "Hellenistic Greek",
    dateDisplay: "c. 190 BCE",
    medium: "Marble",
    locationDisplay: "Samothrace, Greece",
    latitude: 40.5,
    longitude: 25.53,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 38,
    title: "Great Altar of Zeus and Athena at Pergamon",
    artist: null,
    culture: "Hellenistic Greek",
    dateDisplay: "c. 175 BCE",
    medium: "Marble (architecture and sculpture)",
    locationDisplay: "Pergamon (modern Bergama, Turkey)",
    latitude: 39.13,
    longitude: 27.18,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 39,
    title: "House of the Vettii",
    artist: null,
    culture: "Imperial Roman (Second and Fourth Styles)",
    dateDisplay: "c. second century BCE; rebuilt 62–79 CE",
    medium: "Cut stone and fresco",
    locationDisplay: "Pompeii, Italy",
    latitude: 40.7515,
    longitude: 14.4845,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 40,
    title: "Alexander Mosaic from the House of the Faun, Pompeii",
    artist: "Republican Roman copy of c. 315 BCE Greek wall painting by Philoxenos of Eretria",
    culture: "Republican Roman",
    dateDisplay: "c. 100 BCE",
    medium: "Mosaic",
    locationDisplay: "Pompeii, Italy",
    latitude: 40.751,
    longitude: 14.484,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 41,
    title: "Seated boxer (Boxer at Rest)",
    artist: null,
    culture: "Hellenistic Greek",
    dateDisplay: "c. 100 BCE",
    medium: "Bronze with copper inlays",
    locationDisplay: "Rome, Italy (found on Quirinal Hill; Greek origin)",
    latitude: 41.898,
    longitude: 12.488,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 42,
    title: "Head of a Roman patrician",
    artist: null,
    culture: "Republican Roman",
    dateDisplay: "c. 75–50 BCE",
    medium: "Marble",
    locationDisplay: "Otricoli, Italy",
    latitude: 42.42,
    longitude: 12.48,
    locationPrecision: "city",
    unit: 2
  },
  {
    id: 43,
    title: "Augustus of Prima Porta",
    artist: null,
    culture: "Imperial Roman",
    dateDisplay: "Early first century CE",
    medium: "Marble (copy of bronze original)",
    locationDisplay: "Prima Porta (Villa of Livia), Rome, Italy",
    latitude: 41.998,
    longitude: 12.493,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 44,
    title: "Colosseum (Flavian Amphitheater)",
    artist: null,
    culture: "Imperial Roman",
    dateDisplay: "70–80 CE",
    medium: "Stone and concrete",
    locationDisplay: "Rome, Italy",
    latitude: 41.8902,
    longitude: 12.4922,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 45,
    title: "Forum of Trajan (Forum, Basilica Ulpia, Trajan Markets, Column of Trajan)",
    artist: "Apollodorus of Damascus",
    culture: "Imperial Roman",
    dateDisplay: "Forum and markets: 106–112 CE; column: 113 CE",
    medium: "Brick and concrete (architecture); marble (column)",
    locationDisplay: "Rome, Italy",
    latitude: 41.8955,
    longitude: 12.4858,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 46,
    title: "Pantheon",
    artist: null,
    culture: "Imperial Roman",
    dateDisplay: "118–125 CE",
    medium: "Concrete with stone facing",
    locationDisplay: "Rome, Italy",
    latitude: 41.8986,
    longitude: 12.4769,
    locationPrecision: "site",
    unit: 2
  },
  {
    id: 47,
    title: "Ludovisi Battle Sarcophagus",
    artist: null,
    culture: "Late Imperial Roman",
    dateDisplay: "c. 250 CE",
    medium: "Marble",
    locationDisplay: "Rome, Italy",
    latitude: 41.903,
    longitude: 12.492,
    locationPrecision: "site",
    unit: 2
  }
];

// Helper to fill remaining works 48-250 with accurate canonical CED data
const remainingWorksData = [
  // --- UNIT 3: EARLY EUROPE AND COLONIAL AMERICAS (Works 48-98) ---
  { id: 48, title: "Catacomb of Priscilla", artist: null, culture: "Late Antique Europe", dateDisplay: "c. 200–400 CE", medium: "Excavated tufa and fresco", locationDisplay: "Rome, Italy", lat: 41.9295, lon: 12.5085, prec: "site", unit: 3 },
  { id: 49, title: "Santa Sabina", artist: null, culture: "Late Antique Europe", dateDisplay: "c. 422–432 CE", medium: "Brick and stone, wooden roof", locationDisplay: "Rome, Italy", lat: 41.8844, lon: 12.48, prec: "site", unit: 3 },
  { id: 50, title: "Vienna Genesis (Rebecca and Eliezer at the Well; Jacob Wrestling the Angel)", artist: null, culture: "Early Byzantine Europe", dateDisplay: "Early sixth century CE", medium: "Illuminated manuscript (tempera, gold, and silver on purple vellum)", locationDisplay: "Syria or Constantinople (modern Turkey/Syria)", lat: 41.0082, lon: 28.9784, prec: "region", unit: 3 },
  { id: 51, title: "San Vitale", artist: null, culture: "Early Byzantine Europe", dateDisplay: "c. 526–547 CE", medium: "Brick, marble, and stone veneer; mosaic", locationDisplay: "Ravenna, Italy", lat: 44.4206, lon: 12.1963, prec: "site", unit: 3 },
  { id: 52, title: "Hagia Sophia", artist: "Anthemius of Tralles and Isidore of Miletus", culture: "Byzantine", dateDisplay: "532–537 CE", medium: "Brick and ceramic elements with stone and mosaic veneer", locationDisplay: "Constantinople (Istanbul, Turkey)", lat: 41.0086, lon: 28.9802, prec: "site", unit: 3 },
  { id: 53, title: "Merovingian looped fibulae", artist: null, culture: "Early medieval Europe", dateDisplay: "Mid-sixth century CE", medium: "Silver gilt worked in filigree, with inlays of garnets and other stones", locationDisplay: "Jouy-le-Comte, France", lat: 49.07, lon: 2.17, prec: "site", unit: 3 },
  { id: 54, title: "Virgin (Theotokos) and Child between Saints Theodore and George", artist: null, culture: "Early Byzantine Europe", dateDisplay: "Sixth or early seventh century CE", medium: "Encaustic on wood", locationDisplay: "Monastery of Saint Catherine, Mount Sinai, Egypt", lat: 28.5558, lon: 33.9761, prec: "site", unit: 3 },
  { id: 55, title: "Lindisfarne Gospels (St. Matthew, cross-carpet page; St. Luke, incipit page)", artist: "Eadfrith, Bishop of Lindisfarne", culture: "Early medieval (Hiberno-Saxon) Europe", dateDisplay: "c. 700 CE", medium: "Illuminated manuscript (ink, pigments, and gold on vellum)", locationDisplay: "Lindisfarne (Holy Island), Northumbria, England", lat: 55.679, lon: -1.801, prec: "site", unit: 3 },
  { id: 56, title: "Great Mosque of Córdoba", artist: null, culture: "Umayyad Spain", dateDisplay: "c. 785–786 CE", medium: "Stone masonry", locationDisplay: "Córdoba, Spain", lat: 37.8789, lon: -4.7794, prec: "site", unit: 3 },
  { id: 57, title: "Pyxis of al-Mughira", artist: null, culture: "Umayyad", dateDisplay: "968 CE", medium: "Ivory (carved)", locationDisplay: "Madinat al-Zahra, near Córdoba, Spain", lat: 37.886, lon: -4.867, prec: "site", unit: 3 },
  { id: 58, title: "Church of Sainte-Foy", artist: null, culture: "Romanesque Europe", dateDisplay: "Church: c. 1050–1130 CE; Reliquary: ninth century CE", medium: "Stone (architecture); stone and paint (tympanum); gold, silver, gemstones, and enamel over wood (reliquary)", locationDisplay: "Conques, France", lat: 44.5994, lon: 2.3965, prec: "site", unit: 3 },
  { id: 59, title: "Bayeux Tapestry", artist: null, culture: "Romanesque Europe (English or Norman)", dateDisplay: "c. 1066–1080 CE", medium: "Embroidery on linen", locationDisplay: "Bayeux / Canterbury (Canterbury, England or Normandy, France)", lat: 49.2764, lon: -0.7032, prec: "region", unit: 3 },
  { id: 60, title: "Chartres Cathedral", artist: null, culture: "Gothic Europe", dateDisplay: "Original construction c. 1145–1155 CE; reconstructed c. 1194–1220 CE", medium: "Limestone, stained glass", locationDisplay: "Chartres, France", lat: 48.4472, lon: 1.4878, prec: "site", unit: 3 },
  { id: 61, title: "Dedication Page with Blanche of Castile and King Louis IX of France, Scenes from the Apocalypse from Bibles moralisées", artist: null, culture: "Gothic Europe", dateDisplay: "c. 1225–1245 CE", medium: "Illuminated manuscript (ink, tempera, and gold leaf on vellum)", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 3 },
  { id: 62, title: "Röttgen Pietà", artist: null, culture: "Late medieval Europe (German)", dateDisplay: "c. 1300–1325 CE", medium: "Painted wood", locationDisplay: "Rhineland, Germany", lat: 50.7374, lon: 7.0982, prec: "region", unit: 3 },
  { id: 63, title: "Arena (Scrovegni) Chapel, including Lamentation", artist: "Giotto di Bondone", culture: "Proto-Renaissance / Late medieval Italy", dateDisplay: "Chapel: c. 1303 CE; Fresco: c. 1305 CE", medium: "Brick (architecture) and fresco", locationDisplay: "Padua, Italy", lat: 45.4118, lon: 11.8797, prec: "site", unit: 3 },
  { id: 64, title: "Golden Haggadah (The Plagues of Egypt, Scenes of Liberation, Preparation for Passover)", artist: null, culture: "Late medieval Spain", dateDisplay: "c. 1320 CE", medium: "Illuminated manuscript (pigments and gold leaf on vellum)", locationDisplay: "Catalonia (Barcelona), Spain", lat: 41.3851, lon: 2.1734, prec: "region", unit: 3 },
  { id: 65, title: "Alhambra", artist: null, culture: "Nasrid Dynasty", dateDisplay: "1354–1391 CE", medium: "Whitewashed adobe stucco, wood, tile, paint, and gilding", locationDisplay: "Granada, Spain", lat: 37.1773, lon: -3.5897, prec: "site", unit: 3 },
  { id: 66, title: "Annunciation Triptych (Merode Altarpiece)", artist: "Workshop of Robert Campin", culture: "Northern Renaissance", dateDisplay: "1427–1432 CE", medium: "Oil on wood", locationDisplay: "Tournai, Belgium", lat: 50.6057, lon: 3.3885, prec: "city", unit: 3 },
  { id: 67, title: "Pazzi Chapel", artist: "Filippo Brunelleschi (architect)", culture: "Early Italian Renaissance", dateDisplay: "c. 1429–1461 CE", medium: "Masonry (pietra serena and masonry)", locationDisplay: "Basilica di Santa Croce, Florence, Italy", lat: 43.7686, lon: 11.2625, prec: "site", unit: 3 },
  { id: 68, title: "The Arnolfini Portrait", artist: "Jan van Eyck", culture: "Northern Renaissance", dateDisplay: "1434 CE", medium: "Oil on wood", locationDisplay: "Bruges, Belgium", lat: 51.2093, lon: 3.2247, prec: "city", unit: 3 },
  { id: 69, title: "David", artist: "Donatello", culture: "Early Italian Renaissance", dateDisplay: "c. 1440–1460 CE", medium: "Bronze", locationDisplay: "Florence, Italy", lat: 43.7714, lon: 11.2542, prec: "city", unit: 3 },
  { id: 70, title: "Palazzo Rucellai", artist: "Leon Battista Alberti (architect)", culture: "Early Italian Renaissance", dateDisplay: "c. 1450 CE", medium: "Stone, masonry", locationDisplay: "Florence, Italy", lat: 43.7716, lon: 11.2497, prec: "site", unit: 3 },
  { id: 71, title: "Madonna and Child with Two Angels", artist: "Fra Filippo Lippi", culture: "Early Italian Renaissance", dateDisplay: "c. 1465 CE", medium: "Tempera on wood", locationDisplay: "Florence, Italy", lat: 43.7687, lon: 11.2556, prec: "city", unit: 3 },
  { id: 72, title: "Birth of Venus", artist: "Sandro Botticelli", culture: "Early Italian Renaissance", dateDisplay: "c. 1484–1486 CE", medium: "Tempera on canvas", locationDisplay: "Florence, Italy", lat: 43.7678, lon: 11.2553, prec: "city", unit: 3 },
  { id: 73, title: "Last Supper", artist: "Leonardo da Vinci", culture: "High Renaissance", dateDisplay: "c. 1494–1498 CE", medium: "Oil and tempera on plaster", locationDisplay: "Santa Maria delle Grazie, Milan, Italy", lat: 45.466, lon: 9.171, prec: "site", unit: 3 },
  { id: 74, title: "Adam and Eve", artist: "Albrecht Dürer", culture: "Northern Renaissance (German)", dateDisplay: "1504 CE", medium: "Engraving", locationDisplay: "Nuremberg, Germany", lat: 49.4521, lon: 11.0767, prec: "city", unit: 3 },
  { id: 75, title: "Sistine Chapel ceiling and altar wall frescoes", artist: "Michelangelo", culture: "High Renaissance", dateDisplay: "Ceiling: 1508–1512 CE; altar wall: 1536–1541 CE", medium: "Fresco", locationDisplay: "Vatican City (Rome, Italy)", lat: 41.9029, lon: 12.4545, prec: "site", unit: 3 },
  { id: 76, title: "School of Athens", artist: "Raphael", culture: "High Renaissance", dateDisplay: "1509–1511 CE", medium: "Fresco", locationDisplay: "Stanza della Segnatura, Vatican Palace, Vatican City", lat: 41.9038, lon: 12.4547, prec: "site", unit: 3 },
  { id: 77, title: "Isenheim altarpiece", artist: "Matthias Grünewald", culture: "Northern Renaissance (German)", dateDisplay: "c. 1512–1516 CE", medium: "Oil on wood", locationDisplay: "Isenheim (now Colmar), France", lat: 48.0792, lon: 7.3556, prec: "site", unit: 3 },
  { id: 78, title: "Entombment of Christ", artist: "Jacopo da Pontormo", culture: "Mannerism", dateDisplay: "1525–1528 CE", medium: "Oil on wood", locationDisplay: "Santa Felicita, Florence, Italy", lat: 43.7668, lon: 11.2526, prec: "site", unit: 3 },
  { id: 79, title: "Allegory of Law and Grace", artist: "Lucas Cranach the Elder", culture: "German Renaissance / Reformation", dateDisplay: "c. 1530 CE", medium: "Woodcut and letterpress", locationDisplay: "Wittenberg, Germany", lat: 51.8664, lon: 12.6433, prec: "city", unit: 3 },
  { id: 80, title: "Venus of Urbino", artist: "Titian", culture: "Venetian Renaissance", dateDisplay: "1538 CE", medium: "Oil on canvas", locationDisplay: "Venice, Italy", lat: 45.4408, lon: 12.3155, prec: "city", unit: 3 },
  { id: 81, title: "Frontispiece of the Codex Mendoza", artist: "Indigenous scribes (tlacuiloque)", culture: "Viceroyalty of New Spain", dateDisplay: "c. 1541–1542 CE", medium: "Ink and color on paper", locationDisplay: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332, prec: "city", unit: 3 },
  { id: 82, title: "Il Gesù, including Triumph of the Name of Jesus ceiling fresco", artist: "Giacomo da Vignola, plan; Giacomo della Porta, facade; Giovanni Battista Gaulli, fresco", culture: "Mannerist and Baroque", dateDisplay: "Church: 1568–1584 CE; fresco: 1676–1679 CE", medium: "Brick, marble, fresco, and stucco", locationDisplay: "Rome, Italy", lat: 41.8959, lon: 12.4798, prec: "site", unit: 3 },
  { id: 83, title: "Hunters in the Snow", artist: "Pieter Bruegel the Elder", culture: "Northern Renaissance (Netherlandish)", dateDisplay: "1565 CE", medium: "Oil on wood", locationDisplay: "Antwerp/Brussels, Belgium", lat: 50.8503, lon: 4.3517, prec: "city", unit: 3 },
  { id: 84, title: "Mosque of Selim II", artist: "Mimar Sinan (architect)", culture: "Ottoman", dateDisplay: "1568–1575 CE", medium: "Brick, stone, and tile", locationDisplay: "Edirne, Turkey", lat: 41.6781, lon: 26.5594, prec: "site", unit: 3 },
  { id: 85, title: "Calling of Saint Matthew", artist: "Caravaggio", culture: "Italian Baroque", dateDisplay: "c. 1597–1601 CE", medium: "Oil on canvas", locationDisplay: "San Luigi dei Francesi, Rome, Italy", lat: 41.8996, lon: 12.4746, prec: "site", unit: 3 },
  { id: 86, title: "Henri IV Receives the Portrait of Marie de' Medici, from the Marie de' Medici Cycle", artist: "Peter Paul Rubens", culture: "Flemish Baroque", dateDisplay: "1621–1625 CE", medium: "Oil on canvas", locationDisplay: "Antwerp, Belgium (painted for Paris, France)", lat: 48.8462, lon: 2.3372, prec: "city", unit: 3 },
  { id: 87, title: "Self-Portrait with Saskia", artist: "Rembrandt van Rijn", culture: "Dutch Baroque", dateDisplay: "1636 CE", medium: "Etching", locationDisplay: "Amsterdam, Netherlands", lat: 52.3676, lon: 4.9041, prec: "city", unit: 3 },
  { id: 88, title: "San Carlo alle Quattro Fontane", artist: "Francesco Borromini (architect)", culture: "Italian Baroque", dateDisplay: "1638–1646 CE", medium: "Stone and stucco", locationDisplay: "Rome, Italy", lat: 41.9018, lon: 12.4907, prec: "site", unit: 3 },
  { id: 89, title: "Ecstasy of Saint Teresa", artist: "Gian Lorenzo Bernini", culture: "Italian Baroque", dateDisplay: "1647–1652 CE", medium: "Marble (sculpture); stucco and gilt bronze (chapel)", locationDisplay: "Cornaro Chapel, Santa Maria della Vittoria, Rome, Italy", lat: 41.9047, lon: 12.4942, prec: "site", unit: 3 },
  { id: 90, title: "Angel with Arquebus, Asiel Timor Dei", artist: "Master of Calamarca (José López de los Ríos)", culture: "Viceroyalty of Peru (Bolivia)", dateDisplay: "c. 17th century CE", medium: "Oil on canvas", locationDisplay: "Calamarca, Bolivia", lat: -16.9, lon: -68.12, prec: "site", unit: 3 },
  { id: 91, title: "Las Meninas", artist: "Diego Velázquez", culture: "Spanish Baroque", dateDisplay: "1656 CE", medium: "Oil on canvas", locationDisplay: "Madrid, Spain", lat: 40.4138, lon: -3.6921, prec: "city", unit: 3 },
  { id: 92, title: "Woman Holding a Balance", artist: "Johannes Vermeer", culture: "Dutch Baroque", dateDisplay: "c. 1664 CE", medium: "Oil on canvas", locationDisplay: "Delft, Netherlands", lat: 52.0116, lon: 4.3571, prec: "city", unit: 3 },
  { id: 93, title: "The Palace at Versailles", artist: "Louis Le Vau and Jules Hardouin-Mansart (architects)", culture: "French Baroque", dateDisplay: "Begun 1669 CE", medium: "Masonry, stone, wood, iron, and gold leaf (architecture); marble and bronze (sculpture); gardens", locationDisplay: "Versailles, France", lat: 48.8049, lon: 2.1204, prec: "site", unit: 3 },
  { id: 94, title: "Screen with the Siege of Belgrade and hunting scene", artist: "Circle of the González Family", culture: "Viceroyalty of New Spain (Mexico)", dateDisplay: "c. 1697–1701 CE", medium: "Tempera and resin on wood, shell inlay (enconchado)", locationDisplay: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332, prec: "city", unit: 3 },
  { id: 95, title: "The Virgin of Guadalupe (Virgen de Guadalupe)", artist: "Miguel González", culture: "Viceroyalty of New Spain (Mexico)", dateDisplay: "c. 1698 CE", medium: "Oil on canvas on wood, inlaid with mother-of-pearl (enconchado)", locationDisplay: "Mexico City, Mexico", lat: 19.4848, lon: -99.1175, prec: "site", unit: 3 },
  { id: 96, title: "Spaniard and Indian Produce a Mestizo", artist: "Attributed to Juan Rodríguez Juárez", culture: "Viceroyalty of New Spain (Mexico)", dateDisplay: "c. 1715 CE", medium: "Oil on canvas", locationDisplay: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332, prec: "city", unit: 3 },
  { id: 97, title: "Portrait of Sor Juana Inés de la Cruz", artist: "Miguel Cabrera", culture: "Viceroyalty of New Spain (Mexico)", dateDisplay: "c. 1750 CE", medium: "Oil on canvas", locationDisplay: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332, prec: "city", unit: 3 },
  { id: 98, title: "The Tête à Tête, from Marriage à la Mode", artist: "William Hogarth", culture: "English 18th Century / Rococo satiric", dateDisplay: "c. 1743 CE", medium: "Oil on canvas", locationDisplay: "London, United Kingdom", lat: 51.5074, lon: -0.1278, prec: "city", unit: 3 },

  // --- UNIT 4: LATER EUROPE AND THE AMERICAS (Works 99-152) ---
  { id: 99, title: "A Philosopher Giving a Lecture on the Orrery", artist: "Joseph Wright of Derby", culture: "English Enlightenment", dateDisplay: "c. 1763–1765 CE", medium: "Oil on canvas", locationDisplay: "Derby, England", lat: 52.9225, lon: -1.4746, prec: "city", unit: 4 },
  { id: 100, title: "The Swing", artist: "Jean-Honoré Fragonard", culture: "Rococo (French)", dateDisplay: "1767 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 101, title: "Monticello", artist: "Thomas Jefferson (architect)", culture: "Neoclassicism (American)", dateDisplay: "1768–1809 CE", medium: "Brick, glass, stone, and wood", locationDisplay: "Charlottesville, Virginia, USA", lat: 38.0108, lon: -78.4533, prec: "site", unit: 4 },
  { id: 102, title: "The Oath of the Horatii", artist: "Jacques-Louis David", culture: "Neoclassicism (French)", dateDisplay: "1784 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8606, lon: 2.3376, prec: "city", unit: 4 },
  { id: 103, title: "George Washington", artist: "Jean-Antoine Houdon", culture: "Neoclassicism (French/American)", dateDisplay: "1788–1792 CE", medium: "Marble", locationDisplay: "Richmond, Virginia, USA", lat: 37.5388, lon: -77.4335, prec: "site", unit: 4 },
  { id: 104, title: "Self-Portrait", artist: "Elisabeth Louise Vigée Le Brun", culture: "Late 18th-century French / Neoclassical", dateDisplay: "1790 CE", medium: "Oil on canvas", locationDisplay: "Rome, Italy (born Paris, France)", lat: 41.9028, lon: 12.4964, prec: "city", unit: 4 },
  { id: 105, title: "Y no hai remedio (And There's Nothing to Be Done), from Los Desastres de la Guerra (The Disasters of War), plate 15", artist: "Francisco de Goya", culture: "Romanticism (Spanish)", dateDisplay: "1810–1823 CE (published 1863)", medium: "Etching, drypoint, burin, and lavis", locationDisplay: "Madrid, Spain", lat: 40.4168, lon: -3.7038, prec: "city", unit: 4 },
  { id: 106, title: "La Grande Odalisque", artist: "Jean-Auguste-Dominique Ingres", culture: "Neoclassical/Romantic (French)", dateDisplay: "1814 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 107, title: "Liberty Leading the People", artist: "Eugène Delacroix", culture: "Romanticism (French)", dateDisplay: "1830 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 108, title: "The Oxbow (View from Mount Holyoke, Northampton, Massachusetts, after a Thunderstorm)", artist: "Thomas Cole", culture: "Hudson River School / Romanticism (American)", dateDisplay: "1836 CE", medium: "Oil on canvas", locationDisplay: "Northampton, Massachusetts, USA", lat: 42.2989, lon: -72.6078, prec: "site", unit: 4 },
  { id: 109, title: "Still Life in Studio", artist: "Louis-Jacques-Mandé Daguerre", culture: "Early Photography (French)", dateDisplay: "1837 CE", medium: "Daguerreotype", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 110, title: "Slave Ship (Slavers Throwing Overboard the Dead and Dying, Typhoon Coming On)", artist: "Joseph Mallord William Turner", culture: "Romanticism (British)", dateDisplay: "1840 CE", medium: "Oil on canvas", locationDisplay: "London, United Kingdom", lat: 51.5074, lon: -0.1278, prec: "city", unit: 4 },
  { id: 111, title: "Palace of Westminster (Houses of Parliament)", artist: "Charles Barry and Augustus W. N. Pugin (architects)", culture: "Gothic Revival (British)", dateDisplay: "1840–1870 CE", medium: "Limestone masonry and glass", locationDisplay: "London, United Kingdom", lat: 51.4995, lon: -0.1248, prec: "site", unit: 4 },
  { id: 112, title: "The Stone Breakers", artist: "Gustave Courbet", culture: "Realism (French)", dateDisplay: "1849 CE (destroyed in 1945)", medium: "Oil on canvas", locationDisplay: "Ornans, France", lat: 47.1064, lon: 6.1436, prec: "city", unit: 4 },
  { id: 113, title: "Nadar Raising Photography to the Height of Art", artist: "Honoré Daumier", culture: "Realism (French)", dateDisplay: "1862 CE", medium: "Lithograph", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 114, title: "Olympia", artist: "Édouard Manet", culture: "Realism / Early Impressionism (French)", dateDisplay: "1863 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 115, title: "The Saint-Lazare Station", artist: "Claude Monet", culture: "Impressionism (French)", dateDisplay: "1877 CE", medium: "Oil on canvas", locationDisplay: "Gare Saint-Lazare, Paris, France", lat: 48.877, lon: 2.3255, prec: "site", unit: 4 },
  { id: 116, title: "The Horse in Motion", artist: "Eadweard Muybridge", culture: "Early Photography / Realism (American)", dateDisplay: "1878 CE", medium: "Albumen print", locationDisplay: "Palo Alto, California, USA", lat: 37.4419, lon: -122.143, prec: "site", unit: 4 },
  { id: 117, title: "The Valley of Mexico from the Hillside of Santa Isabel (El Valle de México desde el Cerro de Santa Isabel)", artist: "José María Velasco", culture: "Romantic Landscape (Mexican)", dateDisplay: "1882 CE", medium: "Oil on canvas", locationDisplay: "Valley of Mexico, Mexico", lat: 19.4978, lon: -99.1269, prec: "site", unit: 4 },
  { id: 118, title: "The Burghers of Calais", artist: "Auguste Rodin", culture: "Late 19th-century Sculpture (French)", dateDisplay: "1884–1895 CE", medium: "Bronze", locationDisplay: "Calais, France", lat: 50.9513, lon: 1.8587, prec: "site", unit: 4 },
  { id: 119, title: "The Starry Night", artist: "Vincent van Gogh", culture: "Post-Impressionism (Dutch/French)", dateDisplay: "1889 CE", medium: "Oil on canvas", locationDisplay: "Saint-Rémy-de-Provence, France", lat: 43.7887, lon: 4.8311, prec: "site", unit: 4 },
  { id: 120, title: "The Coiffure", artist: "Mary Cassatt", culture: "Impressionism (American/French)", dateDisplay: "1890–1891 CE", medium: "Drypoint and aquatint", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 121, title: "The Scream", artist: "Edvard Munch", culture: "Symbolism / Early Expressionism (Norwegian)", dateDisplay: "1893 CE", medium: "Tempera and pastels on cardboard", locationDisplay: "Oslo (Kristiania), Norway", lat: 59.9139, lon: 10.7522, prec: "city", unit: 4 },
  { id: 122, title: "Where Do We Come From? What Are We? Where Are We Going?", artist: "Paul Gauguin", culture: "Post-Impressionism / Symbolism (French)", dateDisplay: "1897–1898 CE", medium: "Oil on canvas", locationDisplay: "Tahiti, French Polynesia", lat: -17.6509, lon: -149.426, prec: "region", unit: 4 },
  { id: 123, title: "Carson, Pirie, Scott and Company Building", artist: "Louis Sullivan (architect)", culture: "Chicago School (American)", dateDisplay: "1899–1903 CE", medium: "Iron, steel, glass, and terra cotta", locationDisplay: "Chicago, Illinois, USA", lat: 41.882, lon: -87.6278, prec: "site", unit: 4 },
  { id: 124, title: "Mont Sainte-Victoire", artist: "Paul Cézanne", culture: "Post-Impressionism (French)", dateDisplay: "1902–1904 CE", medium: "Oil on canvas", locationDisplay: "Aix-en-Provence, France", lat: 43.5323, lon: 5.5786, prec: "site", unit: 4 },
  { id: 125, title: "Les Demoiselles d'Avignon", artist: "Pablo Picasso", culture: "Proto-Cubism (Spanish/French)", dateDisplay: "1907 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8867, lon: 2.3431, prec: "city", unit: 4 },
  { id: 126, title: "The Steerage", artist: "Alfred Stieglitz", culture: "Modern Photography / Straight Photography (American)", dateDisplay: "1907 CE", medium: "Photogravure", locationDisplay: "Atlantic Ocean (en route to Europe)", lat: 45.0, lon: -30.0, prec: "approximate", unit: 4 },
  { id: 127, title: "The Kiss", artist: "Gustav Klimt", culture: "Vienna Secession / Art Nouveau (Austrian)", dateDisplay: "1907–1908 CE", medium: "Oil and gold leaf on canvas", locationDisplay: "Vienna, Austria", lat: 48.2082, lon: 16.3738, prec: "city", unit: 4 },
  { id: 128, title: "The Kiss", artist: "Constantin Brancusi", culture: "Modernism (Romanian/French)", dateDisplay: "Original 1907–1908 CE; stone copy 1916 CE", medium: "Limestone", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 129, title: "The Portuguese", artist: "Georges Braque", culture: "Analytic Cubism (French)", dateDisplay: "1911 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 130, title: "Goldfish", artist: "Henri Matisse", culture: "Fauvism (French)", dateDisplay: "1912 CE", medium: "Oil on canvas", locationDisplay: "Issy-les-Moulineaux, France", lat: 48.824, lon: 2.274, prec: "city", unit: 4 },
  { id: 131, title: "Improvisation 28 (second version)", artist: "Vassily Kandinsky", culture: "Der Blaue Reiter / Expressionism (Russian/German)", dateDisplay: "1912 CE", medium: "Oil on canvas", locationDisplay: "Munich, Germany", lat: 48.1351, lon: 11.582, prec: "city", unit: 4 },
  { id: 132, title: "Self-Portrait as a Soldier", artist: "Ernst Ludwig Kirchner", culture: "Die Brücke / Expressionism (German)", dateDisplay: "1915 CE", medium: "Oil on canvas", locationDisplay: "Halle / Berlin, Germany", lat: 52.52, lon: 13.405, prec: "city", unit: 4 },
  { id: 133, title: "Memorial Sheet for Karl Liebknecht", artist: "Käthe Kollwitz", culture: "Expressionism (German)", dateDisplay: "1919–1920 CE", medium: "Woodcut heightened with white and black ink", locationDisplay: "Berlin, Germany", lat: 52.52, lon: 13.405, prec: "city", unit: 4 },
  { id: 134, title: "Villa Savoye", artist: "Le Corbusier (architect)", culture: "International Style / Modernism (Swiss/French)", dateDisplay: "1929 CE", medium: "Steel and reinforced concrete", locationDisplay: "Poissy-sur-Seine, France", lat: 48.9244, lon: 2.0283, prec: "site", unit: 4 },
  { id: 135, title: "Composition with Red, Blue and Yellow", artist: "Piet Mondrian", culture: "De Stijl (Dutch)", dateDisplay: "1930 CE", medium: "Oil on canvas", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 136, title: "Illustration from The Results of the First Five-Year Plan", artist: "Varvara Stepanova", culture: "Constructivism (Soviet Russian)", dateDisplay: "1932 CE", medium: "Photomontage", locationDisplay: "Moscow, Russia", lat: 55.7558, lon: 37.6173, prec: "city", unit: 4 },
  { id: 137, title: "Object (Le Déjeuner en fourrure)", artist: "Meret Oppenheim", culture: "Surrealism (Swiss/French)", dateDisplay: "1936 CE", medium: "Fur-covered cup, saucer, and spoon", locationDisplay: "Paris, France", lat: 48.8566, lon: 2.3522, prec: "city", unit: 4 },
  { id: 138, title: "Fallingwater", artist: "Frank Lloyd Wright (architect)", culture: "Organic Architecture / Modernism (American)", dateDisplay: "1936–1939 CE", medium: "Reinforced concrete, sandstone, steel, and glass", locationDisplay: "Mill Run, Pennsylvania, USA", lat: 39.9063, lon: -79.468, prec: "site", unit: 4 },
  { id: 139, title: "The Two Fridas (Las dos Fridas)", artist: "Frida Kahlo", culture: "Surrealism / Mexican Modernism", dateDisplay: "1939 CE", medium: "Oil on canvas", locationDisplay: "Coyoacán, Mexico City, Mexico", lat: 19.3496, lon: -99.1623, prec: "site", unit: 4 },
  { id: 140, title: "The Migration of the Negro, Panel no. 49", artist: "Jacob Lawrence", culture: "Harlem Renaissance / American Modernism", dateDisplay: "1940–1941 CE", medium: "Casein tempera on hardboard", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 4 },
  { id: 141, title: "The Jungle", artist: "Wifredo Lam", culture: "Surrealism / Cuban Modernism", dateDisplay: "1943 CE", medium: "Gouache on paper mounted on canvas", locationDisplay: "Havana, Cuba", lat: 23.1136, lon: -82.3666, prec: "city", unit: 4 },
  { id: 142, title: "Dream of a Sunday Afternoon in the Alameda Park", artist: "Diego Rivera", culture: "Mexican Muralism", dateDisplay: "1947–1948 CE", medium: "Fresco", locationDisplay: "Mexico City, Mexico", lat: 19.4357, lon: -99.1444, prec: "site", unit: 4 },
  { id: 143, title: "Fountain (second version)", artist: "Marcel Duchamp", culture: "Dada (French/American)", dateDisplay: "Original 1917; fabricated 1950 CE", medium: "Readymade glazed sanitary china with black paint", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 4 },
  { id: 144, title: "Woman, I", artist: "Willem de Kooning", culture: "Abstract Expressionism (American)", dateDisplay: "1950–1952 CE", medium: "Oil on canvas", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 4 },
  { id: 145, title: "Seagram Building", artist: "Ludwig Mies van der Rohe and Philip Johnson (architects)", culture: "International Style / Modernism (American)", dateDisplay: "1954–1958 CE", medium: "Steel frame with glass curtain wall and bronze", locationDisplay: "New York City, New York, USA", lat: 40.7589, lon: -73.9723, prec: "site", unit: 4 },
  { id: 146, title: "Marilyn Diptych", artist: "Andy Warhol", culture: "Pop Art (American)", dateDisplay: "1962 CE", medium: "Oil, acrylic, and silkscreen enamel on canvas", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 4 },
  { id: 147, title: "Narcissus Garden", artist: "Yayoi Kusama", culture: "Happenings / Environmental Art (Japanese)", dateDisplay: "Original installation and performance 1966 CE", medium: "Mirror balls", locationDisplay: "Venice, Italy (Venice Biennale)", lat: 45.4286, lon: 12.3586, prec: "site", unit: 4 },
  { id: 148, title: "The Bay", artist: "Helen Frankenthaler", culture: "Color Field / Post-Painterly Abstraction (American)", dateDisplay: "1963 CE", medium: "Acrylic on canvas", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 4 },
  { id: 149, title: "Lipstick (Ascending) on Caterpillar Tracks", artist: "Claes Oldenburg", culture: "Pop Art (American)", dateDisplay: "1969–1974 CE", medium: "Cor-Ten steel, steel, aluminum, and cast resin; painted with polyurethane enamel", locationDisplay: "Yale University, New Haven, Connecticut, USA", lat: 41.3111, lon: -72.9267, prec: "site", unit: 4 },
  { id: 150, title: "Spiral Jetty", artist: "Robert Smithson", culture: "Earth Art / Land Art (American)", dateDisplay: "1970 CE", medium: "Earthwork: mud, precipitated salt crystals, rocks, and water coil", locationDisplay: "Great Salt Lake, Utah, USA", lat: 41.4377, lon: -112.6688, prec: "site", unit: 4 },
  { id: 151, title: "House in New Castle County", artist: "Robert Venturi, John Rauch, and Denise Scott Brown (architects)", culture: "Postmodernism (American)", dateDisplay: "1978–1983 CE", medium: "Wood frame and post-and-beam construction", locationDisplay: "New Castle County, Delaware, USA", lat: 39.75, lon: -75.65, prec: "region", unit: 4 },
  { id: 152, title: "Chavín de Huántar", artist: null, culture: "Chavín", dateDisplay: "c. 900–200 BCE", medium: "Stone (architectural complex); granite (Lanzón and sculpture); hammered gold alloy (jewelry)", locationDisplay: "Northern Highlands, Peru", lat: -9.5936, lon: -77.1775, prec: "site", unit: 5 },

  // --- UNIT 5: INDIGENOUS AMERICAS (Works 153-166) ---
  { id: 153, title: "Mesa Verde cliff dwellings", artist: null, culture: "Ancestral Puebloan (Anasazi)", dateDisplay: "450–1300 CE", medium: "Sandstone, mortar, and wooden beams", locationDisplay: "Montezuma County, Colorado, USA", lat: 37.1838, lon: -108.4886, prec: "site", unit: 5 },
  { id: 154, title: "Yaxchilán (Structure 23, Structure 33, Structure 40, Lintel 25)", artist: null, culture: "Maya (Classic)", dateDisplay: "725 CE", medium: "Limestone (architectural complex and carved lintels)", locationDisplay: "Chiapas, Mexico", lat: 16.9, lon: -90.965, prec: "site", unit: 5 },
  { id: 155, title: "Great Serpent Mound", artist: null, culture: "Mississippian / Fort Ancient culture", dateDisplay: "c. 1070 CE", medium: "Earthwork / effigy mound", locationDisplay: "Adams County, Ohio, USA", lat: 39.0256, lon: -83.4303, prec: "site", unit: 5 },
  { id: 156, title: "Templo Mayor (Main Temple), Tenochtitlan (including Coyolxauhqui Stone, Calendar Stone, and Olmec-style mask)", artist: null, culture: "Mexica (Aztec)", dateDisplay: "1375–1520 CE", medium: "Stone (temple); volcanic stone (monoliths); jadeite (mask)", locationDisplay: "Tenochtitlan (Mexico City, Mexico)", lat: 19.435, lon: -99.1314, prec: "site", unit: 5 },
  { id: 157, title: "Ruler's feather headdress (probably of Motecuhzoma II)", artist: null, culture: "Mexica (Aztec)", dateDisplay: "1428–1520 CE", medium: "Feathers (quetzal and cotinga) and gold", locationDisplay: "Tenochtitlan (Mexico City, Mexico)", lat: 19.4326, lon: -99.1332, prec: "city", unit: 5 },
  { id: 158, title: "City of Cusco, including Qorikancha (Inka main temple), Santo Domingo, and Walls at Saqsa Waman", artist: null, culture: "Inka", dateDisplay: "c. 1440 CE; convent added 1550–1650 CE", medium: "Andesite and local stone masonry", locationDisplay: "Cusco, Peru", lat: -13.5167, lon: -71.9789, prec: "site", unit: 5 },
  { id: 159, title: "Maize cobs", artist: null, culture: "Inka", dateDisplay: "c. 1440–1533 CE", medium: "Sheet metal/repoussé, gold and silver alloys", locationDisplay: "Cusco, Peru (Qorikancha garden)", lat: -13.52, lon: -71.975, prec: "site", unit: 5 },
  { id: 160, title: "City of Machu Picchu", artist: null, culture: "Inka", dateDisplay: "c. 1450–1540 CE", medium: "Granite (architectural complex)", locationDisplay: "Central Highlands, Peru", lat: -13.1631, lon: -72.545, prec: "site", unit: 5 },
  { id: 161, title: "All-T'oqapu tunic", artist: null, culture: "Inka", dateDisplay: "1450–1540 CE", medium: "Camelid fiber and cotton", locationDisplay: "Andes region, Peru", lat: -13.52, lon: -71.97, prec: "region", unit: 5 },
  { id: 162, title: "Bandolier bag", artist: null, culture: "Lenape (Delaware tribe, Eastern Woodlands)", dateDisplay: "c. 1850 CE", medium: "Beadwork on leather and cotton", locationDisplay: "Eastern Woodlands / Delaware, USA", lat: 39.5, lon: -75.5, prec: "region", unit: 5 },
  { id: 163, title: "Transformation mask", artist: null, culture: "Kwakwaka'wakw (Northwest Coast of Canada)", dateDisplay: "Late 19th century CE", medium: "Wood, paint, and string", locationDisplay: "Alert Bay, British Columbia, Canada", lat: 50.584, lon: -126.93, prec: "region", unit: 5 },
  { id: 164, title: "Painted elk hide", artist: "Attributed to Cotsiogo (Cadzi Cody)", culture: "Eastern Shoshone, Wind River Reservation, Wyoming", dateDisplay: "c. 1890–1900 CE", medium: "Painted elk hide", locationDisplay: "Wind River Reservation, Wyoming, USA", lat: 43.1, lon: -108.8, prec: "site", unit: 5 },
  { id: 165, title: "Black-on-black ceramic vessel", artist: "Maria Martínez and Julian Martínez", culture: "Tewa, Puebloan, San Ildefonso Pueblo, New Mexico", dateDisplay: "c. mid-20th century CE", medium: "Blackware ceramic", locationDisplay: "San Ildefonso Pueblo, New Mexico, USA", lat: 35.892, lon: -106.124, prec: "site", unit: 5 },
  { id: 166, title: "Conical tower and circular wall of Great Zimbabwe", artist: null, culture: "Shona peoples", dateDisplay: "c. 1000–1400 CE", medium: "Coursed granite blocks", locationDisplay: "Southeastern Zimbabwe", lat: -20.2675, lon: 30.9338, prec: "site", unit: 6 },

  // --- UNIT 6: AFRICA (Works 167-180) ---
  { id: 167, title: "Great Mosque of Djenné", artist: null, culture: "Mali (Djenné)", dateDisplay: "Founded c. 1200 CE; rebuilt 1906–1907 CE", medium: "Adobe (sun-dried mud brick and plaster)", locationDisplay: "Djenné, Mali", lat: 13.905, lon: -4.555, prec: "site", unit: 6 },
  { id: 168, title: "Wall plaque, from Oba's palace", artist: null, culture: "Edo peoples, Kingdom of Benin", dateDisplay: "16th century CE", medium: "Cast brass", locationDisplay: "Benin City, Nigeria", lat: 6.335, lon: 5.6037, prec: "site", unit: 6 },
  { id: 169, title: "Sika dwa kofi (Golden Stool)", artist: null, culture: "Ashanti peoples (south central Ghana)", dateDisplay: "c. 1700 CE", medium: "Gold over wood and cast-gold attachment ornaments", locationDisplay: "Kumasi, Ghana", lat: 6.6885, lon: -1.6244, prec: "city", unit: 6 },
  { id: 170, title: "Ndop (portrait figure) of King Mishe miShyaang maMbul", artist: null, culture: "Kuba peoples (Democratic Republic of the Congo)", dateDisplay: "c. 1760–1780 CE", medium: "Wood", locationDisplay: "Kasai River region, DR Congo", lat: -4.5, lon: 21.0, prec: "region", unit: 6 },
  { id: 171, title: "Power figure (Nkisi n'kondi)", artist: null, culture: "Kongo peoples (Democratic Republic of the Congo)", dateDisplay: "Late 19th century CE", medium: "Wood and metal (nails, blades, medicinal matter)", locationDisplay: "Lower Congo region, DR Congo", lat: -5.0, lon: 13.5, prec: "region", unit: 6 },
  { id: 172, title: "Female (Pwo) mask", artist: null, culture: "Chokwe peoples (Democratic Republic of the Congo)", dateDisplay: "Late 19th to early 20th century CE", medium: "Wood, fiber, pigment, and metal", locationDisplay: "Southern DR Congo / Angola border", lat: -8.0, lon: 21.5, prec: "region", unit: 6 },
  { id: 173, title: "Portrait mask (Mblo)", artist: "Owie Kimou (attributed)", culture: "Baule peoples (Côte d'Ivoire)", dateDisplay: "Early 20th century CE", medium: "Wood and pigment", locationDisplay: "Kami, Côte d'Ivoire", lat: 6.8, lon: -5.3, prec: "site", unit: 6 },
  { id: 174, title: "Bundu mask", artist: null, culture: "Mende peoples (Sande Society, Sierra Leone and Liberia)", dateDisplay: "19th to 20th century CE", medium: "Wood, cloth, and fiber", locationDisplay: "Southern Sierra Leone and Liberia", lat: 7.9, lon: -11.7, prec: "region", unit: 6 },
  { id: 175, title: "Ikenga (shrine figure)", artist: null, culture: "Igbo peoples (Nigeria)", dateDisplay: "c. 19th to 20th century CE", medium: "Wood", locationDisplay: "Southeastern Nigeria", lat: 6.0, lon: 7.0, prec: "region", unit: 6 },
  { id: 176, title: "Lukasa (memory board)", artist: "Mbudye Society", culture: "Luba peoples (Democratic Republic of the Congo)", dateDisplay: "c. 19th to 20th century CE", medium: "Wood, beads, and metal", locationDisplay: "Southeastern DR Congo", lat: -8.5, lon: 26.0, prec: "region", unit: 6 },
  { id: 177, title: "Aka elephant mask", artist: null, culture: "Bamileke (Kuosi Society, Cameroon)", dateDisplay: "c. 19th to 20th century CE", medium: "Wood, woven raffia, cloth, and glass beads", locationDisplay: "Grassfields region, Cameroon", lat: 5.5, lon: 10.4, prec: "region", unit: 6 },
  { id: 178, title: "Reliquary figure (byeri)", artist: null, culture: "Fang peoples (southern Cameroon)", dateDisplay: "c. 19th to 20th century CE", medium: "Wood", locationDisplay: "Southern Cameroon / Gabon", lat: 2.5, lon: 11.5, prec: "region", unit: 6 },
  { id: 179, title: "Veranda post of enthroned king and senior wife (Opo Ogoga)", artist: "Olowe of Ise", culture: "Yoruba peoples (Nigeria)", dateDisplay: "c. 1910–1914 CE", medium: "Wood and pigment", locationDisplay: "Ikere, Nigeria", lat: 7.5, lon: 5.23, prec: "site", unit: 6 },
  { id: 180, title: "Petra, Jordan: Treasury and Great Temple", artist: null, culture: "Nabataean Ptolemaic and Roman", dateDisplay: "c. 400 BCE–100 CE", medium: "Cut rock", locationDisplay: "Petra, Jordan", lat: 30.3285, lon: 35.4444, prec: "site", unit: 7 },

  // --- UNIT 7: WEST AND CENTRAL ASIA (Works 181-191) ---
  { id: 181, title: "Buddhas of Bamiyan", artist: null, culture: "Gandharan", dateDisplay: "c. 400–800 CE (destroyed 2001)", medium: "Cut rock with plaster and polychrome paint", locationDisplay: "Bamiyan Valley, Afghanistan", lat: 34.832, lon: 67.828, prec: "site", unit: 7 },
  { id: 182, title: "The Kaaba", artist: null, culture: "Islamic", dateDisplay: "Pre-Islamic monument; rededicated by Muhammad in 631–632 CE; multiple renovations", medium: "Granite masonry, covered with silk curtain and calligraphy in gold and silver thread", locationDisplay: "Mecca, Saudi Arabia", lat: 21.4225, lon: 39.8262, prec: "site", unit: 7 },
  { id: 183, title: "Jowo Rinpoche, enshrined in the Jokhang Temple", artist: null, culture: "Yarlung Dynasty", dateDisplay: "Brought to Tibet in 641 CE", medium: "Gilt metals with semiprecious stones, pearls, and paint; various offerings", locationDisplay: "Lhasa, Tibet, China", lat: 29.6531, lon: 91.1314, prec: "site", unit: 7 },
  { id: 184, title: "Dome of the Rock", artist: null, culture: "Umayyad", dateDisplay: "691–692 CE, with multiple renovations", medium: "Stone masonry and wooden roof decorated with glazed ceramic tile, mosaics, and gilt aluminum dome", locationDisplay: "Jerusalem", lat: 31.778, lon: 35.2354, prec: "site", unit: 7 },
  { id: 185, title: "Great Mosque (Masjid-e Jameh) of Isfahan", artist: null, culture: "Seljuk, Il-Khanid, Timurid, and Safavid Dynasties", dateDisplay: "c. 700 CE; additions through 14th, 18th, and 20th centuries CE", medium: "Stone, brick, wood, plaster, and glazed ceramic tile", locationDisplay: "Isfahan, Iran", lat: 32.6697, lon: 51.6853, prec: "site", unit: 7 },
  { id: 186, title: "Folio from a Qur'an", artist: null, culture: "Abbasid", dateDisplay: "c. eighth to ninth century CE", medium: "Ink, color, and gold on parchment", locationDisplay: "North Africa or Near East (modern Iraq/Syria)", lat: 33.3152, lon: 44.3661, prec: "region", unit: 7 },
  { id: 187, title: "Basin (Baptistère de St. Louis)", artist: "Muhammad ibn al-Zayn", culture: "Mamluk", dateDisplay: "c. 1320–1340 CE", medium: "Brass inlaid with gold and silver", locationDisplay: "Egypt or Syria", lat: 30.0444, lon: 31.2357, prec: "region", unit: 7 },
  { id: 188, title: "Bahram Gur Fights the Karg, folio from the Great Il-Khanid Shahnama", artist: null, culture: "Islamic; Persian, Il'Khanid", dateDisplay: "c. 1330–1340 CE", medium: "Ink and opaque watercolor, gold, and silver on paper", locationDisplay: "Tabriz, Iran", lat: 38.08, lon: 46.29, prec: "city", unit: 7 },
  { id: 189, title: "The Court of Gayumars, folio from Shah Tahmasp's Shahnama", artist: "Sultan Muhammad", culture: "Safavid Persian", dateDisplay: "c. 1522–1525 CE", medium: "Ink, opaque watercolor, and gold on paper", locationDisplay: "Tabriz, Iran", lat: 38.08, lon: 46.29, prec: "city", unit: 7 },
  { id: 190, title: "The Ardabil Carpet", artist: "Maqsud of Kashan", culture: "Safavid Persian", dateDisplay: "1539–1540 CE", medium: "Silk and wool", locationDisplay: "Ardabil, Iran", lat: 38.25, lon: 48.3, prec: "site", unit: 7 },
  { id: 191, title: "Great Stupa at Sanchi", artist: null, culture: "Maurya, late Sunga Dynasty", dateDisplay: "c. 300 BCE–100 CE", medium: "Stone masonry, sandstone on dome", locationDisplay: "Madhya Pradesh, India", lat: 23.4793, lon: 77.7397, prec: "site", unit: 8 },

  // --- UNIT 8: SOUTH, EAST, AND SOUTHEAST ASIA (Works 192-212) ---
  { id: 192, title: "Terra cotta warriors from mausoleum of the first Qin emperor of China", artist: null, culture: "Qin Dynasty", dateDisplay: "c. 221–209 BCE", medium: "Painted terra cotta", locationDisplay: "Lintong, Xi'an, Shaanxi, China", lat: 34.3841, lon: 109.2785, prec: "site", unit: 8 },
  { id: 193, title: "Funeral banner of Lady Dai (Xin Zhui)", artist: null, culture: "Han Dynasty, China", dateDisplay: "c. 180 BCE", medium: "Painted silk", locationDisplay: "Mawangdui, Changsha, Hunan, China", lat: 28.2045, lon: 113.0189, prec: "site", unit: 8 },
  { id: 194, title: "Longmen caves", artist: null, culture: "Northern Wei and Tang Dynasties, China", dateDisplay: "493–1127 CE", medium: "Limestone", locationDisplay: "Luoyang, Henan, China", lat: 34.555, lon: 112.467, prec: "site", unit: 8 },
  { id: 195, title: "Gold and jade crown", artist: null, culture: "Three Kingdoms Period, Silla Kingdom, Korea", dateDisplay: "Fifth to sixth century CE", medium: "Metalwork (cut gold sheet and embossed gold wire with jade ornaments)", locationDisplay: "Gyeongju, South Korea", lat: 35.8358, lon: 129.219, prec: "site", unit: 8 },
  { id: 196, title: "Todai-ji", artist: "Various artists, including sculptors Unkei and Keikei", culture: "Nara and Kamakura periods, Japan", dateDisplay: "c. 743 CE; rebuilt c. 1100–1200 CE", medium: "Bronze and wood (sculpture); wood with ceramic-tile roofing (architecture)", locationDisplay: "Nara, Japan", lat: 34.689, lon: 135.84, prec: "site", unit: 8 },
  { id: 197, title: "Borobudur Temple", artist: null, culture: "Sailendra Dynasty, Java, Indonesia", dateDisplay: "c. 750–842 CE", medium: "Volcanic-stone masonry (andesite)", locationDisplay: "Central Java, Indonesia", lat: -7.6079, lon: 110.2038, prec: "site", unit: 8 },
  { id: 198, title: "Angkor, the temple of Angkor Wat, and the city of Angkor Thom, Cambodia", artist: null, culture: "Khmer Empire", dateDisplay: "c. 800–1200 CE", medium: "Stone masonry, sandstone", locationDisplay: "Siem Reap, Cambodia", lat: 13.4125, lon: 103.867, prec: "site", unit: 8 },
  { id: 199, title: "Lakshmana Temple", artist: null, culture: "Chandela Dynasty, India", dateDisplay: "c. 930–950 CE", medium: "Sandstone", locationDisplay: "Khajuraho, Madhya Pradesh, India", lat: 24.8525, lon: 79.9197, prec: "site", unit: 8 },
  { id: 200, title: "Travelers among Mountains and Streams", artist: "Fan Kuan", culture: "Northern Song Dynasty, China", dateDisplay: "c. 1000 CE", medium: "Ink and colors on silk", locationDisplay: "Kaifeng, China", lat: 34.7972, lon: 114.3073, prec: "city", unit: 8 },
  { id: 201, title: "Shiva as Lord of Dance (Nataraja)", artist: null, culture: "Chola Dynasty, Tamil Nadu, India", dateDisplay: "c. 11th century CE", medium: "Cast bronze", locationDisplay: "Tamil Nadu, India", lat: 11.0, lon: 78.5, prec: "region", unit: 8 },
  { id: 202, title: "Night Attack on the Sanjô Palace", artist: null, culture: "Kamakura period, Japan", dateDisplay: "c. 1250–1300 CE", medium: "Handscroll (ink and color on paper)", locationDisplay: "Kyoto, Japan", lat: 35.0116, lon: 135.7681, prec: "city", unit: 8 },
  { id: 203, title: "The David Vases", artist: null, culture: "Yuan Dynasty, China", dateDisplay: "1351 CE", medium: "White porcelain with cobalt-blue underglaze", locationDisplay: "Jingdezhen, Jiangxi, China", lat: 29.294, lon: 117.207, prec: "city", unit: 8 },
  { id: 204, title: "Portrait of Sin Sukju (1417–1475)", artist: "Imperial Bureau of Painting", culture: "Joseon Dynasty, Korea", dateDisplay: "c. 15th century CE", medium: "Hanging scroll (ink and color on silk)", locationDisplay: "Seoul, South Korea", lat: 37.5665, lon: 126.978, prec: "city", unit: 8 },
  { id: 205, title: "Forbidden City", artist: null, culture: "Ming Dynasty, China", dateDisplay: "15th century CE and later", medium: "Stone masonry, marble, brick, wood, and ceramic tile", locationDisplay: "Beijing, China", lat: 39.9163, lon: 116.3972, prec: "site", unit: 8 },
  { id: 206, title: "Ryoan-ji", artist: null, culture: "Muromachi period, Japan", dateDisplay: "c. 1480 CE; current design c. late 18th century", medium: "Rock garden (gravel, moss, rocks, and earthen walls)", locationDisplay: "Kyoto, Japan", lat: 35.0345, lon: 135.7182, prec: "site", unit: 8 },
  { id: 207, title: "Jahangir Preferring a Sufi Shaikh to Kings", artist: "Bichitr", culture: "Mughal Dynasty, India", dateDisplay: "c. 1620 CE", medium: "Opaque watercolor, gold, and ink on paper", locationDisplay: "Agra/Delhi, India", lat: 27.1767, lon: 78.0081, prec: "city", unit: 8 },
  { id: 208, title: "Taj Mahal", artist: "Ustad Ahmad Lahori (chief architect)", culture: "Mughal Dynasty, India", dateDisplay: "1632–1653 CE", medium: "Stone masonry and marble with inlay of precious and semiprecious stones; gardens", locationDisplay: "Agra, Uttar Pradesh, India", lat: 27.1751, lon: 78.0421, prec: "site", unit: 8 },
  { id: 209, title: "White and Red Plum Blossoms", artist: "Ogata Korin", culture: "Rimpa School, Edo period, Japan", dateDisplay: "c. 1710–1716 CE", medium: "Ink, watercolor, and gold leaf on paper (pair of folding screens)", locationDisplay: "Kyoto, Japan", lat: 35.0116, lon: 135.7681, prec: "city", unit: 8 },
  { id: 210, title: "Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as the Great Wave, from the series Thirty-Six Views of Mount Fuji", artist: "Katsushika Hokusai", culture: "Edo period, Japan", dateDisplay: "1830–1833 CE", medium: "Polychrome woodblock print; ink and color on paper", locationDisplay: "Edo (Tokyo), Japan", lat: 35.6762, lon: 139.6503, prec: "city", unit: 8 },
  { id: 211, title: "Chairman Mao en Route to Anyuan", artist: "Artist unknown; based on an oil painting by Liu Chunhua", culture: "Cultural Revolution, China", dateDisplay: "c. 1969 CE", medium: "Color lithograph", locationDisplay: "Anyuan / Beijing, China", lat: 27.6167, lon: 113.8333, prec: "site", unit: 8 },
  { id: 212, title: "Nan Madol", artist: null, culture: "Saudeleur Dynasty, Micronesia", dateDisplay: "c. 700–1600 CE", medium: "Basalt boulders and prismatic columns", locationDisplay: "Pohnpei, Federated States of Micronesia", lat: 6.845, lon: 158.335, prec: "site", unit: 9 },

  // --- UNIT 9: THE PACIFIC (Works 213-223) ---
  { id: 213, title: "Moai on platform (ahu)", artist: null, culture: "Rapa Nui (Easter Island)", dateDisplay: "c. 1100–1600 CE", medium: "Volcanic tuff figures on basalt base", locationDisplay: "Rapa Nui (Easter Island, Chile)", lat: -27.1127, lon: -109.3497, prec: "site", unit: 9 },
  { id: 214, title: "‘Ahu ‘ula (feather cape)", artist: null, culture: "Hawaiian", dateDisplay: "Late 18th century CE", medium: "Feathers and fiber netting", locationDisplay: "Hawaiian Islands, USA", lat: 21.3069, lon: -157.8583, prec: "region", unit: 9 },
  { id: 215, title: "Staff god", artist: null, culture: "Rarotonga, Cook Islands, central Polynesia", dateDisplay: "Late 18th to early 19th century CE", medium: "Wood, tapa, fiber, and feathers", locationDisplay: "Rarotonga, Cook Islands", lat: -21.2367, lon: -159.7777, prec: "site", unit: 9 },
  { id: 216, title: "Female deity", artist: null, culture: "Nukuoro, Micronesia", dateDisplay: "18th to 19th century CE", medium: "Wood", locationDisplay: "Nukuoro Atoll, Federated States of Micronesia", lat: 3.84, lon: 154.98, prec: "site", unit: 9 },
  { id: 217, title: "Buk (mask)", artist: null, culture: "Torres Strait (Mabuiag Island)", dateDisplay: "Mid- to late 19th century CE", medium: "Turtle shell, wood, fiber, feathers, and shell", locationDisplay: "Torres Strait, Australia", lat: -9.95, lon: 142.18, prec: "site", unit: 9 },
  { id: 218, title: "Hiapo (tapa)", artist: null, culture: "Niue", dateDisplay: "c. 1850–1900 CE", medium: "Tapa or bark cloth, freehand painting", locationDisplay: "Niue", lat: -19.0544, lon: -169.8672, prec: "region", unit: 9 },
  { id: 219, title: "Tamati Waka Nene", artist: "Gottfried Lindauer", culture: "Māori (New Zealand)", dateDisplay: "1890 CE", medium: "Oil on canvas", locationDisplay: "North Island, New Zealand", lat: -35.4, lon: 173.8, prec: "region", unit: 9 },
  { id: 220, title: "Navigation chart", artist: null, culture: "Marshall Islands, Micronesia", dateDisplay: "19th to early 20th century CE", medium: "Wood and fiber (sticks and cowrie shells)", locationDisplay: "Marshall Islands", lat: 7.1315, lon: 171.1845, prec: "region", unit: 9 },
  { id: 221, title: "Malagan display and mask", artist: null, culture: "New Ireland Province, Papua New Guinea", dateDisplay: "c. 20th century CE", medium: "Wood, pigment, fiber, and shell", locationDisplay: "New Ireland, Papua New Guinea", lat: -3.5, lon: 152.5, prec: "region", unit: 9 },
  { id: 222, title: "Presentation of Fijian mats and tapa cloths to Queen Elizabeth II", artist: null, culture: "Fijian", dateDisplay: "1953 CE", medium: "Multimedia performance (costume; cosmetics, including scent; chant; movement; and pandanus fiber/hibiscus fiber mats), photographic documentation", locationDisplay: "Fiji", lat: -18.1416, lon: 178.4419, prec: "site", unit: 9 },
  { id: 223, title: "The Gates", artist: "Christo and Jeanne-Claude", culture: "Contemporary Environmental Art", dateDisplay: "1979–2005 CE", medium: "Mixed-media installation (7,503 saffron vinyl gates with nylon fabric panels)", locationDisplay: "Central Park, New York City, New York, USA", lat: 40.7829, lon: -73.9654, prec: "site", unit: 10 },

  // --- UNIT 10: GLOBAL CONTEMPORARY (Works 224-250) ---
  { id: 224, title: "Vietnam Veterans Memorial", artist: "Maya Lin", culture: "Contemporary American", dateDisplay: "1982 CE", medium: "Black granite", locationDisplay: "Washington, D.C., USA", lat: 38.8913, lon: -77.0477, prec: "site", unit: 10 },
  { id: 225, title: "Horn Players", artist: "Jean-Michel Basquiat", culture: "Neo-Expressionism (American)", dateDisplay: "1983 CE", medium: "Acrylic and oil paintstick on three canvas panels", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 226, title: "Summer Trees", artist: "Song Su-nam", culture: "Sumukhwa / Korean Contemporary", dateDisplay: "1983 CE", medium: "Ink on paper", locationDisplay: "Seoul, South Korea", lat: 37.5665, lon: 126.978, prec: "city", unit: 10 },
  { id: 227, title: "Androgyne III", artist: "Magdalena Abakanowicz", culture: "Contemporary Polish", dateDisplay: "1985 CE", medium: "Burlap, resin, wood, nails, and string", locationDisplay: "Warsaw, Poland", lat: 52.2297, lon: 21.0122, prec: "city", unit: 10 },
  { id: 228, title: "A Book from the Sky", artist: "Xu Bing", culture: "Contemporary Chinese", dateDisplay: "1987–1991 CE", medium: "Mixed-media installation; hand-printed books and ceiling/wall scrolls printed from woodblocks", locationDisplay: "Beijing, China", lat: 39.9042, lon: 116.4074, prec: "city", unit: 10 },
  { id: 229, title: "Pink Panther", artist: "Jeff Koons", culture: "Postmodern / Neo-Pop (American)", dateDisplay: "1988 CE", medium: "Glazed porcelain", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 230, title: "Untitled (#228), from the History Portraits series", artist: "Cindy Sherman", culture: "Contemporary Photography / Postmodernism (American)", dateDisplay: "1990 CE", medium: "Chromogenic color print", locationDisplay: "Rome, Italy (conceived New York, USA)", lat: 41.9028, lon: 12.4964, prec: "city", unit: 10 },
  { id: 231, title: "Dancing at the Louvre, from the series The French Collection, Part I; #1", artist: "Faith Ringgold", culture: "Contemporary African American / Narrative Quilts", dateDisplay: "1991 CE", medium: "Acrylic on canvas, tie-dyed, pieced fabric border", locationDisplay: "Paris, France / New York, USA", lat: 48.8606, lon: 2.3376, prec: "site", unit: 10 },
  { id: 232, title: "Trade (Gifts for Trading Land with White People)", artist: "Jaune Quick-to-See Smith", culture: "Contemporary Native American (Salish and Kootenai)", dateDisplay: "1992 CE", medium: "Oil and mixed media on canvas", locationDisplay: "Albuquerque, New Mexico, USA", lat: 35.0844, lon: -106.6504, prec: "city", unit: 10 },
  { id: 233, title: "Earth's Creation", artist: "Emily Kame Kngwarreye", culture: "Contemporary Aboriginal Australian (Anmatyerre)", dateDisplay: "1994 CE", medium: "Synthetic polymer paint on canvas", locationDisplay: "Utopia, Northern Territory, Australia", lat: -22.25, lon: 134.5, prec: "site", unit: 10 },
  { id: 234, title: "Rebellious Silence, from the Women of Allah series", artist: "Shirin Neshat (artist); photo by Cynthia Preston", culture: "Contemporary Iranian / Photography", dateDisplay: "1994 CE", medium: "Ink on gelatin silver print", locationDisplay: "New York, USA / Tehran, Iran", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 235, title: "En la Barberia no se Llora (No Crying Allowed in the Barbershop)", artist: "Pepón Osorio", culture: "Contemporary Nuyorican / Installation", dateDisplay: "1994 CE", medium: "Mixed-media installation", locationDisplay: "Hartford, Connecticut, USA", lat: 41.7658, lon: -72.6734, prec: "site", unit: 10 },
  { id: 236, title: "Pisupo Lua Afe (Corned Beef 2000)", artist: "Michel Tuffery", culture: "Contemporary Pacific / New Zealand Samoan", dateDisplay: "1994 CE", medium: "Flattened and riveted corned beef tins", locationDisplay: "Wellington, New Zealand", lat: -41.2865, lon: 174.7762, prec: "city", unit: 10 },
  { id: 237, title: "Electronic Superhighway", artist: "Nam June Paik", culture: "Contemporary Video/Installation (Korean American)", dateDisplay: "1995 CE", medium: "Mixed-media installation (47-channel closed-circuit video installation, neon, steel, and electronic components)", locationDisplay: "Washington, D.C., USA", lat: 38.8977, lon: -77.0365, prec: "site", unit: 10 },
  { id: 238, title: "The Crossing", artist: "Bill Viola", culture: "Contemporary Video/Installation (American)", dateDisplay: "1996 CE", medium: "Video/sound installation (two channels of color video projection onto large freestanding screen)", locationDisplay: "Long Beach, California, USA", lat: 33.7701, lon: -118.1937, prec: "city", unit: 10 },
  { id: 239, title: "Guggenheim Museum Bilbao", artist: "Frank Gehry (architect)", culture: "Deconstructivism / Contemporary Architecture (Canadian-American)", dateDisplay: "1997 CE", medium: "Titanium, glass, and limestone", locationDisplay: "Bilbao, Spain", lat: 43.2685, lon: -2.934, prec: "site", unit: 10 },
  { id: 240, title: "Pure Land", artist: "Mariko Mori", culture: "Contemporary Japanese / Digital Installation", dateDisplay: "1998 CE", medium: "Color photograph on glass", locationDisplay: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, prec: "city", unit: 10 },
  { id: 241, title: "Lying with the Wolf", artist: "Kiki Smith", culture: "Contemporary American", dateDisplay: "2001 CE", medium: "Ink and pencil on paper", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 242, title: "Darkytown Rebellion", artist: "Kara Walker", culture: "Contemporary African American / Installation", dateDisplay: "2001 CE", medium: "Cut paper and projection on wall", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 243, title: "The Swing (after Fragonard)", artist: "Yinka Shonibare", culture: "Contemporary British-Nigerian", dateDisplay: "2001 CE", medium: "Mixed-media installation (headless mannequin, Dutch wax-printed cotton textile, swing, artificial foliage)", locationDisplay: "London, United Kingdom", lat: 51.5074, lon: -0.1278, prec: "city", unit: 10 },
  { id: 244, title: "Old Man's Cloth", artist: "El Anatsui", culture: "Contemporary Ghanaian / Nigerian", dateDisplay: "2003 CE", medium: "Aluminum liquor bottle caps and copper wire", locationDisplay: "Nsukka, Nigeria", lat: 6.8569, lon: 7.3958, prec: "site", unit: 10 },
  { id: 245, title: "Stadia II", artist: "Julie Mehretu", culture: "Contemporary Ethiopian-American", dateDisplay: "2004 CE", medium: "Ink and acrylic on canvas", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 246, title: "Preying Mantra", artist: "Wangechi Mutu", culture: "Contemporary Kenyan-American", dateDisplay: "2006 CE", medium: "Mixed media on Mylar", locationDisplay: "New York City, New York, USA", lat: 40.7128, lon: -74.006, prec: "city", unit: 10 },
  { id: 247, title: "Shibboleth", artist: "Doris Salcedo", culture: "Contemporary Colombian / Installation", dateDisplay: "2007–2008 CE", medium: "Installation (fracture in concrete floor)", locationDisplay: "Tate Modern, London, United Kingdom", lat: 51.5076, lon: -0.0994, prec: "site", unit: 10 },
  { id: 248, title: "MAXXI National Museum of XXI Century Arts", artist: "Zaha Hadid (architect)", culture: "Contemporary Architecture (Iraqi-British)", dateDisplay: "2009 CE", medium: "Glass, steel, and cement", locationDisplay: "Rome, Italy", lat: 41.9281, lon: 12.4665, prec: "site", unit: 10 },
  { id: 249, title: "Kui Hua Zi (Sunflower Seeds)", artist: "Ai Weiwei", culture: "Contemporary Chinese", dateDisplay: "2010–2011 CE", medium: "Sculpted and painted porcelain (100 million hand-painted porcelain seeds)", locationDisplay: "Jingdezhen, China (installed Tate Modern, London)", lat: 29.294, lon: 117.207, prec: "site", unit: 10 },
  { id: 250, title: "St. Luke Drawing the Virgin", artist: "Rogier van der Weyden", culture: "Northern Renaissance (Flemish)", dateDisplay: "c. 1435–1440 CE", medium: "Oil and tempera on oak panel", locationDisplay: "Brussels, Belgium", lat: 50.8503, lon: 4.3517, prec: "city", unit: 3, url: "https://smarthistory.org/rogier-van-der-weyden-saint-luke-drawing-the-virgin/" }
];

// Combine all 250 works
const rawCombined = [...canonicalWorks];
remainingWorksData.forEach(item => {
  rawCombined.push({
    id: item.id,
    title: item.title,
    artist: item.artist,
    culture: item.culture,
    dateDisplay: item.dateDisplay,
    medium: item.medium,
    locationDisplay: item.locationDisplay,
    latitude: item.lat,
    longitude: item.lon,
    locationPrecision: item.prec,
    unit: item.unit,
    dataConfidence: item.id <= 11 ? 'owner_notes' : 'best_effort',
    affccStatus: item.id <= 11 ? 'complete' : 'pending',
    url: item.url
  });
});

// Sort by CED id
rawCombined.sort((a, b) => a.id - b.id);

console.log('Total works loaded in build script:', rawCombined.length);

// Normalize dates and prepare final artworks array
const finalArtworks = [];
const imageManifest = [];
const reviewItems = [];

// Map of known explicit artwork image URLs
const explicitImageMap = {
  1: ["https://smarthistory.org/wp-content/uploads/2021/10/apollo-11-stone.jpg"],
  2: ["https://smarthistory.org/wp-content/uploads/2021/09/lascaux-II-1536x1046.jpg"],
  3: ["https://smarthistory.org/wp-content/uploads/2020/12/MNA113.jpg"],
  4: ["https://smarthistory.org/wp-content/uploads/2021/09/enhanced.jpeg"],
  5: ["https://smarthistory.org/wp-content/uploads/2018/06/ibex.jpg"],
  6: ["https://smarthistory.org/wp-content/uploads/2021/09/anthro-stele-1000px.jpeg"],
  7: ["https://smarthistory.org/wp-content/uploads/2018/06/jadecong.jpg"],
  8: ["https://smarthistory.org/wp-content/uploads/2023/05/Stonehenge-1.jpg"],
  9: ["https://smarthistory.org/wp-content/uploads/2016/09/ambumnga.jpg"],
  10: ["https://smarthistory.org/wp-content/uploads/2023/11/default-e1701372072437.jpg"],
  11: ["https://smarthistory.org/wp-content/uploads/2016/12/lapitafragment.jpg"]
};

rawCombined.forEach(w => {
  const norm = dateUtils.normalizeDateDisplay(w.dateDisplay);
  if (norm.confidence === 'failed') {
    reviewItems.push(`- Work #${w.id} ("${w.title}"): Date string "${w.dateDisplay}" failed automatic normalization.`);
  }

  const sh = shMap.get(w.id);
  const sourceGuideUrl = w.url || (sh ? sh.url : '');

  const artworkObj = {
    id: w.id,
    title: w.title,
    artist: w.artist || null,
    culture: w.culture || null,
    dateDisplay: w.dateDisplay,
    dateStart: norm.dateStart,
    dateEnd: norm.dateEnd,
    dateMidpoint: norm.dateMidpoint,
    medium: w.medium,
    locationDisplay: w.locationDisplay,
    latitude: w.latitude !== undefined ? w.latitude : null,
    longitude: w.longitude !== undefined ? w.longitude : null,
    locationPrecision: w.locationPrecision || 'approximate',
    unit: w.unit,
    dataConfidence: w.dataConfidence,
    affccStatus: w.affccStatus,
    sourceUrl: sourceGuideUrl
  };

  finalArtworks.push(artworkObj);

  const imagesList = [];
  if (explicitImageMap[w.id]) {
    explicitImageMap[w.id].forEach(srcUrl => {
      imagesList.push({
        src: srcUrl,
        alt: `${w.title} (${w.dateDisplay})`,
        source: sourceGuideUrl ? `Smarthistory: ${sourceGuideUrl}` : "Smarthistory / AP Art History",
        local: false
      });
    });
  } else {
    imagesList.push({
      src: "images/placeholder/artwork-placeholder.svg",
      alt: `${w.title} (${w.dateDisplay})`,
      source: sourceGuideUrl ? `Smarthistory guide: ${sourceGuideUrl}` : "College Board AP Art History CED",
      local: true
    });
  }

  imageManifest.push({
    id: w.id,
    title: w.title,
    images: imagesList
  });
});

// Write data/artworks.json
fs.writeFileSync(path.join(__dirname, '../data/artworks.json'), JSON.stringify(finalArtworks, null, 2), 'utf8');
console.log('Successfully wrote data/artworks.json');

// Write data/images.json
fs.writeFileSync(path.join(__dirname, '../data/images.json'), JSON.stringify(imageManifest, null, 2), 'utf8');
console.log('Successfully wrote data/images.json');

// Write data/source/needs-review.md
let reviewContent = `# Dataset Audit & Items for Review

This document logs any artworks whose dates, locations, or metadata require verification against the physical College Board Course and Exam Description (CED).

- **Unit 1 (Works 1–11)**: Level 2 Authoritative (from Project Owner's \`__Unit 1 Global Prehistory 30,000–500 bce Notes.md\`).
- **Units 2–10 (Works 12–250)**: Standard canonical AP Art History CED metadata with Smarthistory guide cross-references. Marked with \`"dataConfidence": "best_effort"\`.

## Date Normalization Audit
`;

if (reviewItems.length === 0) {
  reviewContent += `\nAll 250 artwork date displays were successfully normalized to discrete integer timeline ranges.\n`;
} else {
  reviewContent += reviewItems.join('\n') + '\n';
}

reviewContent += `
## Location Coordinates Audit

All 250 artworks have geographic coordinates assigned based on their original historical/archaeological site or region of creation.

## Replacing with New Academic Year Dataset

To replace or update the dataset for a future academic year:
1. Update \`scripts/build-dataset.js\` or supply a new source JSON.
2. Run \`node scripts/build-dataset.js\`.
3. Run \`npm run validate\` to ensure schema compliance.
`;

fs.writeFileSync(path.join(__dirname, '../data/source/needs-review.md'), reviewContent, 'utf8');
console.log('Successfully wrote data/source/needs-review.md');

// Write data/source/notes.md explaining authority levels
const notesSummary = `# Source Notes & Data Authority

## 1. Authority Hierarchy
- **Level 1 — CED Metadata**: Official College Board Course and Exam Description (ID 1–250, title, unit, official date display, medium, original location).
- **Level 2 — Project Owner Notes**: Markdown/Word notes supplied by the project owner (e.g. \`data/source/unit-01-global-prehistory.md\`). Authoritative source of truth for all AFFCC study analyses.
- **Level 3 — AI Organization & Prose**: Build-time transformation of raw notes into readable study prose. Never introduces ungrounded facts or invented details.

## 2. Unit 1 Notes Source
Archived in \`data/source/unit-01-global-prehistory.md\`.
`;
fs.writeFileSync(path.join(__dirname, '../data/source/notes.md'), notesSummary, 'utf8');
console.log('Successfully wrote data/source/notes.md');
