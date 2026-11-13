# Photographer Dashboard: Architecture

The dashboard is an admin UI over settings that the client modules already own. It adds no data of its own: the gallery, the portfolio and the store each keep their settings next to their code, and both the dashboard and the client pages read the same saved values. See the app-wide [Architecture.md](../../Architecture.md) for everything else.

## Directory map

```
src/photographer-dashboard/
├── PhotographerDashboard.jsx  Shell: sidebar (full / rail / phone drawer), phone top bar, nested routes, Toaster
├── components/
│   ├── PreviewFrame.jsx       Live preview: client page in an iframe, device widths, scaled to fit
│   ├── Modal.jsx              Short-form dialog (centred card; bottom sheet on phones)
│   ├── InlineName.jsx         Click-to-rename title
│   └── ui.jsx                 PageHeader, Stat, Chip, Tag, Empty, IconButton, Menu, PriceInput, Select
├── lib/hooks.js               useMedia, useDocked (≥960px), usePhone (<640px), useWideNav (≥1024px), useTopOffset
├── galleries/
│   ├── GalleriesPage.jsx      Gallery cards, search, card menu
│   ├── GalleryForm.jsx        New gallery / gallery settings (+ delete)
│   └── GalleryCover.jsx       WithGallery: reads one gallery's cover + count inside its provider
├── gallery/
│   ├── GalleryTab.jsx         Route /galleries/:id/:step → GalleryProvider → breadcrumb, step bar, settings, the step
│   ├── useGalleryWorkspace.js Wires the library, cover, cover photo, headings, footer and grid
│   ├── PhotosStep.jsx         Upload, collections, selection, drag to reorder or move, selection bar
│   ├── DesignStep.jsx         Overview of the four parts → their editors, beside the preview
│   ├── GridEditor.jsx         Default grid layout (new; in the gallery's EditorPane shell)
│   └── ShareStep.jsx          Link, checklist, next steps
├── portfolio/
│   ├── PortfolioTab.jsx       Editor beside the /portfolio preview
│   └── PortfolioEditor.jsx    Profile, Intro, Work, Contact tabs
├── store/
│   ├── CatalogsPage.jsx       Catalog cards, New catalog (everything / nothing / copy), rename, duplicate, delete
│   ├── StoreTab.jsx           One catalog (/store/:catalogId): summary, product and package lists, New package
│   ├── ProductEditor.jsx      Details, Sizes, Options
│   └── PackageEditor.jsx      Details (+ editable contents for custom packages), Pricing
└── *.md                       PRD, Architecture, DesignSystem, Interactions
```

Settings modules (outside this folder, owned by their module):

| Module | File | localStorage key |
|---|---|---|
| Gallery registry | `src/data/galleries.js` (`useGalleries`) | `store-v3:galleries` |
| Photo library | `src/gallery/lib/library.js` | `galleryKey(id, 'library')` (+ IndexedDB `store-v3-media` / `gallery-uploads`) |
| Grid defaults | `src/gallery/lib/settings.js` (`useGridDefaults`) | `galleryKey(id, 'grid')` |
| Cover / cover photo | `src/gallery/templates/cover/config.js`, `photo.js` | `galleryKey(id, 'cover')`, `galleryKey(id, 'cover-photo')` |
| Collection headings | `src/gallery/templates/set-header/config.js` | `galleryKey(id, 'sections')` |
| Footer | `src/gallery/templates/footer/config.js` | `galleryKey(id, 'footer')` |
| Portfolio | `src/portfolio/data/config.js` (`usePortfolio`) | `store-v3:portfolio` |
| Store catalogs | `src/data/storeConfig.js` (`useCatalogs`, `useStoreConfig`) | `store-v3:store` |

`galleryKey(id, name)` is `store-v3:gallery:<id>:<name>`, except for the sample gallery (`lexie-taylor`), which keeps the keys it had before galleries existed (`store-v3:gallery-<name>`), so earlier edits survive.

## Routing

`App.jsx` mounts `dashboard/*` → `PhotographerDashboard`, which has nested routes:

