# Photographer Dashboard: Interactions

How each part of the dashboard behaves, step by step. Breakpoints: **phone** under 640px, **rail** 640–1023px, **full sidebar** from 1024px, **docked** editors from 960px (the store docks its editor from 1100px).

## Shell

| Action | Result |
|---|---|
| Open `/dashboard` | Redirects to Galleries. |
| Click a section in the sidebar | Goes to it. The highlight slides to it and its icon fills. Galleries and Store show their counts. |
| Hover the rail (640–1023px) | Each icon has a tooltip with its name. The rail shows no recent galleries. |
| Phone: tap ☰ in the top bar | The sidebar slides in from the left as a drawer over a dimmed page. Tapping the page, ✕ or any link closes it. |
| **New gallery** (top of the sidebar) | Opens the New gallery dialog from anywhere. |
| A recent gallery | Opens it (its Photos step). The open one is highlighted. "All N galleries" appears after five. |
| Profile at the bottom | Opens the portfolio in a new tab. |
| Any edit, anywhere | Saved immediately. It shows in the preview and in any open client tab without a reload. Only dialogs (new gallery, settings, new catalog, rename) have a Save or Create button. |

## Galleries

| Action | Result |
|---|---|
| Type in the search | Filters cards by title, client or date as you type. The New gallery card hides while searching; ✕ clears. No match shows an empty state with Clear search. |
| Click a card's photo or title | Opens the gallery editor at Photos. |
| Card ⋯ | Edit gallery, Settings, View as client (new tab, `/g/<id>`), Delete. Delete asks first, then removes it and toasts. It's disabled for the last gallery. |
| **New gallery** | Dialog: Gallery title (required; Create is disabled until it has text), Client name, Date, Print store catalog, and Start with **Empty** or **Sample photos**. Enter submits. Creating toasts "<title> created" and opens its Photos step. |

### Inside a gallery
- The header shows **Galleries › <client>** (the first part links back), the title and photo count, the three steps, then ⚙ and **View**. On phones ⚙ and View sit beside the title.
- ⚙ opens **Gallery settings**: the same fields as New gallery (no Start with), plus **Delete gallery** (asks first; disabled for the last gallery). Save toasts "Gallery updated". Changing the catalog changes what this gallery's clients can buy straight away.
- An unknown gallery id in the URL goes back to the list.

## Gallery: step bar

- Shows the gallery name, photo count and three steps. Every step is a link, so steps can be visited in any order; earlier steps show a tick.
- Browser Back and Forward move between steps, since the step is in the URL.

## Gallery: Photos

### Adding photos
1. **Add photos** opens the file picker (multiple files). Alternatively, drag files anywhere over the page: a full-screen overlay reads "Drop to add to <collection>".
2. Photos go to the open collection. From All or Removed, they go to the first collection.
3. While it works, the button shows a spinner and "Adding 3/12".
4. A toast reports the result: "Added 12 photos to Golden Hour", plus "· 2 skipped" for files that aren't readable images.
5. New photos appear at the end of the collection with a "New" tag.

### Collections
- The chip row is sticky under the top bar: **All photos**, each collection with its count, **New collection**, and **Removed** (only when something is removed). It scrolls sideways on phones.
- **New collection** turns into an inline name field. Enter or clicking away saves, Esc cancels, and an empty name does nothing. A duplicate name gets a number ("Details 2"). The new collection opens.
- Open a collection, then use **⋯** for **Rename** (inline field, same rules), **Add photos here**, **Move earlier** / **Move later**, or **Delete collection**.
- **Delete** asks first if the collection has photos ("Its 89 photos move to Golden Hour"), then shows All. It's disabled when only one collection is left.

### Selecting
| Input | Result |
|---|---|
| Click or tap a photo | Toggles it. The selection bar rises. |
| Shift-click | Selects the range from the last photo toggled. |
| Space / Enter on a focused photo | Toggles it. |
| ⌘/Ctrl+A | Selects everything in view (not while typing). |
| Esc, or ✕ on the bar | Clears the selection. |
| Switching collection | Clears the selection. |

Hovering a photo shows its check outline and, in All or Removed, its collection name.

