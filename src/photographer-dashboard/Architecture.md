# Photographer Dashboard: Architecture

The dashboard is an admin UI over settings that the client modules already own. It adds no data of its own: the gallery, the portfolio and the store each keep their settings next to their code, and both the dashboard and the client pages read the same saved values. See the app-wide [Architecture.md](../../Architecture.md) for everything else.

## Directory map

```
src/photographer-dashboard/
├── PhotographerDashboard.jsx  Shell: sidebar (full / rail / phone drawer), phone top bar, nested routes, Toaster
├── components/
│   ├── PreviewFrame.jsx       Live preview: client page in an iframe, device widths, scaled to fit; optional toolbar `heading` + `actions`
│   ├── Modal.jsx              Short-form dialog (centred card; bottom sheet on phones)
│   ├── InlineName.jsx         Click-to-rename title
│   └── ui.jsx                 PageHeader, Stat, Chip, Tag, Empty, IconButton, Menu, PriceInput, Select
├── lib/hooks.js               useMedia, useDocked (≥960px), usePhone (<640px), useWideNav (≥1024px), useTopOffset
├── galleries/
│   ├── GalleriesPage.jsx      Gallery cards, search, card menu
│   ├── GalleryForm.jsx        New gallery / gallery settings (+ delete)
│   └── GalleryCover.jsx       WithGallery: reads one gallery's cover + count inside its provider
├── gallery/
│   ├── GalleryTab.jsx         Route /galleries/:id/:step → GalleryProvider → header (breadcrumb, settings, View; on Design passed into the preview toolbar instead), the step, right-hand step rail (with the Design parts tray when docked)
│   ├── useGalleryWorkspace.js Wires the library, cover, cover photo, headings, footer and grid
│   ├── PhotosStep.jsx         Upload, collections, selection, drag to reorder or move, selection bar
│   ├── DesignStep.jsx         Preview + right column with the open editor (chips + sheets when narrow); `designParts(ws)` for the rail
│   ├── GridEditor.jsx         Default grid layout (new; in the gallery's EditorPane shell)
│   ├── SettingsStep.jsx       Access type, roles and links, then Access / Engagement / Privacy settings; draft + Save bar
│   ├── access.js              Settings model: defaults, load/normalize, rules (pinRequired, filterIncluded, saveBlocker), useGalleryAccess
│   ├── ShareStep.jsx          Access overview (links, passwords, PINs), email composer, QR card, checklist, next steps
│   ├── share.js               Share settings (email wording, includes, QR options), composeEmail, mailto, qrFor (uqr), qrCardPNG
│   ├── AnalyticsStep.jsx      Totals, download split, people list, person dialog, CSV export
│   └── analytics.js           Sample analytics for a gallery (buildAnalytics), toCSV, ago, shortDate
├── portfolio/
│   ├── PortfolioTab.jsx       /portfolio preview with the editor docked on its right
│   └── PortfolioEditor.jsx    Profile, Intro, Work, Contact tabs
├── store/
│   ├── CatalogsPage.jsx       Catalog cards, New catalog (everything / nothing / copy), rename, duplicate, delete
│   ├── StoreTab.jsx           One catalog (/store/:catalogId): summary, product and package lists, New product, New package
│   ├── ProductEditor.jsx      Catalog products: Details, Sizes, Options
│   ├── CustomProductEditor.jsx The photographer's own products: Details, Images, Sizes, Options
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
| `/dashboard/galleries/:galleryId/:step?` | `GalleryTab`; `step` is `photos` (default), `design`, `settings`, `share` or `analytics`. An unknown gallery redirects to the list, an unknown step to Photos. |
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
- **Optional `onClose` (inline).** Without it the pane can't be closed: no ✕, no Done, Esc is ignored, and the footer only shows if there's a Reset. `DesignStep` leaves it out when docked, since the step rail's parts tray switches editors; `editing` falls back to `'cover'` there. The open part is the `part` search param (`cover` | `grid` | `headings` | `footer`, anything else is ignored), read by both `DesignStep` and `StepRail`; `DesignStep` sets it with `replace` and leaves other params alone. Closing a sheet removes it.
- **No tab bar for a single tab.**

`CoverEditor`, `FooterEditor` and `SectionEditor` accept `inline` and pass it through. With `inline`, `SectionEditor` drops its own preview stage and its scroll lock, because the dashboard's iframe is the preview. When not docked (under 960px), the dashboard passes `phone` to the panes so they open as bottom sheets. `SectionEditor` decides that itself, keeping its own stage.

### Analytics (`analytics.js`, `AnalyticsStep.jsx`)

There's no tracking backend, so `buildAnalytics(galleryId, client, photos)` generates sample activity with a seeded PRNG (mulberry32 over the gallery id). The same gallery always shows the same people; every event points at a photo in `ws.photos`, so thumbnails are real. It's recomputed when the photo ids change and nothing is saved (no storage key). A gallery with no photos returns `null` (empty state).

Shape: `{ anonymous, people: [person], totals }`. A person is `{ id, email, name, isClient, visits, firstVisit, lastActive, downloads: [{ photoId, at }], fullDownloads: [{ at, size }], shares: [{ photoId, at, via }], favourites: [{ photoId, at }], comments: [{ photoId, at, text }], orders: [{ id, at, items: [{ name, size, qty, price, photoId }], total }], spent }` (dates are ms timestamps). The first person is the gallery's client (`isClient`), always the most active. `totals` has `visitors` (people + anonymous), `identified`, `downloads`, `singleDownloads`, `fullDownloads`, `singleDownloaders`, `fullDownloaders`, `revenue`, `orders`, `favourites`, `shares`, `comments`. Order items use the bundled catalog's base size prices (`src/data/catalog.js`), not the gallery's catalog overrides.

`toCSV(people)` builds the export (one row per person, in the list's current filter and sort); `AnalyticsStep` downloads it as `<gallery id>-analytics.csv`.

### Settings (`access.js`, `SettingsStep.jsx`)

`useGalleryAccess()` is `forGallery('access', load)`, saved under `galleryKey(id, 'access')` (`store-v3:gallery-access` for the sample). Shape:

```
{ mode: 'anyone' | 'roles', roles: ['client' | 'guest' | 'vendor'], singleLink, expiry: { all, client, guest, vendor },  // yyyy-mm-dd or ''
  data: { anyone, client, guest, vendor } }  // one audience each:
{ collectEmail: { on }, approved: { on, people: [{ id, name, email, phone }] }, pin: { on, value },
  faceSearch: { on, scope: 'all' | 'own' }, comments, filterByFace, favoriting: { on, limit }, hideImages: { on, bulk },
  screenshot, downloads: { on, pin: { on, code }, image: { on, sizes: { web, high }, limit }, video: { on } },
  sharing: { on, image, video }, sets: { on, hidden: [collection title] } }
