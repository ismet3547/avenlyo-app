# Direction 3 refinement / design-only

Open `index.html` to compare original and refined views, or open the PNGs in
`mockups/`. The original artwork stays in `../mockups/` without modification.

- Six refined compositions: four desktop 1440×900 and two mobile 390×844.
- `comparison-direction3-before-after.png`: Home, Inbox, desktop widget and both
  mobile views, with original artwork on the left and refinement on the right.
- `comparison-direction3-inbox.png`: compact Inbox comparison.
- `tokens-refined.css` and `tokens-refined.json`: exact values and geometry.
- `validation-refinement.json`: dimensions, contrast, preserved original hashes,
  warm-chroma exposure and message-stack measurements.
- Full notes: `../../../docs/frontend-visual-directions-v1.md#direction-3-refinement`.

Identity remains charcoal, terracotta, Manrope and warm porcelain. Ordinary
messages/summary surfaces are more neutral. Operational radii and spacing are
tighter. Message sizes, pane architecture, fixture and handling semantics are
unchanged. Mobile primary actions remain 44px. The softer widget geometry stays.

Reproduce from the existing design checkout with its original font assets:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 design-prototypes/frontend-visual-directions/refinement-v1/build_refinement.py
node design-prototypes/frontend-visual-directions/refinement-v1/render_refinement.mjs
python3 design-prototypes/frontend-visual-directions/refinement-v1/review_refinement.py
```

Uses the already available Pillow/fontTools/numpy/sharp authoring tools. No
repository dependency change. PNGs and outlined SVGs need no authoring tools.
The generator reuses only the existing artwork renderer and Direction 3 fixture;
it imports no production code and makes no backend calls.

No Direction 1/2 hybrid, new product capabilities, production implementation,
merge or deployment. Static artwork does not prove live keyboard or touch behavior.
