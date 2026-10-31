# Ellis v1.1 durable implementation checklist

Authoritative source: references/ELLIS_MASTER_WORKFLOW_CODEX_SPEC.md, fully read 30 October, interpreted with the user's later instructions and repository rules. Do not push/deploy this work.

## Phases
- Phase 0: assessment complete; authentication references inspected; no dashboard screenshots found
- Phase 1: implemented partially; provider integration and a material identity-model conflict remain
- Phase 2: daily work and appointment screens implemented partially; clinical-depth and mobile verification pending
- Phase 3: clinical depth pending
- Phase 4: finance pending
- Phase 5: stock/pilot gates pending

## Requirement evidence
Status pending means not yet verified against v1.1, even if older functionality exists.

| ID | Requirement | Status / evidence |
|---|---|---|
| D01 | Focused practice system with records, workflow and basic billing | Pending |
| D02 | Personal means an independent veterinarian's practice | Partial: personal setup and Today; full clinical/financial scope pending |
| D03 | One identity can access several practices | Implemented/tested per master spec; user confirmed on 30 October that the master spec governs the earlier AGENTS.md conflict |
| D04 | Personal practice can explicitly switch to a clinic in Settings | API verified: same IDs, alias retained, concurrent conversion; UI wired |
| D05 | Base domain is ellismanager.com | Pending |
| D06 | Central login and clinic subdomain login | Pending |
| D07 | Email/password with Google option | Partial: email/password verified; Google pending |
| D08 | Staff join through email invitation | Partial: scoped invitation API tested; SMTP adapter added, connectivity timed out |
| D09 | Job titles optional; editable permission presets | Pending |
| D10 | Any verified user may create a practice | API verified: verified identities create practices; unverified blocked |
| D11 | Clinicians can see all clinical patients in their practice | Pending |
| D12 | Owner and authorised admins see clinic-wide finances | Pending |
| D13 | Payment recording is independently grantable | Pending |
| D14 | Only authorised clinical users, including clinical admins, can sign | Pending |
| D15 | Signing is optional | Pending |
| D16 | Case/task assignment optional | Partial: visits/tasks accept unassigned; authorship persisted |
| D17 | Appropriately permitted staff may pick up shared tasks | Pending |
| D18 | Overdue shared work notifies a designated supervisor | Pending |
| D19 | Important handovers require acceptance | Pending |
| D20 | Important means urgent, time-sensitive treatment or explicitly flagged clinical work | Pending |
| D21 | Full clinical templates, prescribing and treatment charts | Pending |
| D22 | Prescribing is clinician-entered and formatted by Ellis | Pending |
| D23 | Basic persistent inpatient view with scheduled tasks | Pending |
| D24 | Staff-managed appointments and walk-ins | Partial: appointment CRUD/list and idempotent check-in implemented; personal-timezone date filter added; calendar and walk-in override UX pending |
| D25 | Companion animals first | Pending |
| D26 | Invoices, payments, balances and collections | Pending |
| D27 | Record external cash, transfer and POS payments | Pending |
| D28 | Transfers await verification by an authorised user | Pending |
| D29 | Basic stock quantities and movements after the core workflow | Pending |
| D30 | Calls/messages happen outside Ellis initially | Pending |
| D31 | Desktop depth and practical mobile workflows | Partial: Today, patient, task, and schedule desktop screens; responsive CSS, but no viewport-emulated mobile browser review yet |
| D32 | List/table default; optional board | Partial: persistent list views; no board view |
| D33 | Soft white, forest green sidebar, restrained lime | Partial: app shell and Today use light content, forest sidebar, restrained lime; full screens still need review |
| D34 | Network failure visibly blocks unsaved actions | Pending |
| D35 | One location per workspace initially | Pending |
| D36 | Pricing per practice with staff allowance | Pending |
| D37 | Small guided clinic pilot first | Pending |
| D38 | Distinct For myself and For a clinic onboarding | Partial: explicit signup choice and personal/clinic setup paths implemented; browser journey coverage partial |
| D39 | Dashboard references live in ellis/references/ | N/A for absent dashboard reference images; auth visuals mapped in docs/ellis-reference-map.md |
| D40 | Authentication references live in ellis/references/loginsignup/ | Passed inspection and reference map |
| D41 | Existing local PostgreSQL database is ellis_manager_db | Passed: read-only inspection, then migrations 001–004 applied; no pre-existing data/tables |
| AT01 | New email identity registers | Pending |
| AT02 | Existing password user chooses Google | Pending |
| AT03 | User has one practice | Partial: single-practice direct entry implemented; first browser test covers account chooser then Today |
| AT04 | User has two practices | API and browser path tested; remaining full chooser/tenant-routing coverage is pending |
| AT05 | Logged-in nonmember visits clinic URL | Pending |
| AT06 | Two users request same slug | Pending |
| AT07 | Practice creation request repeats | Pending |
| AT08 | Invitation accepted by intended user | Passed API test: matching verified identity joins invited clinic |
| AT09 | Expired/revoked/wrong-user invitation | Pending |
| AT10 | Staff tries granting forbidden capability | Pending |
| AT11 | Last owner is removed | Pending |
| AT12 | Owner explicitly converts personal practice in Settings | Partial: transaction/idempotency/alias tested; confirmation/cancel UI wired, browser completion pending |
| AT13 | Reception opens clinical-only fields | Pending |
| AT14 | Clinician opens unassigned patient | Pending |
| AT15 | Walk-in without staff/room assignment | Passed API test: walk-in visit created without assignee |
| AT16 | Check-in repeated or concurrent | Passed API test: concurrent check-in returns the same visit |
| AT17 | Patient has unknown age/sex | Pending |
| AT18 | Two animals share name | Pending |
| AT19 | Note saved unsigned | Passed API test: unsigned note persists without signing |
| AT20 | Nonclinical admin signs note | Pending |
| AT21 | Clinical admin signs colleague's note | Pending |
| AT22 | Signed note corrected | Pending |
| AT23 | Concurrent unsigned-note edits | Pending |
| AT24 | Prescription issued | Pending |
| AT25 | One recurring dose completed | Pending |
| AT26 | Administration submitted twice | Pending |
| AT27 | Treatment not given | Pending |
| AT28 | Two members claim shared task | Pending |
| AT29 | Shared task overdue | Pending |
| AT30 | Important handover pending | Pending |
| AT31 | Important handover accepted | Pending |
| AT32 | Handover declined | Pending |
| AT33 | Member deactivated | Pending |
| AT34 | Result uploaded after discharge | Pending |
| AT35 | Reviewed result replaced | Pending |
| AT36 | Follow-up call has no answer | Pending |
| AT37 | Patient discharged | Pending |
| AT38 | Inpatient passes midnight | Pending |
| AT39 | Pending transfer entered | Pending |
| AT40 | Transfer confirmed | Pending |
| AT41 | Transfer rejected | Pending |
| AT42 | Invoice paid before transfer verification | Pending |
| AT43 | Payment retry after timeout | Pending |
| AT44 | Staff payment permission without reporting | Pending |
| AT45 | Catalogue price changes | Pending |
| AT46 | Confirmed payment reversed | Pending |
| AT47 | Invoice export requested by unauthorised user | Pending |
| AT48 | Cross-workspace nested ID submitted | Pending |
| AT49 | Membership removed during action | Pending |
| AT50 | Patient attachment direct URL guessed | Pending |
| AT51 | Offline save attempted | Pending |
| AT52 | Server write outcome unknown | Pending |
| AT53 | Today query fails | Pending |
| AT54 | Phone view used | Pending |
| AT55 | Keyboard-only user navigates board | Pending |
| AT56 | Prescription created | Pending |
| AT57 | Concurrent stock-out exceeds stock | Pending |
| AT58 | Notification marked read | Pending |
| AT59 | Practice name changes | Pending |
| AT60 | Clinical note signature omitted | Pending |
| AT61 | User selects For myself and signs up | Partial: personal signup/setup paths implemented; test suite exercises verified setup, browser inspected labels/setup but email delivery remains gated |
| AT62 | Personal signup traverses verification/Google redirects | Pending |
| AT63 | Personal owner logs in after setup | Partial: API login/logout/session persistence tested; browser sign-in verified using disposable synthetic account |
| AT64 | Personal owner checks navigation/checklist | Partial: Today, Schedule, patient-registration entry and task detail browser-checked with synthetic account; personal-only labels/navigation still need browser coverage |
| AT65 | Personal owner has a task with no assignee | Passed API test: unassigned task appears on Today |
| AT66 | Direct staff invite request targets personal practice | Pending |
| AT67 | Owner cancels conversion | Pending |
| AT68 | Owner converts without inviting anyone | Pending |
| AT69 | Conversion request repeats/concurrent submits | Pending |
| AT70 | New conversion address conflicts | Pending |
| AT71 | Owner chooses new address successfully | Pending |
| AT72 | Conversion completes | Pending |
| AT73 | Nonowner calls conversion endpoint | Pending |
| AT74 | Auth screens rendered on desktop and mobile | Partial: signup inspected at desktop/390px; broader auth screens not completed |
| AT75 | PostgreSQL connection configured | Passed locally; secrets only in ignored .env |
| AT76 | Local database has existing schema/data | Passed: empty public schema at inspection, migrations applied additively |
| AT77 | Codex runs remotely without user's local DB | Not applicable to local execution; isolated tests use temporary PostgreSQL |
| AT78 | A clinic has one member | Passed API test: single-owner nonclinical clinic setup |

