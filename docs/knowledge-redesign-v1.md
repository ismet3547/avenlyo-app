# Knowledge workspace V1

Starting point: `feat/product-ui-v1`, `163431736271e1ce58ba4389e5527e0c905df3d2`.
Delivery branch: `feat/knowledge-redesign-v1`. No merge or deployment.

## Audit and model decision

The baseline stores `knowledge_items.type` as text constrained to `text`/`faq`, not an enum. Both formats use title/content, a draft/published/archived status, revision and nullable vector. `save_knowledge_item` is an owner-only revision-checked RPC; edits return to Draft and clear the embedding. Publication checks current owner membership before embedding and again in the backend-only publish RPC. Both `match_knowledge` (Test Agent, RLS invoker) and `match_channel_knowledge` (bounded customer channel run) select only published records with non-null embeddings. Finalization rechecks source status and revision to reject races. The runtime treats retrieved knowledge as data, never instructions. None of these authorization or safety rules were changed.

The audit document itself and ElevenLabs screenshots were not supplied in this workspace/repository. The findings quoted in the task were used: reduce zero-state controls, improve first-content guidance, increase readability and use consistent working width.

## Persistence and API

An additive migration adds real `service`, `pricing`, `policy`, `business_info`, `custom_note` types alongside FAQ. Legacy `text` remains accepted/readable and is displayed as Custom note, including the type filter. Existing rows, IDs, statuses, revisions, timestamps, content and embeddings are not rewritten. The old six-argument RPC remains for older Text/FAQ clients; new Text writes normalize to Custom note. Older clients cannot erase the structured fields of newer types.

Pricing has a required free-form `price_statement` (240 characters), optional three-letter currency, and optional conditions in content. This accepts fixed prices, ranges, starting prices and contact-based pricing. Service has a description (4,000 characters) plus optional details/limits (2,000 characters), keeping the complete structured representation inside the existing embedding provider’s 6,500-character input bound. Other types retain title/content. SQL checks and the shared strict Zod contract reject irrelevant structured fields.

A generated `runtime_content` column combines structured fields into readable facts. Publication embeds title + runtime content; both retrieval RPCs return the same generated content using their unchanged published-only predicates and authorization boundaries. Legacy Text/FAQ runtime content is identical to its original content. Publication also supports the pre-upgrade Foundation schema in the existing upgrade acceptance flow.

`knowledge_collections` is workspace scoped, with RLS, authenticated member SELECT only, explicit revocations and owner-only create/rename RPC. The optional relation uses a composite workspace/collection foreign key. Collections do not publish children, enter prompts, change permission or create hierarchy. No nested folders or drag/drop.

## User experience

Knowledge uses the existing app shell with a scoped maximum working width of 1,440px. A first-content workspace offers six compact business choices and one Add knowledge action. Filters and counts appear only after content exists. The library provides search over title, content and price, status/type/collection filters, compact status counts, meaningful rows, collection navigation, filtered empty states and 50-record pagination.

The editor begins with a keyboard-reachable type picker and then shows type-specific fields. Pricing has a dedicated panel and price input. The useful context panel describes the current publication state and organization. Save draft is followed by an explicit existing Publish action in the library; there is no automatic publication. Editing published content explicitly returns it to Draft.

Knowledge-only CSS increases the title to 28–32px, labels/body to 15–16px and support/status text to 14px with stronger contrast. Mobile uses one-column choices, full-width search, wrapping filters, horizontally scrollable status links and stacked entries. Native labels, radio controls, semantic buttons, visible focus and readable hit targets are retained.

Operational body text contrast is 7.10:1 on white (6.79:1 on the app background), primary 9.38:1, published status 7.35:1 and Draft 5.63:1, exceeding the 4.5:1 normal-text target.

## Verification

- Unit/API tests cover six types, flexible pricing, strict fields, legacy data, canonical embedding input and publication races.
- pgTAP covers all six types through draft/publish/archive/edit, runtime content, stale revisions, workspace/RLS isolation, collection create/rename and composite foreign keys.
- Upgrade acceptance snapshots existing Knowledge fields before/after migration.
- Browser acceptance covers each editor, zero/one/24-item libraries, publishing, published edits, archiving, searching, filtered empty states, collection create/rename and overflow at 1440/1280/1024/768/390.
- Browser screenshots are written to `test-results/screenshots/knowledge` and attached to the existing CI artifact `foundation-browser-qa`.

Local results: 107 unit/API tests passed; typecheck, lint and production build passed. This container requires a temporary external Node memory-query workaround to run Next build (no application code change). API artifact smoke and browser inventory are also checked. Docker is not available locally. The first CI run passed real Foundation acceptance, additive upgrade preservation, the pgTAP database suite and channel runtime acceptance; browser validation is in progress. The initial Playwright Chromium download returned an invalid archive in this container.
