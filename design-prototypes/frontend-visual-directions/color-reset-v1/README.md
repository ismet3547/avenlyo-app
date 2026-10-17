# Avenlyo / cool color reset

**Preferred: B — Graphite + Cyan / Teal, with Manrope.** This is a design
recommendation awaiting stakeholder color approval. The approved Direction 3
structure stays; its earlier warm color family is superseded by this study.

B balances a clear action color, a true cool graphite frame and quiet white work
planes. Its blue-leaning cyan/teal is restrained enough for daily supervision,
while giving Avenlyo more character than a familiar azure dashboard. Color is
concentrated on decisions, links and selection. Ordinary messages stay neutral.

No production code, app, backend, runtime, dependency, merge or deployment change.
These are static outlined SVGs and PNGs, plus an offline artwork gallery.

## Review

- [Offline gallery](index.html).
- [Home / all three palettes side-by-side](color-reset-comparison-home.png).
- [Inbox / all three palettes side-by-side](color-reset-comparison-inbox.png).
- [Typography / three fonts × three palettes](color-reset-typography.png).
- [Exact CSS tokens](tokens-color-reset.css), [JSON tokens and drawing records](tokens-color-reset.json), [validation](validation-color-reset.json).

Each Home/Inbox comparison board is 4416×1308. Each constituent desktop frame
is native 1440×900. The typography board is 2040×2260, using native-size crops
of the same Home and Inbox compositions. Columns are palettes A/B/C; rows are
Manrope/Geist/Instrument Sans. Font sizes and weights receive no compensation.

| Palette | Home, 1440×900 | Inbox, 1440×900 | Visual assessment |
| --- | --- | --- | --- |
| A — Graphite + Azure | [PNG](mockups/a-home.png) | [PNG](mockups/a-inbox-desktop.png) | Immediate, familiar operational clarity. Highest risk of looking like a generic blue dashboard. |
| B — Graphite + Cyan / Teal | [PNG](mockups/b-home.png) | [PNG](mockups/b-inbox-desktop.png) | Preferred balance of calm, precision and distinctive mature character. No green decorative surfaces or neon. |
| C — Midnight + Ice Blue | [PNG](mockups/c-home.png) | [PNG](mockups/c-inbox-desktop.png) | Composed ink frame and quiet ice actions. The light action fill has less visual emphasis; dark action text and a separate darker link/selection ink are essential. |

The complete preferred B system also includes:

| View | Dimensions | Artwork |
| --- | --- | --- |
| Agent | 1440×900 | [PNG](mockups/b-agent.png) |
| Widget | 1440×900 | [PNG](mockups/b-widget-desktop.png) |
| Inbox mobile | 390×844 | [PNG](mockups/b-inbox-mobile.png) |
| Widget mobile | 390×844 | [PNG](mockups/b-widget-mobile.png) |

Every PNG has a same-named portable outlined SVG. The main ten required frames
use Manrope to isolate color as the variable. Twelve additional full-size Home/
Inbox frames provide the Geist and Instrument Sans comparisons for all palettes.
Their filenames start `type-{palette}-{font}-`.

## Exact foundation tokens

All values are sRGB hex. CSS names use `--` followed by the role in this table.

| Token | A / Graphite + Azure | B / Graphite + Cyan / Teal | C / Midnight + Ice Blue |
| --- | --- | --- | --- |
| canvas | `#F3F6F9` | `#F2F6F8` | `#F2F5FA` |
| surface | `#FFFFFF` | `#FFFFFF` | `#FFFFFF` |
| surface-subtle | `#EDF2F6` | `#EDF3F5` | `#ECF1F7` |
| navigation | `#1C2026` | `#1B232A` | `#111D33` |
| navigation-selected | `#303A46` | `#2B3E48` | `#213653` |
| text | `#17212B` | `#14232D` | `#17263B` |
| muted | `#566575` | `#526572` | `#53667E` |
| border | `#D7E0E8` | `#D4E0E6` | `#D5DFED` |
| accent | `#1967D2` | `#087F8C` | `#A6D5F2` |
| accent-hover | `#1153AD` | `#056673` | `#8CC5E9` |
| selection | `#E8F0FC` | `#E3F1F4` | `#E6F2FC` |
| ai-message | `#F0F4F8` | `#F0F5F7` | `#F0F4FA` |
| customer-message | `#E9EEF3` | `#E8F0F3` | `#E7EEF7` |
| success | `#23764B` | `#23764B` | `#23764B` |
| attention | `#946200` | `#946200` | `#946200` |
| danger | `#C12E4B` | `#C12E4B` | `#C12E4B` |
| focus | `#1B73E8` | `#007FAD` | `#397EAF` |

Additional exact role tokens prevent light accents and semantic states from
being overloaded:

