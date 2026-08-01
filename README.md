# Budget Escape Travel Planner

Turn a total vacation budget into exciting, realistic destination ideas.

A mobile-first, editorial travel-discovery web app. You choose your departure
city, total budget, currency (USD or EUR), traveler count, trip length, and
approximate dates — and the app returns destinations you can realistically
afford, ranked by fit, each with a large inspiring image and a transparent
all-in cost estimate.

> Estimates only — never live/bookable pricing unless a live provider is
> integrated. Every result shows its data source and last-checked time.

## Goals & scope

This repository is the foundation for the Budget Escape Travel Planner MVP. It
currently ships:

- The **design system foundation** (CSS custom properties / tokens) faithful to
  the reference "Parameters of Escape" editorial direction.
- A **shared app shell**: global reset, header/nav, footer, base layout grid,
  and a reusable **circular budget control** component.
- The mobile-first **input flow**: departure, budget (circular + exact +
  currency), travelers, trip length, and dates with flexibility, emitting one
  structured `inputs` object.
- The **results engine**: honest all-in cost estimates and fit-based ranking,
  image-led destination cards, an itemized estimate breakdown, a destination
  detail panel, and "refine inputs" re-ranking. Results are filtered to those
  whose all-in estimate fits the budget and ranked by fit (budget fit, best
  season, ideal stay length).

The visual direction preserves the reference design language:

| Token | Value |
| --- | --- |
| Ivory canvas | `#F3EFE7` |
| White cards | `#FFFFFF` |
| Deep forest green | `#1E3F27` |
| Muted olive | `#8D8B6D` |
| Pale green accents | `#DFE2BD` |
| Typeface | Inter |

## Stack

- **Vite** + modern vanilla JavaScript (ES modules)
- Semantic HTML + CSS (no framework)
- Designed mobile-first at 360px, then tablet/desktop
- Vercel-ready static output

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
npm run lint       # run ESLint
```

## Environment variables

All environment variables are documented in [`.env.example`](.env.example).
Copy it to `.env` locally if you need values:

```bash
cp .env.example .env
```

Never commit real secrets. For the current static MVP none of the variables are
required.

## Deployment

The build outputs a static site to `dist/` (see `vite.config.js`). The app is
deployed to Vercel from the `main` branch; see `vercel.json` for rewrite/URL
settings. Do not deploy production infrastructure from a feature branch.

## Cost & data honesty

Every result shows its data source and last-checked time. Estimates are ranges
built from public travel-cost guides — they are **illustrative, never live or
bookable pricing**. Cost assumptions live in `src/data/destinations.js` in a
reference currency (USD) with documented image provenance (source, license,
credit) per destination. Currency conversion for non-USD budgets goes through
the pluggable seam in `src/rates.js`, which defaults to a clearly-labeled
bundled reference rate.

## Directory layout

```
├── index.html              # canonical app shell
├── src/
│   ├── main.js             # entry point (wires input -> results)
│   ├── inputs.js           # shared inputs model + validation
│   ├── engine.js           # estimate + ranking engine
│   ├── rates.js            # currency conversion seam
│   ├── data/
│   │   └── destinations.js # seed destinations (costs + image provenance)
│   ├── styles/
│   │   ├── tokens.css      # design tokens (color, space, type, radius, hairline, breakpoints)
│   │   ├── base.css        # reset + base element styles
│   │   ├── layout.css      # shell layout grid (header/nav, main, footer)
│   │   ├── components.css  # component styles (budget control, cards, buttons)
│   │   └── results.css     # results/summary/detail styles
│   └── components/
│       ├── budget-control.js  # reusable circular budget selector
│       ├── input-flow.js      # mobile-first input flow
│       └── results.js         # results grid + breakdown + detail
├── test/                  # node:test unit tests (inputs, engine, data)
├── .github/workflows/ci.yml  # lint + build on PRs and main
└── vercel.json
```

## License

[MIT](LICENSE)
