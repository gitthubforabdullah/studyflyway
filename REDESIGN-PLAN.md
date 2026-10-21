# StudyFlyway redesign plan

Phase 1 inspection completed: 21 October 2026. This document plans the redesign; it does not change the live site or its deployment.

## 1. Existing architecture

The project is a static, multi-page HTML/CSS/JavaScript website. There is no application framework, package installation requirement, client-side router, or component framework. Preserve this architecture.

Source inventory: 143 HTML files: 18 at the root, five country pages, 88 university profiles, ten scholarship pages, six guides, and 16 consultant profiles. The root count includes two Google verification files. Public navigation uses extensionless URLs. `prepare.js` retains HTML files and creates directory-index aliases in ignored `dist/`, including the base paths needed for assets. The custom domain comes from `CNAME`: studyflyway.online.

### Source ownership

| Area | Existing source | Redesign location |
| --- | --- | --- |
| Shared presentation | `assets/style.css`, `assets/app.js` | Shared tokens, layouts, navigation and accessible interactions |
| Navigation | Repeated static markup; `scripts/update-navigation.js` updates it | Extend build-time shared markup without requiring JavaScript to render links |
| Footer | Repeated static markup; partial updates in navigation script | One shared build-time footer renderer used by handwritten and generated pages |
| Homepage | `index.html` | Preserve head/integrations; redesign body sections |
| Destinations | `destinations.html`, `countries/*.html`, `assets/destinations.css` | Preserve existing sections and anchor targets |
| Country generated content | `scripts/build-country-background.js`, `scripts/enhance-destinations.js`, research country/update JSON | Change generator markup as well as styles |
| Universities | `scripts/build-universities.js`, `scripts/university-profile-content.js`, research university JSON files | Shared directory/profile presentation at the generator level |
| University styles and search | `assets/universities.css`, `assets/universities.js` | Preserve search, country filters, query-string behavior and readable static cards |
| Scholarships | `scripts/build-scholarships.js`, `research/scholarships.json`, `assets/app.js` | Preserve date/status attributes, eligibility, sources and filters |
| Consultants | `scripts/build-consultants.js`, research consultant JSON, `assets/consultants.css`, `assets/consultants.js` | Preserve listings, profiles, filters and external-link notices |
| Other pages | About, contact, guides, English tests, policies, credits, thank-you and 404 HTML | Apply common shell and appropriate article/form layouts |
| Page styles | `assets/about.css`, `assets/english-tests.css`, `assets/privacy.css` | Migrate visual values to shared tokens without losing page-specific layouts |
| Build and SEO | `prepare.js`, `scripts/clean-site-links.js` | Preserve canonical URLs, Open Graph URLs, schema, sitemap, robots and aliases |

Important build detail: `scripts/sync-university-styles.js` copies university CSS into the generated tail of `assets/style.css` and hashes stylesheet URLs. Do not edit that generated tail as the source of truth. Update original university CSS and keep shared CSS outside the generated block. Ensure new shell synchronization runs after generators so regenerated pages get the same header and footer.

Existing behavior includes mobile menu toggling, destination dropdowns, keyboard/Escape handling, scholarship filtering and review-expiry labels, university search, consultant filters, image fallbacks, the application checklist, and FormSubmit contact handling. Keep selectors, data attributes, form fields and public anchors stable while changing presentation.

## 2. Reference interpretation

Use the attached image as visual direction: white canvas, navy text, restrained blue actions, serif editorial headings, readable sans-serif interface text, fine borders, subtle pale-blue panels, tighter section spacing and authentic campus photography. Replace the current lilac gradients, floating rounded navigation and oversized pill/card styling consistently.

Keep the menu sticky as requested previously. Use a white full-width header with a centered inner container, existing brand assets, desktop links, accessible mobile menu and a useful existing planning-guide CTA. Retain access to English tests and consultants even though they are absent from the reference navigation. Contact must remain easy to find.

Reference content is illustrative, not a factual source:

- Do not copy its 1,000+ university claim, sample news, deadlines, student testimonials, named campus caption, expert-review claim or partnership implications.
- Keep the five existing destinations, including New Zealand. Do not introduce USA content simply to match the screenshot.
- Use existing editorial/source information for trust messaging; do not imply independent certification or expert review without evidence.
- No newsletter form unless a real subscription service is separately requested and configured.
- No new map, news feed or story pages merely to reproduce decorative screenshot sections.

## 3. Phase 2: Shared design system and shell

1. Establish named CSS variables for navy text, primary/action blue, muted text, white, pale-blue surfaces, borders, spacing, type scale, radii, container widths and focus rings. Starting palette: navy #102344, blue #0757B8, muted #52627A, border #DCE4EE, surface #F1F7FC. Verify actual contrast before finalizing.
2. Use a restrained editorial serif heading stack and readable sans-serif body/UI stack, with local/system fallbacks. Avoid adding multiple blocking font families or weights. Use fluid heading sizes and comfortable article line lengths.
3. Define reusable primitives: container, section heading, primary/secondary/text buttons, image card, editorial feature, scholarship row, filter bar, badge, breadcrumb, article/sidebar, notice, source panel and form controls.
4. Create shared build-time header/footer rendering in a small Node module. Reuse it from the existing pipeline; keep delivered pages fully static. Preserve per-page active navigation and relative/root asset paths, especially 404 and nested routes.
5. Keep footer Explore, StudyFlyway and policy links, email, Instagram, copyright and independent-information disclaimer. Do not add inactive social icons.
6. Consolidate competing header/media rules rather than accumulating another layer of overrides. Keep existing mobile-menu and dropdown behavior, keyboard access, visible focus, reduced-motion support and skip link.
7. Confirm the sticky header does not obscure anchor destinations or expanded mobile navigation. Retain internal menu scrolling on short screens.