| Path | View |
|---|---|
| `/dashboard` | Redirects to `/dashboard/galleries` |
| `/dashboard/galleries` | `GalleriesPage` |
| `/dashboard/galleries/:galleryId/:step?` | `GalleryTab`; `step` is `photos` (default), `design` or `share`. An unknown gallery redirects to the list, an unknown step to Photos. |
| `/dashboard/portfolio` | `PortfolioTab` |
| `/dashboard/store` | `CatalogsPage` |
| `/dashboard/store/:catalogId` | `StoreTab`; an unknown catalog redirects to the list |
| `/dashboard/gallery/:step?` | Old URL: redirects to the sample gallery |

Client routes in `App.jsx`: `/` redirects to `/dashboard` (the app's entry point), and `/g/:galleryId` renders `GalleryPage` for that gallery. The store's "Back to gallery" and the portfolio's "Gallery" link go to the active gallery's `/g/<id>`.

## Galleries: `data/galleries.js`

- **Registry.** A persisted list of `{ id, title, client, date, collections, catalogId, sample, created }`, newest first. `id` is a slug of the title, made unique. `sample: true` means the gallery starts from the bundled sample photos; otherwise its base photos are empty and everything is an upload. `useGalleries()` returns the list plus `create`, `update`, `remove` (not the last one; also clears its settings keys) and `reassignCatalog`.
- **Which gallery a component is editing.** `GalleryProvider id` puts a gallery id in context, and `useGalleryId()` reads it (default: the sample). Every per-gallery settings hook is a `persistedFamily` keyed by `galleryKey(useGalleryId(), name)` (`forGallery(name, load, save)`), so the hooks kept their signatures. `GalleryPage`, `GalleryTab` and `WithGallery` (list thumbnails) each render inside a provider.
- **`useGalleryData(id)`** (`gallery/lib/useGalleryData.js`) is what a gallery page renders from: the gallery object with the studio's branding, its base photos and collections, its default cover, and the key for the client's own favourites, hidden photos and sets (the sample keeps its original key). `fallbackCover()` falls back to the first photo, then a placeholder.
- **The active gallery.** `GalleryPage` calls `setActiveGallery(id)` (kept in `sessionStorage`). The store `Layout` reads `useActiveGallery()` for its banner and "Back to gallery" link, and `storeConfig` uses it to choose the catalog.
- **Deleting** removes the registry entry, every `galleryKey(id, …)` value and the gallery's uploaded blobs (`purgeUploads`).

## Shared state: `lib/persisted.js`

Each settings module now builds its hook on `persisted(key, load, save?)` instead of `useState` plus its own `localStorage` effect:

- **One value per document.** `persisted()` keeps the value at module level and exposes `use()` (built on `useSyncExternalStore`), `get()`, `set()` and `subscribe()`. Every component reading it sees the same value, so the dashboard's Cover editor and the cover's preview card can't drift apart.
- **Synced across documents.** A `storage` event listener reloads the value when another tab or the preview iframe changes it. Values that arrive that way are not written back, so two documents never echo each other.
- **`persistedFamily(keyOf, load, save?)`** caches one `persisted` value per id (one per gallery). `load(key)` gets the key, so one loader serves every gallery.
- **`load()` sanitises.** It merges saved values over defaults and drops unknown or invalid ones, so an old or hand-edited value can't break a page.
- **`save()` can degrade.** The cover photo and portfolio portrait drop an upload that's too big for storage and keep everything else.

This was the only change needed to make the existing gallery editors usable from the dashboard. Their hooks (`useCoverConfig`, `useSectionConfig`, `useFooterConfig`, `useCoverPhoto`) keep the same API.

## Live preview: `PreviewFrame` + `lib/embed.js`

```
Dashboard document                          Preview iframe (/g/<id>?embed=1)
──────────────────                          ─────────────────────────
editor → persisted.set()                    persisted store (same key)
           │ localStorage.setItem             ▲  'storage' event → load() → re-render
           └──────────────────────────────────┘
PreviewFrame ── postMessage({type:'store-v3:preview', target}) ──▶ usePreviewTarget() → scroll
```

- The iframe loads the real client page (`/g/<id>` for a gallery) with `?embed=1`. `isEmbedded()` hides the page's own edit buttons (the cover's "Edit cover", the footer's and headings' pencils).
- **Targets.** The gallery accepts `cover`, `grid`, `footer` and `section:<collection>`. `footer` first loads the whole grid (the infinite list would otherwise keep pushing the footer away). The portfolio accepts `top` or an element id (`work`, `contact`). Messages from other origins are ignored.
- **Device widths.** The iframe is rendered at 1280, 820 or 390px and scaled with a CSS transform to fit the stage, so the page's own breakpoints (`useBreakpoint`, media queries) are true. On phones (`fit`) it renders at the stage's own width.
- The store has no preview frame. Its changes are visible in the list itself, and "View store" opens the live store.

