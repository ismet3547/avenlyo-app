# New-generation product UI research v1

Research date: **17 October 2026**. Repository: `ismet3547/avenlyo-app`. Branch: `feat/frontend-recreation-v1`. Audited design HEAD: `e5ef78fe604a83dddbd520407a4f7f494de9e68f`.

**Research only.** This document reopens visual and structural assumptions; it does not approve implementation, replace the functional contract, or create Direction 4. Existing mockups and production code are unchanged. Stop after stakeholder review of this research.

## 1. Executive finding: why the previous explorations still feel conventional

**We changed the skin while protecting the composition.** All three Inbox directions keep substantially the same module sidebar, list, conversation, context column, handling strip and bottom composer. The refinement explicitly preserved pane architecture. The color reset then locked non-text geometry, line breaks and, for the main frames, glyph positions. That made the studies useful comparisons of visual tone, but prevented them from answering a structural question.

The approved refined geometry is 224px navigation + 320px list + 624px thread + 272px context at 1440px. Before reading a customer message, the operator sees an application map, queue furniture, handling furniture and metadata furniture. Home similarly introduces the page, introduces the product, encloses the work, and keeps readiness alongside it. Agent presents configuration, then repeats it in an effective-behavior panel. The result is an accomplished administrative application whose intelligence is represented largely through labels and state treatments.

**The strongest contemporary signal in this study is a different allocation of attention:** make the note, task, document, conversation or current intervention the primary place; expose additional machinery when that job needs it. Wispr makes the utility appear in another app's text field. Granola starts with a note. Tana turns meeting context into proposed outcomes. Claude's September unification removes the user's need to choose between question mode and work mode. Dia makes navigation, context and transitions part of the working environment. These are different operating models, not one shared palette.

This does **not** establish that sidebars, cards, large titles, tables or chat are obsolete. New Notion Mail has a labeled sidebar; new Tana has spaces and cards; Docs still uses document navigation, tables and an AI side panel; Codex's launch app has a large empty starting surface. The relevant difference is whether a component earns its space for the current task, and whether the product changes coherently as the task changes.

The five most useful contemporary references for the next Avenlyo discussion are **Wispr Flow, Granola, Dia, Tana's new product, and Claude's unified work experience**. This is an analytical selection for structural contrast and transfer, not a usability ranking. Docs and Codex supply essential counterexamples and supervision lessons.

## 2. Products researched and recency check

Fifteen distinct products/surfaces were studied. The first six are the requested starting set; the remaining nine were discovered for this study. **Nine have a documented 2026 product launch or major redesign even when Dia's incremental refreshes are excluded.** Five additional products launched in 2025; Dia launched in 2025 and received the specifically requested 2026 updates. No older mature SaaS controls are counted toward the fifteen. Notion and Superhuman are included only for the named new surfaces, not their old dashboards.

| # | Product / exact scope | Qualifying event | Cohort | UI evidence actually inspected |
| --- | --- | --- | --- | --- |
| 1 | Granola desktop notepad and 2026 identity | 2 Feb 2026: product visual pass, new typography/logo/system | 2026 major redesign | Official notepad screenshot; design-team account |
| 2 | Dia browser | 2025 launch; 23 Apr, 9/30 Jul and 15 Oct 2026 surface/interaction updates | 2025–2026; **not needed for the nine** | Official new-tab poster; dated changelog text; 2026 settings/motion not hands-on |
| 3 | Wispr Flow desktop/mobile utility, especially Android | 23 Feb 2026 Android launch | 2026 new platform product | Official Android demonstration frames and dictation controls; iPhone imagery; desktop behavior documented |
| 4 | Superhuman Docs | 8 Jul 2026 Coda → Docs redesign and new AI | 2026 major redesign | Official editor/AI demo sequence, product crop, identity specimens |
| 5 | Superhuman Go | 12 Aug 2026 Go 1.0; initial announcement Oct 2025 | 2026 major product release | Official contextual suggestion sequence; builder/full-screen imagery |
| 6 | Notion 2026 Agent/mobile surfaces | 20 Jan mobile Agent; 24 Feb Custom Agents | 2026 major new product surfaces | Official mobile Agent/recording screenshot; agent creation sequence and settings imagery |
| 7 | Claude Cowork → unified Claude | 12 Jan 2026 preview; 16 Sep 2026 unification | 2026 launch and major product change | Official built-in-browser screenshot; current and dated explanatory material |
| 8 | Codex desktop launch app | 2 Feb 2026 | 2026 new app | Official launch-video thumbnail showing full shell; announcement; video interaction **not** inspected |
| 9 | Perplexity Computer | 25 Feb 2026 | 2026 new product | Official task execution screenshot and product tour imagery |
| 10 | New Tana, distinct from Tana Outliner | 31 Mar 2026 new product announcement; 5 Jun and 8 Oct updates | 2026 new product | Official space home, meeting create menu, outcome and mobile imagery |
| 11 | Notion Mail | 15 Apr 2025 | 2025 new product | Official custom-view animated screenshot sequence |
| 12 | Raycast for iOS | 30 Apr 2025 | 2025 new mobile app | Official Home/AI/Notes launch imagery; not old macOS shell |
| 13 | Figma Make | 7 May 2025 initial launch | 2025 new product | Official Make prompt/result interface crops; not the generated music player's style as product chrome |
| 14 | Adobe Firefly Boards | 24 Apr 2025 beta context; 24 Sep worldwide availability | 2025 new work surface | Official spatial board screenshot |
| 15 | Opera Neon agentic browser | 30 Sep 2025 first invitations; announced 28 May | 2025 new product | Official browser start page and Make execution/result screenshots |

### Evidence method and limits

- **V**: visually inspected official product image/crop or launch-video poster. This verifies composition in the pictured state, not the entire product.
- **Q**: inspected multiple ordered frames of an official GIF or demo. This verifies a demonstrated sequence. It does not prove production latency, easing, focus behavior or accessibility.
- **D**: first-party dated release or help text. Behavior is attributed to the publisher, not presented as personal use.
- **U**: unverified; no inference from absent controls. A cropped sidebar does not mean a product has no sidebar.

No signed-in product trials, accounts or installs were created. The study deliberately separates actual product UI pictured in official material from website design, brand reels, staged backdrops and generated output. Campaign backgrounds around screenshots are not app canvas colors. Exact CSS dimensions, measured contrast, font identities, hover-only behavior and animation curves are unknown unless explicitly supported. Relative typography descriptions come from images, not pixel measurements.

The [reference board and source manifest](../design-prototypes/new-generation-research/README.md) retain small internal-analysis reference copies, including publication context, retrieval date, original asset URLs and frame details. They are competitor references, never Avenlyo work.

## 3. Exact sources and dates

All sources below were retrieved on 17 October 2026. A date describes the source/event, not necessarily the age of every image on a living product page. The local manifest records exact media URLs; these page URLs are the stable reading entry points.

| ID | Official source URL | Date / evidence scope |
| --- | --- | --- |
| G1 | <https://www.granola.ai/blog/a-new-look-for-granola> | 2 Feb 2026, confirmed by page `datePublished`; V/D, product pass and design rationale |
| G2 | <https://www.granola.ai/updates/whats-new-2026-01-08> | 8 Jan 2026; D, window radius/contrast and naming polish |
| G3 | <https://www.granola.ai/blog/say-hello-to-recipes> | 30 Sep 2025; D, all-new Chat and saved prompts; historical supplement |
| D1 | <https://www.diabrowser.com/> | Living product tour, media undated; V, new-tab/window composition only |
| D2 | <https://www.diabrowser.com/changelog/mac/1-28-0> | 23 Apr 2026; D, sidebar visual refresh and content color matching |
| D3 | <https://www.diabrowser.com/changelog/mac/1-20-0> | 26 Feb 2026; D, sidebar toggle, split controls, group naming animation |
| D4 | <https://www.diabrowser.com/changelog/mac/1-29-0> | 30 Apr 2026; D, swipe navigation and sidebar drag rubber-banding |
| D5 | <https://www.diabrowser.com/changelog/mac/1-39-0> | 9 Jul 2026; D, expandable thinking and settings navigation |
| D6 | <https://www.diabrowser.com/changelog/mac/1-42-0> | 30 Jul 2026; D, thinking UI redesign |
| D7 | <https://www.diabrowser.com/changelog/mac/1-53-0> | 15 Oct 2026; D, anchored-content sidebar/split transitions |
| D8 | <https://www.diabrowser.com/changelog/mac/1-15-0> | 23 Jan 2026; D, profile-colored new tab and command-bar shimmer |
| W1 | <https://wisprflow.ai/post/flow-on-android> | 23 Feb 2026; D, Android launch |
| W2 | <https://wisprflow.ai/android> | Living page, undated images; V/Q/D, Android floating utility and desktop/iPhone differences |
| W3 | <https://docs.wisprflow.ai/articles/1790396454-move-and-dock-the-flow-bar-on-desktop> | Updated 16 Oct 2026; D, desktop resting/recording/processing and docking behavior |
| W4 | <https://docs.wisprflow.ai/articles/5096240724-navigating-the-wispr-flow-app-desktop-ios-and-android> | Updated 16–17 Oct 2026; D, desktop Hub, mobile tabs and platform differences |
| S1 | <https://blog.superhuman.com/docs-new-visual-identity/> | 8 Jul 2026; V/D, elevation rationale, Super family, icon system |
| S2 | <https://blog.superhuman.com/introducing-superhuman-docs/> | 8 Jul 2026; V/Q/D, editor/AI demo; AI Views and Databases explicitly closed beta at launch |
| S3 | <https://superhuman.com/docs> | Living page; V, current official product crops |
| S4 | <https://blog.superhuman.com/go-1-0/> | 12 Aug 2026; V/Q/D, contextual suggestions, sources, agent builder and full-screen Go |
| N1 | <https://www.notion.com/releases/2026-01-20> | 20 Jan 2026; V/D, mobile Agent and persistent recording affordance |
| N2 | <https://www.notion.com/releases/2026-02-24> | 24 Feb 2026; V/Q/D, Custom Agents, connected tools and agent settings |
| N3 | <https://www.notion.com/help/mobile-custom-agents> | Living help; D, agents accessible through mobile sidebar/search |
| N4 | <https://www.notion.com/releases/2026-05-05> | 5 May 2026; D, admin agent monitoring/disable controls |
| C1 | <https://www.anthropic.com/news/introducing-anthropic-labs> | 13 Jan 2026; D, states Cowork preview launched the previous day |
| C2 | <https://claude.com/product/cowork> | Living page; V/D, built-in browser alongside task; mixed transitional copy noted below |
| C3 | <https://claude.com/resources/articles/cowork-is-now-claude> | 16 Sep 2026; D, unified chat/work and artifact editing; rollout scoped to stated plans |
| X1 | <https://openai.com/index/introducing-the-codex-app/> | 2 Feb 2026; V/D, launch shell, review threads, projects and automations |
| X2 | <https://vimeo.com/1161130375/2470243d0c> | Official OpenAI video embedded in X1; **poster inspected only**, not watched interaction |
| P1 | <https://hub-prod.perplexity.ai/> | Official blog index lists Computer launch 25 Feb 2026; D |
| P2 | <https://www.perplexity.ai/changelog/what-we-shipped---february-27-2026> | Page displays 26 Feb 2026 despite URL suffix; D, release-week capabilities |
| P3 | <https://www.perplexity.ai/products/computer> | Living page; V/D, execution/tool/subagent and result crops |
| T1 | <https://outliner.tana.inc/blog/the-next-chapter-for-tana> | 31 Mar 2026; D, new Tana vs existing Outliner distinction |
| T2 | <https://tana.inc/blog/tana-takes-it-from-here> | 5 Jun 2026, page `datePublished`; V/D, meeting outcomes, create menu, space home |
| T3 | <https://tana.inc/blog/tana-app-for-ios> | 8 Oct 2026; V/D, iPhone/iPad and Lock Screen capture |
| M1 | <https://www.notion.com/releases/2025-04-15> | 15 Apr 2025; V/Q/D, Notion Mail launch, custom views, AI labeling |
| R1 | <https://www.raycast.com/blog/raycast-for-ios> | 30 Apr 2025; V/D, mobile Home, AI and Notes |
| R2 | <https://www.raycast.com/changelog/1-97-0> | 30 Apr 2025; D, platform launch corroboration |
| F1 | <https://www.figma.com/blog/introducing-figma-make/> | 7 May 2025; V/D, prompt/result and point-to-element editing |
| A1 | <https://blog.adobe.com/en/publish/2025/04/24/adobe-firefly-next-evolution-creative-ai-is-here> | 24 Apr 2025; D, Firefly/Boards beta context |
| A2 | <https://blog.adobe.com/en/publish/2025/09/24/firefly-boards-launches-globally-now-with-runway-aleph-moonvalley-marey-models-new-powerful-ideation-features-flexible-offers> | 24 Sep 2025; V/D, Boards worldwide availability and pictured canvas |
| O1 | <https://blogs.opera.com/news/2025/09/opera-neon-agentic-ai-browser-release/> | 30 Sep 2025; V/D, first invitations, browser, Cards and Make |

