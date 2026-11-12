# Store V3: Product Requirements (Prototype)

**Status:** Interactive prototype (front end only, mocked data)
**Last updated:** 12 Nov 2026

## 1. Summary

Store V3 is a print store that a photographer configures and their clients use. A client opens the gallery the photographer delivered, browses and favourites photos, and turns them into physical products: wall art, prints, albums or discounted packages. Product previews use the client's own photos and crops. The flow ends at payment, and orders are approved by the photographer before the client is charged.

This prototype covers the full client journey, **Gallery → Store → Product → Builder → Cart → Checkout → Payment**, so the experience can be tested before back-end work starts.

## 2. Problem

- **Clients can't see what they'll get.** Most client galleries treat print sales as an add-on: a generic product list and a cropped thumbnail. Clients struggle to judge what a piece will look like, which photos suit which product, and whether the photos will print well.
- **Photographers can't sell bundles well.** They want to sell bundles, such as an album with wall art, without the client having to work through each item separately.

## 3. Goals

1. **Gallery first.** The gallery is the home page, and buying is one tap away from any photo.
2. **Previews use the client's photos.** Every product preview reflects the chosen photos, crop and options, such as frame colour, mat and cover.
3. **Photo-led building.** The client picks photos first and quantity follows: one photo makes one print, three make a triptych, and an album holds a range.
4. **Confidence before paying.** Crops can be adjusted per photo, each crop gets a print-quality warning, and a review step comes before the cart.
5. **Packages drive order value.** Curated bundles are offered at up to 22% off, with the savings shown clearly.

**Non-goals for this prototype:** the photographer-side store configuration UI, real payments, order management, accounts and authentication, and the backend APIs.

## 4. Users

| User | Need |
|---|---|
| **Client** (couple, family, event guest) | Relive the photos, save favourites, share and download, and order prints and albums without friction |
| **Photographer** (indirect) | Branded store, configurable catalogue and packages, higher order value, approval before charge |

The demo persona is *Lexie & Taylor*, an engagement gallery shot by *Monika Frias*, Aftershoot.

## 5. Scope and requirements

### 5.1 Client gallery (`/`)

| # | Requirement | Status |
|---|---|---|
| G1 | Full-screen cover with the hero image, gallery title and date, and two entry points: view the gallery and shop prints | ✅ |
| G2 | Sticky nav bar showing the client and photographer names, collection tabs with counts, a layout menu, a favourites toggle with a count, and a "Shop prints" button | ✅ |
| G3 | All collections appear in one continuous infinite-scroll grid, in tab order, each with its own heading. There is no "All" tab. | ✅ |
| G4 | Collection tabs update automatically as the user scrolls (scroll-spy). On mobile the active tab scrolls into view. | ✅ |
| G5 | Tapping a tab loads that section if needed and scrolls to it | ✅ |
| G6 | Grid layout options: **orientation** (vertical masonry / horizontal justified rows), **size** (small 4 / medium 3 / large 2 per row on desktop, fewer on tablet and mobile) and **spacing** (airy / thin / none). Option names match the Live Canvas editor. | ✅ |
| G7 | Layout settings are stored in the URL, so a layout can be shared by link | ✅ |
| G8 | Favourite a photo from its tile or the lightbox. Favourites persist on the device for each gallery. Favourites view shows a flat grid, with an empty state and an option to clear. | ✅ |
| G9 | Lightbox with previous/next, keyboard support (arrows, Esc), favourite, download and share | ✅ |
| G10 | Download saves the full-size file. Share uses the native share sheet where available and otherwise copies a link. Both confirm with a toast. | ✅ |
| G11 | Hover actions on each tile: favourite, download, share and buy | ✅ (buy goes to the store without preselecting the photo) |
| G12 | Real photos can be dropped into a folder to replace the placeholders | ✅ |

### 5.2 Store home and browsing (`/store`, `/shop`, `/packages`)

| # | Requirement | Status |
|---|---|---|
| S1 | Store home has a hero, a category grid, "How it works", bestsellers, a packages teaser, a quality section and an FAQ | ✅ |
| S2 | Store header has the photographer's branding, a promo banner showing the gallery being ordered from and a discount code, navigation, and a cart button with an item count | ✅ |
| S3 | Shop lists products, filters by category and sorts by price | ✅ |
| S4 | Packages list and package detail pages show what's included, the bundle price, the compare-at price and the savings | ✅ |

**Catalogue in the prototype:**
- 4 categories: Wall Art, Albums & Books, Fine Prints, Desk & Gifts.
- 9 products: Framed Print, Gallery Canvas, Metal Print, Framed Triptych, Heirloom Album, Layflat Photo Book, Fine Art Print, Acrylic Block, Desk Frame.
- 4 packages: The Keepsake (15% off), The Heirloom (22% off), Gallery Wall (20% off), Family Share (18% off).

### 5.3 Product page (`/product/:id`)