```

- `load` merges the stored value over `defaults()` keeping only values of the right type, then `normalize()`s it. Defaults: Anyone, everything off; Client everything on except email collection, password and face scan, on the approved list; Guest the same but collecting email; Vendor like Client.
- `normalize()` keeps roles in Client, Guest, Vendor order, makes exactly one of `collectEmail` / `approved` true per role, and sets `pin.on` when `pinRequired(s, role)` (roles + `singleLink` + not approved). `filterIncluded(d)` is face scan on with scope `all`.
- `saveBlocker(s)` returns the first reason Save is disabled, or null. Limits are whole numbers up to `LIMIT_MAX` (99999), `''` meaning no limit.
- `SettingsStep` keeps a local draft (`structuredClone` + `normalize` on every edit) and only calls the setter on Save. While it has no unsaved changes it follows the saved value (another tab). A `beforeunload` listener warns while it's dirty.
- Set visibility stores hidden collection titles, so new collections show by default.

### Share (`share.js`, `ShareStep.jsx`)

Everything is derived from `useGalleryAccess()`; the step only saves the photographer's wording and choices, `useShareSettings()` = `forGallery('share', load)` under `galleryKey(id, 'share')` (`store-v3:gallery-share` for the sample):

```
{ subject, message, closing,             // '' = use defaultText(gallery)
  include: { link, password, pin, expiry }, // email details, all true by default
  qr: { password, pin } }                  // printed under the QR code (true, false)
