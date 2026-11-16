# Photographer Dashboard: Design System

The dashboard uses the app's design system as it is: tokens in `src/index.css` and `src/tokens/typography.js`, with the rules in the app-wide [DesignSystem.md](../../DesignSystem.md). It adds no colours, type tokens or fonts. This doc covers how those pieces are put together for a tool that handles a lot of settings, and the few components the dashboard adds.

## Principles

- **It's the gallery, backstage.** Same surfaces, type, controls and motion as the client gallery. A photographer who has used the gallery's cover editor already knows the dashboard.
- **The photos and the preview carry the colour.** The chrome is monochrome. Colour appears only for meaning: success green for "Edited" and live status, amber for warnings, destructive red for deletes.
- **One thing at a time.** Each screen has one job: a list to scan, or one editor beside its preview. Settings are grouped in titled `Section`s with a one-line hint, never a wall of fields.
- **Defaults are visible.** Empty text fields show the value they fall back to as a placeholder, edited prices show the original struck through or as "was $X", and lists tag what's been changed.
- **Touch first.** Targets are at least 32px, usually 36–40px. Every screen works at 390px.
- **Phones: full-width buttons, sheets for options.** Under 640px, action buttons fill their row (two side by side share it equally, 40px tall), and every list of options (selects and ⋯ / Move to menus) opens as a bottom sheet, never a popover or the OS picker. Exceptions: icon buttons, chips, switches, steppers, the toolbar buttons in a header row (gallery ⚙ / View), and a button attached to a text field (Add speciality).

## Layout

| Region | Spec |
|---|---|
| Sidebar | From 1024px: 248px, sticky full height, `surface-1`, `border-r`. 64px logo row with a `11-SB` "Studio" eyebrow; nav rows (40px, `rounded-lg`, `13-M`, icon 18px, count in `12-R type-3`) with the active row on a sliding `surface-2` highlight; "Recent galleries" (`11-SB` eyebrow, 40px rows with a 28px `rounded-md` cover thumbnail); profile at the bottom above a `border-t` (32px initials disc, name `13-M`, "View portfolio" `12-R type-3`). |
| Rail | 640–1023px: the same sidebar at 72px, icons only, the logo cropped to its mark, tooltips on hover, no recent galleries. |
| Phone bar + drawer | Under 640px: a 56px sticky top bar (`surface-0/90`, blur) with ☰, the logo and the section name. ☰ opens the full sidebar as a drawer, `min(300px, 86vw)`, sliding from the left (0.4s) over a `black/40` scrim. |
| Workspace | Design and Portfolio fill the screen (`100svh`, minus the 56px bar on phones): a docked editor column (380px, 400px from `xl`) on `surface-1`, and the preview filling the rest on `surface-2`. Design and Portfolio both dock it on the right of the preview (`border-l`); in Design it sits between the preview and the step rail. |
| Docked editor | From 960px (`useDocked`). Below that, editors are the gallery's bottom sheet (`SHEET_H` 58svh, collapsible to `PEEK_H` 64px). |
| Store | A list column (max 1100px, centred) plus a 420px right editor column from 1100px. Below that, the editor is a bottom sheet. |
| Page content | Lists (Galleries, Store): `max-w-[1400px]`, 16px gutters on phones and 32px from `md`. Gallery steps keep `max-w-[1800px]` and 24px. Bottom padding of 160px where a floating bar can cover the last row. |
| Gallery grid | Cards in 1 / 2 / 3 / 4 columns (phone / `sm` / `lg` / `2xl`), 16px across and 24px down. |
| Catalog grid | 1 / 2 / 3 columns (phone / `md` / `2xl`), 16px gaps. |

## Type

| Use | Token |
|---|---|
| Page title | `30-M`, `24-M` on phones |
| Page description | `14-R-P`, `type-2` |
| Editor title / panel heading | `16-SB` |
| Section title (in editors) | `11-SB` uppercase, `type-2` (`Section`) |
| Row title | `14-M` (lists), `13-M` (inside editors) |
| Row meta / hints | `12-R`, `type-2` / `type-3` |
| Stat value | `20-M` tabular |
| Eyebrows ("Client gallery", "Products live") | `11-SB` uppercase, `type-3` |
| Chips, buttons, tabs | `13-M` |

Prices and counts always use `tabular-nums`.

## Components

### Reused from the gallery

- `EditorPane` is the shell for every editor: header, pill tabs, crossfading body, and Reset / Done footer. It's now also `inline`, with a `resetLabel`. Inline without `onClose` it hides ✕ and Done (the Design step's always-open editors).
- `controls.jsx`: `Section`, `Segmented`, `Switch`, `Slider`, `TextField` (with live character count and limits), `Swatches`.
- `Button`, `Toaster` / `notify()` and `BottomSheet`.

### Added in `components/ui.jsx`

