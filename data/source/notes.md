# Source Notes & Data Authority

## 1. Authority Hierarchy
- **Level 1 — CED Metadata**: Official College Board Course and Exam Description (ID 1–250, title, unit, official date display, medium, original location).
- **Level 2 — Project Owner Notes**: Markdown/Word notes supplied by the project owner (e.g. `data/source/unit-01-global-prehistory.md`). Authoritative source of truth for all AFFCC study analyses.
- **Level 3 — AI Organization & Prose**: Build-time transformation of raw notes into readable study prose. Never introduces ungrounded facts or invented details.

## 2. Unit Notes Sources
- Unit 1: `data/source/unit-01-global-prehistory.md`
- Unit 2: `data/source/unit-02-ancient-mediterranean.md`
- Unit 3: `data/source/unit-03-early-europe-colonial-americas.md`

Unit 2–3 study images: Steven Zucker / Smarthistory Flickr album `72157648851606647` (see `scripts/update-unit2-images.js`, `scripts/update-unit3-images.js`). Works not in the album use Wikimedia Commons fallbacks.
