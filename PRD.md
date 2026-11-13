# Store V3: Product Requirements (Prototype)

**Status:** Interactive prototype (front end only, mocked data)
**Last updated:** 13 Nov 2026

## 1. Summary

Store V3 is a print store that a photographer configures and their clients use. A client opens the gallery the photographer delivered, browses and favourites photos, and turns them into physical products: wall art, prints, albums or discounted packages. Product previews use the client's own photos and crops. The flow ends at payment, and orders are approved by the photographer before the client is charged.

This prototype covers the full client journey, **Gallery → Store → Product → Builder → Cart → Checkout → Payment**, so the experience can be tested before back-end work starts. It also includes the photographer's public **Portfolio**, opened from the gallery, so a client (or someone they share the gallery with) can see the photographer's other work and get in touch.

## 2. Problem

- **Clients can't see what they'll get.** Most client galleries treat print sales as an add-on: a generic product list and a cropped thumbnail. Clients struggle to judge what a piece will look like, which photos suit which product, and whether the photos will print well.
- **Photographers can't sell bundles well.** They want to sell bundles, such as an album with wall art, without the client having to work through each item separately.
- **Galleries are a missed referral channel.** A delivered gallery is seen by the couple, their family and their guests, but it doesn't lead anywhere: there's no way to see what else the photographer shoots or to book them.

## 3. Goals

1. **Gallery first.** The gallery is the home page, and buying is one tap away from any photo.
2. **Previews use the client's photos.** Every product preview reflects the chosen photos, crop and options, such as frame colour, mat and cover.
3. **Photo-led building.** The client picks photos first and quantity follows: one photo makes one print, three make a triptych, and an album holds a range.
4. **Confidence before paying.** Crops can be adjusted per photo, each crop gets a print-quality warning, and a review step comes before the cart.
5. **Packages drive order value.** Curated bundles are offered at up to 22% off, with the savings shown clearly.
6. **Every gallery markets the photographer.** One tap from the gallery leads to a portfolio of all published work, filterable by genre, with a clear way to enquire.

**Non-goals for this prototype:** the photographer-side store configuration UI, real payments, order management, accounts and authentication, and the backend APIs.

## 4. Users

| User | Need |
|---|---|
| **Client** (couple, family, event guest) | Relive the photos, save favourites, share and download, and order prints and albums without friction |
| **Photographer** (indirect) | Branded store, configurable catalogue and packages, higher order value, approval before charge, and new bookings from people who see a gallery |
| **Prospective client** (guest, friend of the couple) | See the photographer's work in their style of shoot, and enquire |