| Component | Look | Use |
|---|---|---|
| `Modal` (`Modal.jsx`) | Centred `surface-1` card, 520px max, `rounded-2xl`, deep shadow, over `black/40`; on phones a bottom sheet with `rounded-t-3xl`. `20-M` title, `13-R-P` description, ✕, scrolling body, footer actions right above a `border-t` (on phones they share the row equally) | New gallery, Gallery settings, New catalog, Rename |
| `InlineName` | Text that shows a pencil on hover (always on phones); click swaps it for a field on `surface-2` with a soft ring | Catalog name in its header |
| `Select` | 36px field, `rounded-lg`, `border-input`, caret icon right. Native select on tablet and desktop; on phones a button that opens a bottom sheet (titled with its `label`) of 48px `16-R` options with a ✓ on the current one | Catalog choice, package lines (product, size) |
| `PageHeader` | Eyebrow, title, description; actions right. On phones the actions sit under the text, fill the row and share it equally | Top of Photos, Share and Store |
| `Stat` | `11-SB` label, `20-M` value, `12-R` hint | Store summary strip |
| `Chip` | 36px pill. Inactive `surface-2` / `type-1`; active `primary`. Optional count in `type-3` | Category filters |
| `Tag` | 20px pill, `11-M`. Tones: muted, dark, success, warn | Hidden, Edited, Cover, New, badges |
| `Empty` | Dashed `rounded-2xl` box, 48px icon disc, title, one line, action (full width on phones) | Empty collections and lists |
| `IconButton` | 40px or 32px circle, `type-1`, `surface-2` on hover | Toolbar actions |
| `Menu` | `surface-1` card, `rounded-xl`, `border`, soft shadow, 36px items. On phones the items open in a bottom sheet titled with the menu's `label`: 48px rows, 20px icons, `16-R`, destructive items in red, dividers kept | Card ⋯, collection options, Move to |
| `PriceInput` | 36px field with a `$` / `+$` prefix, 104px wide; the border darkens to `type-2` when it differs from the original | Product sizes and options |

### Dashboard-specific patterns

- **Gallery card.** A 4:3 `rounded-2xl` cover (scales 3% on hover), a "Sample" `dark` tag top left, then title `14-M`, "date · N photos" `12-R type-2`, and the catalog with a storefront icon in `12-R type-3`. ⋯ on the right of the text. A gallery with no photos shows an image icon and "No photos yet" on `surface-2`. The **New gallery** card is the same size, dashed, with a 48px `+` disc.
- **Catalog card.** `rounded-2xl`, `border`, `surface-1`, 16–20px padding: name `16-M` with a "Main" `dark` tag, a counts line, four square product mockups on `surface-2`, then a `border-t` footer with the galleries using it and a "Customised" `success` tag.
- **Choice card** (Start with). A bordered `rounded-xl` button with an icon, `13-M` title and `12-R` line. Selected: `type-0` border and a 4px `black/5` ring (the same selected style as list rows); in New catalog the icon disc turns `primary`.
- **Gallery header.** Breadcrumb `12-R type-3` (Galleries › client) over the title `14-M` and "· N photos" in `type-3`. On Photos and Share it is its own bar spanning the content column, left of the step rail, with ⚙ `IconButton` and an outline **View** pill on the right (all widths). On Design there is no separate bar: the same breadcrumb and title take the left of the preview frame's toolbar, and a small (32px) ⚙ sits after Open. View is dropped there because Open already opens the client gallery.