## Gallery tab

### Library (`gallery/lib/library.js`)

A layer of edits over the gallery's base photos (`gallery/data/photos.js`), which are never changed:

```js
{ collections: string[] | null,      // null = gallery.collections
  assign: { [photoId]: collection },  // moved photos
  order: photoId[] | null,            // display order; unknown ids sort after known
  removed: photoId[],
  uploads: [{ id, name, w, h, collection, added }] }
```

- `useGalleryLibrary(base, baseCollections)` returns `photos` (in the gallery: grouped by collection, then by order), `removed`, `all` and `collections`, plus the actions listed in the file. A photo whose collection no longer exists is shown in the first one.
- **Uploads.** Each file is decoded with an `<img>`, drawn to a canvas at 2400px and 720px, and saved as two JPEG blobs in IndexedDB. Only the manifest goes in localStorage, because image data would quickly fill its ~5MB. Object URLs are cached per document (`urls`), and the hook re-renders when they resolve.
- **Collections are keyed by name.** Renaming re-assigns every photo in the collection to the new name. Heading words are also keyed by name, so a renamed collection loses its custom heading words (known gap).
- **`GalleryPage` uses it.** The client gallery now builds its photos and collection order from `useGalleryLibrary`, so dashboard changes reach it. Client-side hiding, favourites and sets work on top as before.

### Workspace (`useGalleryWorkspace`)

