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

## 27 October: editorial framework release

Commit d85acfc26883e4302f17f2d9650141ff3779c97a, repository https://github.com/Dee-08/ellis-manager. Existing Hubb review deployment dpl_GPPUQu5d5a5wk7dMtN1yU65J6RSE reported READY. Verified live https://ellis-manager.vercel.app/how-it-works contains four alternating pairs, all four GRID WebP images load and the supplied typography renders. No browser console errors observed during the check.

Changes: thinner borderless ticker, Sofia Pro headings/CTAs and Proxima Nova body, rounded CTA corners with eased feedback, smoother text entrance, workflow section with only one linked button, forest/cream framework grid. Checks and width matrix documented in public-polish.md. No backend changes; remains frontend review mode. Reduced-motion CSS reviewed but OS preference not emulated. No new dependencies or services. Rollback: revert d85acfc and push, or promote prior READY deployment dpl_bZfMif1h1tsbSEGgSy4Ki6BV3zZj; no database migration required.

## Local backend continuation — 30 October 2026

This is an uncommitted local increment. No push or deployment was made. Additive migrations 001–004 are applied to `ellis_manager_db`, which was inspected read-only first and had no pre-existing tables or records. Tests use a separate disposable PostgreSQL cluster and refuse the user's database.

Added verified identity/setup and personal/clinic workspaces, invitation/conversion APIs, persistent patient/visit/unsigned coordination-note/task flows, and appointment creation, changes, check-in and practice-timezone week filtering. Disposable browser review covered synthetic sign-in, workspace selection, Today and Schedule. It did not verify real email, Google, the complete signup journey, all onboarding flows or production tenancy.

Evidence: `node scripts/test-identity.js` — 25 passed, 0 failed; `node node_modules/eslint/bin/eslint.js web server db tests scripts` — passed; `node node_modules/vite/bin/vite.js build` — passed; `git diff --check` — passed. A timezone-boundary case confirms the schedule week follows Africa/Lagos local midnight.

Release blockers: Gmail SMTP connection timed out (`ETIMEDOUT`), so no email was sent and the local development mailbox remains enabled. Google OAuth configuration is unavailable. Production database/host, privacy and recovery policies, backups and deployment gates remain separate. Prescriptions/treatments, diagnostics, inpatient/discharge, finance, inventory, notifications and reporting remain unimplemented.

Instruction conflict resolved by the user's 30 October choice of “Master spec”: proceed with central identities and multi-workspace membership. See `docs/ellis-progress.md`. This is not a completed veterinary system or hosted release.

## Local authentication and demo-request update — 31 October 2026

Status: uncommitted local increment, not published. Repository remains https://github.com/Dee-08/ellis-manager; https://ellis-manager.vercel.app remains the earlier static frontend preview. No new deployment or release commit is claimed.

Working locally: persistent demo-request form at `/book-demo`; one Create Account header action and primary Book a Demo CTA; forest input-focus borders; verification/session recovery links and workspace-load retries. Verified users enter Today after login. Signup still correctly requires verification and practice setup.

Migration `005_demo_requests.sql` was reviewed and applied additively to `ellis_manager_db`. Demo submissions are validated, rate limited and idempotent. No main-database synthetic records or destructive migrations were used.

Evidence: `pnpm test` passed all 27 tests using isolated PostgreSQL; `pnpm run lint`, `pnpm run build`, and `git diff --check` passed. Disposable browser review verified demo submission/receipt, sign-in to Today and retained session after refresh. Desktop demo layout/focus was inspected; mobile demo visual signoff is incomplete. Real inbox verification and production workflows were not tested.

The local API now uses SMTP, not the local mailbox. `node --env-file=.env scripts/verify-mail.js` verified TLS and authentication without sending a message. This supersedes the earlier timeout result but is not proof of inbox delivery or production readiness. Google OAuth remains unconfigured. No transactional email account/domain or hosted PostgreSQL is available; local PostgreSQL must not be exposed to Vercel.

Publishing: Vercel project access is restored. GitHub write access still fails with HTTP 403 Resource not accessible by integration on a branch-creation retry. No new repository, hosting resource, paid service, push or deployment was created.

Rollback: retain migration 005 and submitted records. Revert only this increment's application changes after reviewing compatibility; never drop the requests table as an automatic rollback. Public deployment needs no rollback because it was not changed. Full master-spec workflows remain incomplete; see `ellis-progress.md` for the continuation checklist.