Access caveats: the initially tried Anthropic news preview URL was unavailable; C1/C3 supplied dated first-party verification. Several guessed Perplexity blog URLs failed; P1/P2/P3 supplied the verified date and interface instead. Figma's article HTML was blocked to the local reader; its first-party article and CDN images were retrieved through the research reader/direct media. Dia's embedded video download failed; its animation claims remain D. Codex video streaming could not be inspected; only its official poster is V. No failed fetch is treated as evidence.

## 4. Detailed product analyses

### 4.1 Granola

| Field | Finding |
| --- | --- |
| Product | Granola, especially the desktop notepad pictured in the 2026 redesign. |
| Launch / redesign date | 2 Feb 2026 product/brand pass [G1]; not its original 2024 launch. |
| Source | G1 V/D, G2 D, G3 D. |
| Why it feels current | The object is a meeting note, not a dashboard describing note-taking. Controls congregate at the edge of the work. |
| App shell | Quiet native-window treatment; broad uninterrupted note surface. The pictured note hides or omits wider navigation; whole-app sidebar behavior is U. |
| Navigation | Bottom prompt/action cluster and small window controls in the inspected note. Chat/Recipes exist in documented adjacent workflows. |
| Typography | Modest meeting-name heading, sparse metadata, short labels. G1 identifies Melange for UI and Quadrant for display; this does not mean every product heading uses the display face. |
| Surfaces | One pale note plane; a raised bottom input/control cluster. Window shadow separates app from campaign backdrop. Exact elevation count across the app is U. |
| Color | Restrained pale interior with small green cues; the surrounding pink/lime campaign is not the note canvas. |
| Density | Relaxed writing space, compact control density. A blank note is legitimate work space. |
| Iconography | Hand-drawn spiral identity contrasts with restrained utility controls. |
| Motion | G2 documents window/contrast polish. No note-opening or hover sequence inspected. |
| AI integration | Human note-taking and AI enhancement share the note context; saved prompts extend captured knowledge. Correction/review is more useful than a separate AI dashboard. |
| Distinctive detail | The team explicitly links identity to the calm of a dependable notebook amid busy work. |
| What feels generic | Prompt input and pill actions are widespread conventions. |
| What Avenlyo could learn | Let the real work object establish identity; align brand with the experience people want. |
| What Avenlyo must not copy | Lime/pink, slab-serif styling, empty-note proportions, or a recording metaphor for customer support. |

Granola's team says the old **homepage** looked interchangeable with SaaS companies and also describes its first substantial product visual pass. These are connected claims, not proof that a logo swap alone transformed the product. Its useful precedent is consistency between promise, object and everyday controls [G1].

### 4.2 Dia

| Field | Finding |
| --- | --- |
| Product | Dia's browser environment, 2026 navigation, chat/thinking and polish. |
| Launch / redesign date | 2025 product; multiple 2026 refreshes, especially 23 Apr and 9/30 Jul [D2]/[D5]/[D6]. |
| Source | D1 V; D2–D8 D. 2026 settings pixels and live transitions U. |
| Why it feels current | Browser organization doubles as work context; interface changes seek continuity while pages, profiles and AI state change. |
| App shell | Native titlebar/window controls, narrow object sidebar, low-profile toolbar and one dominant content plane in the tour poster. |
| Navigation | Toggleable sidebar, alternative top tabs, grouped tabs, command bar, contextual split controls [D3]. Not an abandonment of sidebars. |
| Typography | Compact tab/group labels; large new-tab input instead of a page-title/subtitle stack. Content dictates the reading scale. Font identity U. |
| Surfaces | Content is inset inside a browser frame; April update matches toolbar to page headers [D2]. Split panes have independent context [D3]. |
| Color | Profile/content tint supports orientation. A January new-tab gradient/shimmer exists [D8]; gradients have not universally vanished. |
| Density | Dense navigation beside a relaxed start surface; tighter tab spacing and neutral groups in April. |
| Iconography | Favicons identify objects; window/browser controls retain recognizable meanings. |
| Motion | D4 reports swipe affordance redesign and rubber-banding at sidebar limits. D7 reports reduced seams/layout churn while web content stays anchored. Easing/timings U. |
| AI integration | Command entry, attached tab context and expandable in-timeline thinking [D5]/[D6]; thought display is not proof of a faithful reasoning trace. |
| Distinctive detail | Context-preserving movement is treated as product quality, not decorative entrance animation. |
| What feels generic | It still includes a familiar sidebar/chat/input arrangement. |
| What Avenlyo could learn | Change workspace density without losing the selected customer, reading position or action context. |
| What Avenlyo must not copy | Browser tab sprawl, implicit automatic grouping, shimmer as business state, or rubber-band motion merely to appear native. |

The 2026 settings refresh introduces sidebar navigation and redesigned Privacy/Memory panes [D5]. The evidence supports their existence and purpose, not their exact layout. Likewise, the new-tab poster is current public marketing material of unknown image date; it must not be labeled a captured April build.

### 4.3 Wispr Flow

| Field | Finding |
| --- | --- |
| Product | Cross-app dictation utility; Android is the qualifying new product. |
| Launch / redesign date | 23 Feb 2026 Android [W1]. Desktop/iPhone are separate platform implementations. |
| Source | W1 D; W2 V/Q/D; W3/W4 D. |
| Why it feels current | The service becomes a small temporary capability within an existing task. There is little reason to visit a dashboard during dictation. |
| App shell | Host app remains primary; Android capture floats over its text field. Settings/history can still have their own app. |
| Navigation | Desktop hotkey documented; Android contextual bubble; iPhone uses a different keyboard-based integration. Do not generalize Android's overlay to iOS. |
| Typography | The host owns most text. Utility copy is short; dictated output remains ordinary editable text. |
| Surfaces | Compact dark/translucent-looking capture surface and rounded waveform/action controls in the demo. Actual material blur implementation U. |
| Color | Small lavender/pale accents distinguish recording controls; surrounding messaging colors belong to the host. |
| Density | Extremely compact utility above an already dense communication interface. |
| Iconography | Waveform, cancel and confirm communicate a temporary input operation. |
| Motion | Ordered demo frames show capture text, revision and insertion back into the host; demo includes presentation movement. Native timing and hover U. |
| AI integration | Speech becomes corrected/formatted text in place. Self-correction is part of input, not a second chat conversation. |
| Distinctive detail | Android availability follows the presence of a text field [W2]. |
| What feels generic | W4 documents a conventional desktop Hub with sidebar, history and statistics. Its pixels were not comprehensively inspected. |
| What Avenlyo could learn | Put a narrowly scoped control exactly where intervention happens; let it recede afterward. |
| What Avenlyo must not copy | Hidden availability, voice-only navigation, tiny targets, or ambiguous automatic customer-message sending. |

Desktop deserves its own distinction: W3 documents a bar with resting, recording and processing states that adapts to Dock/taskbar and full-screen context. W4 documents a full Hub for history/settings. Flow avoids making **dictation** a dashboard visit; it does not remove every conventional management surface. The iPhone app has tabs and a side menu; Android has bottom navigation, alongside its contextual bubble. These are platform-specific decisions, not one floating shell copied everywhere.

### 4.4 Superhuman Docs