## Checkpoint 30 October 2026 (local only)

- Local ignored DATABASE_URL corrected with user-supplied connection. Read-only inspection confirmed ellis_manager_db / public and no pre-existing tables. Never printed credentials.
- Applied migrations 001, 002 and additive 003 to this empty local database. No reset, drop, seed or clinical record deletion.
- Added central verified identities, hashed verification/recovery tokens, PostgreSQL sessions, explicit workspace creation with idempotency key, memberships, invitation endpoints, address aliases and owner-confirmed conversion.
- Light auth/setup screens in web/identity-pages.jsx + CSS use inspected Anima composition adapted to Ellis. Placeholder image area only. Settings conversion in web/practice-conversion.jsx.
- Today endpoint in server/today.js queries visits and shared/unassigned tasks. New visits/tasks record authorship separately from optional assignment.
- Existing staff UI now uses email invitation endpoint, no manual activation-link presentation. Google button explicitly disabled; real Google implementation remains pending.
- server/mail.js provides only explicit local development file delivery; actual email provider is pending. Development API started with AUTH_MAIL_MODE=local. No real messages sent.
- Six database-backed identity tests passed in an isolated ellis_test cluster before adding the patient/visit/task test. Expanded test run pending. Tests refuse ellis_manager_db. Historical test suites still target superseded auth semantics and require migration; they are not claimed passing.
- ESLint and Vite production build passed. Desktop signup was visually inspected; global radio styles were corrected. Mobile and full browser journeys still pending.
- No commit/push/deployment of this work. Public Vercel remains its existing frontend preview.

