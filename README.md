# Store-V3

Prototype of a photographer-configured print store for end clients (prints, wall art, albums, packages).

```bash
npm install
npm run dev
```

Stack: React + Vite, Tailwind v4 (shadcn-style tokens in `src/index.css`), Framer Motion, Phosphor icons, Geist.

## Flow
**Gallery** (`/`, entry page) → Shop prints → Store (`/store`) → Category → Product (variants) → **Builder** (`/build/:kind/:id`): select photos → crop → review → Cart → Checkout → Payment (ends at "Make payment").

## Where things live
- `src/data/catalog.js` — categories, products, variant options, packages (what the photographer configures)
- `src/data/gallery.js` — the client gallery the store was opened from (placeholder photos)
- `src/lib/pricing.js` — pricing, photo→quantity rules, package discounts
- `src/lib/crop.js` — percentage-based crop math + print DPI check
- `src/components/ProductMockup.jsx` — CSS product previews that react to variants and crops
- `src/pages/Builder.jsx` + `src/components/CropEditor.jsx` — photo selection and cropping

Product modes: `unit` (1 photo = 1 item, so N photos = qty N), `set` (e.g. triptych, 3 photos per item), `book` (one item holding min–max photos, extra photos charged).

## Design tokens
- `src/tokens/typography.js` — **type tokens** (source of truth), wired into Tailwind via `tailwind.config.js` (`@config` in `src/index.css`) and into `cn()`/tailwind-merge.
- One class per token sets size + weight + line height + tracking: `48-SB` → `text-48-sb`, `14-R` → `text-14-r`, `12-SB` → `text-12-sb uppercase`.
- Don't add `font-*` / `leading-*` / `tracking-*` next to a token, since they override it. Raw `text-[Npx]` sizes shouldn't be used.
- Tokens marked `status: 'proposed'` aren't in the Figma DS yet.

## Client gallery (`src/gallery/`)
The entry page: Cover → sticky Nav (collections, layout, favourites, **Shop prints** → `/store`) → infinite-scroll grid → lightbox.
- Grid options (also URL params, so a layout can be shared, e.g. `/?orientation=horizontal&size=small&spacing=airy`):
  - `orientation` — `vertical` (masonry columns) · `horizontal` (justified rows)
  - `size` — `small` 4 · `medium` 3 · `large` 2 per row on desktop (steps down on tablet/mobile)
  - `spacing` — `airy` · `thin` · `none`
- Values live in `src/gallery/lib/settings.js`; option names match the Live Canvas editor.
- Photos: drop images into `src/gallery/assets/photos/` to replace the placeholders (first one becomes the cover).
