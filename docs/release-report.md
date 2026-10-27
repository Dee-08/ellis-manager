# Ellis local pilot release — 23 October 2026

Status: functional local full-stack pilot for synthetic data. Public production release is blocked; this is not a hosted product or an authoritative clinical record.

## Delivery

- Local preview: http://127.0.0.1:5173 ; API: http://127.0.0.1:3001/api/health . Processes must be running; setup is in operations.md.
- Tested implementation commit: `dc3a040` (local Git). Subsequent documentation-only commit records this identifier. Repository URL: unavailable; GitHub CLI is signed out and no connected GitHub tool is available. No remote was created or pushed.
- Deployment URL: unavailable. User confirmed no existing PostgreSQL resource or eligible Vercel team/plan. No infrastructure, trial, subscription or paid dependency was purchased. Vercel configuration is prepared but has not been platform-tested.

## Implemented

Public Home, How it works, About, Contact, separate account choices/signup, sign-in and honest recovery guidance. Actual Ellis/Hub Animalia assets and approved photograph derivatives; supplied phone digits retained with spacing.

Independent personal and clinic credentials/records; solo clinic setup; PostgreSQL sessions; optional-title clinic staff; explicit permissions; single-use activation links, rotation/revocation and accountable ownership transfer. No global user or account switcher. Admin permission does not automatically grant clinical editing/signing.

Clients/patients, visits, draft/sign/amend companion notes, tasks/deadlines/statuses, follow-ups/contact attempts, accepted handovers, reasoned reassignment, audit history and permission-checked JSON exports. Account-scoped queries, composite foreign keys, transactions, stale-version conflicts and server-side permission checks protect writes. Saves wait for commit. The app does not send activation email or messages.

## Evidence

- `node --env-file=.env --test tests/*.test.js`: **25 passed, 0 failed** against actual PostgreSQL. Covers personal/solo clinic, independent same-email identities, direct permission and cross-account attacks, signed notes, transaction rollback, concurrent edits, handover, staff revocation, ownership transfer, expiry and timezone boundaries.
- ESLint: passed. Vite production build: passed. Public JS 462.60 kB (137.71 kB gzip), lazy workspace 47.91 kB (9.67 kB gzip); CSS 16.39 kB (4.08 kB gzip). These are bundle measurements, not performance scores.
- Production dependency audit: no known vulnerabilities reported during implementation. This is not a security certification.
- Browser journeys, failed-save retry, responsive samples and visual limitations: browser-review.md.
- Durable records and sessions verified after database/API restart. Cleanly stopped physical backup restored to a separate local port; all recorded counts matched, including the browser-created patient. Machine-readable result: restore-evidence.json. Same-machine rehearsal only; no off-site backup claim.

## Remaining release gates

1. GitHub authentication and intended private-repository destination. Eligible Vercel target and approved persistent PostgreSQL resource with TLS/connection limits. Any additional cost needs specific approval.
2. Verified owner recovery; approved privacy, retention, account closure/export handling; accountable backup operator, independent storage, monitoring and restore schedule. Until then, synthetic data only.
3. Complete matching-width visual comparison, 200% zoom/full accessibility and real-device performance review. Replace illustrative public product strip with approved actual product evidence. Missing Hub Animalia source PDF cannot be independently compared; supplied About Markdown was used.
4. Large-workload/concurrency assessment and production least-privilege DB roles. Histories currently show the latest 100 entries; exports page at 500. Creation retries after a response is lost after commit still need idempotency keys; this differs from the tested failure before submission reached the server.

Uploads, automated messaging, billing, inventory, inpatient care, prescription automation and AI are outside this V1. No empty controls imply they work. Follow-up work is recorded in future-backlog.md.

## Rollback

Keep the prior application commit/build. Revert application code when schema-compatible; do not reverse migrations or delete records automatically. For schema/data recovery, stop writes, take a fresh backup, restore a prior backup into a separate database, validate and switch only with approval if data loss is possible. See operations.md for setup, backup and recovery details.

## Public-page review update — 24 October 2026

Commit: 97cb2a1 (public-page refresh). Repository: https://github.com/Dee-08/ellis-manager. Canonical personal frontend review: https://ellis-manager.vercel.app. Existing Hubb Hobby project and master Git integration are reused; no resources, services, subscriptions or dependencies added.

Delivered: distinct Growmodo-informed How to use, About us and Contact pages; shared landing navigation/footer across public/account routes; named personal, clinic and clarity photographs; transparent Hub Animalia logo; removed decorative labels/numbers. About uses confirmed source copy and founder quote. How remains a provisional guide.