`useGalleryWorkspace(data)` (inside the gallery's provider) calls the same hooks in the same order as `GalleryPage`: library → measured photos → cover config (`coverDefaults(gallery, count)`) → cover photo (`useCoverPhoto(coverPhoto, photos)`) → headings (`useSectionConfig(cover.config)`) → footer (defaults from `usePortfolio().profile`) → grid defaults. `sections` are computed from the library alone; client hiding is per device and doesn't apply here.

### Editors in the dashboard

`EditorPane` gained:
- **`inline`.** It renders in place, filling its parent, instead of as a fixed sliding panel. It still mounts a non-modal Radix `Dialog.Root` so the shared header (`Dialog.Title`, `Dialog.Close`) and Esc-to-close keep working.
- **`resetLabel`.** For example, "Reset product".
- **No tab bar for a single tab.**

`CoverEditor`, `FooterEditor` and `SectionEditor` accept `inline` and pass it through. With `inline`, `SectionEditor` drops its own preview stage and its scroll lock, because the dashboard's iframe is the preview. When not docked (under 960px), the dashboard passes `phone` to the panes so they open as bottom sheets. `SectionEditor` decides that itself, keeping its own stage.

### Grid defaults

`useGridSettings()` (client) now starts from `useGridDefaults()`, the photographer's choice, and the URL only carries values that differ from it. The Layout menu and shared links behave as before.

## Portfolio tab

`usePortfolio()` (`portfolio/data/config.js`) returns the resolved profile (stored fields over the mock `profile`; empty text falls back), the visible `galleries` and `genres` (title and label overrides, hidden ones removed, genres in the photographer's order), `allGalleries` and `allGenres` for the editor, section settings and setters. `Hero`, `Contact`, `PortfolioHeader`, `WorkGrid`, `ProjectPage` and the gallery's `FooterSection` read from it instead of importing `profile` or `galleries` directly. The portrait is `{ id }` (a portfolio photo) or `{ src }` (an upload at 1200px, as a data URL in localStorage).

## Store: catalogs

`data/storeConfig.js` is imported for its side effect in `main.jsx`, before anything reads the catalog. It stores `{ catalogs: [{ id, name, created, products, order, packages, packageOrder, custom }] }`; the single set of edits saved before catalogs existed is migrated into the Main catalog (`id: 'default'`).

1. It snapshots the catalog as delivered (`original`).
2. It picks the **active catalog** for this document, first match wins: the dashboard's override (set by `useStoreConfig(id)` while a catalog is open), `?catalog=<id>` (Preview store; kept in `sessionStorage` for that tab until the client opens a gallery), the active gallery's `catalogId`, then the Main catalog.
3. `apply(catalog)` rebuilds each product and package from the snapshot plus that catalog's edits, and writes the result into the **same objects** that `productById` and `packageById` hold. It then refills the `products` and `packages` arrays with the visible ones, in the catalog's order. A catalog's `custom` packages are added to `packageById`; other catalogs' custom packages are registered too (hidden), so a cart line holding one still prices.
4. It re-applies whenever the stored catalogs, the gallery registry, the active gallery or the override change, in this document or another, and bumps the version `useCatalogVersion()` reports.

`useCatalogs()` lists catalogs with `create(name, 'all' | 'none' | <id to copy>)`, `rename`, `remove` (not Main) and `summary(c)` (counts, lowest price, thumbnails, edit count). `useStoreConfig(id)` returns one catalog with the old setters plus `createPackage`, `editCustom`, `deletePackage`, `addSlot`, `editSlot` and `removeSlot`. A copied catalog gets new ids for its custom packages, so catalogs never share one.

So `lib/pricing.js`, the store pages, the builder and the cart work unchanged:
- Hidden products and packages stay in the `…ById` maps, so existing cart lines still price correctly.
- An option value that's switched off falls back to the option's first value through `getValue()`.

`Layout` keys its outlet on `useCatalogVersion()`, so store pages re-mount and re-read the catalog after a change.

## Production shape

| Prototype | Production |
|---|---|
| `persisted()` + localStorage per browser | Settings API per photographer (store, portfolio, branding) and per gallery (photos, cover, headings, footer, grid) |
| `storage` events to the preview iframe | The preview subscribes to the same draft through the API, or the dashboard posts the draft to the iframe |
| IndexedDB uploads, object URLs | Direct-to-storage uploads, image service for sizes, photo records with original dimensions |
| `apply()` mutating the catalog in place | Catalog served already resolved for the client; the dashboard edits a photographer catalog resource |
| Gallery registry in localStorage, slug ids | Gallery records with server ids, a share token per client link, and a `catalog_id` |
| Active gallery / catalog in sessionStorage | The store URL carries the gallery (or the catalog comes with the client's session) |
| Everyone can open `/dashboard` | Photographer auth; client pages hide every edit affordance |

## Known gaps

- **Per device.** All settings are local to the browser. Opening the gallery on another device shows the defaults.
- **No drafts.** Every edit is live immediately (see the PRD's open questions).
- **No touch reorder for photos.** HTML5 drag-and-drop doesn't fire on touch screens, so phones can move photos between collections but can't reorder them. Products, packages and portfolio categories do reorder on touch.
- **Uploads aren't in the print store's photo list.** The store builder still uses the 28 store photos (an existing gap). Quick buy from the gallery does register uploads.
- **Collection rename loses heading words** (they're keyed by collection name).
- **The heading editor below 960px** shows its own full-screen stage rather than the dashboard's preview.
- **Custom packages use a fixed hero photo** (the store's `p1011`); there's no picker yet.
- **Clients' favourites, hidden photos and sets** for a deleted gallery stay in localStorage (keyed by `gallery:<id>`).
- **The store builder isn't re-keyed** on catalog changes. It's outside `Layout`, and it's never open at the same time as the dashboard in one document.
