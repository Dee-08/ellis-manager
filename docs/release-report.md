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
