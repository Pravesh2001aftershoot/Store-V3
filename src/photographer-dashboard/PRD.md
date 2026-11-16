# Photographer Dashboard: PRD

## Summary

The client-facing side of Store V3 (the gallery, portfolio and print store) is built. Until now every setting was edited on the client page itself: the cover, heading and footer editors open from pencil buttons in the gallery, and the portfolio and store couldn't be edited at all. The Photographer Dashboard (`/dashboard`) moves that work into one place built for the photographer. It's laid out like a working dashboard: a sidebar on the left and three sections.

| Section | The photographer can… |
|---|---|
| **Galleries** | Create a gallery per client. In each one: add photos, sort them into collections, set the order and the cover, design the cover, grid, collection headings and footer against a live preview, share the link, and see who visited and what they downloaded, shared, favourited, commented on and bought. Each gallery picks the store catalog its clients buy from. |
| **Portfolio** | Edit their profile, portrait, intro, which galleries and categories appear, and the contact section. |
| **Store** | Create catalogs (for example Weddings, Newborns). In each one: show or hide products and packages, put them in order, rename them, set sizes, prices, option add-ons and package discounts, and build their own packages. |

Every change saves as it's made and shows on the client pages straight away. There is no draft or publish step.

## Goals

1. **One place to set up a gallery.** Photographer tasks shouldn't live on client pages.
2. **See it as the client will.** Every design change is previewed on the real client page, at desktop, tablet or phone width.
3. **Reuse, don't rebuild.** The gallery's cover, heading and footer editors are reused as they are, so the dashboard and the gallery can't drift apart.
4. **Feel like the gallery.** The dashboard uses the same tokens, controls and motion, and stays calm and photo-first even with a lot of settings.
5. **Works on a phone.** A photographer should be able to fix a price or swap a cover from their phone.

## Non-goals (prototype)

- Accounts, sign-in, or a client list. A gallery's "client" is just a name on the gallery.
- A server. Settings live in this browser (see [Architecture.md](Architecture.md)).
- Sending the gallery (email, client list), order management and fulfilment.
- Real event tracking. Gallery analytics show sample data (see Gallery: Analytics).
- New categories, and products that aren't made from the client's photos (every product takes at least one gallery photo). Photographers can create products and packages, but only in the delivered categories.

## Users

**The photographer.** They deliver dozens of galleries a year and are comfortable with Lightroom-style photo managers. They want defaults that look good, and a fast way to make each gallery feel personal.

## Requirements

### Shell

- R1. A left sidebar with the logo, the three sections (Galleries and Store show counts), the five most recent galleries, and the photographer's profile, which opens their portfolio. From 1024px it's 248px wide; from 640px it collapses to a 72px icon rail; on phones it's a drawer opened from a 56px top bar that names the section.
- R2. Every page has its own URL: `/dashboard/galleries`, `/dashboard/galleries/<id>/<step>`, `/dashboard/portfolio`, `/dashboard/store` and `/dashboard/store/<catalog>`. The old `/dashboard/gallery/<step>` redirects to the sample gallery.
- R3. Each gallery has **View** (its client link), and each catalog has **Preview store** (the print store with that catalog), both in a new tab.

### Galleries

- G1. A grid of gallery cards, newest first: cover photo (or "No photos yet"), title, date, photo count and catalog. Search by title, client or date. A dashed **New gallery** card leads the grid.
- G2. **New gallery** (page header or card) asks for a title (required, up to 60 characters), client name (defaults to the title), date (defaults to this month), the store catalog, and whether to start empty or with the sample photos. Creating it opens its Photos step. A new gallery has one collection, "Highlights".
- G3. A card's menu: Edit gallery, Settings, View as client, Delete. Inside a gallery, the header has a breadcrumb back to Galleries, the gear (Settings) and View. On the Design step the header merges into the preview's toolbar: breadcrumb and title on the left, gear after the preview's Open (which replaces View).
- G4. **Settings** edits the title, client, date and catalog. Delete is there too, after a confirmation; it removes the gallery's photos (including uploads), design and link. The last gallery can't be deleted.
- G5. Each gallery has its own photos, collections, cover, grid, headings and footer. Clients open it at `/g/<id>`. The app opens on the dashboard (`/` redirects to `/dashboard`). An unknown link shows "This gallery isn't available".
- G6. The print store follows the gallery the client came from: its banner names that gallery, "Back to gallery" returns to it, and it sells from that gallery's catalog.

### Gallery: Photos (step 1)