The demo persona is *Lexie & Taylor*, an engagement gallery shot by *Esteban Gill*, Aftershoot.

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
| G9 | Lightbox (loupe) with previous/next, keyboard support (arrows, Esc), favourite, download and share, plus a horizontal film strip of thumbnails below the photo on all screen sizes. The current photo is highlighted and kept in view, and tapping a thumbnail jumps to it. | ✅ |
| G10 | Download saves the full-size file. Share uses the native share sheet where available and otherwise copies a link. Both confirm with a toast. | ✅ |
| G11 | Hover actions on each tile: favourite, download, share and buy. Hidden on touch screens, where tapping a tile opens the lightbox, which has the same actions. | ✅ (buy goes to the store without preselecting the photo) |
| G12 | Real photos can be dropped into a folder to replace the placeholders | ✅ |
| G13 | **Cover editor.** "Edit cover" on the cover opens an editor with a live preview: a left pane on tablet and desktop, and a bottom sheet on phones that collapses to a bar to see the whole cover. Tabs: Templates, Layout, Text, Photo. "Reset all" restores the defaults, and the choices are saved on the device. | ✅ (open to every visitor, see open question 12) |
| G14 | **Templates.** Six presets (Classic, Centered, Editorial, Minimal, Top corner, Signature) set the layout and which pieces show. They never change the text. | ✅ |
| G15 | **Layout.** Text position on a 3×3 grid, alignment, title size, text width, logo position (top left/centre/right, above the title, or off), button arrangement and size, margins and overlay strength | ✅ |
| G16 | **Text.** Edit the eyebrow, title, subtitle and both button labels, each with a character limit and counter. Optional pieces and the print store link can be turned off. An empty title falls back to the client's names. | ✅ |
| G17 | **Cover photo.** Choose any gallery photo as the cover, filtered by collection, or upload an image from the device (click or drag and drop). The upload stays available to switch back to until it's removed. | ✅ (uploads are stored on the device only) |
| G18 | **Footer editor.** "Edit footer" on the footer opens an editor with a live preview, like the cover's: a left pane on tablet and desktop, and a bottom sheet on phones that collapses to a bar. The preview scrolls, since a footer can be taller than the space left for it, and its links don't navigate while editing. Tabs: Templates, Content, Socials, Style. "Reset all" restores the defaults, and the choices are saved on the device. | ✅ (open to every visitor, see open question 14) |
| G19 | **Footer templates.** Six minimal layouts built only from design system tokens and components: Simple, Statement, Let's talk (an invitation to get in touch, with a button), Photo card, Grid and Wordmark. Choosing one changes the layout and which pieces show, never the text or social links. All start on the same white background as the default footer, and every template adapts to phone widths. | ✅ |
| G20 | **Footer content.** Show or hide the logo, wordmark (the studio name drawn edge to edge, with editable text), tagline, button label, email, location, quick links (View gallery, Print store, Portfolio), photographer credit and back to top. Only the pieces the chosen template uses are offered. Fields have character limits; an invalid email shows an error and is left out of the footer. Defaults come from the gallery and the photographer's profile. | ✅ |
| G21 | **Social links.** Add profiles from 11 platforms (Instagram, Facebook, TikTok, Pinterest, YouTube, X, Threads, LinkedIn, Behance, WhatsApp, website) by handle or full link, see the resulting link, and remove them. Empty profiles stay hidden. Show socials as icons or names, or turn them off. | ✅ (handles aren't verified) |
| G22 | **Footer style.** Background: White (default), Page, Grey or Dark. The Photo card template can use any gallery photo, or the cover photo. | ✅ |
| G23 | **Collection heading editor.** A pencil on each collection heading (on hover; always shown on touch screens) opens "Customize headings": a left pane on tablet and desktop, a bottom sheet on phones that collapses to a bar, and a live preview of that heading over a few of the collection's photos. Tabs: Templates, Text, Style. The pencil is hidden while photos are being multi-selected. "Reset all" restores the defaults, and the choices are saved on the device. | ✅ (open to every visitor, see open question 16) |
| G24 | **Heading templates.** Five layouts: Classic (photo count over a large title), Centered (title between two fine rules), Split (title on one side, a note on the other), Numbered (a chapter number beside the title) and Inline (a quiet title and count on one hairline). A template applies to every collection heading, so the gallery reads as one piece, and never changes the words or typeface. Template previews show the current words and type. | ✅ |
| G25 | **Heading text.** Each collection has its own label (defaults to "N photos"), title (defaults to the collection name; an empty title falls back to it) and optional note, with character limits (32 / 40 / 160). Pick the collection in the editor; the label can be turned off for every heading. Each collection's words can be restored to the original. | ✅ |
| G26 | **Heading style.** "Match the cover's style" (on by default) takes the font, weight, letter case, alignment and title size from the cover and follows later cover changes. Turned off, choose the font (Sans, Serif, Classic, Mono), weight (Light, Regular, Bold), letter case, alignment, title size (Small, Medium, Large) and title side (Split). Space around (Compact, Regular, Airy) and fine rules can be set either way. Only the controls the chosen template uses are offered. | ✅ |
| G27 | **Multi-select.** Select several photos at once. On a computer, tick the check that appears on a photo's hover; Shift-click selects a range; ⌘/Ctrl+A selects everything in view. On touch screens, long-press a photo; on phones a Select button in the collection row works too. While selecting, tapping a photo toggles it. A floating bar shows the count, Select all / Select none, Cancel (or Esc), and the bulk actions. Works in the gallery, Favourites and Hidden. | ✅ |
| G28 | **Bulk actions.** Share (as files through the share sheet for up to 10 photos, otherwise as links, or copied links where there's no share sheet), Favourite or Unfavourite all (Unfavourite when every selected photo is already a favourite), Download (one file after another, with a toast if any fail) and New set. Each action confirms with a toast. | ✅ (download saves separate files, not a zip) |
| G29 | **Custom sets.** A client can save a selection as a named set (default "Set 1", "Set 2", up to 40 characters) and keep up to two sets per gallery; at the limit they're asked to delete one first. Sets appear after the collection tabs with their photo count and open as their own flat view. Hidden photos are left out of a set's view and count. A set can be deleted (after a confirmation), which leaves its photos in the gallery. Sets are saved on the device. | ✅ (sets can't be renamed or edited, see open question 17) |
| G30 | **No multi-select inside a set.** An open set is for viewing: photos open in the lightbox as usual, but there's no select check, long press or Select button there. | ✅ |
| G31 | **Hide photos.** A client can hide a photo they don't want to see (from the tile on hover, or the lightbox) and bring it back later. Hidden photos leave the gallery grid, collection counts, Favourites and sets; a collection with every photo hidden drops out of the tabs. Each hide or unhide confirms with a toast. Hiding the photo open in the lightbox moves on to the next one. Hidden photos are saved on the device. | ✅ (not shared with the photographer, see open question 18) |
| G32 | **Hidden view.** A "Hidden" button in the nav, with a count, opens a flat list of hidden photos with an empty state ("No hidden photos. Photos you hide will wait here."). Each photo can be unhidden, or all of them at once with "Unhide all" (after a confirmation), which returns to the gallery. Multi-select works here too. | ✅ |

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

### 5.7 Photographer portfolio (`/portfolio`, `/portfolio/:slug`)

| # | Requirement | Status |
|---|---|---|
| F1 | The photographer's name in the gallery nav links to the portfolio | ✅ |
| F2 | Sticky header with a way back (to the gallery, or to the portfolio from a gallery page), the photographer's name, section links (Work, About, Contact) and an "Enquire" button | ✅ |
| F3 | Intro: greeting, disciplines, short bio, portrait, "View work" and "Get in touch", and a facts strip (availability, focus, location, experience) | ✅ |
| F4 | "Selected work" lists every published gallery with its total count, as cards (cover, title, genre, location, photo count) or a compact list | ✅ |
| F5 | Filter by genre with tabs and counts. Genres come from the photographer's work folders, so a new genre needs no code change. | ✅ |
| F6 | Search by client name, place, genre or year, with a no-results state and "Clear filters" | ✅ |
| F7 | Sort by newest, oldest or most photos. Date sorts group galleries under year headings with counts. | ✅ |
| F8 | Filters, sort, view and search are stored in the URL, so a filtered portfolio can be shared by link | ✅ |
| F9 | Galleries load progressively as the visitor scrolls (infinite scroll), with a "Showing all N galleries" end state | ✅ |
| F10 | Hovering a card with a mouse scrubs through a few of the gallery's photos, so a shoot can be previewed without opening it | ✅ (not available on touch) |
| F11 | Gallery page: title, category (links to that genre in the portfolio), location, date and photo count, then all photos in a masonry grid | ✅ |
| F12 | Gallery page ends with up to four more galleries of the same genre, nearest in date first, plus "View all" | ✅ |
| F13 | Contact footer on both pages: headline, email, "Browse galleries", availability, location and Instagram | ✅ (email opens `mailto:`; no form) |
| F14 | Photos are rebuilt from the photographer's export folder with one command (`npm run portfolio:photos`) | ✅ |

**Portfolio content in the prototype:** about 500 photos across 4 genres (Weddings, Couples, Families, Portraits), split into mock galleries with placeholder client names, places and dates. Profile copy and the contact email are placeholders.

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
- Gallery to portfolio click-through rate, and portfolio to enquiry rate

## 9. Open questions and next steps

1. **Buy from a photo.** The buy button on a gallery tile should open the store or Builder with that photo preselected.
2. **One photo source.** The gallery and the Builder should share a photo set. Today the Builder uses a separate 28-photo list.
3. **Photographer approval flow.** Decide what the client sees after payment, and how the photographer reviews crops and approves or rejects an order.
4. **Store configuration.** Design the photographer-side UI for products, prices, packages, promos and branding.
5. **Tax and shipping.** Replace the flat rates with real tax and shipping-rate services.
6. **Favourites and the store.** Decide whether favourites should be offered first, or pre-filtered, in the Builder's photo step.
7. **Sync.** Decide whether favourites and the cart should sync across devices, which would require client identity.
8. **Portfolio source.** Decide where portfolio galleries come from in production: the photographer's real published galleries (with privacy controls per client) or a curated selection. Today they are slices of a folder with mock details.
9. **Portfolio privacy.** Client galleries are private by default. Define consent for showing a client's photos publicly, and whether client names appear.
10. **Enquiries.** Replace the `mailto:` buttons with an enquiry form that reaches the photographer's CRM, and decide what details it captures (date, location, genre).
11. **Portfolio photo viewer.** Decide whether portfolio photos should open in the gallery lightbox, and whether they can be shared.
12. **Who edits the cover.** In the prototype anyone can open the cover editor. In the product it should be photographer-only, and saved to the gallery rather than the device.
13. **Cover photo rules.** Decide whether an uploaded cover should be added to the gallery or kept separate, the minimum size for an upload, and whether photographers can set a focal point for crops on narrow screens.
14. **Who edits the footer, and where its details come from.** Like the cover, the footer editor should be photographer-only and saved to the gallery. Decide whether email, location and socials come from one photographer profile shared by every gallery and the portfolio, with per-gallery overrides, and whether social handles should be checked.
15. **Footer defaults per studio.** Decide whether photographers pick a default footer template and background for all their galleries, and whether the Dark background should wait for a full dark theme.
16. **Who edits collection headings, and how they're stored.** Like the cover and footer, the heading editor should be photographer-only and saved to the gallery. Headings are keyed by collection name today, so renaming a collection drops its custom words; in the product they should be keyed by collection id. Decide whether the note should also show in the collection tabs or the lightbox, and whether heading templates join the cover and footer in a studio-wide default.
17. **Sets.** Decide whether sets are shared with the photographer (for example as an album or print shortlist), sync across devices, can be renamed, and can have photos added or removed after they're made. Revisit the two-set limit, and whether bulk actions (download, buy) should be offered inside a set, since multi-select is off there today. Decide whether bulk download should be a single zip.
18. **Hidden photos.** Decide whether the photographer should see what a client hid (a signal of photos they don't like, or a privacy request), whether hiding should sync across devices and between people sharing a gallery, whether hidden photos should be excluded from downloads, the store and the cover picker, and whether to add Hide to the selection bar's bulk actions.