At this historical checkpoint, browser/failure testing, provider work and Phase 2 were still open; later increments below supersede this status.

## Second local increment

- Added additive 004_schedule.sql; applied after isolated DB tests passed. Appointment list/create/change and concurrent-safe check-in in server/schedule.js; UI in web/schedule.jsx. No public booking. Overlap requires explicit override; original times/states retained in audit history. Calendar view, practice-local date filtering, undo check-in and distinct duplicate-encounter overrides remain pending.
- `node scripts/test-identity.js`: 8 tests passed (including parent), 0 failures. Tests cover persisted patient/unsigned note/shared task, overlapping bookings and one visit under concurrent check-in. Runner now uses a free loopback port; prior startup failures did not count as passing tests.
- `node node_modules/eslint/bin/eslint.js web server db tests scripts`: passed.
- `node node_modules/vite/bin/vite.js build`: passed.
- Browser inspected signup at desktop and 390px, personal setup labels at 390px. Full signup journey remains unverified because verification mail delivery did not complete.
- Nodemailer SMTP adapter added following https://nodemailer.com/smtp; Gmail configuration stored only in ignored .env. `node --env-file=.env scripts/verify-mail.js` failed ETIMEDOUT, including outside sandbox. No message sent. AUTH_MAIL_MODE remains local for development. SMTP acceptance is not proof of inbox delivery.
- At this historical checkpoint, invitation-intent, stale-session, unknown-delivery, Google, historical-suite migration and Phase 2 work remained open; later increments below supersede this status.

## Third local increment

