# Public-site polish — 26 October 2026

## Reference analysis
The senior designer's critique supersedes literal reproduction of the earlier references where it produced uneven hierarchy. Current code confirms staggered programme transforms, competing image heights, three unrelated links in one row, and duplicated CSS overrides. Future London Academy still informs rectangular photography and editorial hierarchy. Growmodo still informs secondary-page hero typography and clear content regions. Supplied Ellis video, named photography and exact logos remain the assets; no additional references, font licences or claims are invented.

## Design direction
One 8px spacing rhythm (8/16/24/32/48/64/96), common gutters and type scale across four public pages. Simplify the landing introduction to one photo and a readable text column. Two equal account choices belong together; the workflow gets a full-width photo/text section and existing disclosures. Align image heights, card padding and action baselines without a generic three-card feature row. Secondary pages use warm paper for reading sections and forest for the founder statement, keeping their supplied heroes and introducing clearer contrast between content purposes. Primary CTAs use lime/forest, secondary links remain understated. No invented content, decorative numbers, arrows or interface features.

## Implementation plan
1. Replace overlapping public styles with a consolidated token-based layout.
2. Restructure the account/workflow sections and shared CTA treatments.
3. Use a reusable IntersectionObserver hook for once-only heading entrances, with visible-by-default content and prefers-reduced-motion handling. Use CSS-only hover/focus/active feedback; no library.
4. Browser-review desktop/mobile, card geometry, navigation, disclosures, video controls, link targets and motion fallback. Run lint, regular build and frontend-review build.
5. Commit/push to the existing repository; verify the existing Vercel frontend preview and report limitations.

## Decisions
Keep the source founder quote verbatim, including its punctuation. Keep How to use provisional. No backend, database, permissions, account model or hosting changes. Animation must not hide content or cause layout shifts. Do not animate paragraphs repeatedly, hijack scrolling or introduce paid dependencies.

## Verification
26 October: ESLint, normal Vite build and review build passed. Built CSS is 31.76 kB (7.11 kB gzip), down from the prior 36.89 kB. Browser checked /, /about, /how-it-works and /contact at 360/390/768/1024/1440 CSS pixels: no document overflow or observed failed image loads. Account panels match heights at 768/1024/1440; stacked mobile panels use natural content height. Desktop measurement confirmed equal image heights and CTA baselines. Reviewed intro, account photos, About typography and mobile Contact controls in screenshots; adjusted portrait crop and CSS import order during review.

Video pause/play, workflow disclosure, mobile menu/Escape and account link targets passed. Heading entry class/animation observed in the browser. A Node VM smoke check of the actual public-motion.js hook verified reduced-motion skips observation, entry unobserves once, preference changes remove animation, and cleanup removes listeners. OS reduced-motion was not visually emulated; no accessibility certification or field-performance score is claimed. Development hot reload emitted createRoot reuse warnings when editing main.jsx; final hosted route checks must distinguish this dev-only warning from deployed behavior. Backend unchanged; backend tests not rerun.

Rollback: revert the public-polish commit with a new normal commit and push, or restore preceding verified Vercel deployment dpl_ANt1uec5kx7MMJeDtt6u9ZXQDQYY. No migration or stored-data change is involved. The deployed build remains a personal frontend review with account services disabled.

## Screenshot corrections, 26 October
Latest screenshots/direct instructions replace the prior card treatment and exact founder punctuation requirement. Navigation links increase to 16px with .04em tracking; buttons use 17px/.035em; wordmark reduces to 80px desktop / 72px mobile. Hero Discover/Pause controls removed as requested; video and reduced-motion behavior retained. Landing uses the original embedded animated headline, with a video entrance fade; other hero text and section paragraphs/addresses/CTAs join the existing once-only entrance system.

Post-hero image now fills its grid cell edge-to-edge, mirrored from the founder's 3:2 split, with padding only on copy. Practice/clinic are semantic articles with only their CTA links interactive, no enclosing borders/padding/hover boxes. Choice heading no longer has a forced line break. Contact email/address blocks are borderless. Reading surfaces use #FFFFFF; hero/footer/founder backgrounds preserved. Founder message punctuation changed to a full stop at the user's explicit request. Optional outbound-action loader omitted because app-launch completion cannot be measured honestly.