### Selection bar actions
- **Move to ▾:** a menu of collections, opening upward; the current collection is disabled. Moves the photos to the end of that collection, toasts and clears the selection.
- **Make cover** (exactly one photo): sets it as the gallery cover. The Cover tag moves to it, and a toast confirms.
- **Remove:** takes the photos out of the client gallery and toasts "find them under Removed". Removing the current cover returns the cover to the default.
- In **Removed**: **Restore** puts them back, and **Delete** (only when every selected photo is an upload) asks for confirmation, then deletes them for good.

### Reordering (desktop)
- Inside a collection, drag a photo (or the whole selection, if the dragged photo is selected) onto another photo. A bar on that photo's left edge shows where they'll land, and dropping puts them before it.
- From any view, drop dragged photos onto a collection chip to move them there.
- Phones can't drag. Use Move to.

### Reset
- **Reset** (shown once something has changed) asks first, then restores every photo's original collection and order and clears removals. Uploads are kept.

## Gallery: Design

### Docked (960px and wider)
1. The left column lists **Cover**, **Grid**, **Collection headings** and **Footer**, each with its current setting.
2. Picking one replaces the list with that editor. The preview scrolls to that part:
   - Cover: the top of the page.
   - Grid: the grid.
   - Headings: the collection being edited.
   - Footer: the bottom, after loading the whole grid.
3. ✕, **Done** or Esc returns to the list.
4. **Photos** and **Next: Share** sit at the bottom of the list.

### Not docked
1. Chips for the four parts sit above a full-width preview. On phones the preview renders at the screen's own width with no device switch.
2. Tapping a chip opens its editor as a bottom sheet. **Preview** collapses the sheet to a bar so the whole preview shows, and **Edit** opens it again.
3. Headings open the gallery's own heading editor, which has its own heading-only preview stage.

### Editors
- **Cover, Collection headings, Footer** behave exactly as in the client gallery: same tabs, templates, limits and Reset all. See the app-wide [Interaction.md](../../Interaction.md).
- **Grid:** arrangement cards (Vertical masonry or Horizontal rows), Photo size (Small, Medium, Large) and Spacing (Airy, Thin, None). Reset all goes back to Vertical · Medium · Thin. A note explains that clients can still change their own view.
- In Headings, picking a collection in the Text tab scrolls the preview to that collection.

### Preview frame
- **Device switch:** Desktop (1280), Tablet (820) or Phone (390), scaled to fit. The page's own responsive layout applies.
- **Reload** reloads the iframe. **Open** opens the page in a new tab.
- The preview is a real page: it scrolls, and its links and buttons work. Its own edit buttons are hidden.

## Gallery: Share

