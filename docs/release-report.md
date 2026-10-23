# Ellis local pilot release — 23 October 2026

Status: functional local full-stack pilot for synthetic data. Public production release is blocked; this is not a hosted product or an authoritative clinical record.

## Delivery

- Local preview: http://127.0.0.1:5173 ; API: http://127.0.0.1:3001/api/health . Processes must be running; setup is in operations.md.
- Source revision: see the local Git milestone commits (`git log --oneline`). Final handoff records the commit hash. Repository URL: unavailable; GitHub CLI is signed out and no connected GitHub tool is available. No remote was created or pushed.
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
