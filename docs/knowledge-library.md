# Knowledge library review

This change continues PR #6 on `codex/fresh-product-design`. Keep the PR draft and unmerged. Home and Onboarding retain their existing behavior.

## What changed

- The true zero state offers Add manually, Import webpage and Upload file, with no empty management controls. Mobile uses one Add knowledge action and a bottom sheet.
- The populated library leads with knowledge titles, type, status and last update. Search and All / Published / Drafts support finding content. Type and collection filters live in an anchored popover; Archived and Manage collections are secondary maintenance links.
- Manual creation first asks for one of the six existing types, then opens a focused editor with the appropriate labels and fields. Save draft remains in the editor with a compact confirmation. Publish is explicit and remains in the editor.
- Type changes require review when text exists. Pricing statements/currency and service details are retained in the new type's visible text. A transition that exceeds the target field limit is blocked without truncation.
- Unpublish, Archive and Delete have explicit consequence confirmations. Unsaved edits are protected on in-app links, sign-out forms, browser history and page exits. Native modal dialogs handle focus containment and Escape. Filter and library overflow use native auto popovers with outside-click dismissal and focus restoration.
- Loading and retry states use safe copy. Known import failures provide useful guidance; unexpected network/database exceptions never return raw exception text.

## Existing backend reused

No migrations, schema changes, dependencies, API changes, runtime changes, RLS changes or channel changes are introduced. The UI uses the existing owner-authorized `save_business_knowledge`, `change_knowledge_status`, `delete_knowledge_item`, and `save_knowledge_collection` RPCs and the existing publication API. Reads retain workspace-scoped predicates and existing RLS.

The existing intentional rule remains: editing Published content returns it to Draft and clears its embedding. The editor explains this next to Save changes. Only Published, embedded knowledge is usable by the agent. Unpublish retains the item as Draft; Archived content leaves the active library; Restore returns to Draft without publishing; Delete is permanent after confirmation.

The optional Service pricing note shares the existing plain-text details field with Additional details. Their combined value remains subject to the existing 2,000-character limit. Pricing retains the existing optional currency field as a secondary disclosure.

## Imports and collections

Webpage import remains a single-page import through the existing URL validation, DNS/private-address and redirect checks, timeout, response-type and byte limits. No crawling is added. TXT, Markdown, CSV, JSON and HTML uploads retain the 1 MB limit and existing first-6,000-character extraction. Both imports create a Custom note Draft with no publication or embedding, and open that persisted item for review. Failed imports offer Add manually instead. Onboarding retains its existing save/import destinations.

Collections remain flat and optional. Filtering and editor assignment use existing collections. The dedicated Collections screen supports creating and renaming through the existing RPC; counts include active items only. No sidebar, hierarchy, drag/drop or cascading publication is added.

## Desktop and mobile

Knowledge opts into shared workspace page spacing: 38px top, 32px horizontal and 48px bottom on desktop; 20px/18px/28px on mobile. Knowledge styles set a maximum 1,180px library width, readable 28–32px headings, 15–16px body/input/title text, and restrained 13–14px metadata. Rows use subtle dividers. The editor has a single comfortable content column. Mobile stacks row metadata and editor fields, keeps actions at least 44px high, and presents Add, Filter and confirmation surfaces as bottom sheets. Desktop Add/confirmation dialogs are explicitly centered, with a 500px Add dialog. Filter is a 340px anchored popover with a single-column type list; the 220px library overflow menu stays anchored on every screen size. Search and Filter share a bounded row with a 12px gap on every screen size. Status is written in text as well as color. Shared shell styles and unrelated screens are unchanged.

## Coverage and validation

Unit regressions cover library hierarchy, true versus filtered zero states, archived maintenance, combined filtering, legacy Text normalization, service-field round trips including multipart CRLF line endings, lossless type conversions, over-limit conversion rejection, editor navigation, explicit publication, stale-save rejection, all supported import types and size limits, redirect/private-address rejection, and safe import errors.

