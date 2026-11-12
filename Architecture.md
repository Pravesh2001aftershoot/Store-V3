# Store V3: Architecture

This is a front-end-only prototype: a React single-page app with no backend. All data is mocked in `src/data/`, and the only state that persists is the cart and favourites in `localStorage`. This doc describes how the app is put together as of commit `a42bab1`.

## Stack

| Concern | Choice |
|---|---|
| UI | React 19, JSX (no TypeScript) |
| Build / dev server | Vite 8 (`npm run dev`, `npm run build`) |
| Routing | react-router-dom 7 (`BrowserRouter`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, with shadcn-style CSS variables |
| Motion | framer-motion |
| Dialogs | `@radix-ui/react-dialog` |
| Icons | `@phosphor-icons/react` |
| Font | Geist Variable (`@fontsource-variable/geist`) |
| Class utils | `clsx` + `tailwind-merge` (`cn()`), `class-variance-authority` |
| Dev tooling | Locator (`@locator/babel-jsx` + runtime): alt-click a component to jump to its source. Dev server only. |

## Directory map

```
src/
├── main.jsx              Entry: BrowserRouter → StoreProvider → App. Boots Locator in dev.
├── App.jsx               Route table
├── index.css             Colour tokens (CSS vars) + Tailwind theme mapping
├── tokens/typography.js  Type tokens (source of truth) → Tailwind fontSize utilities
├── state/store.jsx       Cart/checkout state: Context + useReducer, persisted to localStorage
├── data/
│   ├── catalog.js        Categories, products, variant options, packages
│   └── gallery.js        Gallery metadata + the 28 photos the store builder uses
├── lib/
│   ├── pricing.js        Pricing, photo-to-quantity rules, validation, packages, cart line maths
│   ├── crop.js           Percentage-based crop maths + print DPI / quality check
│   └── utils.js          cn(), money(), plural(), uid()
├── components/           Store UI (Layout, CartDrawer, ProductMockup, CropEditor, OptionGroup…)
│   └── ui/index.jsx      Primitives: Button, Badge, Reveal, SplitText, AnimatedNumber, Accordion, Field
├── pages/                Store routes (Home, Shop, Product, Packages, PackageDetail, Builder, Cart, Checkout, Payment)
└── gallery/              Client gallery module (entry page), kept self-contained
    ├── GalleryPage.jsx   Page composition, scroll-spy, tab jumps, favourites toggle
    ├── components/       Cover, NavBar (+ LayoutMenu), GalleryGrid, Photo, Lightbox, Toaster
    ├── data/photos.js    Gallery photo source (local images or placeholders)
    └── lib/
        ├── settings.js   Grid options + URL-param state
        ├── layout.js     Pure layout maths (masonry, justified rows)
        ├── hooks.js      useBreakpoint, useInfinite, useMeasuredPhotos
        └── actions.js    Toasts pub/sub, download, share, useFavorites
```

## Routing

Defined in `src/App.jsx`.

| Path | Component | Shell |
|---|---|---|
| `/` | `GalleryPage` | Own layout (cover + sticky nav) |
| `/store` | `Home` | `Layout` (header, footer, cart drawer) |
| `/shop`, `/shop/:categoryId` | `Shop` | `Layout` |
| `/product/:productId` | `Product` | `Layout` |
| `/packages`, `/packages/:packageId` | `Packages`, `PackageDetail` | `Layout` |
| `/cart` | `Cart` | `Layout` |
| `/build/:kind/:id` | `Builder` | Full screen, no Layout |
| `/checkout` | `Checkout` | `CheckoutShell` |
| `/payment` | `Payment` | `CheckoutShell` |

`Builder` takes three values for `:kind`:
- `product/:productId`: new build. The query string seeds the variant, for example `?size=16x20&frame=walnut`.
- `package/:packageId`: new package build with one slot per package item.
- `edit/:lineId`: re-opens an existing cart line. It starts on the Crop step.

`Payment` redirects to `/cart` when the cart is empty and to `/checkout` when no email has been entered.

## State

### Store state (`src/state/store.jsx`)

A single React Context backed by `useReducer`.

```js
{ lines: CartLine[], checkout: {email, firstName, …}, shipping: 'standard'|'express'|'pickup', promo: string|null }
```

- **Persistence.** The whole state object is written to `localStorage['lumen-store-v3']` on every change and read back once on boot.
- **Actions.** `add`, `update`, `replace` (one line becomes several, in place; used when edits split a line by variant), `remove`, `duplicate`, `checkout`, `shipping`, `promo`.
- **Derived totals** are computed in the provider's `useMemo`: subtotal, package savings, item count, promo discount, shipping, tax at a flat 8.25%, and total.
- **Constants.** `SHIPPING` holds the three methods. `PROMOS` maps codes to rates and currently contains only `LEXIE10`, which takes 10% off.
- **UI state.** The cart drawer's open flag (`drawer`/`setDrawer`) also lives here, so the Builder can open it after an add.

### Cart line shapes

```js
// product line
{ id, kind: 'product', productId, variant: {size, frame, …}, photos: PhotoEntry[] }
// package line
{ id, kind: 'package', packageId, slots: [{ slotId, productId, variant, photos: PhotoEntry[] }] }

PhotoEntry = { photoId, crop: { zoom, ox, oy }, orientation: 'portrait'|'landscape' }
```

A line stores choices only: photo IDs, variant IDs and crops. Prices are always recomputed from the catalogue by `lib/pricing.js`, so changing a price in `catalog.js` updates existing carts.

### Gallery state

This state is local to `GalleryPage` and does not go through the store context.
- **Grid settings** live in URL search params (`useGridSettings`), so a layout can be shared by link. Default values are removed from the URL.
- **Favourites** are a `Set` persisted to `localStorage['gallery-favs:<client>']`. Local photo IDs are derived from file names, so saved favourites survive reordering.
- **Toasts** use a tiny module-level pub/sub (`notify()` / `useToasts()`), so any component can show one without prop drilling.

## Domain model (`src/data/catalog.js`)

### Product

```js
{
  id, name, category, style,   // style picks the ProductMockup renderer (frame, canvas, album, …)
  mode: 'unit' | 'set' | 'book',
  setSize?,                    // set: photos per item (triptych = 3)
  book?: { min, max, perExtra },
  allowOrientation?,           // the client may flip portrait/landscape per photo
  options: [{ id, label, type: 'size'|'swatch'|'segmented'|'card', values: [{ id, label, price | delta, w, h, hex, note }] }]
}
```

The `size` option carries the base `price` and the physical `w`/`h` in inches. Every other option adds a `delta`.

### Product modes

| Mode | Photos → items | Example |
|---|---|---|
| `unit` | Each photo is one item. N photos means quantity N. | Framed print, canvas |
| `set` | Every `setSize` photos make one item. The count must be a multiple of `setSize`. | Triptych |
| `book` | Always one item holding `min` to `max` photos. Photos above `min` cost `perExtra` each. | Albums, books |

`requirement()` and `validate()` in `pricing.js` turn these rules into photo-selection constraints and user-facing messages.

### Packages

```js
{ id, name, discount, slots: [{ id, productId, qty, variant }] }
```

`packagePrice` is the sum of the slot values minus `discount`, rounded to the nearest $5. The un-discounted value is shown as the compare-at price. Package variants are fixed, so the client can only choose photos and crops. The one extra charge is book overage, which is added on top of the package price.

## Key subsystems

### Builder (`src/pages/Builder.jsx`)

A three-step wizard: **Photos → Crop → Review**.

- **Slots.** Internally a build is a list of slots, each holding `{ product, variant, qty, photos }`. A product build starts with one slot and a package build has one slot per package item.
- **Variant switching (product builds only).** On the Crop step the client can change the variant for one photo or for the whole item:
  - `switchPhotoVariant` moves the photo into an existing slot with the same variant, or splits it into a new slot placed after the original.
  - `switchSlotVariant` changes the whole slot, merging it into a matching slot if one exists.
  A toast reports the outcome: split, joined, merged or switched.
- **Commit.** A product build adds one cart line per non-empty slot. A package build adds one package line. In edit mode the original line is swapped out with `replace`. After adding, the app navigates back to the product or package page and opens the cart drawer.

### Crop maths (`src/lib/crop.js`)

- A crop is `{ zoom: 1–3, ox, oy }`. The offsets are fractions of the frame size, which makes crops resolution-independent: the same crop renders identically in the editor, the mockup and the cart thumbnail.
- `coverBase` computes how the photo covers the frame, `clampCrop` keeps the photo covering the frame, and `imageStyle` produces absolute-percentage CSS.
- `printDpi` estimates effective DPI from the visible source pixels divided by the print inches. `quality()` buckets the result: 200 DPI or more is Great, 130 or more is Good, anything lower is "Low resolution". Original pixel sizes are simulated as display dimensions × 4.
- `CropEditor` handles pointer drag to pan and wheel or pinch to zoom, and dims the area outside the print.

### Product previews (`src/components/ProductMockup.jsx`)

CSS-only mockups keyed on `product.style`. They react to the variant (frame colour, mat, canvas depth, cover material, size scale) and render the client's actual photos and crops through `CroppedImage`.

### Client gallery (`src/gallery/`)

- **Photo source** (`data/photos.js`). Images dropped into `src/gallery/assets/photos/` are picked up with `import.meta.glob`, sorted by filename, and assigned to collections round-robin. Their dimensions are measured at runtime by `useMeasuredPhotos`. If the folder is empty, the gallery uses the store's 28 photos plus generated picsum placeholders, 200 photos in total.
- **One continuous grid.** Photos are ordered by collection, in tab order. `sections` are `{title, start, end}` index ranges into that flat list, so infinite scroll, the lightbox and favourites all work on one array.
- **Infinite scroll** (`useInfinite`). An `IntersectionObserver` sentinel with a 1200px look-ahead reveals 24 more photos at a time. A 350ms delay stands in for a paginated API. The `min` parameter forces enough photos to load for a tab jump to land.
- **Scroll-spy.** A rAF-throttled scroll listener sets the active tab to the last section heading that has passed below the nav. At the very bottom of the page, the last rendered section is forced active.
- **Tab jumps.** Tapping a tab ensures that section is loaded, then smooth-scrolls to it in a layout effect. While the scroll runs, a `lock` ref pauses the spy. The lock is released on `scrollend`, on user wheel or touch input, or after a 1.5s fallback timeout.
- **Layout** (`lib/layout.js`). Two pure functions:
  - `masonry` places each photo in the shortest column, so appending photos never moves ones already placed.
  - `justifiedRows` makes rows of `perRow` photos with equal heights and pads the last row with spacers.
  Column counts and gaps per breakpoint are tables in `settings.js` (`COLUMNS`, `GAP`, `MARGIN`).
- **Lightbox** (`components/Lightbox.jsx`). A full-screen dark viewer over the same flat `photos` array as the grid; `index` is owned by `GalleryPage`. It locks body scroll and handles ←/→/Esc on `window`. Below the stage, a `FilmStrip` sub-component renders every photo's `thumb` in one horizontal, scrollable row at all breakpoints. The row is centred with `mx-auto w-max` when it fits, and padded so the active ring isn't clipped by the scroll container. A ref on the active thumbnail calls `scrollIntoView({ inline: 'center' })` whenever `index` changes, so the current photo stays visible however you navigate.
- **Tile actions on touch.** `Photo.jsx` hides the hover overlay and action buttons under `@media (hover: none)`. On touch screens a tap opens the lightbox, which carries the same actions.
- **Quick buy** (`components/QuickBuy.jsx`). The bag button on a tile, and "Buy print" in the lightbox, open a side panel that runs a short version of the store flow for that one photo: Product (framed print, canvas, metal, fine art print) → Size & finish → Crop → Added. It adds a normal product cart line, then offers Checkout, View cart or Keep browsing. Gallery photos are bridged into the store with `registerPhoto()` in `data/gallery.js`, persisted to `localStorage['lumen-store-v3:photos']` so cart lines resolve after a reload.
- **Actions** (`lib/actions.js`).
  - Download fetches the image as a blob and saves it, falling back to opening it in a new tab.
  - Share uses the Web Share API, with a file where `canShare` supports it, and falls back to copying a link to the clipboard.

## Design system

- **Colour tokens** are defined in `src/index.css` as CSS variables: `surface-0/1/2`, `type-0…3`, `primary`, `border`, `success`, `destructive` and others. They are exposed to Tailwind through `@theme inline`. The app is light theme only.
- **Type tokens** are defined in `src/tokens/typography.js`.
  - Names follow `<size>-<weight>` (R/M/SB), for example `48-SB`, which becomes the class `text-48-sb`.
  - Each class sets size, weight, line height and letter spacing together.
  - The tokens reach Tailwind through `tailwind.config.js`, loaded with `@config`. `cn()` registers them with tailwind-merge so they merge correctly.
  - Rules: don't add `font-*`, `leading-*` or `tracking-*` next to a token, and don't use raw `text-[Npx]`.
  - Tokens with `status: 'proposed'` are not in the Figma design system yet.
- **Primitives** live in `components/ui/index.jsx`.
  - Motion primitives (`Reveal`, `SplitText`, `AnimatedNumber`) handle on-scroll reveals and animated price changes.

## Mock data and boundaries

These are the places that would be swapped out for real services:

| Today | Production equivalent |
|---|---|
| `data/catalog.js` (static) | Photographer's store configuration API |
| `data/gallery.js`, `gallery/data/photos.js` (picsum / local files) | Gallery and photo API, including original dimensions for DPI checks |
| `useInfinite` 350ms timeout | Paginated photo endpoint |
| `localStorage` cart | Server cart / session |
| `PROMOS`, `SHIPPING`, flat 8.25% tax | Promotions, shipping-rate and tax services |
| Payment page stops at "Make payment" | Payment provider and order creation (with photographer approval, as the copy says) |

## Known gaps / tech debt

- **Two photo sets.** The store builder picks from the 28 photos in `data/gallery.js`, while the gallery page shows up to 200, or the local images. Photos dropped into `gallery/assets/photos/` do not appear in the builder.
- **No tests, linting config or TypeScript.**
- **`Builder.jsx` is large (~960 lines).** It holds the step components, the variant-switch logic and the page. Splitting the step components into their own files would help.
- **The `.playwright-mcp/` logs are committed.** They should probably be added to `.gitignore`.
