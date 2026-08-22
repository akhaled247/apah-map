# Dataset Audit & Items for Review

This document logs any artworks whose dates, locations, or metadata require verification against the physical College Board Course and Exam Description (CED).

- **Unit 1 (Works 1–11)**: Level 2 Authoritative (from Project Owner's `__Unit 1 Global Prehistory 30,000–500 bce Notes.md`).
- **Units 2–10 (Works 12–250)**: Standard canonical AP Art History CED metadata with Smarthistory guide cross-references. Marked with `"dataConfidence": "best_effort"`.

## Date Normalization Audit

All 250 artwork date displays were successfully normalized to discrete integer timeline ranges.

## Location Coordinates Audit

All 250 artworks have geographic coordinates assigned based on their original historical/archaeological site or region of creation.

## Replacing with New Academic Year Dataset

To replace or update the dataset for a future academic year:
1. Update `scripts/build-dataset.js` or supply a new source JSON.
2. Run `node scripts/build-dataset.js`.
3. Run `npm run validate` to ensure schema compliance.