- R4. Add photos with a button or by dropping files anywhere on the page. JPEG, PNG, WebP and AVIF are accepted; uploads are resized to 2400px on the long edge, with a 720px thumbnail. Files that can't be read are skipped and counted in the toast.
- R5. Collections: create, rename, reorder (move earlier or later) and delete. Deleting moves the collection's photos to another collection; photos are never deleted with it. At least one collection always remains. Names are up to 32 characters and must be unique.
- R6. Photos are selection-first. A tap selects, Shift-click selects a range, ⌘/Ctrl+A selects everything in view, and Esc clears. Bulk actions: Move to a collection, Make cover (one photo selected), and Remove from the gallery.
- R7. Removed photos go to a **Removed** view, where they can be restored. Uploaded photos can also be deleted for good from there, after a confirmation. Gallery photos can only be removed, never deleted.
- R8. Reorder by dragging within a collection (desktop). Drag photos onto a collection chip to move them.
- R9. "Reset" puts every photo back in its original collection and order. Uploads are kept.

### Gallery: Design (step 2)

- R10. Four parts: Cover, Grid, Collection headings and Footer. On wide screens they're tabs above the editor; on narrower screens chips above the preview.
- R11. Picking a part opens its editor. On screens 960px and wider it docks in a right-hand column beside the preview, under the part tabs, and one editor is always open (Cover first); on narrower screens it opens as the gallery's bottom sheet over a full-width preview.
- R12. Cover, heading and footer editing use the gallery's own editors, with the same tabs, controls, limits and templates.
- R13. Grid sets the default layout clients start with: arrangement (masonry or justified rows), photo size and spacing. Clients can still change their own view.
- R14. The preview is the real client gallery. It scrolls to the part being edited, updates as settings change, and can render at desktop (1280), tablet (820) or phone (390) width, scaled to fit.

### Gallery: Share (step 3)

- R15. The client link, with Copy link and Open.
- R16. A "Before you send" checklist (photos, cover photo, title, footer), each item linking to where it's fixed.
- R17. Links on to the Portfolio and to this gallery's store catalog.

### Gallery: Analytics (step 4)

- R17a. Totals for the gallery: **Visitors** (with how many gave an email and how many are anonymous), **Downloads** (single photos and full gallery), **Revenue** (orders and average order) and **Favourites** (with shares and comments).
- R17b. **How people download:** a bar splitting downloads into single photos and full gallery, with each side's download count and how many people did it.
- R17c. **People:** everyone who opened the gallery with an email, with their downloads, favourites, shares, comments, amount spent and when they were last active. The client is tagged "Client". Search by email or name; sort by Most recent, Most downloads, Most favourites, Most shares or Highest spend.
- R17d. Opening a person shows their activity by kind, down to the photo: **Downloads** (full gallery downloads with their size, then each photo), **Favourites**, **Shares** (with the channel: Link, Email, WhatsApp, Facebook), **Comments** (the text and the photo) and **Orders** (each item with its photo, size, quantity and price). Copy email and Email (mailto) are in the footer.
- R17e. **Export CSV** downloads the people list as shown (one row per person).
- R17f. The prototype shows sample activity, generated per gallery and stable between visits; the page says so. A gallery with no photos shows "No activity yet".

### Portfolio

- R18. Profile: portrait (upload, pick from portfolio photos, or use the default), name, role, location, availability, year started, email (validated), Instagram, and specialities (add or remove; at least one).
- R19. Intro: headline (defaults to "Hello! I'm <first name>."), bio, buttons on or off, and the facts strip on or off with each fact on or off.
- R20. Work: section title; categories (rename, reorder, hide, which also hides their galleries); galleries (search, filter by category, rename, hide). A hidden gallery's page shows "This gallery isn't available".
- R21. Contact: heading, which detail rows show, and the header's Enquire button on or off.
- R22. The profile also fills in the gallery footer's contact details.
- R23. Like Design, but the editor ("Customize portfolio") is docked to the **right** of a live `/portfolio` preview that follows the open tab, or a sheet on narrow screens.

### Store: catalogs

- C1. A list of catalogs as cards: name, product and package counts, the lowest price, four product thumbnails, which galleries use it, and a "Customised" tag once edited. The **Main catalog** always exists and can't be deleted; new galleries use it unless another is picked.
- C2. **New catalog** asks for a name (up to 40 characters) and how to start: **Everything** (every product and package on), **Nothing** (everything off, to switch on what you sell) or **A copy** of another catalog. Creating it opens it.
- C3. A card's menu: Edit catalog, Rename, Duplicate (a copy named "<name> copy"), Preview store, Delete. Deleting a catalog moves the galleries using it to the Main catalog, after a confirmation that says how many.
- C4. Catalogs are independent: a price, a hidden product, a product or a package in one never changes another. Copies get their own products and packages.