| Field | Finding |
| --- | --- |
| Product | July 2026 Docs redesign, not old Coda UI. |
| Launch / redesign date | 8 Jul 2026 [S1]/[S2]. |
| Source | S1 V/D, S2 V/Q/D, S3 V. |
| Why it feels current | The document remains the durable shared result; AI acts on that document instead of trapping output in a private chat. |
| App shell | Page navigation on the left, working document in the center, optional AI/comments on the right in the official demo. |
| Navigation | Page tree and object toolbar; contextual side panel; in-doc work remains the anchor. Keyboard/launcher behavior U here. |
| Typography | Custom Super Sans/Serif/Mono family described in S1. Document title is substantial; utility labels are compact. Large titles remain appropriate for authored documents. |
| Surfaces | Explicit desk/paper elevation model: canvas sits above quieter navigation/panels. Fine borders and differentiated planes, not universal flattening. |
| Color | Warm framing, white content; selective purple. S1 says purple was removed from ubiquitous selected states. |
| Density | Dense editable tables can occupy an entire page. Current does not mean fewer tables. |
| Iconography | S1 reports over 500 mapped custom icons, plus expressive completion/empty-state illustrations. |
| Motion | Demo sequence replaces comments with AI, shows working state, then an editable tracker. Editorial zooms are not native panel transitions. |
| AI integration | AI builds/changes shared text, tables and workflows. July AI Views and Databases were closed beta, not universal released capabilities. |
| Distinctive detail | Brand frames the user's canvas without taking authorship away. |
| What feels generic | Sidebar plus AI panel; colored table status chips. These coexist with a contemporary redesign. |
| What Avenlyo could learn | Give conversation and controls different visual priority; put generated results in inspectable durable objects. |
| What Avenlyo must not copy | Warm paper identity, proprietary font/icons, collaborative abilities or generated interactive views beyond its backend. |

### 4.5 Superhuman Go

| Field | Finding |
| --- | --- |
| Product | Go 1.0 contextual assistant and agent controls. |
| Launch / redesign date | 12 Aug 2026 major release; announced Oct 2025 [S4]. |
| Source | S4 V/Q/D; inspected suggestion sequence, builder and full-screen crops. |
| Why it feels current | Assistance begins beside the relevant sentence in the user's current app. Opening another destination is optional. |
| App shell | Primarily a layer in host applications; separate builder and full-screen assistant also exist. |
| Navigation | Underlined text opens a contextual suggestion; sources/agent identity attach to the intervention. Full-screen input is an alternative. |
| Typography | Host prose dominates; concise edit preview; larger New Agent title belongs to configuration. |
| Surfaces | Small raised suggestion over a document; builder has rounded fields and grouped metadata. Whole-window elevation U. |
| Color | Purple emphasizes edits/actions. Promotional blue/green backgrounds are outside the app surface. |
| Density | Compact assistance, more relaxed setup; not one density for every task. |
| Iconography | Agent mark and source-app identities help explain the suggestion's origin. |
| Motion | Demo shows typing → underlines → suggestion with sources and changed words → accepted text. No native easing claim. |
| AI integration | Proactive source-grounded correction and contextual assistance; humans review edits. A visible source count is stronger evidence than a generic sparkle. |
| Distinctive detail | The pictured correction names the knowledge-checking agent and displays source services beside the change. |
| What feels generic | Full-screen prompt and conventional builder form. |
| What Avenlyo could learn | Explain the reason for an intervention alongside the affected content, when real evidence exists. |
| What Avenlyo must not copy | Proactive rewriting of customer history, confidence claims, or agent progress/sources unavailable in its payload. |

### 4.6 Notion 2026 Agent and mobile surfaces

| Field | Finding |
| --- | --- |
| Product | Mobile Agent, recording, Custom Agents and their controls. |
| Launch / redesign date | 20 Jan and 24 Feb 2026 [N1]/[N2]. |
| Source | N1 V/D; N2 V/Q/D; N3/N4 D. Old Notion layouts excluded. |
| Why it feels current | Work can be delegated from mobile and continued in the background; the interface keeps context and control nearby. |
| App shell | Mobile Agent composer over a work surface; recording also represented in a persistent system activity. Custom Agents integrate with the workspace. |
| Navigation | Agents accessible in sidebar/search [N3]. The inspected Jan image does not establish a complete mobile Home redesign. |
| Typography | Readable multiline prompt, short source scope and prominent recording status; custom-agent names can be expressive. |
| Surfaces | White rounded composer with light border/shadow; black recording activity with Stop. App UI and OS surface have different jobs. |
| Color | Blue action, mostly neutral work surface; colored agent identities distinguish instances. |
| Density | Relaxed input with compact context attachments; administrative controls remain denser. |
| Iconography | Characterful agent marks plus familiar attachment/source icons. |
| Motion | Official creation sequence shows intent and source connections becoming an agent object; it is an explanatory animation, not a live creation-time measurement. |
| AI integration | Goal, permitted sources, triggers and admin supervision make agents operational entities [N2]/[N4]. |
| Distinctive detail | Taking notes remains visibly stoppable while the user leaves the page or locks the phone [N1]. |
| What feels generic | Sidebar, form controls, agent cards and conventional settings still exist. |
| What Avenlyo could learn | Keep automation state and the human control available across context changes. |
| What Avenlyo must not copy | General-purpose agent creation, persistent background claims or an All sources scope without explicit authorization. |

**Mobile Home evidence limit:** mobile Agent and recording were visually inspected; an exact 2026 main-app Home layout was not independently verified. It is not used as a pixel/layout reference. Avenlyo should not derive a replacement Home from an assumed Notion screenshot.

### 4.7 Claude Cowork and unified Claude

| Field | Finding |
| --- | --- |
| Product | Cowork's task environment and its September integration into Claude. |
| Launch / redesign date | 12 Jan 2026 preview [C1]; 16 Sep unification [C3]. |
| Source | C1 D, C2 V/D, C3 D. Unified rollout interactions not hands-on. |
| Why it feels current | Task intent can determine the working tools; users need not classify a request as chat versus delegated work first. |
| App shell | Pictured compact native window with task on the left and built-in browser on the right. This is a Cowork example, not proof of every unified screen. |
| Navigation | Task title and local controls; history/sidebar not shown in this crop. September removes a mode choice; does not prove removal of all navigation. |
| Typography | Readable prose, compact tool-state lines and short browser title; the task identifies the workspace. |
| Surfaces | Adjacent light task/browser panes; browser is a nested working tool with its own URL identity. |
| Color | Near-neutral interior; mint presentation backdrop belongs to the promotional image. |
| Density | Low chrome, moderate execution detail, result can open alongside dialogue. |
| Iconography | Tool-specific browser/progress symbols communicate activity; brand remains secondary. |
| Motion | Still evidence only for the inspected screenshot. Unification behavior documented, not visually timed. |
| AI integration | Files/tools access, ongoing steering, reviewable artifacts and permission choices are product concepts [C2]/[C3]. |
| Distinctive detail | September explicitly removes deciding where a task belongs, preserving context in one conversation. |
| What feels generic | Dialogue bubbles and right-hand tools remain familiar. |
| What Avenlyo could learn | Reduce navigation decisions while preserving a stable work object and explicit consequential actions. |
| What Avenlyo must not copy | General-purpose file/browser permissions, autonomous tasks or a prompt that implies unsupported configuration. |

C2 contains both a unification banner and older copy instructing users to switch modes. C3 is the dated source for the change. This study does not silently combine old screenshots with a claim that they depict the complete September interface.

### 4.8 Codex desktop launch app

| Field | Finding |
| --- | --- |
| Product | February desktop app, deliberately treated as a dated launch reference. |
| Launch / redesign date | 2 Feb 2026 [X1]. Current developer docs redirect to broader ChatGPT desktop documentation; they are not used as February imagery. |
| Source | X1 D; X2 official poster V only. |
| Why it feels current | Work is organized as ongoing delegated threads and reviewable changes, rather than a single synchronous answer. |
| App shell | Native window; pale sidebar and white rounded main plane in the poster. |
| Navigation | Projects/threads, New thread, Automations and Skills; window toolbar holds Open/Commit. Sidebar collapse control pictured; behavior U. |
| Typography | Small thread labels, a moderate central invitation and compact execution/context labels. |
| Surfaces | One main plane adjacent to quieter navigation; outlined composer and small suggestion objects. Exact translucency U. |
| Color | Restrained neutrals; desktop wallpaper is not product color. |
| Density | Dense thread navigation but unusually relaxed empty main area. Counterexample to declaring blank canvases obsolete. |
| Iconography | Project folders, task states and recognizable work actions. No icon-family identification inferred. |
| Motion | U. The launch video poster is not evidence of transitions, hover or streaming. |
| AI integration | Parallel threads, diffs, comments/manual correction and automation review queue described in X1. |
| Distinctive detail | The output is something to review/apply; automation returns to review rather than claiming success through a decorative card. |
| What feels generic | Familiar sidebar, prompt box and start suggestions. |
| What Avenlyo could learn | Make supervision and review the primary task model. |
| What Avenlyo must not copy | Developer density, technical controls, worktree concepts or simulated long-running agent traces. |

### 4.9 Perplexity Computer

| Field | Finding |
| --- | --- |
| Product | Computer's execution and review surface. |
| Launch / redesign date | 25 Feb 2026 [P1]; corroborated by release-week P2. |
| Source | P1/P2 D; P3 V/D. |
| Why it feels current | A task becomes a sequence of inspectable operations and outputs, rather than just a final answer in a bubble. |
| App shell | Inspected official crop centers execution content. Full permanent navigation/window frame is U, not assumed absent. |
| Navigation | Expandable execution groups and subagent/result objects; broader launcher/keyboard model U. |
| Typography | Reading prose contrasted with compact tool lines and monospaced command detail; type carries hierarchy between explanation and operation. |
| Surfaces | Dark continuous reading plane with indentation/rules, plus a bordered subtask container. Containers remain where they define separate work. |
| Color | Near-black/brown pictured canvas with muted operational text and a small branded accent. Other themes U. |
| Density | High detail is disclosed within a readable narrative sequence. |
| Iconography | Distinct tool/action/completion marks label execution. |
| Motion | U from stills. Do not infer live progress speed from the pictured elapsed duration. |
| AI integration | Task decomposition, tools, connected services, background execution and continued guidance [P2]/[P3]. |
| Distinctive detail | Work summary, command execution and a separately identified subtask coexist without turning every line into a chat bubble. |
| What feels generic | Expandable tool traces and chat entry are increasingly shared conventions. |
| What Avenlyo could learn | Expose useful evidence at the correct depth; separate current state from generated prose. |
| What Avenlyo must not copy | Code traces, model labels, invented subagents or a progress timeline unsupported by real events. |

