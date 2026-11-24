# Freebase

Freebase is a searchable directory of free tools, courses, media, and opportunities. It helps visitors see what’s included and check the terms before choosing a resource.

The catalog has 700 unique resources across 45 categories. The editorial pass reviewed 95 entries against provider material and added 51 new destinations, including 25 browser games. Six task collections use source-reviewed picks. The Play section also includes two original games.

## Run locally

Use Node.js 24 or newer and the checked-in npm lockfile.

```sh
npm ci
npm run dev
```

Open [Freebase locally](http://127.0.0.1:3000). To build and serve the production export:

```sh
npm test
npm run check:catalog
npm run typecheck
npm run build
npm run preview
```

The production build writes static HTML and assets to `out/`. Serve that directory with a host that supports directory index files. No database service, app account, API key, or environment variables are required.

## How the app is organized

| Path | Responsibility |
| --- | --- |
| `app/` | Next.js routes, metadata, layout, and global styles |
| `components/` | Directory controls, resource cards, shared UI, and browser storage |
| `lib/catalog.ts` | Catalog import, canonical URLs, stable slugs, category grouping, and legacy bookmark mappings |
| `lib/search.ts` | Task-aware relevance, filter semantics, counts, and URL serialization |
| `lib/collections.ts` | Shortlists and editorial guidance organized by task |
| `app/play/` and `components/games/` | Play index and the original Orbit Courier and Signal Fold games |
| `data/legacy.json` | Original resource rows extracted reproducibly from `freebase.html` |
| `data/reviewed.json` | Source-reviewed entries and new destinations |
| `tests/` and `scripts/` | Regression tests, catalog validation, extraction, and a local production preview |

The directory reads its filter state from the URL. Search runs in the browser over the static catalog. Bookmarks, theme, and result layout use browser storage. Legacy bookmarks can be migrated on the Saved page when the prototype and Next.js app share an origin.

Orbit Courier renders its three orbital lanes with Three.js and has a Canvas 2D fallback. Signal Fold uses a seeded puzzle engine and a live circuit trace. Both have keyboard and touch controls.

## Edit the catalog

1. Find the exact resource or offer page, and a provider source that establishes the terms.
2. Create or update the entry in `data/reviewed.json`. Write a short description, best use, what’s free, main limitation, source URL, and review date. Match an existing destination or supply `replacesUrl` when a provider changes its URL.
3. Record eligibility, licensing, payment-card or account requirements, and other filter fields only when the source establishes them. Omit unresolved facts. An explicit `false` is a claim.
4. Run `npm run check:catalog` and `npm test`. Review the detail page and try a representative search.

Reviews cover the provider’s published information at the recorded date. The inherited entries carry their original labels and can be researched incrementally. Recheck fast-changing offers and licenses first. To reproduce the legacy import, run `node scripts/extract-legacy.mjs`.

## References

- Static pages and deployment use the [Next.js static export guide](https://nextjs.org/docs/app/guides/static-exports).
- Topic and resource navigation uses ordinary links following [Google Search Central’s crawlable links guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
- Keyboard focus, control sizing, and navigation were designed with [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as a reference.
- DM Sans and Manrope are self-hosted from Fontsource. Their license texts are in `public/licenses/`.
- Orbit Courier uses the [Three.js WebGL renderer](https://threejs.org/docs/pages/WebGLRenderer.html). The [design notes](DESIGN.md) describe the visual and interaction decisions.