### Store: one catalog

- R24. Header: a back link to Catalogs, the catalog name (click to rename), which galleries sell from it (with links), Reset, and Preview store. Summary: products live, packages live, the price range and how many items are customised.
- R25. Products: filter by category; drag a row's handle to reorder (only when showing All); a visibility switch on every row; and an edited price shows with the original struck through.
- R26. Product editor tabs:
  - **Details:** show in store, name, tagline and badge. It warns when a hidden product is still sold inside a package.
  - **Sizes:** the price of each size, and whether it's offered.
  - **Options:** the add-on price of each choice, and whether it's offered.
  Every option keeps at least one choice. "Reset product" goes back to the catalog values.
- R26a. **New product** (beside the Products / Packages switch, and in an empty category) creates the photographer's own product in this catalog and opens it. It starts hidden, named "New product", in the category being shown (or Wall Art under All), with one 8 × 10" size at $50. It's tagged "Yours" in the list. Its editor has four tabs:
  - **Details:** show in store; Name (32), Tagline (80), Badge (16); Category (one of the store's four); Description (400) and up to 6 Highlights (60 each), shown under Details on the product page; Delete product (also removes it from the photographer's packages).
  - **Images:** up to 6 product images (resized to 1000px and stored in the browser). The first is the cover, used on the product card, the catalog row and the catalog card; the product page shows them all as thumbnails beside the "your photo" preview. **Look** picks which mockup style shows the client's photo in it (Loose print, Framed, Canvas, Metal / flat panel, Acrylic block, Book cover, Photo only), and a switch lets clients turn photos landscape.
  - **Sizes:** how photos work (One photo per item; A set of photos per item, 2–10; Album or book, with photos included, most photos and a price per extra photo), then up to 10 sizes, each width × height in inches (1–60, which sets the crop shape and the label) and a price. A product keeps at least one size.
  - **Options:** up to 4 options (like Finish or Colour), each with a name, how it's shown (Buttons, Cards with a note, Colour swatches) and up to 8 choices with a name, an add-on price and a colour or note. The first choice is the default. Choices without a name, and options without a named choice, don't show in the store.
  A custom product works everywhere a catalog product does: shop lists, the product page, the builder, the cart, and the photographer's own packages.
- R27. Packages: reorder, show or hide, name, tagline, Most popular, and a discount from 0–40% with the live package price, its value and the client's saving. The delivered packages' contents are read-only, and products hidden from the store are flagged.
- R27a. **New package** creates a package in this catalog (tagged "Yours") with one item, and opens it. Its contents are editable: up to 6 lines, each a product, a size and a quantity (1–50; books are always one), with the line's price. An empty package stays hidden from the store. It can be deleted from its Details tab.
- R28. Changes apply to the live store of every gallery using the catalog: lists, product pages, the builder, cart prices and package prices.

## Success criteria (prototype)

- A photographer can take the mock gallery from as delivered to customised (new photos, a new collection, a cover, a footer) without leaving `/dashboard`.
- A photographer can create a second gallery from their own photos, give it a Weddings catalog with different prices, a product and a package of their own, and its client sees those prices while the first gallery's client doesn't.
- Every edit shows in the preview in under a second, with no reload.
- Every tab is usable at 390px wide.

## Open questions

- **Draft or live?** Today edits go live immediately. A real product probably needs drafts and a "Publish" step for galleries that clients are already viewing.
- **Per-gallery or account-wide?** Now explicit: the portfolio, footer contact details and catalogs are photographer-wide; cover, headings, grid, photos and the choice of catalog are per gallery. Open: should a gallery be able to override a single price without a whole catalog?
- **Projects vs galleries.** A gallery is one client delivery. Some photographers will want a project (a wedding) holding several galleries (engagement, wedding day). Not modelled yet.
- **Catalog per client in a gallery?** Today one catalog per gallery. Schools and events may need different catalogs for different viewers of one gallery.
- **Analytics: what counts as a visitor?** Today a person is an email. Should guests without an email be tracked per device, and should the client see who else viewed their gallery?
- **Analytics date range.** All time only for now. Photographers may want last 7 / 30 days, or activity since the link was sent.
- **Should clients still see edit pencils?** The gallery's own pencils remain for now, but are hidden in the dashboard preview. Once there's a photographer login they should only show to the photographer.