### 4.10 New Tana

| Field | Finding |
| --- | --- |
| Product | New team/meeting product, distinct from the renamed Tana Outliner [T1]. |
| Launch / redesign date | 31 Mar 2026 announcement; inspected 5 Jun and 8 Oct material [T2]/[T3]. |
| Source | T1 D, T2 V/D, T3 V/D. |
| Why it feels current | Meeting, agent and resulting work objects are connected; capture is a route to outcomes rather than a transcript destination. |
| App shell | Native window with labeled spaces/sidebar and a quiet content plane. It is not sidebar-free. |
| Navigation | Space home, Library/search filters and a local in-call create menu. Oct mobile includes Lock Screen/Siri entry [T3]. |
| Typography | Moderate space title; compact utility labels; pinned objects and recent-item rows supply hierarchy without many borders. |
| Surfaces | Touching pale planes at home; raised meeting menu over an ambient call surface. Context changes the surface model. |
| Color | Subtle lavender/gray framing, small colored object/type marks; not one large AI gradient. |
| Density | Medium-density home, compact contextual call controls. |
| Iconography | Type and workflow state travel with inline mentions; task icon progressively fills [T2]. |
| Motion | Hover preview documented; no timing, interpolation or voice-agent animation claim from stills. |
| AI integration | Meeting wrap-up proposes outcomes; pinned documents guide updates. Proposed work remains an object people can inspect. |
| Distinctive detail | Create menu distinguishes shared from private output within the meeting. |
| What feels generic | Home still uses pinned cards, filters, navigation rows and an activity dashboard. |
| What Avenlyo could learn | Attach intervention and consequence to the conversation, and make visibility/ownership unambiguous. |
| What Avenlyo must not copy | Meeting-room metaphors, organization spaces, synthesized outcomes or continuous-agent capabilities outside its contract. |

### 4.11 Notion Mail

| Field | Finding |
| --- | --- |
| Product | New Mail product; useful direct counterexample for Inbox/navigation. |
| Launch / redesign date | 15 Apr 2025 [M1]. |
| Source | M1 V/Q/D; launch imagery, not a claim about every October 2026 feature. |
| Why it feels current | Personal views reorganize existing email around the user's work; AI changes organization rather than merely adding chat. |
| App shell | Clearly labeled full-height sidebar, flat message list, quiet view title. |
| Navigation | Search, custom views and traditional mail folders coexist. View switching changes grouping in the same working place. |
| Typography | Small title; sender/subject weight and section labels carry list hierarchy. No giant intro paragraph. |
| Surfaces | Adjacent pale navigation and white list plane; selected row tint; no per-email cards. |
| Color | Mostly neutral with small category/emoji identity and unread dots. Unread is a real email capability, not transferable decoration. |
| Density | Compact scan rows, generous separation between meaningful groups. |
| Iconography | User-oriented view marks plus conventional mail controls. |
| Motion | Official sequence switches Hiring/Support/Travel, replacing grouped rows; interpolation and latency U. |
| AI integration | Auto-labeling and drafting described in the release; AI can create persistent organizational structure. |
| Distinctive detail | The same mail can be presented through a purposeful view instead of a new rigid module. |
| What feels generic | It deliberately preserves the recognizable email sidebar. |
| What Avenlyo could learn | Improve the selected queue/conversation relation before eliminating familiar navigation. |
| What Avenlyo must not copy | Unread indicators, custom filters, categories, search or auto-routing that Avenlyo does not have. |

### 4.12 Raycast for iOS

| Field | Finding |
| --- | --- |
| Product | 2025 mobile app, not mature Raycast macOS as a control. |
| Launch / redesign date | 30 Apr 2025 [R1]/[R2]. |
| Source | R1 V/D, R2 D. Angled product imagery limits exact geometry. |
| Why it feels current | Portable commands, quick capture, notes and AI are composed around frequent personal actions. |
| App shell | Mobile home with favorites/actions; dark material and native phone framing in launch imagery. |
| Navigation | Quick actions and content lists; complete bottom-navigation/overlay behavior U in inspected crops. Desktop keyboard-first behavior is not assumed for the phone. |
| Typography | Compact labels for actions and notes; hierarchy follows objects rather than dashboard statistics. |
| Surfaces | Small favorite tiles and list rows against a continuous dark plane. Exact blur/elevation U. |
| Color | Individual action/service icons carry color while the frame stays restrained. |
| Density | Dense but touch-oriented, with short high-frequency choices. |
| Iconography | Recognizable service/action icons are the primary scanning aid. |
| Motion | U; embedded walkthrough was not inspected. |
| AI integration | Mobile AI chat, commands and notes are available [R1]; not evidence of autonomous supervision or permissions design. |
| Distinctive detail | The home is a reusable set of things to do, not a report about having done them. |
| What feels generic | Favorites grids and chat are standard mobile patterns. |
| What Avenlyo could learn | Mobile can prioritize a few frequent actions independently of desktop navigation. |
| What Avenlyo must not copy | Icon-only discovery, command terminology, personal utility breadth or a grid of unsupported shortcuts. |

### 4.13 Figma Make

| Field | Finding |
| --- | --- |
| Product | Make's prompt/edit/preview environment; generated output excluded from chrome analysis. |
| Launch / redesign date | 7 May 2025 [F1], initial launch stage. |
| Source | F1 V/D, official prompt/result crops. |
| Why it feels current | Request, working result and targeted correction share the same context. The next action can point at the thing being changed. |
| App shell | Dialogue beside preview in the inspected crop; full file browser/navigation U. |
| Navigation | Point-and-prompt selection, attached design context and local preview. Standard surrounding Figma navigation is not reconstructed from memory. |
| Typography | Chat text is readable and hierarchical; preview typography belongs to the generated design. |
| Surfaces | Clear separation between dialogue and result; input/attachment/result objects use boundaries. Generated modal shadow is not Make's surface system. |
| Color | Neutral chat surface with purple action/focus. Orange/cream music-player styling is output. |
| Density | Moderate dialogue, large preview because the result requires inspection. |
| Iconography | Attach image, selection and send distinguish ways of supplying context. |
| Motion | U. Text asking to animate a settings panel is not proof of the animation occurring. |
| AI integration | Existing frames/context → generated interactive output → pointed correction; direct manipulation remains valuable. |
| Distinctive detail | Selection identifies the correction target instead of forcing a long textual locator. |
| What feels generic | Chat-left/result-right is already a common AI composition. |
| What Avenlyo could learn | Keep human correction close to its target, with clear scope. |
| What Avenlyo must not copy | A prompt-to-build operating model or arbitrary generated interfaces for a bounded customer-support product. |

### 4.14 Adobe Firefly Boards

| Field | Finding |
| --- | --- |
| Product | Boards ideation surface, not the older entire Creative Cloud suite. |
| Launch / redesign date | 2025 beta context [A1]; worldwide release 24 Sep 2025 [A2]. |
| Source | A1 D; A2 V/D. |
| Why it feels current | The spatial arrangement of references is the workspace; tools attach to creating and comparing work. |
| App shell | Thin top bar over a large dark board; small tool rails and floating bottom action group in the official screenshot. |
| Navigation | Spatial canvas, local tools and generation actions. Keyboard/search and complete settings are U. |
| Typography | Tiny board/tool labels; visual content establishes the surface. No repeated hero heading. |
| Surfaces | One open plane with differently sized overlapping assets; compact floating tools. Not a grid of identical containers. |
| Color | Dark neutral chrome leaves authored images to carry color. |
| Density | High content density but low permanent chrome. Blank space between references is part of the composition. |
| Iconography | Tool-specific creation and manipulation controls. |
| Motion | Dragging is appropriate to this product model; no drag animation/easing was inspected, so none is asserted. |
| AI integration | Generation and exploration alongside references; result is another editable/arrangeable asset, not merely an answer. |
| Distinctive detail | Multiple assets remain visible for comparison while generation tools occupy little area. |
| What feels generic | Familiar creative-app toolbar and dark canvas. |
| What Avenlyo could learn | Distinct object types need not share identical card geometry. |
| What Avenlyo must not copy | Infinite spatial navigation for urgent conversations; it would undermine predictable reading and action. |

### 4.15 Opera Neon

| Field | Finding |
| --- | --- |
| Product | Agentic browser released to initial invitees in 2025; not the 2016 concept browser. |
| Launch / redesign date | 30 Sep 2025 first rollout [O1], not full public availability on that date. |
| Source | O1 V/D, browser and Make screenshots. |
| Why it feels current | Browser task execution, reusable instructions and generated output are connected to a browsing environment. |
| App shell | Standard browser frame and narrow side rail; more immersive agent/start surfaces inside it. |
| Navigation | Browser tabs/rail plus Chat/Do/Make concepts and reusable Cards described in O1. |
| Typography | Compact browser controls; stronger centered invitation at start; execution text becomes denser during work. |
| Surfaces | Scenic start backdrop, floating prompt; Make screenshot places execution beside a result/inspection window. |
| Color | Dark/translucent-looking controls over expressive imagery; actual blur material U. |
| Density | Relaxed entry, dense active execution; changes with the task. |
| Iconography | Browser/service symbols plus agent/product identity. |
| Motion | U. Still imagery cannot establish animated wallpaper, panel transitions or resizing. |
| AI integration | Work may continue in cloud execution; progress/result surfaces make the task more than chat [O1]. |
| Distinctive detail | Reusable Cards turn repeated intent into a product object. |
| What feels generic | Large centered prompt and atmospheric AI imagery can themselves become a template. |
| What Avenlyo could learn | Separate the starting invitation from active operational density. |
| What Avenlyo must not copy | Scenic robots, visual distraction behind customer messages, autonomous website tasks or uncertain delivery hidden by progress theater. |

## 5. Generational matrix

