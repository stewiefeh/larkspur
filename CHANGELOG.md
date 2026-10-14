# Changelog

All notable changes to Larkspur, newest first.

## v1.0.0 (October 14, 2026)

First public build of the concept site.

### Added
- Editorial design system: OKLCH tokens, paper / late-service themes,
  Fraunces + Inter variable type, 4px spacing scale, clamp() type scale.
- Home page: crossfading hero with word-rise title, press marquee,
  philosophy split, menu preview cards, stat band, gallery with lightbox,
  journal teasers, hours table with live open/closed status.
- Menu page: five tabbed menus (tasting, a la carte, wine, cocktails,
  zero proof) with dietary filters and a dedicated print stylesheet.
- Story page: chef narrative, five-year timeline, farm partners, press.
- Events page: the autumn calendar of long-table dinners, hearth classes,
  and winemaker nights.
- Journal: six long-form essays with drop caps, pull quotes, and a
  readable measure.
- Field report page: the Monday kitchen board with ready / thin / done
  states.
- Colophon: the full design system on display, tokens and specimens live.
- Reserve page: validated request form, hours, access notes, FAQ accordion.
- Site search: local runtime index, full-screen sheet, keyboard nav, / to
  open.
- Progressive enhancement: scroll progress, View Transitions for internal
  navigation, after-10pm dark default, konami larkspur bloom.
- Edge worker: security headers + CSP, immutable asset caching, designed
  404, probe-path blocking.
- Plumbing: sitemap.xml, robots.txt, manifest.json, llms.txt, favicon,
  self-hosted fonts, og image.

### Engineering
- No frameworks. Static HTML plus three JS modules that all degrade.
- CSS in cascade layers, ~3,000 lines, numbered sections.
- One IntersectionObserver for all entrances, staggered by index.
- prefers-reduced-motion collapses all motion to instant states.
- WCAG 2.2 AA targets in both themes.
