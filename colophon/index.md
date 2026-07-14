---
layout: default
title: Colophon
permalink: /colophon/
description: "How this site is built: hand-rolled search, the light/dark theme system, accessibility work, and how it ships — no theme, no framework, no build step beyond Jekyll itself."
---

<h1>Colophon</h1>

<p>
  This site is itself a work sample. Everything below it &mdash; templates,
  search, the theme switcher, the accessibility patterns &mdash; is
  hand-written for this repository: no Jekyll theme, no CSS framework, no
  frontend build tooling. Just Liquid templates, one plain CSS file, and a
  couple hundred lines of dependency-free JavaScript.
</p>

<h2>Search</h2>
<p>
  The search box in the header is a from-scratch implementation, not a
  bundled library. At build time Jekyll emits <code>search-index.json</code>
  &mdash; every page's title, section, tags, summary, and body text. In the
  browser, <code>assets/js/search.js</code> fetches that once and scores it
  against the query with a small weighted substring matcher: exact title
  match scores highest, then a title substring, then a tag hit, then the
  summary, then the full body &mdash; no stemming or fuzzy matching, which is
  plenty of precision for a site this size and keeps the whole thing
  dependency-free.
</p>
<p>
  The input is a full ARIA <code>combobox</code>: <code>aria-expanded</code>,
  <code>aria-controls</code>, and <code>aria-activedescendant</code> track
  state for assistive tech, the results list is a real <code>listbox</code>
  with <code>option</code> roles, and a visually-hidden
  <code>aria-live="polite"</code> region announces result counts as you type.
  Arrow keys move the active option, Enter navigates, Escape closes it. If
  JavaScript doesn't run, the input stays disabled and a plain-text note
  says so rather than presenting a search box that silently does nothing.
</p>

<h2>Theme system</h2>
<p>
  Light/dark mode is a single <code>data-theme</code> attribute on
  <code>&lt;html&gt;</code>, driving every color through CSS custom
  properties defined once in <code>main.css</code> and re-mapped under a
  <code>[data-theme="dark"]</code> selector. The initial theme is resolved by
  a small inline script in <code>&lt;head&gt;</code>, before anything paints:
  it reads a stored preference from <code>localStorage</code>, falls back to
  <code>prefers-color-scheme</code>, and sets the attribute immediately &mdash;
  so there's no flash of the wrong theme on load. The toggle button in the
  header keeps its <code>aria-pressed</code> and <code>aria-label</code>
  ("Switch to dark theme" / "Switch to light theme") in sync with the actual
  state, and it stays <code>hidden</code> until the script confirms
  JavaScript is running, so a no-JS visitor never sees a button that does
  nothing. One more detail: the canvas-drawn demos (the dice-roller and
  wave/FFT visualizers on the Visualizers page) bake colors into already-drawn
  pixels, so they don't repaint automatically when the CSS variables change
  &mdash; the toggle dispatches a <code>sitethemechange</code> custom event
  and those demos listen for it to redraw in the new palette.
</p>

<h2>Accessibility</h2>
<p>
  Alongside the search and theme-toggle patterns above: every page has a
  skip-to-content link that's visually hidden until it receives focus; every
  interactive element gets a visible <code>:focus-visible</code> outline
  instead of relying on the browser default (or worse, suppressing it); a
  <code>prefers-reduced-motion</code> media query collapses all animation and
  transition durations for anyone who's set that preference at the OS level;
  and navigation links mark the current page with <code>aria-current</code>
  rather than just a CSS class, so assistive tech gets the same "you are
  here" signal a sighted user gets from the visual state. This isn't
  theoretical &mdash; an automated audit of the live site (Lighthouse +
  axe-core across all 18 pages) is part of how this site gets checked before
  changes ship, and the one real violation that audit caught &mdash; a
  skipped heading level on the projects grid &mdash; got fixed because of it.
</p>

<h2>Build &amp; deploy</h2>
<p>
  This repo pins the <code>github-pages</code> gem in its
  <code>Gemfile</code>, so the Jekyll version and every plugin running on my
  laptop is exactly what GitHub's own infrastructure runs in production.
  GitHub Pages rebuilds and redeploys automatically on every push to
  <code>main</code> &mdash; no separate GitHub Actions workflow to maintain,
  because the platform's native build already guarantees dev/prod parity.
  The tradeoff is deliberate: for a static portfolio site, a custom CI
  pipeline would be more infrastructure than the problem calls for.
</p>

<h2>Performance</h2>
<p>
  Images are served through <code>&lt;picture&gt;</code> with a WebP source
  and a compressed JPEG/PNG fallback, sized to the width they actually
  render at (not the raw export from whatever tool produced them) so
  retina screens stay sharp without shipping multi-megabyte originals to
  everyone else. Below-the-fold figures are lazy-loaded. Video demos use
  <code>preload="metadata"</code> so the browser fetches just enough to show
  a poster frame and duration, not the whole file, until a visitor actually
  presses play.
</p>

<p>
  <a href="{{ '/' | relative_url }}">&larr; Back home</a>
</p>