| # | Requirement | Status |
|---|---|---|
| P1 | Live mockup that updates as options change | ✅ |
| P2 | Option controls by type: size, colour swatch, segmented control, descriptive card. The price updates live as options change. | ✅ |
| P3 | Explains how photo count maps to quantity for the product's mode | ✅ |
| P4 | Details list, related packages and "You may also like" | ✅ |
| P5 | The call to action opens the Builder with the chosen variant | ✅ |

### 5.4 Builder (`/build/...`)

Full-screen, three steps: **Photos → Crop → Review**. A sticky top bar shows the steps and a live total.

| # | Requirement | Status |
|---|---|---|
| B1 | **Photos:** pick from the gallery with filters by collection, select many, clear, and preview in a lightbox | ✅ |
| B2 | Selection rules follow the product mode. **Unit** products take any number of photos. **Set** products need multiples of the set size. **Books** hold min to max photos, and photos above the minimum cost extra. The footer shows a clear message when the selection is invalid. | ✅ |
| B3 | **Packages:** one slot per package item, each with a fixed photo count and variant. The client switches between slots with pills. | ✅ |
| B4 | **Crop:** pan and zoom for each photo, a portrait/landscape toggle where the product allows it, reset, and remove | ✅ |
| B5 | Print-quality badge for each crop, based on effective DPI: Great (200+), Good (130+), Low resolution (below 130) | ✅ |
| B6 | Change the variant for one photo, which splits it into a new item or joins a matching one, or for the whole item, which merges with a matching item. A toast describes the result. | ✅ |
| B7 | **Review:** each item's mockup with the client's crops, the photos and their prices, and an edit link back to crop | ✅ |
| B8 | Adding to the cart returns to the product page and opens the cart drawer. Editing a cart line updates it in place. | ✅ |

### 5.5 Cart (`/cart` and drawer)

| # | Requirement | Status |
|---|---|---|
| C1 | Cart drawer and cart page with a thumbnail, variant summary, photo count and price for each line | ✅ |
| C2 | Edit (reopens the Builder), duplicate and remove for each line | ✅ |
| C3 | Package lines show the compare-at price and the savings | ✅ |
| C4 | Order summary shows the subtotal, savings, promo code, shipping, tax and total | ✅ |
| C5 | The cart persists across reloads | ✅ (localStorage) |
| C6 | The empty cart has calls to action for the shop and packages | ✅ |

### 5.6 Checkout and payment (`/checkout`, `/payment`)

| # | Requirement | Status |
|---|---|---|
| K1 | Contact and shipping address form | ✅ |
| K2 | Shipping methods: Standard ($12, 7–10 days), Express ($28, 3–5 days), Studio pickup (free) | ✅ |
| K3 | Payment methods: card (with a live card preview and input formatting), PayPal, Apple Pay. Billing address can match shipping. | ✅ (UI only) |
| K4 | "Make payment" ends the prototype with a notice that no payment was processed. The copy states that the client isn't charged until the photographer approves the order. | ✅ |

## 6. Business rules

**Pricing**
- **Item price.** The size price plus the deltas of the other options. Books also charge `perExtra` for each photo above `min`.
- **Package price.** The sum of the slot values, minus the package discount, rounded to $5. The un-discounted value is shown as the compare-at price.
- **Promo.** `LEXIE10` takes 10% off the subtotal. One code per order.
- **Tax.** A flat 8.25% on the subtotal after the promo (placeholder rate).
- **Shipping.** Charged per order. No charge when the cart is empty.

**Print quality**
- Thresholds are set in DPI. Low resolution produces a warning but does not block the order.

## 7. Design principles

- Monochrome, photo-first UI: neutral surfaces and near-black primary actions, so the photos carry the colour.
- Design tokens:
  - Colour tokens use shadcn-style CSS variables.
  - Typography uses the Figma DS scale `<size>-<weight>` (for example `text-48-sb`), with one class per token.
- Fully responsive (mobile, tablet, desktop), with touch gestures for cropping.
- Motion is subtle and meaningful: reveals on scroll, animated prices, step transitions.
- Accessible: icon buttons have labels, toggles use `aria-pressed`, the lightbox supports the keyboard, and dialogs use Radix.

## 8. Success metrics (for the real product)

- Gallery to store click-through rate
- Store visit to add-to-cart conversion
- Average order value, and package attach rate
- Builder completion rate (Photos → Review → Cart)
- Share of cart items with a low-resolution warning, and the reprint or complaint rate
- Photographer approval time

## 9. Open questions and next steps

1. **Buy from a photo.** The buy button on a gallery tile should open the store or Builder with that photo preselected.
2. **One photo source.** The gallery and the Builder should share a photo set. Today the Builder uses a separate 28-photo list.
3. **Photographer approval flow.** Decide what the client sees after payment, and how the photographer reviews crops and approves or rejects an order.
4. **Store configuration.** Design the photographer-side UI for products, prices, packages, promos and branding.
5. **Tax and shipping.** Replace the flat rates with real tax and shipping-rate services.
6. **Favourites and the store.** Decide whether favourites should be offered first, or pre-filtered, in the Builder's photo step.
7. **Sync.** Decide whether favourites and the cart should sync across devices, which would require client identity.
