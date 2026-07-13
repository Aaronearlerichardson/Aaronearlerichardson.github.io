# aaronearlerichardson.github.io

Personal portfolio site — hand-rolled Jekyll and Liquid, no theme gem, no
CSS framework. Palette and type are modeled on the Read the Docs theme
used by [ieeg-pipelines.readthedocs.io](https://ieeg-pipelines.readthedocs.io/en/latest/)
(Roboto Slab / Lato, `#2980b9` blue on near-white).

## Structure

- `_layouts/`, `_includes/` — hand-written templates (default, home, project)
- `assets/css/main.css` — hand-written stylesheet, no framework
- `assets/js/theme.js` — dark/light toggle: persists to `localStorage`,
  syncs the button's `aria-pressed`/`aria-label`. The theme itself is
  resolved before first paint by an inline script in `_includes/head.html`
  (reads `localStorage`, falls back to `prefers-color-scheme`) so there's
  no flash of the wrong theme.
- `assets/js/search.js` + `assets/search-index.json` — client-side search.
  The index is Liquid-generated at build time (title/summary/tags/body for
  every project and top-level page); the JS is a small hand-rolled
  substring scorer plus an ARIA combobox/listbox (arrow keys, Enter,
  Escape). No jQuery, no search library. Degrades to a disabled input and
  a "Search requires JavaScript" note if JS is off.
- `_projects/` — a Jekyll collection; each file is a project detail page
  rendered at `/projects/<name>/`
- `index.md` / `about/index.md` / `projects/index.md` — the three top-level pages

## Local preview

Requires Ruby (3.0–3.3) and Bundler.

```bash
bundle install
bundle exec jekyll serve
```

Visit `http://127.0.0.1:4000`. `bundle exec jekyll build` writes the static
site to `_site/` without serving it.

This repo pins `gem "github-pages"` in the `Gemfile`, so the local Jekyll
version and every plugin matches what GitHub Pages runs in production —
no custom Actions build is needed; GitHub's native Pages build handles it.
`theme: null` is set explicitly in `_config.yml` because the `github-pages`
gem otherwise defaults every site to `jekyll-theme-primer` — this site is
intentionally theme-free.

## Publishing to GitHub Pages

1. Create a **new, empty** repository on GitHub named exactly
   `Aaronearlerichardson.github.io` (no README/license/gitignore —
   this local repo already has them).
2. Add it as the remote and push:
   ```bash
   git remote add origin git@github.com:Aaronearlerichardson/Aaronearlerichardson.github.io.git
   git push -u origin main
   ```
   (use the HTTPS URL instead if you haven't set up SSH keys:
   `https://github.com/Aaronearlerichardson/Aaronearlerichardson.github.io.git`)
3. On GitHub: **Settings → Pages → Build and deployment → Source** →
   select **Deploy from a branch**, branch **main**, folder **/ (root)** → **Save**.
4. Wait a minute or two, then visit **https://aaronearlerichardson.github.io**.

Repos named `<username>.github.io` publish automatically once Pages is
enabled — no further config needed for future pushes to `main`.

## Content maintenance notes

- Add a new project by dropping a file in `_projects/` with `title`,
  `summary`, `stack`, `order`, and optionally `repo` front matter — it's
  picked up automatically by both the homepage and `/projects/`.
- The About page bio, education, and skills come from
  `Aaron 2026 Resume.pdf`. Home address and phone number were
  intentionally left off the public site; update `about/index.md` and
  `_includes/footer.html` if you want to change what's surfaced.
