# Setup, deployment and recovery

## Local development

Requires Node 22.12+ (tested Node 24.19.0), pnpm and PostgreSQL. Run `pnpm install --frozen-lockfile`. Native Argon2 and development PostgreSQL build scripts are explicitly permitted in pnpm-workspace.yaml. No paid API is required.

Use an existing PostgreSQL database via .env, or run `pnpm db:local` in a terminal. The latter starts actual PostgreSQL on 127.0.0.1:55432 with SCRAM authentication, creates ellis_dev and generates ignored local credentials. It is a development convenience, not a production database service. Persistent files live in .local/postgres. Never commit .local or .env.

Then run `pnpm migrate`, `pnpm server`, and in another terminal `pnpm dev`. Open http://127.0.0.1:5173. `node --env-file=.env scripts/seed-demo.js` creates a guarded, synthetic clinic only on a loopback database ending in _dev. It refuses to overwrite an existing demo. The generated test login is in .local/demo-login.json.

`pnpm test` exercises PostgreSQL-backed API tests using unique synthetic accounts. Use a disposable development database; tests intentionally retain synthetic history and never truncate a database. `pnpm lint`, `pnpm build`, and `pnpm audit --prod` complete code/dependency checks. Development runtime does not mean a hosted release.

## Environment

| Variable | Purpose |
|---|---|
| DATABASE_URL | Server-only PostgreSQL connection URI; use TLS with certificate validation for remote databases. |
| SESSION_SECRET | At least 32 random characters, server-only. Rotate deliberately; rotation signs users out. |
| APP_ORIGIN | Exact browser origin, including scheme/port; enforced on every state-changing request. |
| PORT | Local API port, default 3001. |
| NODE_ENV | production enables Secure cookies and production CSP. |

Sessions persist in PostgreSQL; 30-minute rolling idle expiry and 12-hour absolute expiry. Revocation/version checks run on every request and again under the account lock before writes. Transactions serialize writes within an account for a small pilot; independent accounts remain concurrent. This is a deliberate correctness-first tradeoff, to be revisited under load.

The local development role owns the disposable database. Production needs separate migration-owner and restricted application roles. Grant the application SELECT/INSERT/UPDATE as needed on operational tables, SELECT/INSERT only on audit_events, no schema changes or audit UPDATE/DELETE. The signed-note trigger prevents in-place changes but is not an administrator-proof guarantee. Configure database timeouts, connection caps and credentials externally; do not disable TLS verification.

## Hosting gate

User confirmed no existing PostgreSQL resource or eligible Vercel team/plan on 23 October 2026. GitHub CLI was signed out and GitHub/Vercel plugin connections were not confirmed. No repository remote, hosted deployment, SQL marketplace resource, trial or subscription was created.

Vercel documents [Express support](https://vercel.com/docs/frameworks/backend/express), [external storage options](https://vercel.com/docs/storage), and [Hobby non-commercial restrictions](https://vercel.com/docs/limits/fair-use-guidelines). Rechecked during implementation. Actual account eligibility remains unverified; do not classify Ellis as personal to bypass terms.

Prepared layout: Vite build to dist, same-origin `/api` routed to Express, externally persistent PostgreSQL. The deployment entry is api/index.js; vercel.json preserves API routing and SPA direct links. Do not run migrations in request handlers. Before using this configuration, verify a commercial-eligible target, database connection/TLS limits, production-secret isolation, backups, owner recovery and privacy/retention policy. The config has not been deployed or platform-tested.

After GitHub is connected: inspect the intended account and existing ellis repositories first; create one private repository only if absent, set origin and push the local branch. Exclude original reference screenshots, font binaries, source PDFs, environment files and database files. Approved public brand/photography derivatives are included.

## Backup and restore

Local rehearsal evidence is docs/restore-evidence.json. The development PostgreSQL server was cleanly stopped using its pg_ctl executable, its data directory copied to .local/backups/cold-20261023, and the copy started separately on 127.0.0.1:55433. Every recorded table count matched, including sessions; the browser-created patient was found. The original database was restarted and its session/patient were verified in the browser. This is a same-machine physical recovery rehearsal, not an off-site backup policy.

For production, assign an accountable backup owner and approved storage destination. Proposed minimum pending approval: daily encrypted logical backups with restore testing, an independent backup copy, monitored failures, and a documented retention period. Do not assume the development binaries include pg_dump (they do not). Use the database vendor’s supported backup tools and compatible PostgreSQL version. Back up before migration; rehearse restore in a separate disposable database, validate counts, relationships, signed notes and login/session rules, and record RPO/RTO measurements before claiming them.

On Windows, stop this project's database explicitly with `pg_ctl stop -D .local/postgres -m fast -w` before copying files. Interrupting its terminal can terminate child processes without a clean shutdown; a stale postmaster.pid is not proof it is running. Do not remove files until process ownership and database state are verified.

## Rollback

Keep the previous application commit and build. Restore that code/deployment if no incompatible migration was applied. Current migrations are additive; do not automatically reverse them or delete records. If a schema rollback is necessary, stop writes, take a fresh backup, restore the prior backup into a separate database and validate before switching the connection. Data-loss-bearing restoration requires explicit approval. Preserve the failed database for investigation. Revoke sessions if the incident involves access compromise.

## Recovery, privacy and monitoring

Staff activation uses a 24-hour single-use hashed token. Administrators create a link; Ellis does not claim to email it. Rotating an active staff account invalidates access and returns it to pending while preserving its work. Revocation explicitly escalates open work to the current owner. Neither process reveals passwords.

Owner password recovery is a production blocker: no verified email channel or identity-checked manual recovery policy is available. There is no insecure email-only reset or administrator backdoor. Do not admit real clinical data until owner recovery, retention/export/closure handling, reviewed privacy contact and backup responsibilities are agreed. Exports are permission checked, account scoped, no-store JSON pages of up to 500 records with nextOffset.

No third-party analytics/error subscription is installed. APIs return safe error messages. Audit history captures actor/action/entity/time and minimal transition metadata; never passwords, tokens or note bodies. A production operator must configure server error monitoring, log access controls, retention and alerts without collecting unnecessary clinical content. These are operational gates, not compliance claims.

## Personal design review deployment

User selected https://github.com/Dee-08/ellis-manager and clarified the requested deployment is a personal review link. The Vercel configuration now runs pnpm build:review, which explicitly disables account and patient routes and server calls. The deployment upload excludes api/server/db, local credentials, databases and source references; no SQL or paid infrastructure is provisioned. The ordinary pnpm build and local backend still support full-stack development. X-Robots-Tag discourages indexing but is not access control.

Source was successfully pushed to origin/master. Vercel's connected integration denies team scope; the signed-in browser shows the intended Hubb Hobby account. Browser project creation is awaiting user handling of its 2FA setup prompt. Do not claim a deployed URL until the build and live route checks pass.