The updated Knowledge browser flow preserves the six-type create/save/publish coverage, published edit behavior, search, status/type/collection filtering, collection create/rename, archive and safe deletion, including rejected actions that keep their error inside the open confirmation and leave the item intact. It adds preservation of submit intent, selected type/collection and both Service sections after saving, review-in-editor assertions, restore-to-Draft, unsaved navigation, pricing conversion, real file upload/review, private URL rejection, tenant isolation, dialog focus containment/Escape, popover/menu anchoring and keyboard dismissal, focus restoration, outside-click dismissal, and desktop/mobile captures at 1440/1280/1024/768/390 widths. Existing signup, optional-channel persistence, runtime, channel and handoff flows remain in the suite.

Local typecheck, lint/independence, 182 unit tests, production builds and API artifact smoke pass. Database isolation/security, migration upgrade, runtime and channel checks also pass in CI. The final browser acceptance results and captures are linked from the current PR checks. This local sandbox lacks the Supabase CLI/Docker stack and cannot start the browser fixture's IPC socket. The local production build uses the existing external memory-reporting workaround for the sandbox's missing `/proc`; no workaround is committed to the repository.

## Local visual review

Apply the already-existing local migrations, configure the repository's disposable Supabase stack, and start the API and web app as documented in the main README. Review `/app/knowledge` first in an empty workspace, then add a Service, Pricing and FAQ. Save and Publish each deliberately. Inspect mobile Add knowledge, filtering, imported Draft review, Published edits, Unpublish, archive/restore and cancelled deletion. Run `pnpm test:browser` with manual servers stopped so Playwright can own ports 3001 and 4001.

Remaining limitations follow the current product: webpage import can be blocked by the remote website; no crawling, PDF/DOCX ingestion or AI classification is supplied. Import truncation and shared Service details limits are unchanged. Restoring an archived item always needs a separate explicit Publish before the agent can use it.

## Files changed

- `apps/api/src/testing/browser/channels.spec.ts`
- `apps/api/src/testing/browser/foundation.spec.ts`
- `apps/api/src/testing/browser/knowledge.spec.ts`
- `apps/web/app/app/knowledge/[id]/page.tsx`
- `apps/web/app/app/knowledge/actions.test.ts`
- `apps/web/app/app/knowledge/actions.ts`
- `apps/web/app/app/knowledge/archived/page.tsx`
- `apps/web/app/app/knowledge/collections/page.tsx`
- `apps/web/app/app/knowledge/error.tsx`
- `apps/web/app/app/knowledge/import/page.tsx`
- `apps/web/app/app/knowledge/knowledge.css`
- `apps/web/app/app/knowledge/layout.tsx`
- `apps/web/app/app/knowledge/loading.tsx`
- `apps/web/app/app/knowledge/new/page.tsx`
- `apps/web/app/app/knowledge/page.tsx`
- `apps/web/app/preview/page.tsx`
- `apps/web/components/knowledge-collections.tsx`
- `apps/web/components/knowledge-editor.tsx`
- `apps/web/components/knowledge-import.tsx`
- `apps/web/components/knowledge-library.test.ts`
- `apps/web/components/knowledge-library.tsx`
- `apps/web/components/knowledge-primitives.tsx`
- `apps/web/lib/knowledge-data.ts`
- `apps/web/lib/knowledge-model.test.ts`
- `apps/web/lib/knowledge-model.ts`
- `docs/knowledge-library.md`

## Visual polish scope

The follow-up polish changes spacing, typography and interaction surfaces only. Knowledge lifecycle, import routes and limits, backend contracts, Home, Onboarding, auth, RLS and channel behavior remain unchanged. The spacing utility is opt-in and is applied only to Knowledge. The existing workspace-picker layout is not repurposed.

Browser checks retain every existing product assertion and add layout/accessibility checks at 1440, 1280, 1024, 768 and 390px: centered desktop Add, mobile sheets, adjacent Search/Filter, anchored single-column Filter, contextual overflow, keyboard focus containment for the modal, Escape and invoker focus restoration, radio arrow navigation, menu Home/End navigation, and no horizontal overflow. Production build precedes browser acceptance because Playwright uses `next start`.
