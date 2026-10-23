# Implementation plan

1. Reference inventory, direction, checkpoint specification and decisions (before application code).
2. Public Home, How it works, About, Contact, account forms and representative Today; browser checkpoint.
3. PostgreSQL migrations, independent accounts/principals, Argon2 passwords, database sessions, origin/CSRF protection, persistent throttles. Atomic registration and scoped sign-in. Exercise both account types.
4. Client/patient registration/edit/search, outpatient visits, companion notes with explicit draft/sign/amend capabilities; direct API denial and concurrency tests.
5. Tasks/follow-up contact attempts and accepted handovers; status transitions in transactions with audit. Ended visits retain outstanding work.
6. Pending staff activation, optional titles, explicit grants, revocation/work escalation, safe ownership transfer. Verify cross-account and capability denials.
7. Browser journeys and five widths; database restart/persistence; disposable restore rehearsal; lint/build/dependency audit. Release report states actual evidence.
8. Verify connected GitHub target and Vercel team/plan/database/backup/email resources; private repository and preview only if eligible and no additional cost. No real clinical use until recovery/privacy/retention/backup gates pass.

## Schema/workflow proposal

Accounts own principals, clients, patients, visits, companion notes, tasks, handovers, contact attempts and audit events. Composite account/id foreign keys enforce isolation. Credentials unique only within account. Verified session supplies account context. No global identity. Each mutation validates input and permissions; versioned records reject stale writes; audit is in the same transaction. Notes are signed snapshots; amendments append. Handover retains current owner until accepted. Urgent staff revocation reassigns/escalates open work to owner with audit. Follow-up is a task kind, never a competing status.

## Dependency/cost inventory

React/Vite, Express, pg, Argon2, express-session/connect-pg-simple, Zod, Helmet: free software, no paid API or SaaS dependency. Node and Git available. PostgreSQL/Docker not found on PATH; investigate local runtime before declaring DB tests blocked. GitHub CLI installed but signed out; GitHub and Vercel plugins discovered but unconnected. Existing hosting plan, SQL, email, storage and backups unverified. No subscriptions/provisioning authorised. Attachments deferred. Public contact uses supplied mailto/tel links, no false form submission.