Correction checks: lint/review build passed. All four public routes checked at 360/390/768/900/1024/1440 pixels without horizontal overflow. DOM verified white reading background, no deleted hero controls, borderless ARTICLE account containers with one CTA each, and no em dash in founder message. Clicking a practice image stayed on /. Screenshot review confirmed full-height edge-to-edge intro image and unbroken desktop choice heading. Mobile menu/Escape passed. Paragraph entrance classes observed. Hero/footer/founder colors preserved; backend untouched. No external calls/messages sent. OS motion preference remains a code-level check, not a visually emulated one.

## 26 October: principles marquee

Latest user direction replaces the clarity photo banner with a forest-green infinite ticker. This explicit request supersedes the earlier general preference against continuous decorative motion. Reference: the user's item order and colors; actual supplied public/brand/ellis-reverse.svg logo unit. Pill typography uses the existing sans-serif family.

Implementation: two identical flex groups, each at least viewport width, translate exactly half the combined track over a linear 28-second cycle. Hover and keyboard focus ease the CSS animation playback rate to zero over 500ms; leaving resumes from the same position. Reduced-motion CSS presents one static wrapping group. No dependencies added.

Verified: frontend ESLint and review build pass. Browser at 1280px and 390px: no document overflow, exact equal group widths (1280px and 833.275px respectively), actual logo loaded. Desktop transform remained unchanged between observations while focused and moved after leaving. Mobile screenshot inspected. Reduced-motion fallback reviewed in code; OS preference not emulated in browser. Backend unchanged.

## 27 October: editorial framework and shared refinements

Reference map: screenshot 005045 identifies the How introduction to replace; screenshot 004942 supplies four alternating cream text / photographic pairs on forest with narrow gutters and curved framing. GRID 1-4 map in order to Clarity, Accountability, Follow-through and Keep care moving. Earlier no-numbering preference retained. The new cream cards are the user's explicit exception to the prior all-white rule. Detailed provisional account/workflow guidance remains below the framework.

Direction and implementation: Sofia Pro headings and semibold CTAs with Proxima Nova regular body, from supplied references/fonts. Futura PT retained as a source option, not introduced as a third family. Copy only the three used font files into public/fonts; font-display swap avoids blocking text. Full-width thin marquee with free text, actual logo and lime dot. Rounded 12px CTA corners echo the mark. Entry animation uses a shorter 10px travel with a 640ms ease-out and no persistent transform so hover feedback remains responsive. Workflow wrapper becomes a semantic section with one CTA anchor. Reuse existing React and modular CSS; no new dependency.

Implementation plan: inspect assets; update the paired grid, marquee and link semantics; apply shared typography/buttons/motion; check desktop/mobile and action boundaries; build and publish to existing review deployment. React review: stable list keys, semantic articles/headings, image alternatives, lazy photographs, explicit intrinsic image dimensions, reduced-motion styles, no new fetching or state effects.

Verification: frontend ESLint and review build passed. Browser checks on Landing, How, About and Contact at 360, 768, 1024 and 1440px found no horizontal document overflow; shared CTAs computed to 12px radius. At 390px, the framework stacks in readable text/image pairs, all four photos load, ticker is about 71px high with zero text borders. Clicking the workflow photograph stays on Landing; the sole workflow CTA navigates to /how-it-works. Desktop/mobile grid screenshots inspected. Computed heading/body fonts are Sofia Pro/Proxima Nova; visually loaded in preview. Reduced-motion fallback retained and reviewed, not OS-emulated. Backend unchanged.

## 27 October: white workflow text grid

Screenshot 152342 identifies the four detailed workflow rows. Replaced the split heading/body rows with a two-column, two-row grid: heading above copy in each cell, fine top rules, white background, no pictures or decorative numbering. The feedback invitation remains below. Single-column layout at 700px and below. Existing content and CTA retained.

Verified review build, desktop/mobile screenshots, and computed one/two-column layouts at 360, 390, 768, 1024 and 1440px. All measured backgrounds are pure white and no horizontal overflow was detected. CSS-only change; backend untouched.
