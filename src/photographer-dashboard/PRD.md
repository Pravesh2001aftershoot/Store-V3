# Photographer Dashboard: PRD

## Summary

The client-facing side of Store V3 (the gallery, portfolio and print store) is built. Until now every setting was edited on the client page itself: the cover, heading and footer editors open from pencil buttons in the gallery, and the portfolio and store couldn't be edited at all. The Photographer Dashboard (`/dashboard`) moves that work into one place built for the photographer. It's laid out like a working dashboard: a sidebar on the left and three sections.

| Section | The photographer can… |
|---|---|
| **Galleries** | Create a gallery per client. In each one: add photos, sort them into collections, set the order and the cover, design the cover, grid, collection headings and footer against a live preview, and share the link. Each gallery picks the store catalog its clients buy from. |
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
- Sending the gallery (email, client list), analytics, orders and fulfilment.
- Creating new products. The delivered catalog defines which products exist; catalogs choose and price them. Packages can be created.

## Users

**The photographer.** They deliver dozens of galleries a year and are comfortable with Lightroom-style photo managers. They want defaults that look good, and a fast way to make each gallery feel personal.

## Requirements

### Shell

- R1. A left sidebar with the logo, **New gallery**, the three sections (Galleries and Store show counts), the five most recent galleries, and the photographer's profile, which opens their portfolio. From 1024px it's 248px wide; from 640px it collapses to a 72px icon rail; on phones it's a drawer opened from a 56px top bar that names the section.
- R2. Every page has its own URL: `/dashboard/galleries`, `/dashboard/galleries/<id>/<step>`, `/dashboard/portfolio`, `/dashboard/store` and `/dashboard/store/<catalog>`. The old `/dashboard/gallery/<step>` redirects to the sample gallery.
- R3. Each gallery has **View** (its client link), and each catalog has **Preview store** (the print store with that catalog), both in a new tab.

### Galleries

- G1. A grid of gallery cards, newest first: cover photo (or "No photos yet"), title, date, photo count and catalog. Search by title, client or date. A dashed **New gallery** card leads the grid.
- G2. **New gallery** (sidebar, page header or card) asks for a title (required, up to 60 characters), client name (defaults to the title), date (defaults to this month), the store catalog, and whether to start empty or with the sample photos. Creating it opens its Photos step. A new gallery has one collection, "Highlights".
- G3. A card's menu: Edit gallery, Settings, View as client, Delete. Inside a gallery, the header has a breadcrumb back to Galleries, the gear (Settings) and View.
- G4. **Settings** edits the title, client, date and catalog. Delete is there too, after a confirmation; it removes the gallery's photos (including uploads), design and link. The last gallery can't be deleted.
- G5. Each gallery has its own photos, collections, cover, grid, headings and footer. Clients open it at `/g/<id>`; `/` still opens the sample gallery. An unknown link shows "This gallery isn't available".
- G6. The print store follows the gallery the client came from: its banner names that gallery, "Back to gallery" returns to it, and it sells from that gallery's catalog.

### Gallery: Photos (step 1)

- R4. Add photos with a button or by dropping files anywhere on the page. JPEG, PNG, WebP and AVIF are accepted; uploads are resized to 2400px on the long edge, with a 720px thumbnail. Files that can't be read are skipped and counted in the toast.
- R5. Collections: create, rename, reorder (move earlier or later) and delete. Deleting moves the collection's photos to another collection; photos are never deleted with it. At least one collection always remains. Names are up to 32 characters and must be unique.
- R6. Photos are selection-first. A tap selects, Shift-click selects a range, ⌘/Ctrl+A selects everything in view, and Esc clears. Bulk actions: Move to a collection, Make cover (one photo selected), and Remove from the gallery.
- R7. Removed photos go to a **Removed** view, where they can be restored. Uploaded photos can also be deleted for good from there, after a confirmation. Gallery photos can only be removed, never deleted.
- R8. Reorder by dragging within a collection (desktop). Drag photos onto a collection chip to move them.
- R9. "Reset" puts every photo back in its original collection and order. Uploads are kept.

### Gallery: Design (step 2)

- R10. Four parts, each showing its current setting: Cover, Grid, Collection headings and Footer.
- R11. Picking a part opens its editor. On screens 960px and wider it docks in a left column beside the preview; on narrower screens it opens as the gallery's bottom sheet over a full-width preview.
- R12. Cover, heading and footer editing use the gallery's own editors, with the same tabs, controls, limits and templates.
- R13. Grid sets the default layout clients start with: arrangement (masonry or justified rows), photo size and spacing. Clients can still change their own view.
- R14. The preview is the real client gallery. It scrolls to the part being edited, updates as settings change, and can render at desktop (1280), tablet (820) or phone (390) width, scaled to fit.