Deliverable: all pages share the new shell, type and controls; page content and existing behavior remain available.

## 4. Phase 3: Homepage

Planned section order, adapted to existing content:

1. **Editorial hero:** reference-like split composition, navy serif headline, concise existing mission copy and genuine campus photograph. Preserve the existing primary heading intent and SEO metadata. Reuse verified content for copy; keep planning/explore actions.
2. **Discovery/search:** a real labeled search form if introduced. Use a generated lightweight index of existing destinations, universities, scholarships and guides. Results link to current URLs, support keyboard interaction and empty states, and escape text safely. No decorative search control. Without JavaScript, retain normal links to directories.
3. **Topic shortcuts:** universities, destinations, scholarships and guides, without invented counts.
4. **Featured guide plus scholarship panel:** use an existing application or planning guide. Scholarship summaries come from the same reviewed records as the directory, with current status handling; do not hardcode screenshot dates. Keep existing homepage scholarship entries available.
5. **Destination cards:** show all five current countries with consistent image crops and existing destination links.
6. **Planning resources:** present existing guides in the compact editorial-card treatment used for stories in the reference. Do not fabricate student experiences.
7. **Source and editorial panel:** link to actual editorial policy and official-source guidance using accurate claims.
8. **External consultants:** retain the current homepage feature and its independent-listing context, styled within the same system.
9. **Shared footer.**

Retain all current homepage information and links, repositioning them as needed. Omit a latest-updates ticker unless records have a suitable reviewed date and destination URL; never use animated or fabricated news to fill space.

Photography: inventory local campus images and `research/campus-photos.json` first. The current students hero is explicitly illustrative AI imagery, so it does not satisfy the requested natural-photography direction. Select a licensed real photograph with a recorded source, creator and licence, update credits, and use accurate alt text. Do not extract screenshot people or claim their university. Export appropriately sized responsive images, reserve aspect ratio, prioritize only the hero and lazy-load below-the-fold images.

## 5. Phase 4: Remaining pages

Implement by page family, updating generators before regenerating output:

1. Destinations index and five country guides: editorial introduction, photographic cards, readable long-form sections, contents navigation and preserved country histories, cities, admissions, costs, visa guidance and source links.
2. University directory and all 88 profiles: shared search/filter styling, consistent campus images, identity/fact/source panels, responsive article/sidebar layouts and existing detailed content.
3. Scholarship directory and ten details: compact funding rows/cards, accessible status distinctions, unchanged review and deadline logic, eligibility/application/source sections.
4. Guides index and six guides: editorial cards, comfortable text width, headings, lists and fully functional application checklist.
5. Consultant directory and 16 profiles: consistent cards, filters, logos and contact details; retain non-endorsement wording.
6. English tests, About, Contact, editorial/privacy/disclaimer/credits, privacy fallback, thank-you and 404: shared shell and tailored content layouts. Preserve the contact action, honeypot, validation and success return URL.

Every existing URL and content section must remain reachable. Preserve existing IDs where deep links may depend on them. Google verification documents remain untouched.

## 6. Phase 5: Validation and completion criteria

Before implementation, capture a machine-readable inventory of routes, titles, descriptions, canonical/Open Graph/schema blocks, integration scripts, source links and important IDs. Compare against it after regeneration. Classify intended visual/copy changes explicitly; investigate any missing route, record, verification value or integration.

Run the existing appropriate checks: `node scripts/check-content.js`, `node scripts/check-universities.js`, `node scripts/check-consultants.js` and the build `node prepare.js`. Use `scripts/check-universities-browser.js` as a starting point for browser verification across page families, extending useful coverage rather than assuming university-only checks cover the site. Review build diffs because generators modify source HTML and CSS as well as dist output.

| Area | Acceptance criteria |
| --- | --- |
| Responsive layout | Check 360, 390, 768, 1024 and 1440px widths; no horizontal overflow, clipped controls or unreadable sidebar content |
| Navigation | Sticky throughout scroll; desktop/mobile links, destination submenu, Escape, focus and skip link work |
| Functionality | Existing filters, reset/empty states, URL query search, checklist and contact validation still work; any new search returns real pages |
| Contact | Preserve FormSubmit configuration; test locally without sending real messages; live delivery requires an intentional submission |
| Accessibility | Semantic headings/landmarks, labels, alt text, contrast, keyboard access, touch targets, zoom and reduced-motion checks |
| Content | No removed sections, sources, profiles or guides; no invented reviews, counts, deadlines, affiliations or unsupported claims |
| SEO | Preserve routes, metadata and schema intent; validate generated canonical URLs, sitemap, robots, aliases and policy noindex behavior |
| Integrations | Preserve both Google verification files, AdSense loader/publisher ID and ads.txt, Umami and Cloudflare analytics where currently present |
| Performance | Responsive compressed photography, explicit dimensions, minimal fonts/JS, no added framework; compare representative pages with a baseline and report actual measurements |
| Deployment | Existing GitHub setup and CNAME preserved; no provider migration or new hosting configuration |

Build twice when generator changes land to verify stable output and catch shell/style regeneration regressions. Preview the built output over HTTP to test extensionless routes. Report browser/performance checks that could not be run; do not claim scores or live deployment without evidence.

## 7. Work boundaries and phase handoffs

Phase 1 deliverable is this inspected plan. Phase 2 changes the shared system, Phase 3 the homepage, Phase 4 each remaining page family, and Phase 5 verifies the completed redesign. Keep each phase reviewable in Git. No redesign implementation or deployment has been performed as part of Phase 1.
