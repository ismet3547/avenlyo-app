# Avenlyo visual direction review

Open `index.html` directly, or open the PNGs under `mockups/` and `boards/`.
Everything is a fictional Northstar Studio design fixture. No live customer data,
production imports, backend calls, Supabase calls or OpenAI calls are present.

- 12 desktop compositions: 1440×900.
- 6 mobile compositions: 390×844.
- Exactly three visual systems with the same information architecture and fixture.
- Each composition has a portable outlined SVG and a rendered PNG.
- Home, Inbox and mobile comparison boards; typography and motion boards.
- Six attributed official visual reference images in `references/`.
- Fonts and their licenses in `assets/fonts/`; actual Turkish glyphs are validated.
- `fixture.json`, `tokens.json`, `tokens.css`, `contrast-ratios.json`, `validation.json`.

The complete specifications, weighted scores, critique and recommendation are in
`../../docs/frontend-visual-directions-v1.md`.

Reproduction (authoring tools only):

```sh
python3 design-prototypes/frontend-visual-directions/build.py
node design-prototypes/frontend-visual-directions/render.mjs
python3 design-prototypes/frontend-visual-directions/review.py
```

Requires Python Pillow/fontTools and Node sharp in the authoring environment.
No package or lockfile change belongs to this study. PNGs/SVGs need no tooling.

The HTML gallery's CSS demonstrations are illustrative context-reveal samples.
They do not simulate production claim, release, resume or message sending.
Static artwork is not proof of keyboard, responsive or runtime acceptance.

Recommendation: Direction 3 as a complete visual system, with no borrowed details.
This is not an approval to implement, merge or deploy it.
