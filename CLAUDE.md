# CLAUDE.md — lukeberetta.github.io

Personal portfolio and case study site for Luke Beretta — Designer & Builder based in Cape Town.

## Project Structure

```
/
├── index.html                  # Home page
├── case-studies/
│   └── journey.html            # Journey (YC W21) case study
├── assets/
│   ├── css/main.css            # Single shared stylesheet
│   ├── js/
│   │   ├── index.js            # Scroll hijack (desktop only, rAF-based)
│   │   └── cursor.js           # Custom liquid-glass cursor + magnetic elements
│   ├── fonts/
│   │   ├── DrukWide-Medium.ttf # Display / headings
│   │   └── PolySans-Neutral.otf# Body copy
│   └── img/                    # Images, icons, case study media
└── CNAME                       # lukeberetta.github.io
```

## Tech Stack

- **Plain HTML/CSS/JS** — no build step, no framework, no bundler
- Deployed via **GitHub Pages** — pushing to `master` is a deploy
- The CSS `?v=2` cache-busting suffix on stylesheet links must be incremented when making breaking CSS changes

## Design System

**Fonts**
- `DrukWide` — all headings (`h1`, `h2`), section labels (`span`), nav items
- `PolySans-Neutral` — body copy, project names

**Colours** (defined in `:root`)
- `--colour-light: #fff`
- `--colour-dark: #181818`
- `--colour-accent: #a0a0a0` (active value — note there are stacked declarations above it; the last one wins)

**Breakpoint** — `max-width: 451px` is the single mobile breakpoint used throughout

**Theme** — `.is-black` on `<body>` activates the dark theme (always on)

## Layout Architecture

The desktop scroll experience is **non-standard**:
- `.app-main` is `position: fixed` — it does not scroll naturally
- `index.js` sets `body.style.height` to match `.app-main`'s scroll height and drives `translate3d` via `requestAnimationFrame`
- On mobile (`hover: none` or `pointer: coarse`) the body gets `.is-mobile` and `.app-main` falls back to `position: relative` (normal flow)
- Do not add `overflow`, `scroll`, or `position` changes to `.app-main` without understanding this scroll system

## Custom Cursor (`cursor.js`)

Spring-physics liquid-glass cursor blob — desktop only (`hover: hover` + `pointer: fine`).

Key behaviours:
- `.cursor-active` on `<body>` hides the native cursor
- `.cursor-blob` is the visual element; `.is-visible`, `.is-hovering`, `.is-merged` toggle states
- **Magnetic pull** targets: `.back-link`, `.project-icon`, `.project-folder-icon` (linear), `.nav-link` (rotated — axes are swapped because the aside is `rotate(-90deg)`)
- Grid glow (`#grid-overlay-glow`) tracks the cursor via CSS custom properties `--cx` / `--cy`
- The rAF loop follows a strict **read → compute → write** phase order to avoid forced reflows

When adding new interactive elements that should have magnetic pull, add them to `magTargets` in `cursor.js`.

## Adding Content

**New project card** — add an `<a class="project-card">` inside the relevant `.projects` grid in `index.html`. Follow the existing icon structure (`.project-icon > .project-thumb > img`).

**New case study** — duplicate `case-studies/journey.html`. The page shares `main.css` via `../assets/css/main.css`. Add a `.project-card--folder` entry in `index.html`.

**New section** — add `<section class="main-section fadein-3">` inside `.app-main`. Sections use `padding-bottom: 120px` spacing.

## Animation

Fade-in classes: `fadein-1` (0.3s delay), `fadein-2` (0.6s), `fadein-3` (0.9s). All animate `opacity: 0 → 1`.

## Image / Media Conventions

- Project icons: SVG, rendered inside `.project-icon` at 120×120px (72×72px mobile)
- Case study media: stored in `assets/img/<project-name>/`
- Full-bleed images/video use `.img-placeholder.img-full` — width is `calc(100vw - 240px)` desktop, `calc(100vw - 96px)` mobile
- Videos should have `autoplay muted loop playsinline` attributes

## What to Avoid

- Do not introduce a build system, bundler, or npm unless explicitly asked
- Do not add JavaScript frameworks — this is intentionally vanilla
- Do not change `.app-main` scroll/position behaviour without accounting for the rAF scroll system
- Do not add new CSS files — everything lives in `main.css`
- Do not bump the CSS `?v=` query string unless cache-busting is actually needed
