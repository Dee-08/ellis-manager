# Ellis — project rules for Codex

These are project instructions, subject to platform/system constraints and the user's later instructions. Read the accompanying design and build briefs before work. Report material contradictions instead of silently choosing an old requirement. These rules do not authorise purchases or bypass access controls.

## Product boundaries

1. Build Ellis around clarity, accountability and follow-through from arrival to follow-up.
2. Personal practice and clinic are distinct account choices. Do not link them to one global user, auto-merge by email, share records, add multi-workspace memberships or introduce account switching.
3. Clinic staff accounts belong to that clinic. Optional job titles are descriptive; permissions control access. Never require receptionist, assistant, nurse or veterinarian categories to create staff.
4. A clinic with only its owner must be fully usable. A personal practice must be usable without inviting anyone. No mandatory second approver for routine solo workflows.
5. Do not assume admin access proves clinical qualification. Make clinical editing/signing explicit capabilities; document that the clinic controls these grants. Do not invent a credential-verification system.
6. Use proposed scope defaults only where documented. Ask before consequential expansion such as inpatient care, billing, prescriptions automation, inventory or paid messaging. No AI service is required for V1.

## Design discipline

7. Inspect supplied screenshots, style files and the approved kit before implementing visuals. Produce a traceable reference map; do not say “followed the references” without naming what informed what.
8. Preserve the Ellis name, approved mark, forest green #042617, lime #74D600 and “Keep care moving.” Use the actual logo assets. Keep Hub Animalia acknowledgement secondary.
9. No generic generated SaaS styling by default: purple/blue gradients, glow blobs, glass cards, oversized empty dashboard tiles, repeated icon grids, random pills, decorative charts or meaningless animations.
10. No invented testimonials, numbers, partner logos, certifications, product capabilities or “best in class” claims. “Better than competitors” is an ambition to test, not copy to publish.
11. Adapt reference patterns carefully. Do not carry over third-party branding, private data, trackers, unlicensed assets or unreviewed scripts.
12. Build every displayed action, link and form honestly. Hide deferred features or mark demos explicitly. No fake successful saves, signup, invitation delivery or contact submission.
13. Implement responsive, keyboard accessible interfaces and explicit loading, error, empty and permission states. Verify in a browser at multiple widths.

## Engineering discipline

14. Prefer maintainable React/Vite, JavaScript/JSX, Tailwind/CSS, Express and PostgreSQL with parameterised SQL. Do not introduce Next.js, Supabase, Redis, a heavy ORM or another service merely by habit. Propose justified changes before adopting them.
15. Keep a modular monolith and a small dependency set. Separate route validation, authorisation, domain rules and database access. Use migrations and a lockfile. Document setup, deployment and recovery in plain language.
16. Never ship browser-to-database credentials, client-only authorisation, plaintext passwords, custom cryptography, production in-memory sessions or real secrets in Git. Use maintained security libraries and current official guidance.
17. Enforce account isolation on every server query and write, including search, exports, counts, uploads and audit history. Derive account context from a verified session, not a submitted account ID.
18. Check object ownership and capabilities on every request. Use database constraints and transactions to prevent cross-account foreign keys and partial writes. Log sensitive state changes without logging secrets or unnecessary clinical text.
19. Validate inputs on the server. Parameterise SQL. Protect session cookies, state-changing requests, authentication endpoints and upload/download paths. Do not render unsanitised supplied HTML.
20. Use real PostgreSQL persistence for operational data. Browser storage or JSON fixtures may support an explicitly isolated demo, never masquerade as the working backend.
21. Keep historical attribution when disabling staff. Reassign or explicitly review their open work. Revocation must invalidate existing access. Never delete clinical or audit history as an incidental effect of removing a login.
22. Prevent silent overwrite of concurrent changes. Use transactional status updates and version checks; show a useful conflict resolution path.
23. Never imply “saved” until the server commits. Do not silently queue clinical writes offline. Preserve unsaved work safely in memory and offer retry; avoid storing sensitive drafts on shared devices by default.
24. Signed clinical notes are not silently editable. Use amendments. Audit events are append-only at the application layer; do not claim cryptographic or administrator-proof immutability.

## Cost, access and deployment

25. No new subscriptions, card entry, trials that auto-charge, paid APIs, marketplace provisioning or usage-based services without specific cost approval. Free software does not imply free production infrastructure.
26. The user has authorised creating the project repository, pushing code and deploying to Vercel using suitable connected resources. Verify actual access, account/team, plan and target first. Prefer one private repository unless an existing project is identified. Avoid duplicate repos/projects.
27. Do not ask again for routine authorised commits or deployments. Ask when access is unavailable, the destination is ambiguous, costs arise, or an action risks existing data/resources. Explain the exact blocker and complete independent work first.
28. Never expose secrets, real patient/client information, source reference files with unclear redistribution rights, or private test datasets through public repos or previews. Keep demo seed data synthetic and separate from production.
29. Do not assume a Vercel deployment supplies persistent SQL or disk. Check plan eligibility, persistence, connection limits, storage, email delivery and backup arrangements. Do not make a commercial deployment on a plan whose terms prohibit it.
30. Never force-push, overwrite unrelated work, replace production data, delete resources or run destructive migrations without specific authorisation. Domain ownership and DNS changes are not implied by the planned domain name.

## Quality and completion

31. Record decisions and assumptions. Raise material blockers succinctly; decide routine implementation details and continue. “META”, “truth” and “REDTEAM” mean careful review and honest evidence here, not a tool or guaranteed reasoning mode.
32. Test critical journeys and security boundaries, not only component rendering. Include personal and solo-clinic use, staff permission denial, cross-account access attempts, ownership transfers, failed requests and concurrent edits.
33. Do not declare completion because the build passes. Verify browser flows, deployed APIs, durable records across refresh/restart and intended responsive layouts. State exactly which checks ran and which did not.
34. Produce a concise release report with commit, repo URL, deployment URL, working features, test evidence, known limits and rollback steps. Say “frontend preview” if that is all that works.
35. Marketing expansion follows functional delivery. Keep a future marketing backlog; do not spend V1 effort on analytics subscriptions, campaigns or invented commercial offers.

## Ongoing visual guidance

For Ellis design and copy changes, read HUMAN_DESIGN_GUIDE.md alongside the current brief. It records the user's photography-led direction, reduced decorative arrows and restrained motion preferences. Later user instructions take precedence.