- Migrated historical integration/edge suites to verified identities and scoped email invitations. Preserved regression coverage for cross-account FKs, signed-note protection/amendments, stale edits, follow-up retention, handovers, permission denial, revocation and ownership transfer.
- Added explicit shared-task claim with version checks. Concurrent claims admit one winner. Staff revocation returns nonterminal tasks to Shared with historical attribution. Ownership transfer no longer grants visits.manage to nonclinical recipients.
- Membership auth_version is captured on selection and checked on each authenticated request; permission/ownership changes invalidate previous workspace sessions.
- `node scripts/test-identity.js`: **25 passed, 0 failed**, all three suites, isolated PostgreSQL; no user database fixtures. ESLint/build need final rerun after last test-harness edits.
- Disposable browser harness available with ELLIS_BROWSER_TEST=true; serves only test fixtures on loopback 5175/API3002 and refuses SMTP. This does not create synthetic records in ellis_manager_db.

## Fourth local increment — 30 October 2026

- Corrected schedule week selection to use the persisted practice timezone in both the initial date and the server's local-midnight range bounds. Appointment input still explicitly says it uses the device timezone and converts to UTC.
- Browser-reviewed the isolated synthetic sign-in → workspace chooser → practice Today, including real fixture patient, current visit, and unassigned follow-up. Opened Schedule and verified checked-in appointment display with Africa/Lagos formatting. This was a disposable browser/API/database harness, not signup email delivery and not the user's database.
- `node scripts/test-identity.js`: **25 passed, 0 failed**, against an isolated temporary PostgreSQL cluster. Includes parallel check-in, collision/conversion rollback, cross-account reads/writes, permissions, stale updates, invitations/revocation, handovers, owner transfer, export injection strings and FK transaction rollback.
- `node node_modules/eslint/bin/eslint.js web server db tests scripts`: passed after timezone change.
- `node node_modules/vite/bin/vite.js build`: passed after timezone change.
- Gmail SMTP configuration attempt timed out (`ETIMEDOUT`). No email was sent; local mail adapter remains active. Google OAuth credentials/provider were not supplied. Password recovery UI remains honestly gated.
- Current playable scope: verified identity test harness, personal/clinic setup, sign-in, patients, unsigned coordination notes, visits, shared tasks, conversion/invitation APIs, and appointment schedule/check-in. The browser suite did not verify real email/signup, Google, conversion UI, invitation email, staff UI, or production routing.
- Next: complete provider-specific verified signup/recovery and invitation intent, automated browser coverage for both onboarding tracks and conversion, timezone/daylight-offset tests, deployment-config and privacy gates. Then continue deeper workflows; prescriptions/treatments, diagnostics, inpatient/discharge, finance, inventory, notifications and reporting remain unimplemented. Do not claim V1.1 complete.

## Material instruction conflict — resolved 30 October 2026

- Repository `AGENTS.md` previously conflicted with v1.1 on central identity and multi-workspace memberships.
- The user explicitly selected “Master spec” on 30 October. Continue with its central identity and workspace chooser rules; the previous conflict is resolved.
- Migration 003 added the identity/membership model additively and local data inspection found no pre-existing records. Do not remove or reshape it without a separate migration review.

## Fifth local increment — daily-work screens

- Reworked Today into a data-backed workspace screen with practice-local schedule, active visit links, permission-scoped counts, due work ownership, distinct empty/error states, retries and routes into existing patient, appointment and task workflows. Personal task copy describes work as belonging to the practice rather than exposing a clinic team queue.
- Added a collapsible, keyboard-operable practice menu for narrow layouts, conditional practice switch link only when multiple memberships exist, and direct URL entry into patient registration, task details and appointment creation.
- Improved Schedule from repeated tinted panels into a seven-day date-grouped list with practice-local dates and clear change/check-in controls. Appointment entries remain persisted and API permission checks unchanged.
- Browser-reviewed desktop synthetic Today, opened a follow-up detail from Today, opened patient registration and appointment booking, and reviewed the grouped Schedule including a UTC/practice-timezone boundary. A browser run caught and fixed an ISO-string date parsing error before final review. No patient or appointment was created during this screen review.
- `node scripts/test-identity.js`: **25 passed, 0 failed**; `node node_modules/eslint/bin/eslint.js web server db tests scripts`: passed; `node node_modules/vite/bin/vite.js build`: passed. A real mobile viewport was not available in this CUA browser surface, so mobile layout is CSS-reviewed only.
- Current local-browser test content is synthetic and lives in a disposable PostgreSQL cluster. It is not copied to `ellis_manager_db`. Remaining screen work includes visual/mobile verification and workflow screens for clinical templates, prescriptions/treatment, diagnostics, inpatient/discharge, billing, inventory, notifications and reports.

