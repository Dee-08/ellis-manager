# Design direction and pre-code checkpoint

Direction: calm editorial public pages, compact operational workspace. Quadrant supplies composition; Komma supplies restraint; Leverage supplies paired account choices. This is a documented best-fit interpretation, not a claim of user approval or pixel accuracy.

## Tokens

Forest #042617; lime #74D600; soft-white #F7FBF5; slate #171A1C; white #ffffff; proposed muted ink #536359 and rule #d4ded4. Dark text on lime. System sans (Arial/Segoe UI fallbacks), pending rights for supplied Proxima Nova, Sofia Pro and Futura. Headline clamp 44–88px, section title 32–56px, body 16–19px, labels 12–14px. Spacing 4/8/12/16/24/32/48/64/96. Public max width 1280px, side inset 24–64px. Radius 0 on editorial sections, 4px inputs/buttons, 8px operational panels. No default shadows. Icons 20px, labelled actions. Breakpoints 640/900/1200; no decorative motion; reduced-motion respected.

## Checkpoint specification before application coding

Home: 88px forest header with 160px reverse logo; short navigation. Broad two-part hero: large left headline “Keep care moving.” and concise copy/CTA; right veterinary consultation crop. Below, a clearly labelled illustrative Today strip until real synthetic screen evidence exists. Editorial introduction in a two-column label/copy grid. Four numbered care stages using rules and alternating text/image blocks. Paired independent account choices, FAQ, forest closing CTA and secondary Hub Animalia acknowledgement.

Account choice/signup: two equal rectangular panels, Personal practice and Clinic or hospital. Each starts its own form: practice name/code, owner name/email/password, editable timezone. No membership concept. Clinic can continue alone. Sign-in requires code + email + password. Saving/error states retain input; no successful account until server commit.

Today: 224px forest sidebar desktop; compact top navigation on mobile. Practice name + date; attention list before metrics; task rows show action/patient, accountable person, status and due time. Empty account has a Register patient action. Workspace navigation Today, Patients, Tasks, Follow-ups, Settings; Team only with clinic staff-management permission. Task editing uses version checks and retains unsaved values on conflict.

Patient: identity/client contact header, visit list and chronological activity. Companion notes explicitly do not replace the primary clinical record. Notes signing requires explicit capability independent of administration. No inpatient/billing/upload controls.

Responsive proposal: stack editorial columns below 900px; mobile menu has explicit button, Escape/close handling; forms single column; task rows wrap labels rather than compress text. Test 360,390,768,1024,1440 and 200% zoom. Compare actual screenshots with the selected crops, record departures.