Scores are **analytical judgments about the inspected surfaces**, not objective facts, product quality scores, accessibility scores or adoption data. Scale: 1 = module/dashboard-led administrative composition; 10 = work/context-led environment with a materially different interaction model. Dimensions considered: navigation follows work, controls appear in context, AI changes the operating model, surfaces/identity are coherent, and state continuity. Limited evidence reduces confidence; it does not justify inventing behavior. A low score is not a recommendation to discard a familiar pattern.

| Product | Year | Traditional SaaS ↔ new-generation score | Navigation model | Surface model | Visual identity source | AI integration model | Motion importance* | Density | Most important lesson |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granola | 2026 redesign | 9 | Note + edge actions | Single note, floating controls | Typography, imperfect mark, calm behavior | Capture/enhance/use meeting context | Medium / U | Relaxed work, compact controls | Let the work object lead |
| Dia | 2025 / 2026 refreshes | 9 | Command + dynamic tabs/sidebar | Content-matched window and contextual splits | Native coherence and continuity | Page/tab context, expandable work state | High / D | Mixed | Preserve orientation while the shell adapts |
| Wispr Flow | 2026 Android | 10 | Hotkey/context bubble | Temporary utility over host | Product behavior, waveform, concise controls | AI as input transformation | High / Q, native U | Very compact | Availability need not be a destination |
| Superhuman Docs | 2026 redesign | 8 | Page tree + local tools | Raised paper above quiet chrome | Custom type/icons/elevation | Shared editable artifacts | Medium / Q | Mixed/dense tables | Modernity can retain a familiar shell |
| Superhuman Go | 2026 1.0 | 9 | Contextual suggestion + separate full screen | Local overlay | Agent identity, edit/source language | Proactive correction/actions | High / Q | Compact + relaxed setup | Show why help appears here |
| Notion new surfaces | 2026 | 8 | Sidebar/search + mobile action | Composer, agent objects, OS recording state | Characters, type, persistent state | Configured triggers/tools/supervision | Medium / Q illustration | Mixed | Make automation controllable across contexts |
| Claude unified work | 2026 | 9 | Intent → tools, unified conversation | Task + adjacent tools/artifacts | Quiet prose and task continuity | Delegate, steer, review | High / U | Mixed | Remove an unnecessary mode decision |
| Codex launch app | 2026 | 8 | Projects/threads + review queue | Quiet sidebar + work plane | Task states, review mechanics | Parallel work, diffs, review | Medium / U | Dense nav, relaxed start | Supervision is the job |
| Perplexity Computer | 2026 | 8 | Task + expandable execution | Continuous prose with nested tasks | Type hierarchy, operation detail | Orchestrated work + results | High / U | Medium/high detail | Disclose execution at useful depth |
| New Tana | 2026 | 9 | Spaces + contextual meeting controls | Quiet home, ambient call, local menu | Object/state grammar and voice | Capture → proposed outcomes | High / U | Mixed | Keep outcomes connected to their context |
| Notion Mail | 2025 | 7 | Labeled sidebar + personal views | Flat grouped rows | Editorial hierarchy, view identity | AI organization/drafting | Medium / Q | Compact | The sidebar is not the problem by itself |
| Raycast iOS | 2025 | 8 | Frequent actions + content | Compact mobile home/list | Recognizable action icons | AI commands/chat and capture | Medium / U | Compact | Mobile deserves its own priorities |
| Figma Make | 2025 | 8 | Dialogue + pointed correction | Prompt/preview split | Direct manipulation/context | Generate then target edits | High / U | Mixed | Correction needs a target |
| Firefly Boards | 2025 | 9 | Spatial canvas + tools | Open board + floating controls | Authored content/layout | Generate alongside references | High / U | Content-dense | Use geometry suited to the object |
| Opera Neon | 2025 | 8 | Browser + action modes/Cards | Immersive start + execution/result | Scenic identity and task behavior | Browser/cloud work | Medium / U | Mixed | Entry state and working state differ |

*Motion importance is a design assessment; the evidence suffix says what was inspected. “High / U” means motion would matter greatly in this interaction model but was not verified, not that the product has exemplary motion.*

## 6. 2023 SaaS grammar vs 2026 product grammar

This is an analytical contrast between common design grammars, **not a claim that all 2023 products looked alike or that all 2026 products adopted the right column**. Each newer pattern has counterexamples above.

| Area | Conventional SaaS grammar | Newly current grammar in the evidence | Avenlyo implication |
| --- | --- | --- | --- |
| Shell | Stable module map frames every screen | Work object controls the amount/type of chrome; Dia, Wispr, Tana | Vary shell visibility by job, preserve business identity |
| Navigation | Choose module, then find object, then action | Command, object, direct contextual action, or personal view | Test queue/object navigation; keep visible discoverable routes |
| Home | Product H1/subtitle, KPI row, recent activity | Start work, resume an object, or see actionable work; Granola/Raycast | Distinguish setup and active work; remove redundant introduction |
| Inbox/list-detail | Permanent nav/list/thread/inspector | Flat purposeful views or local inspection; Mail/Claude | Reopen persistent context; master/detail remains valid |
| Forms | Full page of equivalent fields | Scoped edit surface or object-specific controls; Go/Tana | Show consequences of structured settings without repeating the form |
| Settings | Same layout as normal work pages | Secondary dedicated navigation; Dia still uses a sidebar | Ordinary settings are fine; reduce competition with live work |
| AI | Separate chat destination or sparkle action | Input utility, in-place edit, durable result, supervised work | Express actual answering/paused/claim state around the thread |
| Messages | Every actor/state rendered as a bubble | Prose, tool state, sources and artifacts use distinct grammar | Customer messages stay readable; operational truth need not become chat |
| Empty states | Empty card plus explanatory paragraph | Actionable starting object/invitation; Granola/Codex | Truthful setup action, or calm absence; never fake workload |
| Buttons | Repeated generic primary/secondary rows | Local action tied to selected content or current state | One clear next safe action; keep consequential labels explicit |
| Cards | Uniform bordered rectangles for all objects | Rows for lists, planes for writing, compact overlays for intervention | Do not put all state, content and navigation in the same shape |
| Typography | Recurring H1/subtitle on every route | Work-object title and stronger local hierarchy; Docs keeps big document titles | Remove duplicate route headings, keep useful customer/page identity |
| Motion | Added fade/slide polish after composition | Continuity, context change and availability are behavior; Dia | Preserve reading/focus while state changes; no ornamental agent motion |
| Mobile | Shrink sidebar and stack desktop panels | Native entry/capture, system status, focused task surface | Preserve thread-first mobile; reconsider Home independently |
| Brand integration | Accent plus typeface applied to components | Product promise, icon language, geometry and behavior agree | Define identity through dependable human intervention |

## 7. Navigation findings

The evidence rejects a binary “sidebar versus no sidebar” conclusion. Dia, Mail, Docs, Tana and Codex all retain left navigation somewhere. What changes is **what it contains and whether it must remain visible**: active objects and groups, personal views, projects/threads, pages or spaces, rather than an equal-weight directory of features.

Below, “shown” means V/Q; “documented” means D. **U means unknown, not absent.** A dash means not applicable to the inspected surface, such as an OS titlebar for a mobile app. This inventory avoids claiming that a missing control in a crop does not exist.

| Product | Permanent / collapsible sidebar | Command / launcher | Floating / contextual controls | Tabs / native titlebar | Bottom / overlay navigation | Keyboard-first |
| --- | --- | --- | --- | --- | --- | --- |
| Granola | U in isolated note | Chat input shown; global launcher U | Bottom control cluster shown | Native window shown; tabs U | Bottom actions; full nav U | U |
| Dia | Sidebar shown; toggle documented | Command bar documented | Split/PiP/context controls documented | Top/side tabs; native window | Command overlay documented; bottom nav U | Shortcuts documented |
| Wispr | Capture utility has no sidebar; desktop Hub sidebar documented | Desktop hotkey documented | Android bubble shown; desktop Flow Bar documented | Host frame; iPhone tabs documented | Android bottom nav, iPhone side menu and capture overlays documented | Desktop hotkey; mobile touch |
| Docs | Page sidebar shown; collapse U | Local AI entry; launcher U | Document toolbar/panel shown | Browser/app frame; tabs U | Local panel; mobile U | U in study |
| Go | Host owns navigation; builder separate | Full-screen prompt shown | Underline/suggestion shown | Host frame; standalone window shown | Suggestion overlay shown | U |
| Notion 2026 | Agent sidebar/search documented | Agent creation/input shown | Composer and recording state shown | Mobile —; desktop full shell U | Agent overlay shown; exact Home/bottom nav U | U |
| Claude | History outside crop U | Unified intent entry documented | Task/browser controls shown | Native window shown; tabs inside tool | Adjacent tool pane shown; mobile nav U | U |
| Codex launch | Sidebar shown; collapse affordance shown | New thread shown; command launcher U | Thread/review toolbar shown | Native titlebar shown; object tabs U | Review queue documented; overlay U | U in inspected evidence |
| Computer | Full shell U | Task prompt documented | Expandable task/tool objects shown | U | U | U |
| Tana | Space sidebar shown; customizable sidebar documented | Search/Create menu documented/shown | In-call menu shown | Native window shown | Mobile OS entry documented; bottom nav U | U |
| Mail | Full-height labeled sidebar shown; collapse U | Search shown | View controls shown | Full native titlebar U in crop | U | U |
| Raycast iOS | — | Quick actions shown | Mobile action/content surfaces shown | — | Exact bottom/overlay navigation U | Mobile touch; shortcut integration documented in R1 |
| Make | Full file sidebar U | Prompt entry shown | Point-and-prompt documented | Preview beside dialogue; frame U | U | U |
| Boards | Tool rail shown, not a module sidebar | Launcher U | Floating action group shown | Thin app top bar shown | Bottom tool group shown; overlays U | U |
| Neon | Narrow rail and top tabs shown | Prompt/Cards documented | Make execution/result shown | Browser tabs/titlebar shown | Floating prompt shown | U |

