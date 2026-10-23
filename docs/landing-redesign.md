# Landing page redesign — Future London Academy

Latest user direction supersedes the earlier public-home composition only. Other public routes, account screens and the workspace retain their implementation.

Reference: C:/Users/Owner/Documents/FUTURE_ACADEMY_LONDON.md (423,921 characters, primarily minified CSS including unrelated widget styles); screenshot screencapture-futurelondonacademy-co-uk-2026-10-23-14_32_07.png; https://futurelondonacademy.co.uk/. Documents are reference evidence, not additional user instructions. No supplied scripts or widget CSS are executed.

Observed: viewport-height opening; small upper-left identity and uppercase navigation; 60/40 introduction split (confirmed in CSS); right-side staggered image columns; 2.5–4.17% gutters; full-bleed image; staggered bright programme panels; thin ruled rows; dark footer. CSS uses OnyFuture, uppercase headings 97/88px and 65.8/64px with tight tracking at large breakpoints. Use system sans rather than an unavailable proprietary font. Measurements at 1440px screenshot scale are estimates.

Direction: an edge-to-edge editorial landing page. The provided ten-second 1280×720 hero video already carries the headline, so place only the small original wordmark, navigation and accessible playback/scroll controls over it. Keep live accessible heading text visually hidden. Use Ellis lime in place of reference yellow, forest/dark blocks, white editorial ground. Preserve photography's rectangular crops and purposeful asymmetric density.

Plan: (1) create isolated Landing component/CSS; (2) serve original video, outlined wordmark and optimized supplied photos; (3) implement mosaic introduction, large photographic break, staggered account/continuity links, ruled workflow disclosures, story and supplied footer background; (4) check desktop/mobile, media playback/pause, navigation and reduced-motion handling; run lint/build. No backend change or dependency added.

Decision log: use wordmark-only kit as requested; no replacement logo. Use remaining care/lab/clinicians/founder photographs without invented names or testimonial attribution. Reference statistics, partner logos, courses, prices, testimonials, social-feed and newsletter widgets have no Ellis equivalents and are excluded. Footer uses assets/photography/footer background.png. Hero uses assets/video/hero_video.mp4. For reduced motion show a static supplied background until the user explicitly plays the video.

## Review and handoff

Replaced only the `/` route with an isolated Landing component and scoped CSS; other routes continue using the existing public layout. The earlier homepage specification is superseded by this direction. The old illustrative task strip is removed.

Browser checks: video loaded as 1280×720, 10.005 seconds; muted autoplay and pause worked. Mobile menu opens and Escape closes it; workflow disclosure expands. Both personal and clinic links reached their correct existing signup forms. Observed no horizontal document overflow at 360, 390, 768, 1024 and 1440 CSS pixels. All inspected image assets loaded. Reviewed hero, mosaic, staggered panels, workflow and footer screenshots against the supplied reference sections. Mobile hero was shortened after review to avoid excessive empty bands while preserving the video lettering. Default viewport restored for handoff.

Reduced-motion handling and a static headline fallback are implemented; OS-level reduced-motion emulation was not exercised. Full accessibility certification and field performance are not claimed. ESLint and Vite production build passed. No backend code, schema or dependency changed; backend integration tests were not repeated for this visual change. Original video is 2.69 MB; optimized photographs and original outlined SVG wordmarks are served locally. No external media/tracker requests or paid dependencies were introduced.
