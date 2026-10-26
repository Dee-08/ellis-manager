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