**Does Avenlyo need a full-height labeled sidebar?** It remains a credible discoverability option for business owners, especially during setup. It should cease to be a locked visual requirement. Compare it with an object-centered queue shell and with focused conversation mode. A compact rail is not automatically better: icons can hide meaning, hover-only labels exclude touch, and a command palette cannot be the sole route for infrequent users. Workspace identity, route recovery and a visible route to setup/settings must survive every experiment.

## 8. Surface architecture findings

The inspected products support at least four distinct models, not one universal “2026 surface”:

| Model | Evidence | Spatial rule | Appropriate transfer |
| --- | --- | --- | --- |
| Working plane with edge tools | Granola, Firefly Boards | Note/board occupies most space; tools gather at edges | Conversation receives space before administrative decoration |
| Layer within another task | Wispr, Go | Temporary utility floats over host; host remains legible | Narrowly scoped intervention/inspection; clear dismissal and return |
| Window with adjacent tools | Dia, Claude, Docs | Stable content anchor with optional/local tools | Context can appear without rebuilding the whole reading area |
| Quiet organizational plane | Mail, Tana, Codex | Rows/tree/object navigation touch a larger work plane | Familiar scanning can feel current with less redundant framing |

**Canvas and frame:** pale/warm content, dark content and content-colored frames all appear. The invariant is legible ownership of space. No color family determines generation. Avenlyo's white rounded plane is not intrinsically dated—Docs and Codex are direct counterexamples. It becomes unhelpful when it merely encloses another complete page hierarchy or treats navigation, state and content as equal nested surfaces.

**Elevation:** the visual samples often distinguish a base work plane, local controls and a temporary overlay. This is a description of visible layers, not a measured three-token system. Docs deliberately elevates the user's page above its chrome [S1]. Go elevates an edit suggestion because it is temporary. Do not add shadows to every object.

**Borders and seams:** Mail lists use typography/spacing, Computer uses indentation and thin rules, Boards uses asset placement. Fine borders still define inputs, separate tasks and document edges. Panes can touch; a floating control is justified by its different lifetime. Avenlyo should test whether the state strip belongs to the thread rather than painting it as a separate full-width slab.

**Translucency/radius:** several promotional images suggest translucent controls; screenshots cannot establish real OS materials. Rounded fields, bubbles and windows remain common, with different shapes for different objects. No universal radius or border/shadow values are justified by this study. Hover-only control availability remains U except where explicitly documented, such as Dia's player and Tana's previews.

### Per-product physical surface inventory

“Layers” below means distinguishable planes in the inspected image, not measured CSS elevation tokens. Exact radii/shadow parameters and whole-product layer counts remain U. All observations refer to the named pictured state.

| Product | Canvas / window frame | Visible hierarchy | Border, shadow, translucency and radius | Touching / floating panes; hover controls |
| --- | --- | --- | --- | --- |
| Granola | Pale note within native window | Note + raised edge controls | Soft window/control shadow; rounded input; material translucency U | Writing plane continuous; controls float; hover U |
| Dia | Pale tinted frame, light new tab | Frame/content + input | Rounded content edge and input; subtle input shadow; true materials U | Sidebar/content adjacent; prompt floats; player hover D |
| Wispr | Host-owned canvas | Host + temporary utility | Rounded dark capture and pill controls; apparent translucency not technically verified | Utility floats; desktop docking/hover menu D; standalone Hub pixels U |
| Docs | White document, warm quiet frame | Navigation/panels below document; local controls | Fine page/input boundaries, soft elevation, rounded window/panel corners | Adjacent navigation/document/panel; hover U |
| Go | Host-owned document | Host + suggestion | Rounded raised suggestion; border separates edit; promotional backdrop excluded | Local overlay; complete pane system U |
| Notion 2026 | White mobile work surface; separate OS activity | Work + composer; OS recording surface in another context | Fine rounded composer border/shadow; black rounded activity | Composer overlays work; recording persists outside page; hover — on phone |
| Claude | Light task/browser window | Task plane + adjacent nested browser | Rounded inset browser; modest window boundary; exact material U | Tool pane touches task region; native hover U |
| Codex launch | White main plane, pale sidebar | Navigation + main plane + input | Rounded main edge and composer; desktop window shadow in poster; blur U | Main pane touches sidebar; input is inset; hover U |
| Computer | Dark execution crop | Prose/tool indentation + bounded subtask | Thin rules and a rounded subtask outline; shadow/translucency U | Continuous reading surface; full window/pane geometry and hover U |
| Tana | Pale neutral/lavender window | Quiet home planes; raised in-call menu in separate state | Soft object fills and rounded menu; exact material U | Home navigation/content adjacent; meeting controls float; mention hover D |
| Mail | Pale sidebar, white list | Two adjacent planes + selected row | Very limited row borders; modest outer rounding in launch crop; no per-message shadows | Panes touch; full overlay/hover behavior U |
| Raycast iOS | Dark mobile surface | Home/content plus action/input objects | Rounded tiles/inputs; true blur/shadow hierarchy U from angled imagery | Contiguous phone surface; full overlay behavior U |
| Make | Light dialogue beside generated preview | Dialogue + input/result objects | Rounded dialogue/input boundaries; generated modal material is not app evidence | Split composition; full shell and hover U |
| Boards | Near-black board under thin top bar | Canvas + assets + small tool groups | Unframed assets of varied sizes; compact rounded tool groups | Assets coexist spatially; controls float; live hover/drag U |
| Neon | Browser frame around scenic/dark work surface | Browser + prompt; execution/result in Make | Rounded prompt/result panel, translucent-looking fills; actual blur U | Rail/content adjacent; prompt floats; hover U |

## 9. Typography findings

The most consistent change is **title economy**, not universally smaller type. Mail's view title, Granola's meeting title and Claude's task title identify their work without a separate product introduction. Docs needs a larger document heading because the user authored a document. Codex's empty invitation serves an entry task rather than a permanent route masthead. Figma's generated preview typography must not be mistaken for its app typography.

| Dimension | Observed tendency / counterexample | Avenlyo consequence |
| --- | --- | --- |
| Title size/frequency | Few competing titles; some large authored-object titles | Customer identity should outweigh “Inbox”; remove Home + product H1 repetition |
| Weight | Sender/object/section weight often replaces boxes | Differentiate customer, preview and handling instruction without three fills |
| Body density | Compact navigation with readable prose; density is task-specific | Tighten secondary chrome before shrinking customer messages |
| Capitalization | Short sentence-case controls dominate samples; technical/detail labels vary | Keep plain action language; avoid an all-caps administrative taxonomy |
| Muted contrast | Secondary labels visibly recede; screenshots do not verify accessibility | Measure actual proposed colors later; do not copy faint text |
| Numbers | Operational numbers appear in table, task or recording context | Do not invent KPI tiles, counters or confidence to look sophisticated |
| Typography replacing containers | Mail rows and Computer execution hierarchy carry meaning through type | Use grouping and baseline rhythm before enclosing more objects |
| Custom fonts | Granola names Melange/Quadrant; Docs names Super family | A proprietary font is evidence of investment, not a prerequisite or a license to copy |
| Copy | Compact action labels plus explanation near consequential context | Keep handoff consequences explicit; remove repeated generic reassurance |

The next study should compare hierarchy in grayscale before selecting a font. Manrope is not the identified cause of Avenlyo's conventional structure. Replacing it while preserving every line break would repeat the previous limitation.

## 10. Motion findings

**The strongest evidence concerns continuity, not spectacle.** Motion must explain where work went, what changed, and whether the user remains in control. Native interaction quality was not benchmarked in this public-material study. No durations, spring constants, frame rates of production interaction, or easing curves are invented.

| Interaction | Evidence | What can be concluded | What cannot be concluded |
| --- | --- | --- | --- |
| Sidebar/split transition | Dia 15 Oct changelog [D7], D | Publisher prioritizes anchored page content and fewer seams/layout changes | Actual smoothness, duration, focus behavior |
| Dragging/sidebar resize | Dia 30 Apr [D4], D | Rubber-band feedback at limits is an intentional interaction | That a particular spring implementation/tuning was used |
| Back/forward gesture | Dia 30 Apr [D4], D | Swipe affordance was redesigned beyond stock arrows | Exact travel distance or touchpad feel |
| Command/new-tab state | Dia Jan/Feb [D8]/[D3], D | Theme shimmer and group-name feedback exist | That decorative shimmer makes all apps modern |
| Hover | Dia player [D3], Tana mention [T2], D | Controls/previews can appear at the object that needs them | Universal hover-only navigation |
| Tab/view change | Mail ordered GIF frames [M1], Q | Grouped contents change within a stable view frame | Product latency or interpolation |
| Contextual AI appearance | Go suggestion demo [S4], Q | Underline → source-backed edit preview → changed text is demonstrated | Native animation curve or live execution speed |
| Dictation state | Wispr demo [W2], Q | Capture/transformed text returns to host; utility recedes | Device latency, keyboard/focus reliability |
| AI working → editable result | Docs demo [S2], Q | Working indicator precedes an editable table; optional panel can close | Demo camera zoom is not a native panel transition |
| Window opening / notifications | No direct native sequence inspected | U | No claims about springy opening or notification physics |
| Selection / creative drag | Make selected target documented; Boards static | Pointing/arrangement are product interactions | Their live motion or resizing behavior |
| Mobile persistence | Notion N1, Tana T3, V/D | OS-level entry/status can preserve availability outside a page | Interruptions, all device states or accessibility behavior |

For Avenlyo, the critical future motion questions are thread continuity, context dismissal, claim-confirmed composer enablement, new-message anchoring, and reduced-motion behavior. A state change from the server must not steal focus or make a stale result look current. Previous CSS motion samples were proposed behaviors, not evidence that these transitions already work.

## 11. AI-native interaction findings

AI feels native when its **context, authority, state, result and correction path** are part of the job. A chat surface can participate in that system; removing bubbles alone proves nothing.