- **Step rail.** An icon-only tab switcher docked on the right edge of the gallery workspace: 64px wide (56px on phones), `surface-1`, `border-l`, sticky under the top bar at full screen height. Photos (Images), Design (PaintBrush), Share (ShareNetwork) and Analytics (ChartBar) are stacked from the top, 44px `rounded-xl` tiles 8px apart with 20px icons. Inactive: `type-2`, hover `surface-2` + `type-0`. Active: a `primary` tile with a filled `primary-foreground` icon that slides between tabs (`layoutId`, 0.35s, app curve). Hover or keyboard focus shows a tooltip to the left (`type-0` `rounded-lg`, label `12-SB` white, hint `12-R white/60`, fades and nudges in over 0.2s); no tooltip on phones. No numbers or ticks: the steps are tabs, not progress.
- **Analytics** (`gallery/AnalyticsStep.jsx`, `max-w-[1200px]`). **Stat card:** `rounded-2xl`, `border`, `surface-1`, 16px padding (20px from `md`): a 36px `surface-2` icon disc, label `12-SB` uppercase `type-3`, value `24-M` tabular, hint `12-R type-2` (wraps on phones, truncates from 640px). Four in a row from 1024px, two below. **Download split:** the same card with an 8px bar (single photos `primary`, full gallery `type-3`, 2px gap) over two `surface-0` `rounded-xl` tiles, each with a 36px icon disc, a 8px colour dot + `13-M` label, "by N people" `12-R`, and the count `20-M` with "downloads" `11-R type-3`. **People list:** one bordered `rounded-2xl` box; from 1024px a grid table (header `11-SB` uppercase `type-3`; person, four counts, Spent, Last active, chevron), below that rows with a 36px initials avatar (`primary` for the client, else `surface-2`), email `14-M`, a `dark` "Client" tag, and a five-column count strip with 14px icons. Zero shows as a `type-3` dash. **Person dialog:** the dashboard `Modal`; `Chip` tabs with counts; photos in a 3-column (4 from 640px) grid of square `rounded-lg` thumbnails with name `11-M` and date `11-R type-3`; full gallery downloads and empty states on `surface-0` `rounded-xl`; orders as bordered `rounded-xl` cards with a header row and 40px item thumbnails.
- **Collection bar** (Photos). A sticky row of underline tabs on solid `surface-0` (no transparency or blur, so photos never show through) with a `border-b`; it scrolls sideways on phones. Tabs are 48px tall, `13-M`, 24px apart: inactive `type-2` (hover `type-0`), active `type-0` with a 2px `type-0` bottom stroke that slides between tabs (0.3s, app curve). Counts sit in `type-3`. **New collection** is a plain `type-2` text button with a folder-plus icon; while naming, the pill name field takes its place.
- **Collection header** (Photos, under the bar). `min-h-14`, `py-3`: title `16-SB`, `12-R type-2` summary, and on a collection a 40px ⋯ button. All photos and Removed keep an empty 40px slot there, so the header and the grid below don't jump when you switch tabs.
- **Photo tile.** Square, `rounded-none` (sharp corners, also when selected), `object-cover`. Selected: the photo insets to 90% with a check on `type-0`. Hover: a 10% black wash and the check outline. Tags sit top right. The drop position is a 4px `type-0` bar on the left edge.
- **Selection bar.** A floating `type-0` pill (max 720px), white text: clear ✕, count, Select all, then actions with icon and label (icon only on phones). It sits 20px from the bottom.
- **List row** (store). `rounded-2xl`, `border`, `surface-1`: drag handle, 56px thumbnail (`ProductImage` at 25%: a custom product's cover image, otherwise the store's own `ProductMockup`), title with tags, `12-R` meta, price block, chevron and switch. The open row gets a `type-0` border and a 4px `black/5` ring. Hidden rows grey out their thumbnail.
- **Custom product editor** (`store/CustomProductEditor.jsx`). Same `EditorPane` and `Section`s as the product editor, four tabs. List rows inside it use a compact 36px text field (`13-R`, `rounded-lg`, `border-input`, focus `type-0` border + 4px `black/5` ring), a 58px centred whole-number field for counts and inches, `PriceInput` for money, and a 36px round ✕ that fades to 30% when it can't be used. Each option is a `rounded-xl` bordered card, 12px padding: name field, a "Shown as" `Select`, then choice rows (a 36px colour disc for swatches, name, an 88px `+$` price, ✕; cards add a note field below). Images sit in a 3-column grid of square `rounded-xl` tiles, the first with a `primary` "Cover" pill; 28px round `surface-1/90` action buttons (★ make cover, ← →, ✕) along the bottom; a dashed **Add images** tile. The Look preview is a 112px-wide `ProductMockup`.
- **Part tabs** (Design, docked). Underline tabs at the top of the editor column, like the collection bar but in `12-SB` uppercase: 40px tall (10px from text to stroke), 24px apart, 20px side padding, no bottom border. Inactive `type-2` (hover `type-0`), active `type-0` with a 2px `type-0` stroke that slides between tabs (0.3s, app curve). Labels: Cover, Grid, Headings, Footer; the current setting is the tab's `title` tooltip.
- **Preview frame.** A 56px toolbar on `surface-1`: a pulsing success dot with "Live preview" label (or, when a `heading` is passed, that heading in its place, as the gallery editor does), a device `Segmented` (icons, not on phones), Reload, Open and any extra `actions` (32px `IconButton`s). Below it, a `surface-2` stage with the page on a `rounded-xl` card with a soft shadow and `ring-black/5`.

## Motion

Everything uses the app's curve, `[0.22, 1, 0.36, 1]`.
- The sidebar highlight (0.3s) and step indicator (0.35s) slide with `layoutId`. The phone drawer slides in 0.4s; modals fade and rise 12px (0.22s), or slide up as a sheet on phones (0.45s).
- Editor bodies crossfade 8px between tabs (0.2s), as in the gallery.
- The selection bar and menus fade and rise: 0.3s and 0.16s.
- Docked editors swap in place with no slide, because the column is always there. Sheets slide up as in the gallery (0.55s).
- Reordered rows lift slightly while dragged (scale 1.01 and a shadow).

## States and feedback

- **Toasts** (`notify`) confirm every action that isn't visible on screen: upload results, moves, removals, hiding a product, resets.
- **Confirmations** (`window.confirm`) only guard what can't be undone or touches a lot at once: deleting a gallery, catalog, package, a collection that has photos, or uploads for good; Reset photos, Reset portfolio, Reset catalog.
- **Warnings** use an amber inline note with a ⚠ icon, for example when a hidden product is still in a package.
- **Errors** are inline on the field (`TextField` `error`): email format and year.
