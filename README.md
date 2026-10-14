# Larkspur

A fictional seasonal kitchen and bar in Cold Spring, New York. Built as a
design and engineering portfolio piece: every page is hand-written HTML, CSS,
and vanilla JavaScript. No frameworks, no build step for the pages themselves,
no external requests except the fonts, which are self-hosted anyway.

The restaurant, the chef, the farms, the press quotes, and the menu are all
invented. The engineering is not.

## The concept

Larkspur is an "editorial premium" build: the design identity of a print
magazine applied to a restaurant. Fraunces carries the display type, Inter
carries the text, the palette is a warm paper world in OKLCH, and the room's
two themes are "paper" (daytime) and "late service" (after ten). Every page
shares one token-based design system, and no two sections of the site share
the same layout rhythm on purpose.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, press marquee, philosophy, menu preview, stats, gallery, journal teasers, hours |
| `/menu.html` | Five menu tabs (tasting, a la carte, wine, cocktails, zero proof) with dietary filters |
| `/story.html` | Chef story, five-year timeline, farm partners, press quotes |
| `/events.html` | The autumn calendar of long-table dinners, hearth classes, winemaker nights |
| `/journal.html` | Essay index |
| `/journal/*.html` | Six long-form essays from the kitchen |
| `/field-report.html` | The Monday farm report, rendered as the kitchen board |
| `/reserve.html` | Reservation request form, hours, access notes, FAQ accordion |
| `/404.html` | Designed not-found page |

## Engineering notes

**Design system.** One `main.css` (~2,900 lines) organized in `@layer` blocks:
tokens, themes, base, typography, layout, components, motion, responsive,
misc. Every color is OKLCH. Spacing is a 4px scale. The type scale is five
`clamp()` steps that track the root font size, so a user's browser zoom moves
the whole system, not just the body text.

**Theming.** The dark theme is a token remap, not a second stylesheet.
Components never read the theme; they read variables. The toggle persists in
`localStorage` and respects `prefers-color-scheme` on first visit.

**Motion.** Tier 1-2 micro-interactions throughout (button wipes, underline
slides, card lifts). Entrance staggers run on one `IntersectionObserver`. The
hero title rises word by word. Scroll-driven `animation-timeline` parallax
ships as progressive enhancement and is skipped where unsupported.
`prefers-reduced-motion` collapses all of it to instant states.

**Search.** `search.js` builds a local index at runtime, scores queries with
term frequency, title bonuses, and prefix credit, and renders a full-screen
search sheet with keyboard navigation (arrow keys, Enter, Escape, `/` to
open). Snippets highlight the matched terms. No server, no network.

**Accessibility.** Skip link, focus-visible rings everywhere, ARIA on the
tabs, accordions, lightbox, and search dialog. The lightbox and search trap
attention appropriately and close on Escape. Color contrast passes WCAG 2.2
AA in both themes. The menu's dietary marks are inline, not color-only.

**Edge behavior.** `_worker.js` adds security headers and a CSP to every
route, immutable caching for `/assets/`, a friendly 404 for missing routes,
and quiet 404s for probe paths like `/wp-admin`.

**Fonts.** Fraunces and Inter variable WOFF2, self-hosted with
`font-display: swap`. Two requests, no layout shift from font loading.

## Deploying

The site is static plus one worker file, so it deploys to Cloudflare Pages
with a direct upload: `index.html`, `_worker.js`, `assets/`, and the journal
directory at the zip root. The `build_*.py` scripts regenerate every page from
`templates.py`, so the whole site is one command away from a rebuild:

```
python3 build_home.py && python3 build_menu.py && python3 build_story.py \
  && python3 build_journal.py && python3 build_reserve.py \
  && python3 build_404.py && python3 build_extra.py \
  && python3 build_extra2.py && python3 build_extra3.py
```

## Reusing this

The design system layer (tokens, themes, type scale, motion rules) is
deliberately separable from the restaurant content. Point the tokens at a
different palette, swap the fonts, and the same skeleton becomes a gallery, a
studio site, or a shop. That is the point of building it this way.

*Concept and code by Fo (wajo.ai) for Stephen Fehon. Larkspur is not real;
please do not attempt to eat there.*