| Need | Concrete evidence | Transfer to Avenlyo / boundary |
| --- | --- | --- |
| Availability | Wispr field bubble; Go underline; Granola note actions | Place available help by the object; never make essential takeover hover-only |
| Working | Computer task/tool groups; Docs working state; Dia expandable timeline [D5]/[D6] | Show only known state; current Avenlyo does not expose a faithful live agent trace |
| Result | Shared editable Docs table; Claude artifact; Firefly asset | Customer reply, persisted human reply and linked lead are durable objects with different meanings |
| Human correction | Go edit preview; Make point-and-prompt; Codex documented diff review | Human reply and structured saved behavior need clear scope; no rewriting customer history |
| Supervision | Codex review queue; Notion agent disable controls [N4] | Make claim ownership and paused/active state immediately legible |
| Handoff | Claude/Go demonstrate review/steering, not Avenlyo's customer handoff | Do not conflate interrupting an assistant with server-controlled transfer of reply authority |
| Context | Dia tab groups; Go source services; Tana pinned meeting docs | Source disclosures only from valid references; lead name/qualification are not enrichment |
| Permissions | Notion agent source/action configuration; Claude folder/tool controls | Publishing knowledge authorizes answering; workspace/member permissions remain explicit |
| Generated content | Docs/Boards retain editable results in the work surface | Identify AI versus customer versus human authorship with text, not color alone |
| Progress | Computer expandable execution; Codex ongoing threads | Current state is not historical progress. No fabricated “reviewing knowledge / escalating” sequence |
| Uncertainty | Go offers a reviewable sourced change; Claude documents asking/steering | These examples do not prove calibrated uncertainty UI. Avenlyo must retain unconfirmed-send and delivery-unknown states |
| Automation | Notion triggers, Codex automations, Tana wrap-up | Avenlyo's bounded reply runtime is not a general-purpose autonomous agent platform |

**Avenlyo's strongest potential identity is reliable intervention.** A user should know who may act now, what the AI will do next, what evidence is available, and what is still uncertain. This can be visibly current without inventing agent cognition, a confidence percentage, autonomous setup or new background capabilities.

## 12. Brand inside product findings

Granola provides the clearest design-team explanation: its calmer utility had outgrown an interchangeable marketing identity; the new product/brand system adds distinctive type and an intentionally imperfect mark while keeping the note usable [G1]. Docs supplies a complementary example: custom fonts/icons and warmer framing support a user-owned canvas; brand does not require purple on every selection [S1].

| Source of identity | Evidence | Judgment for Avenlyo |
| --- | --- | --- |
| Product behavior | Wispr's appearing-at-input utility; Tana capture-to-outcome | Strongest opportunity: dependable handoff and truthful state |
| Geometry/layout | Granola note/edge tools; Boards spatial references | Choose a shape of working, not a family of accent colors |
| Typography | Granola and Docs custom families | Establish hierarchy before discussing proprietary character |
| Iconography | Granola mark, Docs custom icons, Notion agents | Small authored moments can distinguish the product; generic utility icons are not intrinsically dated |
| Motion | Dia's continuity and boundary feedback, documented | Create a recognizable response to work changes, with reduced-motion support |
| Copy | Short object/action language across samples | Calm, literal consequences can be distinctive in business software |
| Color/illustration | Brand appears selectively around work and in empty/completion moments | Keep customer text authoritative; illustration must not simulate a successful operation |

No evidence establishes that a single icon library, neutral palette or familiar button makes a product old. Identity fails when every decision is interchangeable and the product's behavior supplies no recognizably coherent experience.

## 13. Patterns that now feel dated

These are conditional design judgments from the comparison, not a blacklist or causal user-study result.

| Pattern | Why it can read as older-generation | Evidence / exception | Decision |
| --- | --- | --- | --- |
| Equal-weight permanent module sidebar | The app taxonomy stays more prominent than selected work | Mail/Tana/Codex keep useful sidebars | Reopen prominence and persistence |
| Giant route H1 + explanatory subtitle everywhere | Repeats what navigation and object already say | Large Docs titles belong to documents | Remove redundant introduction |
| KPI row as default Home | Reports the application instead of helping do current work | No need to fabricate Avenlyo metrics | Discard as default; do not add |
| Repeated bordered cards / card inside card | Every object gets the same emphasis and lifetime | Go input/result objects and Tana cards have specific jobs | Remove container reflex |
| Many equal status pills | Forces interpretation before a next action becomes clear | Docs tables legitimately use status chips | Prioritize decision-relevant state |
| Full-page settings as the main AI experience | Configuration stands in for the experience of supervising work | Go builder and Dia settings remain conventional | Keep settings, change their role |
| Permanent CRM-style inspector | Metadata consumes width even when no decision needs it | Adjacent tools are valuable when actively used | Default closed; reconsider content priority |
| One generic chat shape for every event | Hides distinctions between human speech, work state and result | Claude/Go still use dialogue bubbles successfully | Keep conversation semantics; separate operations |
| Sparkle/gradient as the only evidence of AI | Decorates a capability without explaining its action or authority | Dia still uses contextual shimmer; Docs uses AI marks | Never rely on decoration for state |
| Oversized empty dashboard | Signals missing data rather than a clear starting job | Granola note/Codex invitation are purposeful emptiness | Judge the task, not blank-area percentage |
| Breadcrumbs and page furniture everywhere | Adds scope labels where one stable title already suffices | Complex document/location scopes may require them | Use only for real recoverable hierarchy |
| Identical rounded rectangles for all objects | Flattens differences among content, input, status and navigation | Rounded controls remain common in new products | Differentiate by role, not novelty |

## 14. Patterns that feel newly current

The evidence supports **multiple directions**, not a composite competitor kit:

1. **Work establishes the page.** Note, selected customer, document or task title leads; chrome explains only what is necessary. Granola, Mail and Claude make this visible.
2. **Controls have a lifetime.** A suggestion, create menu or capture utility can appear locally and go away. Wispr, Go and Tana show different forms of this principle.
3. **One task crosses surfaces coherently.** Dia's documented transitions and Notion's mobile recording status prioritize continuity over page boundaries.
4. **Results stay useful outside the prompt.** Docs tables, Firefly assets and Claude artifacts can be inspected or edited as work objects.
5. **Supervision has its own grammar.** Review queue, expandable activity, source scope and stop controls express authority and state instead of branding every event “AI.”
6. **Density changes with work.** Quiet entry does not dictate sparse execution; compact navigation does not justify tiny body text.
7. **Identity is restrained within work and stronger at meaningful moments.** Granola/Docs make this an explicit system rather than an accent-color exercise.

These patterns are candidates to test. Neither public launch claims nor screenshots establish that they improve task completion for Avenlyo's business owners.

## 15. Avenlyo-specific critique after the research

### Audited evidence

The critique uses the actual checked-out artifacts and contracts, not memory of an earlier conversation:

- [Frontend research / functional limits](frontend-research-v1.md), especially non-negotiable product truth, unavailable data and handling state matrix.
- [Approved UX wireframes](frontend-wireframes-v1.md), especially optional context and responsive modes.
- [Visual directions and approval history](frontend-visual-directions-v1.md).
- [Refinement notes](../design-prototypes/frontend-visual-directions/refinement-v1/README.md).
- [Color reset notes](../design-prototypes/frontend-visual-directions/color-reset-v1/README.md), including preserved geometry.
- Visually inspected: the three-direction Inbox comparison; cool reset B Home/Inbox/Agent; refined mobile Inbox.
- [Channels and handoff contract](channels-handoff-v1.md) and [architecture](architecture.md), used to protect business semantics.

The wireframe's standard-desktop context is already optional/closed; its wide-screen example opens context deliberately. **The UX did not require a permanent four-pane Inbox.** The static visual studies repeatedly pictured the expanded wide layout, which made it look like the product's defining geometry. The new exploration must not erase that distinction.

| Current assumption / exact artifact | Why it reads conventional | Research-based reconsideration | Truth that must survive |
| --- | --- | --- | --- |
| 224px full-height labeled sidebar in refined/reset frames | Six destinations and Setup group remain equally present while serving one customer | Let active work lead; compare collapsible object navigation with visible setup access | Workspace identity, accessible labels, direct routes |
| Home route label + “Your AI front office” + subtitle | Three introductions precede one real customer's need | Start with real work or a truthful setup task; let business scope identify the view | No fake urgency, metrics or unread semantics |
| Large white rounded Home work plane | Encloses need card, recent list and readiness as a fixed page composition | Test an integrated working plane or direct work objects | Useful grouping, readable contrast |
| Expanded Inbox nav/list/thread/context geometry | Persistent anatomy competes with the message; sparse fixture makes furniture conspicuous | Focused thread or queue with local inspection; compare width only after hierarchy | Customer selection, history and safe return |
| Static Context pane | Repeats ownership/AI paused already above the conversation; linked lead offers little additional data | Context as an intentional local disclosure; do not reserve empty width | Linked lead/name/qualification, real delivery/notification details |
| Agent page title, tabs, operating-brief title and effective-behavior panel | Hierarchy and summary repeat the configuration instead of exposing a concrete consequence | Compare scoped behavior editing with a truthful saved-state summary and separate test surface | Structured controls, explicit save and test using saved settings |
| Traditional navigation rows with authored outline icons | Visually competent but interchangeable; icon restyling cannot alter task priority | Let object/state define navigation first; style later | Text discoverability and touch access |
| Alternating chat bubbles | Supports speaker attribution but gives system explanation the same rhythm as dialogue | Test a readable transcript with explicit authors and separate live handling state | Verbatim messages; customer/AI/human roles |
| 116px fixed desktop composer while unclaimed | A disabled writing area consumes attention before authority exists | Compare compact claim-first state that expands only when reply is allowed | Clear path to claim; no reply before confirmed ownership |
| Fixed composer when already replying | This is useful continuity, especially on mobile | Retain a stable writing anchor while reducing surrounding repetition | Draft retention, keyboard safe area, uncertain-send lock |
| Standing readiness sidebar on Home | Setup remains a competing dashboard during live work | Surface readiness on request or when a real dependency blocks a job | Accurate channel/publication/saved-behavior facts |
| Conventional buttons | The problem is repeated placement/emphasis, not that buttons exist | Place Claim/Send/Resume at the relevant state transition | Explicit labels, target size, confirmation of consequence |
| Static state snapshots | A mockup cannot demonstrate what makes a new app feel coherent over time | Next approved experiment should test transitions and failure states | Backend-confirmed status, stable focus and scroll |

The old feeling is therefore **architectural repetition plus stationary chrome**, reinforced by a design process that held geometry constant. It is not proven to come from cream, terracotta, cyan, a specific radius or Manrope. A stronger neutral/cool palette can improve tone while leaving that problem intact.

