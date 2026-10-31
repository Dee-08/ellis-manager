# Ellis v1.1 reference and current-state map

## References inspected on 30 October

- `references/loginsignup/animaapp-login.png`: opened at full available resolution. The screenshot has a form column at roughly 40% of the canvas and a rounded artwork panel on the right; the form sequence is brand mark, large serif heading, short explanation, provider actions, divider, labelled email/password fields, primary action, then account/recovery links. The sample is dark with purple art. Ellis keeps the split composition, adapts it to a white canvas and forest controls, and uses only the explicitly permitted photography placeholder. GitHub/SSO actions and Anima artwork are not copied.
- `references/loginsignup/animaapp-signup.png`: opened at full available resolution. It shares the split proportions and form hierarchy, with paired first/last-name fields, a full-width email/password sequence, consent checkboxes and full-width action. Ellis uses its explicit personal/clinic intent and one full-name field; third-party marketing consent and terms are not copied.
- `references/loginsignup/ANIMA_LOGIN_PAGE_STYLES.md` and `ANIMA_SIGN_UP_PAGE_STYLES.md`: inspected the large captured CSS documents and their font/import sections. These are broad third-party application bundles rather than small, screen-specific style sheets; the login capture does not expose a useful scoped auth component set, so no copied selectors or external styles are used. They include Anima's externally hosted Mulish, Caveat, Geist and Roboto Mono font imports plus unrelated application styles. Local Sofia Pro is used for headings/actions and Proxima Nova for body/forms; labels remain visible instead of relying on placeholders. Forms have 50px controls, restrained borders, visible Ellis-green focus, and stack on narrow viewports. Provider availability is shown honestly as disabled with explanation.
- `references/DASHBOARD_STYLE.md`: opened and inspected as a captured Bootstrap 5.3.3/icon stylesheet followed by a custom dashboard kit. The custom token block uses teal, Inter, pale grey surfaces, a 4px spacing scale, 6/10/14px radii, a 264px sidebar (76px collapsed), 64px top bar, 1440px content maximum, and 120/200ms motion. Its sample colour and font tokens conflict with the approved Ellis identity, so only useful structure/density/responsive conventions inform screens; the actual app uses the Ellis forest sidebar, white content area, restrained lime and local fonts. No generic charts are added to fill the sample layout.
- Dashboard screenshot inventory: recursively checked all supplied raster images under `references/`. The four images in `references/screenshots/` are public-site references, not dashboard references. There is no dashboard screenshot available to match. `docs/ellis-reference-map.md` records this limitation; no visual match to an absent dashboard image is claimed.
- No dashboard screenshot was found in the inventory. `references/screenshots/` contains only the four previously used public-site references. Do not claim visual matching to an unseen dashboard screenshot. Follow dashboard style document and explicit light-content/forest-sidebar direction until supplied.

## Baseline behaviour and migration approach

- `server/auth.js`: account-scoped passwords, registration creates account before verification, no central identity, Google or recovery delivery. Replace entry points while retaining maintained Argon2, express-session and PostgreSQL session store.
- `db/migrations/001_foundation.sql`, `002_integrity.sql`: real PostgreSQL accounts, principals, grants, patients, visits, notes, tasks, handovers, audit and composite tenant foreign keys. Keep account/principal IDs as workspace/membership IDs. Add identities and optional links; NEVER merge existing principals by email alone. Legacy claims require explicit verification/migration policy.
- `server/records.js`, `work.js`, `team.js`: persistent legacy domain routes, version checks and audit. Mandatory assignments, self-sign-only and manual activation links do not meet v1.1.
- `web/workspace.jsx`: persistent API-backed shell and forms, not mock arrays. New auth/onboarding must reach this shell; do not invent chart data. `scripts/build-review.js` still deliberately disables public account services.
- `tests/*.test.js`: historical tests assume separate login accounts and currently run using `.env`. Add mandatory isolated-test target safeguards before executing; migrate assertions to v1.1 rather than keeping a bypass registration endpoint.
- `.env` is ignored; redacted inspection found old `ellis_dev` on loopback 55432, connection refused. User subsequently supplied the connection. Read-only inspection confirmed empty `ellis_manager_db` / `public`; additive migrations 001–004 were applied locally. Gmail SMTP was configured but timed out on connection; Google credentials remain unavailable.

## Decisions

Use React/Vite, Express, parameterised pg, SQL migrations, existing session store and Argon2. Additive identities above principals preserve clinical attribution. Persist intent on identity and session. Resolve dev tenants via a validated slug selection and server address records; production cross-subdomain handoffs remain gated until configured. Invitation lifecycle is API-tested; no external invitations were sent.

## Local implementation state after 30 October increment

- The isolated synthetic browser run exercised sign-in, workspace selection, Today and Schedule at loopback ports only. It did not exercise SMTP, Google, production tenancy routing or the actual user database.
- Current implementation adds verified central identities and multiple memberships as required by the master spec. The user confirmed the master spec governs the earlier `AGENTS.md` conflict; see `docs/ellis-progress.md`.
- Schedule bounds use the practice timezone and are covered by a UTC/practice-midnight integration case. New appointment entry is still labeled as using the device timezone.

## Authentication and dashboard visual update

- `web/identity-pages.css` now follows the login/signup references' approximately 40/60 split, centered form column, compact brand placement, large heading, labelled fields, provider/divider sequence and rounded art panel. Ellis-specific light surfaces and forest controls replace the reference's dark-purple palette; the art area remains a plainly labelled placeholder as requested.
- At narrow widths the artwork is removed, the form uses the available width, paired fields stack, and controls remain keyboard-focusable. Reduced-motion preference disables button transitions.
- `web/typography.css` loads the included local Sofia Pro and Proxima Nova fonts; no external font request is introduced. Dashboard style tokens above are interpreted as layout guidance only, since their own teal/Inter palette conflicts with Ellis and no dashboard screenshot exists.
