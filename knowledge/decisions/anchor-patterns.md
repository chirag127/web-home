# Family-anchor patterns — `oriz-home` v2

Reference for the 10 sister sites (`oriz-blog`, `oriz-books`, `oriz-book-lore`,
`oriz-cards`, `oriz-finance`, `oriz-image-tools`, `oriz-journal`, `oriz-me`,
`oriz-pdf-tools`, `oriz-urls-to-md`) when they implement their v2 design.
This is the file to grep first instead of re-reading the briefs.

`oriz-home` is the family anchor (commit landed 2026-06-19). It's on the
**dark surface** with mustard-yellow primary + reserved vermilion. The
patterns below are stable across the family even when each site swaps its
primary accent.

---

## Wordmark — `src/components/Wordmark.astro`

The brand mark is `oriz` set in display serif with a **vermilion hairline
strike through the `z`** (proofreader's deletion mark). The strike is
positioned absolutely as a 0.04em-thick `<span>` overlay, extending 0.15em
past each side of the glyph. Vermilion appears here at first paint — this
is the ONE allowed brand exception.

```astro
<!-- Pure home -->
<Wordmark size={128} href={null} asHeading={true} />

<!-- Sub-section: oriz / blog -->
<Wordmark subtitle="blog" />

<!-- Sub-section in light header (no link) -->
<Wordmark subtitle="account" size={56} />
```

Sister sites copy `Wordmark.astro` verbatim. Subtitle renders in mustard
italic; family-token-aware so light variants self-correct.

---

## Color tokens — `src/styles/global.css`

Six tokens at rest, four at hover. Token names are stable across sites;
sister sites just re-paint the values:

```css
:root {
  /* Always visible */
  --paper:        #15110D;   /* dark spine. Sister sites pick their own. */
  --paper-deep:   #0A0805;   /* OLED variant via prefers-contrast: more */
  --ink:          #E8E2D1;   /* bone — body, masthead, index rows */
  --ink-mute:     #8A8270;   /* hairline rules, mono caps, secondary */
  --rule:         #4A3F2E;   /* 1px hairline (pre-mixed for opacity-free use) */

  /* Interactive only — NEVER apply at rest on `oriz-home` */
  --mustard:      #F0DC5A;   /* primary accent on hover/focus */
  --vermilion:    #C8412B;   /* RESERVED — start-arrow + wordmark z-strike only */
  --ledger:       #6B8F71;   /* sub-domain mono strings on hover */
  --highlighter:  #F0DC5A;   /* focus-visible 30% wash */
}
```

Sister-site mapping — each site swaps `--mustard` for its primary accent:

| Site             | --paper      | --mustard equivalent  | Vermilion analogue        |
|------------------|--------------|----------------------|---------------------------|
| oriz-blog        | `#FAF7EE`    | cobalt `#1F4FD8`     | (none — no reserve)       |
| oriz-books       | `#15110D`    | cinnabar `#E5482A`   | (no reserve, red is primary) |
| oriz-book-lore   | `#FAF7EE`    | pencil red `#B71C1C` | (no reserve, red is primary) |
| oriz-cards       | `#2B3A55`    | bone `#E8E2D1`       | vermilion on negatives    |
| oriz-finance     | graph paper  | graph teal `#0F766E` | (none — no reserve)       |
| oriz-home        | `#15110D`    | mustard `#F0DC5A`    | vermilion on start-arrow  |
| oriz-image-tools | `#15110D`    | phosphor `#C8FF3C`   | (none — no reserve)       |
| oriz-journal     | `#15110D`    | seal red `#C25A3F`   | (no reserve, red is primary) |
| oriz-me          | datasheet    | archival `#0B5394`   | (none — no reserve)       |
| oriz-pdf-tools   | `#FAF7EE`    | ledger `#2D4A3E`     | vermilion on destructive  |
| oriz-urls-to-md  | `#FAF7EE`    | hot red `#E63946`    | (no reserve, red is primary) |

Light variant: invert paper/ink, darken accents for contrast. Done in a
single `@media (prefers-color-scheme: light)` block.

---

## Type stack — `src/layouts/BaseLayout.astro`

Three Google Fonts links, no Fraunces:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,ital,wght@6..72,0,400;6..72,0,600;6..72,0,700;6..72,1,400&family=Inter+Tight:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap">
```

Tokens:

```css
@theme {
  --font-display: 'Newsreader', 'GT Sectra', 'Source Serif 4', serif;
  --font-sans:    'Inter Tight', system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;
}
```

Mono utility — disable ligatures, enable tabular numerals. Required for
the `01`–`11` index numerals to align:

```css
code, kbd, pre, samp, .mono {
  font-family: var(--font-mono);
  font-feature-settings: 'tnum' 1, 'zero' 1, 'calt' 0;
}
```

Per-site swaps:
- **oriz-blog**, **oriz-finance** → add `Fraunces` and use it as the
  primary display face. Drop `Newsreader` from `--font-display`.
- **oriz-cards** → swap `Newsreader` for `Geist Mono` (display cut).
- **oriz-books** → swap for `IBM Plex Serif`.
- **oriz-me** → swap `Inter Tight` for `IBM Plex Sans Condensed`.
- **oriz-image-tools** → swap `Newsreader` for `Space Grotesk`.
- **oriz-urls-to-md** → swap `Newsreader` for `Instrument Serif`.

---

## Layout — `.spine` 920px broadsheet column

```css
.spine {
  max-width: 920px;
  margin-inline: auto;
  padding-inline: clamp(1.5rem, 4vw, 2rem);
}
```

Hairline rule helper:

```css
.hairline { height: 1px; background: var(--rule); border: 0; margin: 0; }
```

---

## Monochrome-until-hover signature — `.index-row` in `src/pages/index.astro`

Default state: ink-on-paper only, no accent colors. On `:hover` and
`:focus-visible`: row "comes alive" with mustard category + numerals +
mustard underline; ledger green sub-domain string.

Pattern (verbatim — copy into any site that needs a list of children):

```css
.index-row { color: var(--ink); }
.index-row .num,
.index-row .cat,
.index-row .domain { color: var(--ink-mute); }

.index-row:hover { box-shadow: inset 0 -1px 0 var(--mustard); }
.index-row:hover .num,
.index-row:hover .cat { color: var(--mustard); }
.index-row:hover .domain { color: var(--ledger); }

.index-row:focus-visible {
  outline: none;
  background: color-mix(in oklab, var(--highlighter) 30%, transparent);
  box-shadow: inset 0 -1px 0 var(--mustard);
}
```

Sister sites with their own list-of-children pages (blog post index,
flashcard list, calculator menu) re-use this exact structure.

---

## Header — `src/components/Header.astro`

56px tall, hairline above + below band 1, mono-caps meta strip, no nav
links. The `sign in` word at far right is the ONLY chrome affordance.
Sister sites copy this skeleton and substitute their own `sectionLabel`:

```astro
<Header sectionLabel="ALMANAC" /> <!-- oriz-home -->
<Header sectionLabel="BLOG" />    <!-- oriz-blog -->
<Header sectionLabel="JOURNAL" /> <!-- oriz-journal -->
```

---

## Footer — `src/components/Footer.astro`

The footer IS the sitemap. 4 columns (Read / Make / Track / Meta) +
hairline rules + mono colophon line with `PUBLIC_DEPLOY_TIME` +
`PUBLIC_GIT_SHA` injected by GitHub Actions matrix-deploy at build time.

```env
PUBLIC_DEPLOY_TIME=2026-06-19T14:32:11Z
PUBLIC_GIT_SHA=a13d713
```

Falls back to `new Date().toISOString()` and `'dev'` when env is absent.

---

## Component selector hooks — `src/styles/oriz-ui-overrides.css`

The shared auth + contact form components emit canonical
`data-oriz-account-*` / `data-oriz-finish-sign-in-*` /
`data-oriz-contact-*` attribute hooks. Each site keeps a local
`oriz-ui-overrides.css` that paints those hooks in its own palette. The
hook names are documented at:
- `packages/auth-ui/src/AccountPanel.tsx` (lines 11–29)
- `packages/auth-ui/src/FinishSignIn.tsx` (lines 9–14)
- `packages/contact-form/src/ContactForm.tsx` (lines 12–23)

Sister sites copy `oriz-ui-overrides.css` verbatim and substitute tokens.

---

## Family list — `src/lib/family.ts`

An inline per-app listing of the family sites. Every site keeps its
own copy; the file ships a single-line header comment and the
`FAMILY_SITES` constant.

---

## Firebase init — `src/lib/firebase.ts`

Lazy proxy pattern. `getAuth()` and `getFirestore()` are deferred until
a property is accessed at runtime — so server-side prerender of pages
that import an auth island doesn't crash when env vars are missing on
the build runner. Sister sites copy this file verbatim.

---

## What v2 forbids (locked across the family)

1. NO emoji in chrome (logos, headers, footers, nav). Emoji is allowed
   in body content where contextually appropriate (rare).
2. NO emoji-prefixed cards in CSS grids — the templated indie-hacker
   default. Use the `.index-row` numbered TOC instead.
3. NO stats row (`8 sites · 461 books · 750 cards`). The masthead's
   `NO. 011` carries scale.
4. NO hero illustration / 3D blob / animated gradient. The masthead
   lockup IS the hero.
5. NO Fraunces outside `oriz-blog` / `oriz-finance`.
6. NO theme switcher (the v1 `[data-theme]` system is gone). Light /
   dark via `prefers-color-scheme` only.
7. NO `@chirag127/oriz-ui/styles` import — the package no longer ships
   styles. Use `oriz-ui-overrides.css` with `data-oriz-*` selectors.