| Token | A | B | C |
| --- | --- | --- | --- |
| accent-ink / text links and selected row rule | `#1967D2` | `#087583` | `#235A80` |
| action-text | `#FFFFFF` | `#FFFFFF` | `#10263B` |
| navigation-text | `#EDF3F8` | `#ECF3F7` | `#EAF1FC` |
| navigation-muted | `#B4C1CD` | `#B2C3CD` | `#AFBED4` |
| navigation-selected-text / brand-mark | `#B7D6FF` | `#A9DEE6` | `#C0E5FC` |
| workspace-fill | `#262E37` | `#25313A` | `#1C2D46` |
| workspace-mark | `#3B4856` | `#3B4D59` | `#324762` |
| navigation-border | `#3C4652` | `#3B4B57` | `#344761` |

Shared semantic tokens: `success-fill #EAF4EE`, `attention-fill #F1F4F7`,
`danger-fill #FAEDF1`, `ai-paused #526576`, `ai-paused-fill #EAF0F4`,
`handling-text #E0E9F0`, `handling-muted #B8C7D3`.

## Independent status semantics

- **Primary / action:** the palette accent means Claim, Open, Send, Save or
  selected configuration. It never means warning, danger or AI paused.
- **Success:** green is limited to the existing Active/Qualified/readiness facts.
- **Attention:** a small functional amber rule/label identifies Needs human or
  Setup required. Its surface remains cool neutral; no warm attention-card fill.
  Amber is a semantic exception, not a brand or background family.
- **Danger:** reserved crimson, independent of primary and attention. No error
  exists in the fixture, so no error state was invented inside a mockup. The
  comparison-board legend shows its token only.
- **AI paused:** explicit words and the existing pause icon, in neutral slate.
  The desktop handling strip retains its dark supervision boundary with cool
  light text; widget notices use a quiet cool-gray strip. Pause is neither a
  red warning nor an accent-colored call to action.
- **Focus:** a separate outline token, at least 3:1 against its canvas. The
  artwork does not assert live focus behavior or keyboard acceptance.

Cream, ivory, beige, greige, brown navigation, terracotta, brick actions, peach
selection and warm-gray messages are absent. The fictional customer website
behind the widget is recolored to cool neutrals too; its layout and content stay.

## Typography judgment

These are visual judgments from actual local font outlines, not reading-speed
measurements or user-test findings. No family was substituted for novelty.

| Family | Operational clarity / small UI | Premium and mature character | Decision |
| --- | --- | --- | --- |
| Manrope | Clear hierarchy and open counters at the existing sizes. All approved line breaks and inset spacing fit. | Distinct rounded character without excessive softness after the radius refinement. | Preferred overall balance; retain it. |
| Geist | Very crisp, conventional operational labels; a strong alternative if familiarity is the priority. | More utilitarian and closer to developer-product conventions. | No clear overall gain here. Its wider locked lines consume up to 6.39px of the original text padding. |
| Instrument Sans | Clean, compact labels and readable small copy. | Quiet and mature, but less identifiable in this specific composition. | Credible alternative; insufficient benefit to justify replacing Manrope. |

The font study locks the approved Manrope line breaks, container dimensions and
anchors, while drawing each family's genuine glyphs at the same pixel sizes and
weights. Geist remains inside its bubbles, but some lines enter the original
12px padding; it is not silently shrunk or given larger containers. A future
font change would need its own responsive fit review. The preferred Manrope
set has no fit change.

## Preserved structure and validation

The preserved source is design commit `4efa686ff043c8d56350cf603f72574320529ae8`.
Every new frame is checked against its corresponding approved refined SVG:
non-text geometry is identical; all fixture text and line breaks are identical.
The main ten Manrope frames also retain every glyph position. The original
three-direction artwork and the first refinement remain untouched.

Unchanged: 224px navigation, 320px list, 624px thread, 272px context; 96px
conversation row; 72/57px desktop/mobile handling; 116/98px composer; 10px main
surface/message radii; 22px widget panel; 44px mobile primary buttons. No font
size, line height, touch-target intent, product state, claim/release/resume
meaning, data or functionality changes. Inbox retains six fixture messages;
widget retains the latest four and the existing earlier-history action.

All 22 frames have the required canvas dimensions. Audited text color pairs
meet 4.5:1; focus/canvas pairs meet 3:1. Preferred B: action label 4.75:1,
links 5.41:1, muted/subtle 5.41:1, body/AI 14.61:1 and paused/neutral 5.25:1.
This is static contrast/artwork validation, not production accessibility
certification, browser acceptance or hit-testing validation.

Reproduce with existing authoring tools, without installing dependencies:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 design-prototypes/frontend-visual-directions/color-reset-v1/build_color_reset.py
node design-prototypes/frontend-visual-directions/color-reset-v1/render_color_reset.mjs
python3 design-prototypes/frontend-visual-directions/color-reset-v1/review_color_reset.py
```

**Stop here. Stakeholder color approval is required before implementation.**
