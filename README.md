# Store-V3

Store-V3 is a prototype of a print store that a photographer sets up and their clients use. A client opens the gallery the photographer delivered, browses and favourites photos, then turns them into prints, wall art, albums or discounted packages, with previews that use their own photos and crops.

It is front end only. All data is mocked, and the cart and favourites are saved in `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

**Stack:** React 19, Vite 8, React Router 7, Tailwind v4, Framer Motion, Radix Dialog, Phosphor icons, Geist.

In dev, Locator is enabled: alt-click any element to open its source file.

## Docs

| Doc | What's in it |
|---|---|
| [PRD.md](PRD.md) | Problem, goals, users, requirements for each screen (with build status), business rules, open questions |
| [Architecture.md](Architecture.md) | Routes, state, data model, pricing and crop maths, how the gallery and Builder work, mocked boundaries, tech debt |
| [DesignSystem.md](DesignSystem.md) | Colour, type, radius and motion tokens, components, patterns, accessibility checklist |

## Flow

1. **Gallery** (`/`, the entry page)
2. **Shop prints** opens the Store (`/store`)
3. Category (`/shop/:id`)
4. Product page (`/product/:id`), where the client picks options
5. **Builder** (`/build/:kind/:id`): select photos → crop → review
6. Cart (`/cart`, or the cart drawer)
7. Checkout (`/checkout`)
8. Payment (`/payment`). The prototype ends at **Make payment**.

Packages (`/packages`) go through the same Builder, with one slot per item in the package.

**Demo promo code:** `LEXIE10` (10% off).

## Where things live

```
src/
├── App.jsx                 Routes
├── state/store.jsx         Cart, checkout, shipping and promo state (persisted to localStorage)
├── data/catalog.js         Categories, products, variant options, packages (the photographer's setup)
├── data/gallery.js         Gallery info and the photos used by the Builder
├── lib/pricing.js          Pricing, photo-to-quantity rules, validation, package discounts
├── lib/crop.js             Percentage-based crop maths and print DPI check
├── components/             Store UI: Layout, CartDrawer, ProductMockup, CropEditor, OptionGroup…
├── components/ui/          Primitives: Button, Badge, Eyebrow, Reveal, AnimatedNumber, Accordion, Field
├── pages/                  Store pages, including Builder.jsx (photos → crop → review)
├── gallery/                Client gallery (entry page), kept self-contained
├── tokens/typography.js    Type tokens (source of truth)
└── index.css               Colour tokens and Tailwind theme
```

**Product modes:**
- `unit`: one photo makes one item, so N photos means quantity N.
- `set`: a fixed number of photos per item, for example 3 for a triptych.
- `book`: one item holding between a minimum and maximum number of photos. Photos above the minimum cost extra.

## Client gallery (`src/gallery/`)

The page is laid out as: Cover → sticky nav (collections, layout, favourites, **Shop prints**) → infinite-scroll grid → lightbox.

- **One continuous grid.** Every collection appears in one infinite scroll, in tab order, each under its own heading. There is no "All" tab.
- **Collection tabs.** The active tab updates as you scroll, and on mobile it slides into view. Tapping a tab loads that section and scrolls to it.
- **Favourites.** Shown as a separate flat grid without sections. Saved on the device for each gallery.
- **Lightbox and photo tiles.** Both offer favourite, download and share.
- **Grid options.** These are also URL params, so a layout can be shared, for example `/?orientation=horizontal&size=small&spacing=airy`.
  - `orientation`: `vertical` (masonry columns) or `horizontal` (justified rows)
  - `size`: `small` (4), `medium` (3) or `large` (2) photos per row on desktop, with fewer on tablet and mobile
  - `spacing`: `airy`, `thin` or `none`

  The values are in `src/gallery/lib/settings.js`, and the option names match the Live Canvas editor.
- **Photos.** Drop images into `src/gallery/assets/photos/` to replace the placeholders. Optional thumbnails go in `photos/thumbs/` with the same file names. The first image becomes the cover.

## Design tokens (quick rules)

The full reference is in [DesignSystem.md](DesignSystem.md).

- **One class per type token.** It sets size, weight, line height and letter spacing together:
  - `48-SB` becomes `text-48-sb`
  - `14-R` becomes `text-14-r`
  - `12-SB` becomes `text-12-sb uppercase`
- **Don't override tokens.** Don't add `font-*`, `leading-*` or `tracking-*` next to a type token, and don't use raw `text-[Npx]` sizes.
- **Use colour tokens.** Use `surface-0/1/2`, `type-0…3`, `primary`, `border`, `success` and `destructive` rather than hex values.
- **Combine classes with `cn()`.** It knows about the type tokens, so they aren't dropped when classes are merged.
- **Proposed tokens.** Tokens marked `status: 'proposed'` aren't in the Figma design system yet.
