# Quiz data policy

The list-page **Quiz Me** feature must only test attribution that is explicitly allowed for quizzing. Display metadata (list cards, map panel, AFFCC pages) may show more fields than the quiz uses.

## Rules

1. **No invented attribution** — Quiz code reads answers only from `data/artworks.json` via `ArtworkQuiz.getQuizAnswer`. Do not hard-code artists, dates, or other facts in quiz logic.

2. **Standard quiz fields** (always eligible when the value is present on the record):
   - `culture`, `date`, `medium`, `location`, `title`

3. **Opt-in quiz fields** (never quizzed unless explicitly enabled on that artwork):
   - `artist`
   - `artistCulture` (combined artist + culture string)

   Enable per work in `artworks.json`:

   ```json
   "quizFields": {
     "artist": true
   }
   ```

   Only set these to `true` when the value is confirmed in **your** source notes and you intend students to be tested on it.

4. **Missing values** — If a field is empty or `—`, that field is never used for that artwork in any quiz mode.

5. **Implementation** — All builders call `ArtworkQuiz.canQuizField(artwork, fieldKey)` before using a value. See [`js/artwork-quiz.js`](../js/artwork-quiz.js).

6. **Validation** — `npm run validate` checks `quizFields` shape and that opt-in flags are not set without underlying data.

## Why artist is opt-in

The `artist` property on some records may exist for display or import convenience but might not be part of your study set. Default quiz behavior ignores `artist` and `artistCulture` so questions like “What is the artist of …?” cannot appear unless you opt in with `quizFields`.

## Association (Connect tab)

Grouping and “what connects these works?” questions use a separate dataset and policy: [ASSOCIATION-DATA-POLICY.md](./ASSOCIATION-DATA-POLICY.md). The optional “Include attribution questions” toggle on Connect still follows the rules above for attribution items only.
