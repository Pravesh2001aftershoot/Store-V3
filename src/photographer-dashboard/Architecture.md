# Photographer Dashboard: Architecture

The dashboard is an admin UI over settings that the client modules already own. It adds no data of its own: the gallery, the portfolio and the store each keep their settings next to their code, and both the dashboard and the client pages read the same saved values. See the app-wide [Architecture.md](../../Architecture.md) for everything else.

## Directory map

```
src/photographer-dashboard/
├── PhotographerDashboard.jsx  Shell: sidebar (full / rail / phone drawer; hidden inside a gallery via `matchPath`), phone top bar, nested routes, Toaster
├── components/
│   ├── PreviewFrame.jsx       Live preview: client page in an iframe, device widths, scaled to fit; optional toolbar `heading` + `actions`
│   ├── Modal.jsx              Short-form dialog (centred card; bottom sheet on phones)
│   ├── InlineName.jsx         Click-to-rename title
│   └── ui.jsx                 PageHeader, Stat, Chip, Tag, Empty, IconButton, Menu, PriceInput, Select
├── lib/hooks.js               useMedia, useDocked (≥960px), usePhone (<640px), useWideNav (≥1024px), useTopOffset
├── galleries/
│   ├── GalleriesPage.jsx      Gallery cards, search, card menu
│   ├── GalleryForm.jsx        New gallery / gallery settings modal (+ delete); exports `useDeleteGallery(gallery, onDone)`
│   └── GalleryCover.jsx       WithGallery: reads one gallery's cover + count inside its provider
├── gallery/
│   ├── GalleryTab.jsx         Route /galleries/:id/:step → GalleryProvider → left-hand `StepRail` (Back → /dashboard/galleries, then the five steps), the step (Design gets the breadcrumb + title `Heading` for its preview toolbar; other steps have no header), and on Design when docked the right-hand `PartsRail` (Gallery info, a divider, then Cover, Grid, Headings, Footer)
│   ├── useGalleryWorkspace.js Wires the library, cover, cover photo, headings, footer and grid
│   ├── PhotosStep.jsx         Upload, collections, search by file name, selection, drag / ⌥+arrow reorder or move, selection bar
│   ├── DesignStep.jsx         Preview + right column with the open editor (chips + sheets when narrow); `designParts(ws)` for the rail
│   ├── GalleryInfoEditor.jsx  Design part "Gallery info": title, client, date, catalog, Delete in the EditorPane shell; saves live via `useGalleries().update`
│   ├── GridEditor.jsx         Default grid layout (new; in the gallery's EditorPane shell)
│   ├── SettingsStep.jsx       Access type, roles and links, then Access / Engagement / Privacy settings; draft + Save bar
│   ├── access.js              Settings model: defaults, load/normalize, rules (pinRequired, filterIncluded, saveBlocker), useGalleryAccess
│   ├── ShareStep.jsx          One-column share page (no PageHeader): "Share your gallery" card with Links (LinksPanel: cover + AccessOverview: links, passwords, PINs) / Email (EmailComposer) / QR code (QrPanel with QrCard tiles) tabs; EmailHistory is hidden for now
│   ├── share.js               Share settings (email template, wording, includes, QR options), email templates (BUILT_IN_TEMPLATES + useEmailTemplates), VARIABLES + fillVariables, allCodes, galleryExpiry, composeEmail, qrCards, qrFor (uqr), qrCardPNG
│   ├── VariableText.jsx       Subject / Message field with variable suggestions, + Variable menu and tinted tokens
│   ├── AnalyticsStep.jsx      Totals, download split, people list, person dialog, CSV export
│   └── analytics.js           Sample analytics for a gallery (buildAnalytics), toCSV, ago, shortDate
├── portfolio/
│   ├── PortfolioTab.jsx       /portfolio preview with the editor docked on its right
│   └── PortfolioEditor.jsx    Profile, Intro, Work, Contact tabs
├── website/
│   ├── WebsiteTab.jsx         /dashboard/website: /site preview + docked editor column + right-hand `PartsRail` (Site settings, divider, sections in page order); chips + sheet below 960px; `?part=` in the URL
│   └── WebsiteEditor.jsx      One `EditorPane` per part (`PART_META`: title, tooltip detail, preview target): Site settings, Hero, About, Portfolio, Pricing, FAQ, Contact
├── store/
│   ├── CatalogsPage.jsx       Catalog cards, New catalog (everything / nothing / copy), rename, duplicate, delete
│   ├── StoreTab.jsx           One catalog (/store/:catalogId): summary, product and package lists, New product, New package
│   ├── ProductEditor.jsx      Catalog products: Details, Sizes (Price for digital products), Options
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
| Website | `src/website/data/config.js` (`useWebsite`) | `store-v3:website` |
| Store catalogs | `src/data/storeConfig.js` (`useCatalogs`, `useStoreConfig`) | `store-v3:store` |
| Saved email templates | `photographer-dashboard/gallery/share.js` (`useEmailTemplates`) | `store-v3:email-templates` |

`galleryKey(id, name)` is `store-v3:gallery:<id>:<name>`, except for the sample gallery (`lexie-taylor`), which keeps the keys it had before galleries existed (`store-v3:gallery-<name>`), so earlier edits survive.

## Routing

`App.jsx` mounts `dashboard/*` → `PhotographerDashboard`, which has nested routes:

| Path | View |
|---|---|
| `/dashboard` | Redirects to `/dashboard/galleries` |
| `/dashboard/galleries` | `GalleriesPage` |
| `/dashboard/galleries/:galleryId/:step?` | `GalleryTab`; `step` is `photos` (default), `design`, `settings`, `share` or `analytics`. An unknown gallery redirects to the list, an unknown step to Photos. |
| `/dashboard/portfolio` | `PortfolioTab` |
| `/dashboard/website` | `WebsiteTab`; `?part=site|hero|about|portfolio|pricing|faq|contact` picks the open editor (docked default: Hero) |
| `/dashboard/store` | `CatalogsPage` |
| `/dashboard/store/:catalogId` | `StoreTab`; an unknown catalog redirects to the list |
| `/dashboard/gallery/:step?` | Old URL: redirects to the sample gallery |

Client routes in `App.jsx`: `/` redirects to `/dashboard` (the app's entry point), `/g/:galleryId` renders `GalleryPage` for that gallery, and `/site` renders `WebsitePage` (the photographer's website). The store's "Back to gallery" and the portfolio's "Gallery" link go to the active gallery's `/g/<id>`.

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
- **Targets.** The gallery accepts `cover`, `grid`, `footer` and `section:<collection>`. `footer` first loads the whole grid (the infinite list would otherwise keep pushing the footer away). The portfolio accepts `top` or an element id (`work`, `contact`). The website accepts `top` (Site settings, Hero) or a section id (`about`, `portfolio`, `pricing`, `faq`, `contact`). Messages from other origins are ignored.
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
- **`place(ids, collection, beforeId)`** is what the Photos step uses for every drag and ⌥/Alt+arrow move: it assigns the photos to `collection` and puts them just before `beforeId` (or at the end of that collection when `beforeId` is null) in one `setState`, so a move into another collection and its position can't get out of step. `reorder(collection, ids)` and `moveTo(ids, collection)` remain for whole-collection orders and "move to the end". Search (`PhotosStep`) only filters what's shown and is not persisted.
- **Uploads.** Each file is decoded with an `<img>`, drawn to a canvas at 2400px and 720px, and saved as two JPEG blobs in IndexedDB. Only the manifest goes in localStorage, because image data would quickly fill its ~5MB. Object URLs are cached per document (`urls`), and the hook re-renders when they resolve.
- **Collections are keyed by name.** Renaming re-assigns every photo in the collection to the new name. Heading words are also keyed by name, so a renamed collection loses its custom heading words (known gap).
- **`GalleryPage` uses it.** The client gallery now builds its photos and collection order from `useGalleryLibrary`, so dashboard changes reach it. Client-side hiding, favourites and sets work on top as before.

### Workspace (`useGalleryWorkspace`)

`useGalleryWorkspace(data)` (inside the gallery's provider) calls the same hooks in the same order as `GalleryPage`: library → measured photos → cover config (`coverDefaults(gallery, count)`) → cover photo (`useCoverPhoto(coverPhoto, photos)`) → headings (`useSectionConfig(cover.config)`) → footer (defaults from `usePortfolio().profile`) → grid defaults. `sections` are computed from the library alone; client hiding is per device and doesn't apply here.

### Editors in the dashboard

`EditorPane` gained:
- **`inline`.** It renders in place, filling its parent, instead of as a fixed sliding panel. It still mounts a non-modal Radix `Dialog.Root` so the shared header (`Dialog.Title`, `Dialog.Close`) and Esc-to-close keep working.
- **`resetLabel`.** For example, "Reset product".
- **Optional `onClose` (inline).** Without it the pane can't be closed: no ✕, no Done, Esc is ignored, and the footer only shows if there's a Reset. `DesignStep` leaves it out when docked, since the parts rail switches editors; `editing` falls back to `'cover'` there. The open part is the `part` search param (`info` | `cover` | `grid` | `headings` | `footer`, anything else is ignored), read by both `DesignStep` and `PartsRail`; `DesignStep` sets it with `replace` and leaves other params alone. Closing a sheet removes it. Docked, `DesignStep` also keeps `panel` (plain state, default shown): the toolbar toggle collapses the editor column (`inert` while hidden), and a change of `part` sets it back to shown.
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
  screenshot, downloads: { on, pin: { on, code }, image: { on, sizes: { web, high }, highFree, limit,   // highFree: false = High res is paid when the store sells it
    web: { edge: 1200 | 2048, watermark } }, video: { on } },   // Web size's long edge (default 2048) and watermark (default off)
  sharing: { on, image, video }, sets: { on, hidden: [collection title] } }
```

- `load` merges the stored value over `defaults()` keeping only values of the right type, then `normalize()`s it. Defaults: Anyone, everything off; Client everything on except email collection, password and face scan, on the approved list; Guest the same but collecting email; Vendor like Client.
- `normalize()` keeps roles in Client, Guest, Vendor order, makes exactly one of `collectEmail` / `approved` true per role, and sets `pin.on` when `pinRequired(s, role)` (roles + `singleLink` + not approved). `filterIncluded(d)` is face scan on with scope `all`.
- `saveBlocker(s)` returns the first reason Save is disabled, or null. Limits are whole numbers up to `LIMIT_MAX` (99999), `''` meaning no limit.
- `SettingsStep` keeps a local draft (`structuredClone` + `normalize` on every edit) and only calls the setter on Save. While it has no unsaved changes it follows the saved value (another tab). A `beforeunload` listener warns while it's dirty.
- Set visibility stores hidden collection titles, so new collections show by default.
- The client gallery reads this through `useGalleryAccess()` in `src/gallery/lib/visitor.js` (`resolveVisitor`, `permissionsFor`; see the root `Architecture.md`, Client gallery → Sign-in and permissions). The preview frame loads the gallery with `?embed=1`, which skips sign-in and shows every action.

### Share (`share.js`, `ShareStep.jsx`)

Everything is derived from `useGalleryAccess()`; the step only saves the photographer's wording and choices, `useShareSettings()` = `forGallery('share', load)` under `galleryKey(id, 'share')` (`store-v3:gallery-share` for the sample):

```
{ template,                               // id of the email template the wording started from ('ready' by default)
  subject, message,                      // '' = use defaultText(gallery); the message includes the sign-off
  include: { link, password, pin, expiry }, // email details, all true by default
  qr: { pin } }                            // download PIN printed under the QR code (false); passwords always are
```

Email templates: `BUILT_IN_TEMPLATES` (`ready`, `favourites`, `expiring`, `thanks`; `[{ id, name, subject, message }]`, `ready` has both empty so it is the default wording) plus the photographer's own, account-wide (not per gallery) via `persisted(TEMPLATES_KEY)` under `store-v3:email-templates`: `[{ id: 'own-<base36 time>', name, subject, message }]`, names capped at `TEMPLATE_NAME_LIMIT` (40), at most `TEMPLATE_LIMIT` (20). `useEmailTemplates()` gives `{ builtIn, own, full, find(id), create({ name, subject, message }) → id, update(id, patch), remove(id) }`; `find` falls back to `ready` for an unknown id (a template deleted while a gallery still pointed at it). `EmailComposer` treats the wording as edited when `share.subject`/`share.message` differ from the picked template's, which drives the Save changes / Reset links; `SaveTemplate` (in `ShareStep.jsx`) is the name dialog.

and the emails sent, `useShareHistory()` = `forGallery('share-history', loadHistory)` under `galleryKey(id, 'share-history')` (`store-v3:gallery-share-history` for the sample): `[{ id, at, to: [email], subject }]`, newest first, capped at `HISTORY_LIMIT` (50). `record({ to, subject })` prepends an entry; `EmailComposer`'s Send calls it with the filled-in subject after the recipient checks pass. `formatSent(at)` gives `{ date: '19 / 11 / 2026', time: '5:20 PM' }`. In `ShareStep.jsx`, `EmailHistory` keeps its open/closed state in local `useState` (closed on every load, not persisted), and `Recipients` renders the "+ n more" tooltip through `createPortal` to `document.body` with fixed coordinates from `getBoundingClientRect()`.

- `linkFor(access, aud, base)` is the shared link for `anyone` or a single link, else `?role=<aud>`. `expiryFor` reads `expiry.all` or the role's own. `codesFor(access, aud)` gives `{ password, pin }` ('' when off); `allCodes(access)` lists `{ aud, password, pin }` for every audience that has one. `galleryExpiry(access)` is `expiry.all`, or with a link per role the soonest role date. `linkFor` and `expiryFor` feed the access overview and the client gallery (`visitor.js`); the email and QR always use the gallery link `base`, where a role-mode visitor picks their role.
- `composeEmail({ gallery, access, base, share, to })` builds the one email for everyone, `{ subject, body }`: message, the included detail lines (the link; with roles "When it opens, choose Client or Guest." and a line per role: approved sign-in, password, download PIN, its own expiry). There's no separate sign-off: the default message ends with one, and a saved `closing` from older versions is ignored. Variables in the saved wording stay as typed (`{client_name}`) and are filled at build time: `VARIABLES` lists the keys (`gallery_name`, `client_name`, `client_email`, `expiry_date`), `VARIABLE_RE` matches `{name}` or `${name}` (any case, spaces = underscores), `variableValues({ gallery, expiry, to })` gives `gallery.title`, `gallery.client`, `to[0]` and the formatted `galleryExpiry` ('' when missing), and `fillVariables` swaps them in, leaving unknown names alone.
- `VariableText` is a growing `<textarea>` over a backdrop of the same box and type with transparent text, where variable runs get tints; the suggestion list is placed with a hidden mirror div measuring the caret. Recipients aren't saved: `EmailComposer` keeps the ticked approved groups (`picked`, all to start) and the typed addresses (`typed`) and builds `to` from both, de-duplicated.
- QR codes come from `uqr` (`encode`, ECC M, no border): the card draws them as one SVG path with `crispEdges`; `qrCardPNG` draws a 1080 × 1350 canvas (title, code at whole-pixel offsets, caption, lines) (and an optional `tag`, the role, above the title) and returns a data URL that's downloaded as `<gallery>-qr.png`, or `<gallery>-<role>-qr.png` for a role's card. `qrCards(access, base, share.qr)` gives the cards to show, `[{ key, role, url, lines }]`: one for the gallery link (lines per role plus the role hint when one link serves every role), or with a link per role (`singleLink` off) one per role for `linkFor(access, role, base)` with only that role's codes.

### Grid defaults

`useGridSettings()` (client) now starts from `useGridDefaults()`, the photographer's choice, and the URL only carries values that differ from it. The Layout menu and shared links behave as before.

## Portfolio tab

`usePortfolio()` (`portfolio/data/config.js`) returns the resolved profile (stored fields over the mock `profile`; empty text falls back), the visible `galleries` and `genres` (title and label overrides, hidden ones removed, genres in the photographer's order), `allGalleries` and `allGenres` for the editor, section settings and setters. `Hero`, `Contact`, `PortfolioHeader`, `WorkGrid`, `ProjectPage` and the gallery's `FooterSection` read from it instead of importing `profile` or `galleries` directly. The portrait is `{ id }` (a portfolio photo) or `{ src }` (an upload at 1200px, as a data URL in localStorage).

## Website tab

`useWebsite()` (`src/website/data/config.js`) stores `{ site, order, hidden, hero, about, portfolio, pricing, faq, contact }` under `store-v3:website`:

- `order` — the movable sections (`about`, `portfolio`, `pricing`, `faq`); `load()` drops unknown ids and appends missing ones. `hidden` — switched-off section ids. `sections` (returned) is `['hero', ...order, 'contact']` minus hidden ones: the page order.
- Text is stored as typed; empty falls back to `fallbacks(profile)` (some read the portfolio profile). Photos are `{ id }` of a portfolio photo (`landscapePhotos` for the hero, `portraitPhotos` for About) or `null` for the default.
- `pricing.packages: [{ id, name, price, unit, description, features: [string], featured }]` (ids `pkg-<base36>` from `newId`), `faq.items: [{ id, q, a }]`. The resolved values drop unnamed packages and incomplete questions. `portfolio.featured` is a list of portfolio gallery slugs; resolved `portfolio.galleries` is those still visible (or the newest), cut to `count` (3 or 6).
- It reads `usePortfolio()` for the profile and visible galleries (returned as `pf`), so profile edits flow into the website.
- Setters: `setSite`, `setHero`, `setAbout`, `setPortfolio`, `setPricing`, `setFaq`, `setContact` (a patch or `(section) => patch`), `toggleSection`, `moveSection(id, ±1)`, `resetSection(id)`, `reset`. `LIMITS` holds every character and count limit.

`src/website/WebsitePage.jsx` renders the sections in `sections` order, each with its id, and handles the preview target. It reuses `ProjectCard` from the portfolio, and `Accordion`, `Field`, `Reveal`, `SplitText` and `Button` from `components/ui`. The contact form is local state only.

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

**Digital products** (`digital-download`, `digital-gallery`, category `digital`; `digital: true`) are ordinary catalog products, so hiding or repricing them works like any other. Digital Download's file versions are stored per catalog as `products['digital-download'].files: [{ id, edge: px | null, watermark, price, gallery: { on, price, discount } }]` (written whole by `ProductEditor`'s `FileList` through `editProduct`; new ids `f-<base36 time>`), and `resolveProduct` swaps them in for the delivered `size` values via `readFiles` / `fileValue`. Files saved before whole-gallery offers get `{ on: true, price: 199 }` on the original and none on the rest. The Whole Gallery Download (`galleryOf`) is rebuilt from the versions with `gallery.on` in `resolveDef`, so its prices always follow Digital Download's Files tab. `catalogProduct(catalogId, productId)` (`src/data/storeConfig.js`) returns one product as a given catalog resolves it (prices, `hidden`); Settings → Downloads uses it to say whether the gallery sells High res, and the client gallery's `useDownloadRules()` reads the active catalog for the same decision. `StoreTab` shows their mode (`MODE.gallery`), `PackageEditor` leaves them out of package contents and `CustomProductEditor` leaves the `digital` category out of its Category select. Purchases are stored per gallery under `galleryKey(id, 'purchases')` (`src/data/purchases.js`, listed in `GALLERY_SETTINGS`, so they're cleared with the gallery).

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
| **Send** only toasts (`EmailComposer` `send`) | Send from the platform (templates, tracking, per-recipient links or tokens) |
| Gallery settings saved to `localStorage` and enforced in the browser by the client gallery (`src/gallery/lib/visitor.js`) | The gallery API applies access (sign-in, password, approved list, role links, expiry) and permissions server-side; the client gallery reads them to show or hide favorites, comments, downloads and sharing |
| Website settings in localStorage, enquiry form sends nothing | A site resource per photographer, published to their domain; enquiries posted to the API and delivered to the photographer |
| Everyone can open `/dashboard` | Photographer auth; client pages hide every edit affordance |

## Known gaps

- **Email history is local.** Sends are simulated, so the history only records what was sent from this browser; there's no delivery, open or bounce status. Production would read it from the send log.
- **Client email is the first recipient.** There's no client record with an email yet, so `{client_email}` fills from the To field and is blank until someone is added.
- **Analytics are sample data.** The client gallery doesn't record events yet, so the numbers don't react to what a client actually does. There's no date range filter.
- **Gallery settings are enforced only in the browser.** The client gallery reads the saved settings (`src/gallery/lib/visitor.js`, `downloads.js`): a sign-in screen (role, email or approved list, password, face scan, expiry) and every action (favorites + limit, hide + bulk hide on the Client role, filter by face, face scan → only their photos, sharing, set visibility, screenshot protection, downloads). Passwords and approved emails are in `localStorage`, so this is a prototype of the rules, not security. A gallery that was never saved, and the dashboard preview (`?embed=1`), stay open with no sign-in. Comments and video sharing / downloads have nothing to act on in the client gallery yet.
- **Leaving Settings with unsaved changes** through the rail or sidebar drops the draft without asking (only closing or reloading the tab warns).
- **Website enquiries aren't delivered.** The `/site` contact form validates and shows a thank-you, nothing more.
- **Website photos come only from the portfolio.** There's no upload for the hero or About photo, and no focal point.
- **Website pricing packages don't link to store packages or catalogs.**
- **Per device.** All settings are local to the browser. Opening the gallery on another device shows the defaults.
- **No drafts.** Every edit is live immediately (see the PRD's open questions).
- **No touch reorder for photos.** HTML5 drag-and-drop doesn't fire on touch screens, so phones can move photos between collections but can't reorder them (keyboard reorder needs a hardware keyboard). Products, packages and portfolio categories do reorder on touch.
- **Uploads aren't in the print store's photo list.** The store builder still uses the 28 store photos (an existing gap). Quick buy from the gallery does register uploads.
- **Collection rename loses heading words** (they're keyed by collection name).
- **The heading editor below 960px** shows its own full-screen stage rather than the dashboard's preview.
- **Custom packages use a fixed hero photo** (the store's `p1011`); there's no picker yet.
- **Custom product images live in localStorage** as data URLs, so a few products with six images each can reach the 3.5M-character budget; uploads past it are refused with a toast. Production stores them as uploads.
- **Custom products can't create categories**, and their sizes are always inches (the label is built from width × height).
- **Deleting a custom product** removes it from the photographer's packages and drops cart lines holding it on the client's next load.
- **Clients' favourites, hidden photos and sets** for a deleted gallery stay in localStorage (keyed by `gallery:<id>`).
- **The store builder isn't re-keyed** on catalog changes. It's outside `Layout`, and it's never open at the same time as the dashboard in one document.
