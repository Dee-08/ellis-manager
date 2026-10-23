# Browser review — 23 October 2026

Reviewed the local application using the Codex in-app browser with synthetic records only. This is manual evidence, not an automated browser regression suite or a WCAG certification.

## Working journeys observed

- Sign in to the seeded clinic; later session expiry presents a sign-in link and signing in works again.
- Register synthetic patient Nala and animal owner; refresh and restart the API/database; patient and session survive.
- Start a visit, save a coordination note, sign it, and see Add amendment replace draft editing.
- Create a follow-up; end the visit; follow-up remains outstanding. Log a contact attempt without completing it; explicitly complete it and observe the open list update.
- Stop the API while a task draft is open. Submit shows “The server is unavailable. Please retry.” The Action input retains its text; no success is displayed. Restart API and retry: one task appears. Edit its deadline, observe version 2 and Saved after the response.
- Mobile public menu opens and closes with Escape; corrected the key handler so Escape also works while the toggle retains focus.

## Layout and reference comparison

Normal browser screenshots reviewed for Home, account choices, Today and the task editor. Forest framing, actual outlined Ellis wordmark, fine rules and rectangular editorial sections follow Quadrant; the asymmetric copy and quieter whitespace follow Komma; the two account choices adapt Leverage. The compact workspace deliberately uses smaller type and tighter spacing than public pages. No source photography, third-party logos or testimonials were copied from reference sites.

Actual DOM widths observed across public/workspace checks: 360, 390, 768, 1024 and 1440 CSS pixels, without horizontal document overflow in the measured states. Home images were loaded at the checked mobile state. Signup labels and task rows remained present. These are sampled states, not every page at every width.

The in-app browser viewport override and its 90% zoom caused distorted/duplicated screenshot regions and delayed width changes. Responsive DOM checks were used, while normal-viewport screenshots supplied the reliable visual review. Exact matching-width screenshot comparison remains incomplete; no pixel-accuracy claim. The override is reset for handoff.

Contrast calculations: forest/lime 8.77:1; forest/soft white 15.50:1; muted ink/soft white 6.09:1. Keyboard menu and labelled controls were checked. A full screen-reader audit, 200% zoom, real-device testing, LCP/CLS/INP measurements and comprehensive keyboard traversal were not completed. Homepage product strip remains explicitly illustrative; an approved actual product screenshot is still a public-release design gate.