## Sixth local increment — auth and reference alignment

- Reopened `references/loginsignup/animaapp-login.png` and `animaapp-signup.png` and inspected both supplied Anima style captures. Updated `web/identity-pages.css` to the same approximate 40/60 split, centered form column, labelled field hierarchy and rounded art panel, adapted to Ellis's required light background and forest controls. Uses the bundled local Sofia Pro/Proxima Nova fonts and the requested photography placeholder. At narrow widths the artwork hides, paired signup fields stack, and reduced-motion preferences suppress transitions.
- Refreshed `docs/ellis-reference-map.md` with observed compositions and the dashboard-kit conflict. Dashboard CSS supplies structural measures only; recursive image inventory confirms no dashboard screenshot was supplied.
- Browser smoke check on local Vite routes verified sign-in labels/recovery/signup links and clinic signup's explicit account choice. This was an accessibility-tree/route check, not pixel-level screenshot comparison.
- `pnpm run build`, `pnpm run lint` and `git diff --check` passed. This visual-only increment applied no database migration and mutated no records. The remaining workflow checklist and blockers above still apply; Ellis is not V1.1 complete.

## Seventh local increment — public account navigation

- The public header/footer already linked Sign in to `/sign-in` and Create account to `/choose-account`; Vercel's `build:review` route guard was intercepting those screens. Updated `web/main.jsx` so sign-in, signup and account choice routes are reachable in the static preview. The choice page uses the app's shared public header/footer and links to separate personal/clinic signup intents.
- In `web/identity-pages.jsx`, review builds skip auth-configuration API calls, explain that preview account services are unavailable, and disable sign-in/account-creation submission. This makes the destinations visible without implying an account was created or a login was attempted successfully. Local non-preview paths keep their existing API integration.
- Built and reviewed `build:review` using local preview routes. Accessibility tree confirmed public-header Sign in/Create account, chooser links to both signup intents, sign-in link to signup, and disabled preview submission. `pnpm run build:review`, `pnpm run lint` and `git diff --check` passed. Vercel deployment was not performed.
- Deployment check found the existing `ellis-manager` Vercel project under team `hubb6`, but the connected Vercel app lacks permission to inspect or deploy to that team. A one-time team-access approval was requested; wait for that approval before deploying. No new project or Vercel resource was created.

## Eighth local increment — 31 October 2026

- [x] Added `/book-demo` with labelled visitor/practice/contact/timezone fields, consent, pending/error states and a committed receipt. `server/demo.js` validates and persists requests; matching retries return the same receipt and changed-payload retries fail. No appointment confirmation or email delivery is implied.
- [x] Reviewed and applied additive `db/migrations/005_demo_requests.sql` to local `ellis_manager_db`. No test fixtures, resets or destructive changes were applied to that database.
- [x] Public header contains one secondary Create Account action and a primary Book a Demo action. Footer primary action also opens the demo form. Input focus uses forest green rather than lime.
- [x] Verification-screen session recovery, mail-failure recovery links and workspace-load retry paths are implemented. Verified sign-in reaches persisted Today; verification and onboarding remain required for new accounts.
- [x] Restarted the stale local API with SMTP enabled. Configuration endpoint reports email enabled and local mailbox disabled. SMTP TLS/authentication verification passed; no message was sent and inbox delivery is not verified. This supersedes earlier timeout/local-mail status.
- [x] `pnpm test`: 27 passed, 0 failed on disposable PostgreSQL. Includes demo persistence/idempotency and failed-mail recovery through verification, clinic setup, logout/login and Today. `pnpm run lint`, `pnpm run build`, and `git diff --check` passed.
- [x] Disposable browser/API/database flow saved a demo request and displayed its receipt; synthetic verified login reached Today and survived refresh. Desktop demo form and forest focus were inspected. Mobile demo visual signoff remains incomplete.
- [ ] Production release: public Vercel remains a static preview. Vercel project access now works, superseding the previous access blocker. GitHub branch-write retry still returns 403 Resource not accessible by integration. No commit, push or deployment for this increment.
- [ ] Hosted database/backend configuration, verified production email delivery and Google OAuth remain unresolved. User reports no transactional-provider account or verified sender domain. No paid service was provisioned and the local database was not exposed.
- [ ] Remaining master workflow phases listed above are still incomplete. Next release dependency is repository write access plus an approved production database/runtime and email setup; do not enable preview forms against unavailable services.
