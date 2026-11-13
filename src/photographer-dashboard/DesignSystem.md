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
| Sidebar | From 1024px: 248px, sticky full height, `surface-1`, `border-r`. 64px logo row with a `11-SB` "Studio" eyebrow; a full-width `primary` **New gallery** pill (40px); nav rows (40px, `rounded-lg`, `13-M`, icon 18px, count in `12-R type-3`) with the active row on a sliding `surface-2` highlight; "Recent galleries" (`11-SB` eyebrow, 40px rows with a 28px `rounded-md` cover thumbnail); profile at the bottom above a `border-t` (32px initials disc, name `13-M`, "View portfolio" `12-R type-3`). |
| Rail | 640–1023px: the same sidebar at 72px, icons only, the logo cropped to its mark, a 40px round New gallery button, tooltips on hover, no recent galleries. |
| Phone bar + drawer | Under 640px: a 56px sticky top bar (`surface-0/90`, blur) with ☰, the logo and the section name. ☰ opens the full sidebar as a drawer, `min(300px, 86vw)`, sliding from the left (0.4s) over a `black/40` scrim. |
| Workspace | Design and Portfolio fill the screen (`100svh`, minus the 56px bar on phones): a docked editor column (380px, 400px from `xl`) on `surface-1` with a `border-r`, and the preview filling the rest on `surface-2`. |
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

- `EditorPane` is the shell for every editor: header, pill tabs, crossfading body, and Reset / Done footer. It's now also `inline`, with a `resetLabel`.
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
| `Chip` | 36px pill. Inactive `surface-2` / `type-1`; active `primary`. Optional count in `type-3` | Collection and category filters |
| `Tag` | 20px pill, `11-M`. Tones: muted, dark, success, warn | Hidden, Edited, Cover, New, badges |
| `Empty` | Dashed `rounded-2xl` box, 48px icon disc, title, one line, action (full width on phones) | Empty collections and lists |
| `IconButton` | 40px or 32px circle, `type-1`, `surface-2` on hover | Toolbar actions |
| `Menu` | `surface-1` card, `rounded-xl`, `border`, soft shadow, 36px items. On phones the items open in a bottom sheet titled with the menu's `label`: 48px rows, 20px icons, `16-R`, destructive items in red, dividers kept | Card ⋯, collection options, Move to |
| `PriceInput` | 36px field with a `$` / `+$` prefix, 104px wide; the border darkens to `type-2` when it differs from the original | Product sizes and options |

### Dashboard-specific patterns

- **Gallery card.** A 4:3 `rounded-2xl` cover (scales 3% on hover), a "Sample" `dark` tag top left, then title `14-M`, "date · N photos" `12-R type-2`, and the catalog with a storefront icon in `12-R type-3`. ⋯ on the right of the text. A gallery with no photos shows an image icon and "No photos yet" on `surface-2`. The **New gallery** card is the same size, dashed, with a 48px `+` disc.
- **Catalog card.** `rounded-2xl`, `border`, `surface-1`, 16–20px padding: name `16-M` with a "Main" `dark` tag, a counts line, four square product mockups on `surface-2`, then a `border-t` footer with the galleries using it and a "Customised" `success` tag.
- **Choice card** (Start with). A bordered `rounded-xl` button with an icon, `13-M` title and `12-R` line. Selected: `type-0` border and a 4px `black/5` ring (the same selected style as list rows); in New catalog the icon disc turns `primary`.
- **Gallery header.** Breadcrumb `12-R type-3` (Galleries › client) over the title `14-M`, the step bar centred, ⚙ `IconButton` and an outline **View** pill on the right.

- **Step bar.** Numbered 28px discs: the current step is `primary`, done steps show a tick on `type-0/10`, and a hairline connects them. The active step sits on a `surface-2` pill that slides between steps (`layoutId`).
- **Collection bar** (Photos). A sticky row of chips on solid `surface-0` (no transparency or blur, so photos never show through) with a `border-b`; it scrolls sideways on phones.
- **Photo tile.** Square, `rounded-lg`, `object-cover`. Selected: the photo insets to 90% with a check on `type-0`. Hover: a 10% black wash and the check outline. Tags sit top right. The drop position is a 4px `type-0` bar on the left edge.
- **Selection bar.** A floating `type-0` pill (max 720px), white text: clear ✕, count, Select all, then actions with icon and label (icon only on phones). It sits 20px from the bottom.
- **List row** (store). `rounded-2xl`, `border`, `surface-1`: drag handle, 56px thumbnail (the store's own `ProductMockup` at 25%), title with tags, `12-R` meta, price block, chevron and switch. The open row gets a `type-0` border and a 4px `black/5` ring. Hidden rows grey out their thumbnail.
- **Part card** (Design overview). 56px thumbnail or icon tile, a `01`–`04` index eyebrow, title and current setting, and a chevron that nudges right on hover.
- **Preview frame.** A 56px toolbar on `surface-1`: a pulsing success dot with "Live preview" label, a device `Segmented` (icons), Reload and Open. Below it, a `surface-2` stage with the page on a `rounded-xl` card with a soft shadow and `ring-black/5`.

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