Evidence: ESLint and Vite review build passed. Browser checked four public routes at 360/390/768/1024/1440 pixels with no horizontal overflow or observed failed images. Reviewed desktop and mobile screenshots, menu/Escape, photo cropping, contact link destinations and footer transparency. Full accessibility certification, field performance and OS reduced-motion emulation were not run. Backend code/schema unchanged and backend tests not repeated for this visual change.

This remains a frontend preview. Public account services and patient data are disabled by the review build. Local backend work remains separate. Rollback: revert 97cb2a1 with a normal new commit and push; or restore the preceding verified Vercel deployment dpl_Fz5kdLHd4LnMnvmoMncvXaUDJ1QL. No database migration is involved. No rollback performed.

Deployment verified READY: dpl_HSFEfMEQ2mGHyw7gDCbwRRhMx5Xn, https://ellis-manager-2k9ezy3gr-hubb6.vercel.app, canonical alias https://ellis-manager.vercel.app. Vite build duration 7.7 seconds; Vercel target production (canonical alias), product scope personal frontend preview. Browser verified live Contact artwork and both wordmarks/transparent logo, About hero, and sign-in review gate with zero forms. No browser console errors observed in this check. Platform runtime log scan/drains monitoring were not configured or claimed; this is a static frontend review.

## 26 October public-site polish

Code commit: 57235aa. Repository: https://github.com/Dee-08/ellis-manager. Deployment: https://ellis-manager.vercel.app (unique: https://ellis-manager-i8vtv443e-hubb6.vercel.app), dpl_2UpaeWvsWg6Gr3FNuWAcS6ee8oWd, verified READY on the existing Hubb project. Vercel canonical target is production; product scope remains the personal frontend preview.

Changes: simplified intro, two equal account panels and a separate workflow feature; common 8px spacing/type system; stronger shared primary/secondary CTAs; once-only heading and quote entrance animation; restrained hover/focus/press feedback. Consolidated public CSS and corrected its import order. Existing named assets, video, founder quote and independent-account rules preserved.

Tests: lint, standard build and review build passed; all four public routes checked at five widths with no horizontal overflow. Account panel/image/action geometry aligns on desktop/tablet; mobile flows naturally. Menu/Escape, disclosure, video pause/play and link targets checked. Actual motion-hook smoke check passed preference/entry/cleanup cases; OS-level reduced-motion visual emulation was not run. See docs/public-polish.md for detailed evidence and rollback. Backend unchanged; integration suite not repeated.

Live verification: updated landing structure and stylesheet confirmed; About, How to use and Contact rendered; sign-in displayed Design review only with no enabled account workflow. Some network navigation/tool timeouts occurred and resolved on subsequent checks. This is not a hosted backend release. No new dependencies, services or costs.

## Screenshot correction release — 26 October

Commit 5dc7128, https://github.com/Dee-08/ellis-manager. Corrections and checks are recorded in docs/public-polish.md. Public reading backgrounds are white, account/contact wrappers are removed, only account CTAs navigate, hero controls are removed, introductory image fills its section, founder punctuation updated, nav/buttons enlarged, wordmark reduced, section-copy entrances added. Hero/footer/founder colors remain. Lint/review build and six-width browser checks passed. Reduced-motion support retained; OS-level emulation not run. Optional external-app loader intentionally omitted.

Existing Vercel project reused with no costs or service changes. Two GitHub DNS failures resolved before successful push. Frontend preview only; account services remain disabled. Rollback with a normal revert of 5dc7128 or restore preceding deployment dpl_2UpaeWvsWg6Gr3FNuWAcS6ee8oWd. Backend/schema unchanged.

## Principles marquee release — 26 October 2026

Commit: 12d6ff9d8fc7636c7d0e9bfc4f45644f9fecbf21. Repository: https://github.com/Dee-08/ellis-manager. Canonical frontend preview: https://ellis-manager.vercel.app/. Vercel deployment dpl_FqXdKwe96aymghMsYZwpvRavoGhJ reported READY and the canonical page visibly contains the new marquee.

Replaced the clarity photograph with the actual Ellis logo, lime divider and three outlined pills. Duplicated groups loop continuously; hover/focus decelerates and leaving resumes. Includes static reduced-motion CSS. Frontend lint and review build pass; browser checks at 1280px and 390px confirmed no horizontal overflow and equal-width loop halves. Pause/resume and live appearance verified. Reduced-motion preference was reviewed in code, not emulated. No backend changes or paid dependencies. Existing review-only account restrictions remain.

Rollback: revert commit 12d6ff9 and push master, or promote the prior READY deployment dpl_A8FASudyHNZDVfhRU3hzBRkNfAqL. No database migration is involved.