```

- `linkFor(access, aud, base)` is the shared link for `anyone` or a single link, else `?role=<aud>`. `expiryFor` reads `expiry.all` or the role's own. `codesFor(access, aud)` gives `{ password, pin }` ('' when off).
- `composeEmail` builds `{ subject, body }`: message, the included detail lines, sign-off. `mailto(to, email)` encodes it. Recipients aren't saved; they reset to the approved list when the audience changes (`EmailComposer` is keyed by audience).
- QR codes come from `uqr` (`encode`, ECC M, no border): the card draws them as one SVG path with `crispEdges`; `qrCardPNG` draws a 1080 × 1350 canvas (title, code at whole-pixel offsets, caption, lines) and returns a data URL that's downloaded as `<gallery>[-<role>]-qr.png`.

### Grid defaults

`useGridSettings()` (client) now starts from `useGridDefaults()`, the photographer's choice, and the URL only carries values that differ from it. The Layout menu and shared links behave as before.

## Portfolio tab

`usePortfolio()` (`portfolio/data/config.js`) returns the resolved profile (stored fields over the mock `profile`; empty text falls back), the visible `galleries` and `genres` (title and label overrides, hidden ones removed, genres in the photographer's order), `allGalleries` and `allGenres` for the editor, section settings and setters. `Hero`, `Contact`, `PortfolioHeader`, `WorkGrid`, `ProjectPage` and the gallery's `FooterSection` read from it instead of importing `profile` or `galleries` directly. The portrait is `{ id }` (a portfolio photo) or `{ src }` (an upload at 1200px, as a data URL in localStorage).

## Store: catalogs

`data/storeConfig.js` is imported for its side effect in `main.jsx`, before anything reads the catalog. It stores `{ catalogs: [{ id, name, created, products, order, packages, packageOrder, custom, customProducts }] }` under `store-v3:store`; the single set of edits saved before catalogs existed is migrated into the Main catalog (`id: 'default'`).

1. It snapshots the catalog as delivered (`original`).
2. It picks the **active catalog** for this document, first match wins: the dashboard's override (set by `useStoreConfig(id)` while a catalog is open), `?catalog=<id>` (Preview store; kept in `sessionStorage` for that tab until the client opens a gallery), the active gallery's `catalogId`, then the Main catalog.
3. `apply(catalog)` rebuilds each product and package from the snapshot plus that catalog's edits, and writes the result into the **same objects** that `productById` and `packageById` hold. It then refills the `products` and `packages` arrays with the visible ones, in the catalog's order. A catalog's `customProducts` and `custom` packages are added to `productById` / `packageById`; other catalogs' are registered too (hidden), so a cart line holding one still prices.
4. It re-applies whenever the stored catalogs, the gallery registry, the active gallery or the override change, in this document or another, and bumps the version `useCatalogVersion()` reports.

`useCatalogs()` lists catalogs with `create(name, 'all' | 'none' | <id to copy>)`, `rename`, `remove` (not Main) and `summary(c)` (counts, lowest price, thumbnails, edit count). `useStoreConfig(id)` returns one catalog with the old setters plus `createPackage`, `editCustom`, `deletePackage`, `addSlot`, `editSlot`, `removeSlot`, and for the photographer's own products `createProduct(category)`, `editOwnProduct(id, patch | fn)`, `deleteProduct(id)` (also drops it from custom packages), `isOwnProduct(id)` and `productDef(id)`. `editProduct(id, { hidden })` works for both kinds, so the list's switch needs no special case. `allProducts` includes custom products (hidden ones too) in the catalog's order. A copied catalog gets new ids for its custom products and packages (with package lines and the product order remapped), so catalogs never share one.

**Custom products** have the same shape as a catalog product (`src/data/catalog.js`), plus `custom: true`, `hidden` and `images: [{ src, w, h }]` (JPEG data URLs, 1000px, quality 0.8). `blankProduct(id, category)` is the starting point; `readCustomProduct` sanitises stored ones on load (known category, `size` option first with labels rebuilt from `w × h`, numbers clamped to `LIMITS`); `resolveCustom` makes the store-facing copy (empty name → "Untitled product", unnamed choices and empty options dropped, book max ≥ min). `style` is one of `LOOKS` and picks the `ProductMockup` branch; `mode` is one of `MODES`. Their edits live in the definition itself, so **Reset** leaves them alone. `storeSize()` and `STORE_BUDGET` (3.5M characters) stop image uploads before localStorage fills up. `src/state/store.jsx` drops saved cart lines whose product or package no longer exists.

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
| Custom product images as data URLs in the catalog | Image uploads to storage, referenced by id |
| `apply()` mutating the catalog in place | Catalog served already resolved for the client; the dashboard edits a photographer catalog resource |
| Gallery registry in localStorage, slug ids | Gallery records with server ids, a share token per client link, and a `catalog_id` |
| Active gallery / catalog in sessionStorage | The store URL carries the gallery (or the catalog comes with the client's session) |
| `buildAnalytics` sample data | Events recorded by the client gallery (visit, download, full download, share, favourite, comment) and orders from the store, keyed by the visitor's email, aggregated per gallery by the API |
| Email drafts via `mailto:` | Send from the platform (templates, tracking, per-recipient links or tokens) |
| Gallery settings saved, mostly not enforced (Downloads is read by the client gallery) | The gallery API applies access (sign-in, password, approved list, role links, expiry) and permissions server-side; the client gallery reads them to show or hide favorites, comments, downloads and sharing |
| Everyone can open `/dashboard` | Photographer auth; client pages hide every edit affordance |

## Known gaps

- **Analytics are sample data.** The client gallery doesn't record events yet, so the numbers don't react to what a client actually does. There's no date range filter.
- **Gallery settings are mostly not enforced.** The Settings step saves access and permissions. The client gallery reads only **Downloads** (on/off, download PIN, Web size / High res, download limit) through `useDownloadRules` in `src/gallery/lib/downloads.js`, for the whole gallery or the role in the link (`?role=`, else Client); a gallery that was never saved keeps downloads open. Everything else isn't read yet: no sign-in, password, role links or expiry, and favorites, sharing, video downloads and set visibility behave as before.
- **Leaving Settings with unsaved changes** through the rail or sidebar drops the draft without asking (only closing or reloading the tab warns).
- **Per device.** All settings are local to the browser. Opening the gallery on another device shows the defaults.
- **No drafts.** Every edit is live immediately (see the PRD's open questions).
- **No touch reorder for photos.** HTML5 drag-and-drop doesn't fire on touch screens, so phones can move photos between collections but can't reorder them. Products, packages and portfolio categories do reorder on touch.
- **Uploads aren't in the print store's photo list.** The store builder still uses the 28 store photos (an existing gap). Quick buy from the gallery does register uploads.
- **Collection rename loses heading words** (they're keyed by collection name).
- **The heading editor below 960px** shows its own full-screen stage rather than the dashboard's preview.
- **Custom packages use a fixed hero photo** (the store's `p1011`); there's no picker yet.
- **Custom product images live in localStorage** as data URLs, so a few products with six images each can reach the 3.5M-character budget; uploads past it are refused with a toast. Production stores them as uploads.
- **Custom products can't create categories**, and their sizes are always inches (the label is built from width × height).
- **Deleting a custom product** removes it from the photographer's packages and drops cart lines holding it on the client's next load.
- **Clients' favourites, hidden photos and sets** for a deleted gallery stay in localStorage (keyed by `gallery:<id>`).
- **The store builder isn't re-keyed** on catalog changes. It's outside `Layout`, and it's never open at the same time as the dashboard in one document.