## 16. Current visual assumptions to discard

Discard these as **mandatory constraints for the next exploration**, not by deleting the current artifacts or production UI:

1. The approved static pane arrangement must remain the visual foundation forever.
2. A full labeled sidebar must occupy the same width on every desktop task.
3. Home needs both a route introduction and a product proposition above work.
4. Every main job must sit inside the same white rounded work container.
5. Expanded context is the defining Inbox presentation rather than an optional state.
6. Readiness/effective-behavior summaries deserve permanent columns regardless of the job.
7. A disabled full-size composer is the best default before a human has reply authority.
8. A new visual identity can be found while locking all geometry, line breaks and glyph positions.
9. High fidelity static screenshots can validate interaction modernity.
10. General-purpose AI metaphors are automatically appropriate for a bounded front-office runtime.

Do not discard familiar rows, accessible buttons, transcript readability, a stable composer during active writing, or useful document titles merely because they are established conventions.

## 17. UX truths that remain

These are product invariants from the repository, not visual choices to renegotiate through competitor styling:

- Real customer work and Test Agent remain distinct. Tests use saved structured settings and published knowledge; planning notes do not train or instruct the answering runtime.
- Knowledge draft/save and publication are different. Publication authorizes use; editing published knowledge removes it from answering until republished.
- Human assistance remains available and server-enforced. Claim keeps AI paused and assigns the current member; a linked lead changes to `needs_human`.
- Only the confirmed claim owner can send/release. Another member's claim prevents takeover/resume. Stale UI is not authority.
- Release leaves AI paused. Explicit Resume AI clears the claim and permits answering the **next customer message**; it does not answer backlog or restore prior lead qualification.
- Customer, assistant and human messages retain explicit authorship, chronological meaning and readable text. No gesture or typography trick may obscure who said what.
- An unconfirmed browser reply retains the same submitted content and UUID and blocks conflicting new actions. This is distinct from provider delivery uncertainty.
- Website availability, provider acceptance, delivery unknown/failed/blocked and staff-notification states remain distinct. No automatic resend, delivered/read claim or invented success state.
- Leads contain customer-stated evidence, not verified identity/enrichment. Thread context cannot invent email/phone/company/summary fields it did not receive.
- No synthetic confidence, reasoning trace, audit history, unread count, SLA, revenue, saved time, resolution, presence, routing or background autonomy.
- Empty, loading, unavailable and stale are different states. A failed request must not become zero or all caught up.
- Mobile remains a focused list/thread flow with safe back/context access, preserved reading position, keyboard-safe composition and accessible targets. Reduced motion, focus order and non-color state cues remain requirements.

The routing model and jobs can remain recoverable even if their visual organization changes substantially. Backend capabilities and permission semantics do not expand because an experimental shell looks more agentic.

## 18. Five principles for the next exploration

1. **Make customer work the place.** Let the selected conversation or genuine need establish the screen; reduce repeated application introductions.
2. **Give controls the same lifetime as their job.** Context, readiness and configuration appear when needed; identity and consequential state stay easy to find.
3. **Make authority more visible than intelligence.** Show who can reply, whether AI is paused, what action changes that, and what remains unconfirmed.
4. **Preserve continuity through change.** Selection, reading position, draft and focus remain coherent as queues, context and server-confirmed state change.
5. **Build identity from dependable behavior.** Use a distinctive handling rhythm, clear language and intentional geometry first; choose color, icons and type to support it afterward.

## 19. Three radically different structural hypotheses

Descriptions only. These are alternatives to test after approval, not new mockups, a chosen direction, feature commitments or implementations.

### Hypothesis A — Conversation as the workspace

The selected customer conversation occupies the main environment. A compact, clearly labeled workspace/navigation control provides access to other jobs. A summonable conversation list preserves the queue and return position; context opens locally beside the selected evidence. The current handling state and the next permitted action sit at the conversation anchor. Before claim, a compact action region explains authority; after confirmed claim, it becomes the stable writing area.

This tests whether Avenlyo should feel like an instrument for serving one customer rather than a dashboard containing a transcript. Its main risk is losing queue awareness or discoverability. Test pointer, keyboard and touch routes; do not hide customer work or setup behind an unexplained icon.

### Hypothesis B — A working queue with expandable conversations

The working place is a continuous list of real conversations, with explicit handling summaries. Opening one expands a substantial reading/reply region in that same queue context; mobile promotes it to a full-screen thread. The global module shell is secondary. Readiness/configuration is a separate local destination, not a standing side column. Counts and ordering remain exactly what existing data can support—no invented priority engine or unread queue.

This tests whether short repeated intervention is easier when users keep their place among customers instead of entering a permanent pane system. Its main risk is scroll instability, long messages and unclear identity while an item expands. Test long transcripts, repeated switching and provider-unknown state before judging appearance.

### Hypothesis C — Two working modes: operate and prepare

The top-level experience distinguishes current customer work from preparing the answering system. Operate has a compact queue/thread environment; Prepare presents structured behavior, published knowledge and channel facts as connected, editable work objects. A visible labeled switch changes mode; it is not command-only navigation. Readiness appears here or at a genuine dependency, while active conversations keep only the facts needed to intervene.

This tests whether the current six-module map reflects implementation categories more than owners' mental jobs. Existing routes remain directly accessible. Its main risk is creating another unnecessary mode choice—the very problem Claude's unification addresses. Test whether owners can predict where Test Agent, publishing and channel management belong; reject the hypothesis if the division increases navigation uncertainty.

## 20. Recommended next design experiment

**After stakeholder approval, run a low-fidelity structural comparison of these three hypotheses against the current expanded-pane baseline.** Use grayscale, the same type family and the existing truthful Northstar fixture. Do not begin with a new palette or a polished fourth direction.

One comparison should cover the same sequence in each structure:

1. Open a real conversation that needs a person; identify whether AI is paused and who may act.
2. Inspect the linked lead/source information without losing the customer's message or reading position.
3. Claim, wait for confirmed ownership, write a human reply and handle an unconfirmed request safely.
4. Distinguish release from resume; explain what the next customer message will trigger.
5. Move to another conversation and return, then find the saved behavior/knowledge needed to prepare the system.
6. Repeat the core intervention on mobile, with a long message, keyboard open, another member's claim and stale data.

Use a small set of business-owner reviewers. Evaluate first-action discoverability, understanding of reply authority, navigation recovery, transcript reading width, context cost and errors during handoff. Record observations and explanations rather than manufacturing a statistical winner from a small sample. Separately ask which structure feels newly released; aesthetic novelty cannot compensate for a wrong handoff action.

Prototype only enough interaction to test selection, context opening/closing, claim-confirmed control changes and safe return. Any future simulated backend state must be labeled as a fixture. No production changes or new capabilities are implied. Test reduced motion and visible non-keyboard controls alongside the normal transition.

**Decision gate:** choose the structural hypothesis that preserves trust and makes current work most direct. Only then explore its surface system, typography, icon language and motion in high fidelity. Palette selection follows that choice.

**Stop condition reached by this document:** research and critique only. Await stakeholder approval before creating the next Avenlyo design.

<!-- Stable source references used throughout this research. -->

[G1]: https://www.granola.ai/blog/a-new-look-for-granola
[G2]: https://www.granola.ai/updates/whats-new-2026-01-08
[G3]: https://www.granola.ai/blog/say-hello-to-recipes
[D1]: https://www.diabrowser.com/
[D2]: https://www.diabrowser.com/changelog/mac/1-28-0
[D3]: https://www.diabrowser.com/changelog/mac/1-20-0
[D4]: https://www.diabrowser.com/changelog/mac/1-29-0
[D5]: https://www.diabrowser.com/changelog/mac/1-39-0
[D6]: https://www.diabrowser.com/changelog/mac/1-42-0
[D7]: https://www.diabrowser.com/changelog/mac/1-53-0
[D8]: https://www.diabrowser.com/changelog/mac/1-15-0
[W1]: https://wisprflow.ai/post/flow-on-android
[W2]: https://wisprflow.ai/android
[W3]: https://docs.wisprflow.ai/articles/1790396454-move-and-dock-the-flow-bar-on-desktop
[W4]: https://docs.wisprflow.ai/articles/5096240724-navigating-the-wispr-flow-app-desktop-ios-and-android
[S1]: https://blog.superhuman.com/docs-new-visual-identity/
[S2]: https://blog.superhuman.com/introducing-superhuman-docs/
[S3]: https://superhuman.com/docs
[S4]: https://blog.superhuman.com/go-1-0/
[N1]: https://www.notion.com/releases/2026-01-20
[N2]: https://www.notion.com/releases/2026-02-24
[N3]: https://www.notion.com/help/mobile-custom-agents
[N4]: https://www.notion.com/releases/2026-05-05
[C1]: https://www.anthropic.com/news/introducing-anthropic-labs
[C2]: https://claude.com/product/cowork
[C3]: https://claude.com/resources/articles/cowork-is-now-claude
[X1]: https://openai.com/index/introducing-the-codex-app/
[X2]: https://vimeo.com/1161130375/2470243d0c
[P1]: https://hub-prod.perplexity.ai/
[P2]: https://www.perplexity.ai/changelog/what-we-shipped---february-27-2026
[P3]: https://www.perplexity.ai/products/computer
[T1]: https://outliner.tana.inc/blog/the-next-chapter-for-tana
[T2]: https://tana.inc/blog/tana-takes-it-from-here
[T3]: https://tana.inc/blog/tana-app-for-ios
[M1]: https://www.notion.com/releases/2025-04-15
[R1]: https://www.raycast.com/blog/raycast-for-ios
[R2]: https://www.raycast.com/changelog/1-97-0
[F1]: https://www.figma.com/blog/introducing-figma-make/
[A1]: https://blog.adobe.com/en/publish/2025/04/24/adobe-firefly-next-evolution-creative-ai-is-here
[A2]: https://blog.adobe.com/en/publish/2025/09/24/firefly-boards-launches-globally-now-with-runway-aleph-moonvalley-marey-models-new-powerful-ideation-features-flexible-offers
[O1]: https://blogs.opera.com/news/2025/09/opera-neon-agentic-ai-browser-release/