- **Copy link** copies the client URL and toasts "Link copied", or "Couldn’t copy — select the link and copy it". **Open** opens the gallery.
- Each "Before you send" row links to the step that fixes it. A grey dot means "worth a look", not an error.
- The link is `/g/<id>` (the gallery's own link).
- The Portfolio card opens the Portfolio; the Print store card opens this gallery's catalog.

## Portfolio

### Docked
- The editor is always open on the left. Its tabs move the preview: Profile and Intro → the top of the page, Work → Selected work, Contact → the closing section.
- **Done** toasts "All changes are saved".

### Not docked
- Full-width preview with a floating **Edit portfolio** button, which opens the editor as a bottom sheet (with Preview / Edit and ✕).

### Tabs
- **Profile:**
  - Portrait: **Upload** (resized to 1200px, then toasts), **From your work** (a grid of portrait-orientation photos, 24 at a time, with Show more; picking one closes the grid), and **Use default** (only shown once changed).
  - Text fields show their default as a placeholder. Clearing a field returns it to the default.
  - Email shows an inline error when it isn't a valid address. "Since" accepts digits only and errors unless it's a year between 1901 and this year.
  - Specialities: remove with ✕ (disabled when only one is left), and add with the field plus Enter or **Add**. Duplicates are ignored.
- **Intro:** Headline (empty means "Hello! I’m <first name>."), Bio, the Buttons switch, the Facts strip switch, and one switch per fact. The fact switches dim while the strip is off.
- **Work:**
  - Section title.
  - Categories: rename inline, ↑/↓ to reorder, and a switch to hide one along with all its galleries.
  - Galleries: search, category chips, 20 at a time with Show more. Tap a title to rename it (Enter or clicking away saves, Esc cancels). The switch hides the gallery, greying its thumbnail and adding a "Hidden" tag.
- **Contact:** Heading (empty means the default), switches for Availability, Location and Instagram, and the header's Enquire button.
- **Reset all** asks first, then restores every portfolio default.

## Store: catalogs

| Action | Result |
|---|---|
| Click a catalog card | Opens it. |
| Card ⋯ | Edit catalog, Rename (dialog), Duplicate (opens New catalog as "A copy" of it, named "<name> copy"), Preview store (new tab, `/store?catalog=<id>`), Delete. |
| Delete | Asks first, saying how many galleries move to the Main catalog. Disabled for the Main catalog. |
| **New catalog** | Dialog: Name (required) and Start with **Everything**, **Nothing** or **A copy** (then a catalog select). Create toasts and opens it. |

## Store: one catalog

### Header
- **‹ Catalogs** goes back. The eyebrow says Main catalog or Catalog.
- Click the name to rename it inline: Enter or clicking away saves (and toasts), Esc cancels, empty keeps the old name.
- The description says which gallery sells from it (linked), or how many, with chips linking to each when there are several. With none: "No gallery uses this catalog yet".
- **Preview store** opens the print store using this catalog in a new tab. **Reset** (once edited) asks first and resets products and delivered packages; packages you built are kept.

### Lists
- The **Products / Packages** switch changes the list and closes the editor. With Packages, a **New package** button appears beside it.
- **Category chips** filter products. Reordering only works under **All**, and a hint says so.
- **Reorder:** drag a row by its ⋮⋮ handle (mouse or touch). The rest of the row stays clickable and scrollable. The new order is the client's shop order.
- **Visibility switch** on a row: hides or shows the product or package immediately and toasts ("Framed Print hidden from the store").
- **Click a row** to open its editor. The row gets a dark border. Docked, the editor fills the right column; otherwise it opens as a bottom sheet.
- **Reset store** (shown once anything has changed) asks first, then resets every product and package.

### Product editor
- **Details:** the Show in the store switch, then Name, Tagline and Badge (empty name or tagline means the original; an empty badge means no badge). If the product is hidden but sits in a package, an amber note names the packages.
- **Sizes / Options:**
  - Each choice has a price field and an offered switch. Typing updates prices across the store as you type.
  - A changed price shows "was $65 ↺"; clicking it restores the original. Clearing the field and leaving it also restores the original.
  - Switching off the last offered choice of an option is blocked, with a toast.
- **Reset product** restores the catalog values and toasts.

### Package editor
- **Details:** the Show in the store and Most popular switches, then Name and Tagline. **In this package** lists the contents with ⚠ on any product hidden from the store.
- **Packages you built** (tagged "Yours" in the list):
  - **New package** adds one with a single item (the first product on, at its smallest size), opens it and toasts.
  - Name and Tagline are its own (no original to fall back to).
  - **In this package** is editable. Each line has a Product select (hidden products are marked), a ✕, a Size select, a −/+ quantity (1–50; books show "1 book") and the line's price. Changing the product resets the size to its first. **Add a product** adds a line, up to 6.
  - With no lines, the package is tagged "Empty" and hidden from the store.
  - **Delete package** (Details) asks first, closes the editor and toasts.
- **Pricing:** the Discount slider (0–40%) with live figures for Separately, Package and Client saves. The package price is rounded to $5 and also follows the product prices.
- **Reset package** restores the catalog values.

## Keyboard summary

| Key | Where | Does |
|---|---|---|
| Esc | Photos | Clears the selection; cancels a name field. |
| Esc | Any editor | Closes it (docked: back to the Design list). |
| ⌘/Ctrl+A | Photos | Selects everything in view. |
| Shift-click | Photos | Selects a range. |
| Space / Enter | Photo tile | Toggles selection. |
| Arrow keys | Cover focal point (Photo tab) | Moves the point; Shift moves it further (as in the gallery). |
