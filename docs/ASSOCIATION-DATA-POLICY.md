# Association quiz data policy

The list-page **Connect** tab tests how works relate (function, form, period, typology)—not raw attribution strings alone.

## Rules

1. **No invented associations at runtime** — Question builders read only from `data/association-concepts.json` (and artwork `title` for choice labels via `artworks.json`). Do not infer new groupings in quiz JavaScript.

2. **Concept records** — Each entry in `concepts[]` must have:
   - `id` (stable slug), `label` (student-facing), `facet`, `units`, `artworks[]`
   - `quizEligible`: when `true`, the concept may appear in generated questions
   - Optional `vocabId` for linking to glossary definitions in feedback (display only)

3. **Facets** — `function` | `form` | `period` | `typology` | `material` | `site` — used for distractor selection, not shown as answers unless the question mode asks for a concept label.

4. **Pool eligibility** — A concept is usable in a session only when at least three of its `artworks` fall inside the user’s selected unit pool (see `AssociationIndex.eligibleConcepts`).

5. **`quizEligible` concepts** — Must list at least **four** artwork IDs so odd-one-out and four-choice modes can be built.

6. **Unit cohort concepts** (`unit-N-cohort`) — Metadata for curation; keep `quizEligible: false` unless you deliberately want “same unit” as an answer.

7. **Directed relations** — Optional `relations[]` in the same file; validated and used by the Network graph and Connect **`developmentLink`** quiz mode (period / precursor progression).

8. **Validation** — `npm run validate` checks concept shape, artwork IDs, and vocab links.

## Curation workflow

- Add or edit concepts in `data/association-concepts.json`.
- Optional: run `node scripts/bootstrap-association-from-vocab.js` to draft stubs from `vocabulary.json` artwork links; merge manually.
- Run `npm run validate` and `npm run test:association`.

## Network page

The **Network** tab (`network/index.html`) visualizes the same `concepts[]` and `relations[]` data:

- **Works view** — edges between artworks that share a concept; optional directed `relations` edges.
- **Concepts view** — bipartite artwork ↔ concept membership edges.

Graph layout is built in `js/association-graph.js` (no runtime inference). After editing `association-concepts.json`, reload the page to see changes.

## Directed relations (period / precursor links)

Curated **rich meshes** are authored in [`data/period-traditions.json`](data/period-traditions.json) and generated into `relations[]` by:

```bash
npm run generate-relations
```

Generator rules:

- **Adjacent tiers** in a tradition: all-to-all directed links from earlier tier → later tier.
- **Within a tier**: chronological chain by `dateMidpoint` on consecutive works.
- **Manual** edges in `manualRelations` (e.g. ziggurat → pyramids, Doryphoros copy → Parthenon program).

Relation fields: `from`, `to`, `type`, `note`, optional `tradition`, `fromPeriod`, `toPeriod`, `generated`.

**Egypt gap:** The CED 250 list has Predynastic, Old Kingdom, and New Kingdom works only—no Middle Kingdom or Post-dynastic Egyptian object. Chains use what exists; do not invent works.

**Chronology exceptions:** [`data/relation-chronology-exceptions.json`](data/relation-chronology-exceptions.json) lists artwork IDs allowed to point “backward” in time (copies, multi-period sites).

Known `type` values: `architectural_precursor`, `period_succession`, `stylistic_development`, `political_transition`, `technological_medium_shift`, `other`.

## Related

- Attribution quiz policy: [QUIZ-DATA-POLICY.md](./QUIZ-DATA-POLICY.md)