### Gallery: Share (step 3)

- R15. The client link, with Copy link and Open.
- R16. A "Before you send" checklist (photos, cover photo, title, footer), each item linking to where it's fixed.
- R17. Links on to the Portfolio and to this gallery's store catalog.

### Portfolio

- R18. Profile: portrait (upload, pick from portfolio photos, or use the default), name, role, location, availability, year started, email (validated), Instagram, and specialities (add or remove; at least one).
- R19. Intro: headline (defaults to "Hello! I'm <first name>."), bio, buttons on or off, and the facts strip on or off with each fact on or off.
- R20. Work: section title; categories (rename, reorder, hide, which also hides their galleries); galleries (search, filter by category, rename, hide). A hidden gallery's page shows "This gallery isn't available".
- R21. Contact: heading, which detail rows show, and the header's Enquire button on or off.
- R22. The profile also fills in the gallery footer's contact details.
- R23. Same layout as Design: the editor docked beside a live `/portfolio` preview that follows the open tab, or a sheet on narrow screens.

### Store: catalogs

- C1. A list of catalogs as cards: name, product and package counts, the lowest price, four product thumbnails, which galleries use it, and a "Customised" tag once edited. The **Main catalog** always exists and can't be deleted; new galleries use it unless another is picked.
- C2. **New catalog** asks for a name (up to 40 characters) and how to start: **Everything** (every product and package on), **Nothing** (everything off, to switch on what you sell) or **A copy** of another catalog. Creating it opens it.
- C3. A card's menu: Edit catalog, Rename, Duplicate (a copy named "<name> copy"), Preview store, Delete. Deleting a catalog moves the galleries using it to the Main catalog, after a confirmation that says how many.
- C4. Catalogs are independent: a price, a hidden product or a package in one never changes another. Copies get their own packages.

### Store: one catalog

- R24. Header: a back link to Catalogs, the catalog name (click to rename), which galleries sell from it (with links), Reset, and Preview store. Summary: products live, packages live, the price range and how many items are customised.
- R25. Products: filter by category; drag a row's handle to reorder (only when showing All); a visibility switch on every row; and an edited price shows with the original struck through.
- R26. Product editor tabs:
  - **Details:** show in store, name, tagline and badge. It warns when a hidden product is still sold inside a package.
  - **Sizes:** the price of each size, and whether it's offered.
  - **Options:** the add-on price of each choice, and whether it's offered.
  Every option keeps at least one choice. "Reset product" goes back to the catalog values.
- R27. Packages: reorder, show or hide, name, tagline, Most popular, and a discount from 0–40% with the live package price, its value and the client's saving. The delivered packages' contents are read-only, and products hidden from the store are flagged.
- R27a. **New package** creates a package in this catalog (tagged "Yours") with one item, and opens it. Its contents are editable: up to 6 lines, each a product, a size and a quantity (1–50; books are always one), with the line's price. An empty package stays hidden from the store. It can be deleted from its Details tab.
- R28. Changes apply to the live store of every gallery using the catalog: lists, product pages, the builder, cart prices and package prices.

## Success criteria (prototype)

- A photographer can take the mock gallery from as delivered to customised (new photos, a new collection, a cover, a footer) without leaving `/dashboard`.
- A photographer can create a second gallery from their own photos, give it a Weddings catalog with different prices and a package of their own, and its client sees those prices while the first gallery's client doesn't.
- Every edit shows in the preview in under a second, with no reload.
- Every tab is usable at 390px wide.

## Open questions

- **Draft or live?** Today edits go live immediately. A real product probably needs drafts and a "Publish" step for galleries that clients are already viewing.
- **Per-gallery or account-wide?** Now explicit: the portfolio, footer contact details and catalogs are photographer-wide; cover, headings, grid, photos and the choice of catalog are per gallery. Open: should a gallery be able to override a single price without a whole catalog?
- **Projects vs galleries.** A gallery is one client delivery. Some photographers will want a project (a wedding) holding several galleries (engagement, wedding day). Not modelled yet.
- **Catalog per client in a gallery?** Today one catalog per gallery. Schools and events may need different catalogs for different viewers of one gallery.
- **Should clients still see edit pencils?** The gallery's own pencils remain for now, but are hidden in the dashboard preview. Once there's a photographer login they should only show to the photographer.
