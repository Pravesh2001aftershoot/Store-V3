# Photographer Dashboard: Interactions

How each part of the dashboard behaves, step by step. On phones, every ⋯ menu, **Move to** and select opens as a bottom sheet (drag down, tap outside, ✕ or Esc to close; picking an option closes it), and action buttons span the full width.

Breakpoints: **phone** under 640px, **rail** 640–1023px, **full sidebar** from 1024px, **docked** editors from 960px (the store docks its editor from 1100px).

## Shell

| Action | Result |
|---|---|
| Open `/dashboard` | Redirects to Galleries. |
| Click a section in the sidebar | Goes to it. The highlight slides to it and its icon fills. Galleries and Store show their counts. |
| Open a gallery (640px and up) | The sidebar is hidden while you're inside the gallery; the editor fills the width. The rail's Back goes back to the list and brings the sidebar back. On phones the top bar and ☰ stay. |
| Hover the rail (640–1023px) | Each icon has a tooltip with its name. The rail shows no recent galleries. |
| Phone: tap ☰ in the top bar | The sidebar slides in from the left as a drawer over a dimmed page. Tapping the page, ✕ or any link closes it. |
| A recent gallery | Opens it (its Photos step). The open one is highlighted. "All N galleries" appears after five. |
| Profile at the bottom | Opens the portfolio in a new tab. |
| Any edit, anywhere | Saved immediately. It shows in the preview and in any open client tab without a reload. Only dialogs (new gallery, settings, new catalog, rename) have a Save or Create button. |

## Galleries

| Action | Result |
|---|---|
| Type in the search | Filters cards by title, client or date as you type. The New gallery card hides while searching; ✕ clears. No match shows an empty state with Clear search. |
| Click a card's photo or title | Opens the gallery editor at Photos. |
| Card ⋯ | Edit gallery, Settings, View as client (new tab, `/g/<id>`), **Publish** (a draft; toasts "Gallery published. You can share it now" the first time, "Gallery published" after) or **Move to draft** (published; toasts "Moved to draft. Your links and QR codes stay the same"), Delete. The card's tag follows: Draft or green Published. Delete asks first, then removes it and toasts. It's disabled for the last gallery. |
| **New gallery** | Dialog: Gallery title (required; Create is disabled until it has text), Client name, Date, Print store catalog, and Start with **Empty** or **Sample photos**. Enter submits. Creating toasts "<title> created" and opens its Photos step. On phones the button is the full-width bar fixed to the bottom of the screen (`BottomCTA`); the header button and the dashed New gallery card are hidden. On phones every dialog's footer stacks its actions full width with the primary (Create gallery, Save, Add…) on top and Cancel below. |

### Inside a gallery
- Photos, Settings, Share and Analytics have no gallery header bar; each step starts with its own content. Back and the steps are in the rail on the left edge.
- On **Design** the preview's toolbar shows **Galleries › <client>** (the first part links back) over the title and photo count on the left, then the device switch, Reload, Open, the **publish control** and, from 960px, the panel toggle. Never published: a small dark **Publish** button that publishes straight away (toast "Gallery published. You can share it now") and turns into the status pill. After that, the pill (green dot **Published** or grey dot **Draft**, ▾) opens a menu (a bottom sheet on phones) with **Move to draft** or **Publish**, with the same toasts as the card menu. **Open** opens the client gallery in a new tab.
- A gallery's title, client, date, catalog and Delete are edited in Design's **Gallery info** part. The **Gallery settings** modal (same fields, Save toasts "Gallery updated") opens from the gallery card's menu on the Galleries grid.
- An unknown gallery id in the URL goes back to the list.

## Gallery: step rail

- A vertical, icon-only rail on the left edge: **Back**, a divider, then the tabs **Photos**, **Design**, **Settings**, **Share**, **Analytics**. **Back** (tooltip "Back · All galleries") goes to the Galleries grid (`/dashboard/galleries`). Every tab is a link, so steps can be visited in any order; there is no progress or ticks.
- The rail stays in view while the page scrolls. Hovering or focusing a tab shows its name and hint ("Add and arrange", "Cover, grid, headings, footer", "Access, engagement, privacy", "Send to your client", "Visitors, downloads, revenue") to the right; on phones the icons carry `aria-label`s only.
- Browser Back and Forward move between steps, since the step is in the URL.

## Gallery: image panel

- On Design, the toggle at the left of the preview toolbar (SidebarSimple, "Show images panel" / "Hide images panel") opens or closes the panel beside the step rail. Leaving Design closes it.
- **Album name** at the top: click it (pencil on hover, always shown on phones) to rename the gallery; Enter or clicking away saves, Esc cancels, empty keeps the old name. A **Draft** tag sits beside it (static for now).
- **Images / Videos** tabs. Videos shows "No videos in this gallery yet." **Full view** (CornersOut) closes the panel and opens the Photos step.
- Each set is a row: caret collapses or expands it (collapsing is not saved), name and count, **+** picks files to add to that set (toast "Added N photos to <set>"), **⋯** opens Rename (inline field, Enter / blur saves, Esc cancels; a taken name toasts "There’s already a set called “…”") and Delete set (confirms if it has photos, which move to another set; disabled for the last set).
- Hovering or focusing a photo darkens it and shows its file name, a **⋮** menu (Move to <each other set>, Remove from gallery) and **Set as cover** (toast "Cover photo updated"). The cover photo shows a Cover tag instead.
- **Selecting.** Each photo has a round check at its top left (on hover / focus; always shown on touch screens). Clicking the check, ⌘/Ctrl-clicking the photo, or Space / Enter on a focused photo toggles it; Shift-click selects the range from the last toggled photo within the same set. Once anything is selected, every photo shows its check, the hover actions hide, and a click anywhere on a photo toggles it. Esc (when not typing) clears. Selection isn't saved and drops photos that leave the gallery.
- While photos are selected the footer becomes the selection bar: "N selected", **Select all** (hidden when all are selected), ✕ (clear), then **Move to** (menu of sets, opening upward; a sheet on phones; a set is disabled when every selected photo is already in it; toast "Moved N photos to <set>") and **Remove** (toast "N photos removed from the gallery — find them under Removed in Photos"; clears the cover if it was selected). Both clear the selection.
- **Rearranging** (not on phones). Drag a photo onto another: a bar on the left or right edge shows where it lands, before or after it. Dragging a selected photo moves the whole selection, keeping its order. Dropping into another set's photos, or onto a set's header row (outlined while hovered), moves them there (the header puts them at the end) and toasts "Moved N photos to <set>". ⌥/Alt + ← / → on a focused photo moves it (or the selected photos in its set) one place within its set. Dragged photos fade to 40% while dragging.
- **+ New Set** (full width, pinned at the bottom) creates "New set" and opens its name field. It's replaced by the selection bar while photos are selected.
- On Design, from 960px wide, a second rail appears on the right edge (the **parts rail**) with **Gallery info** (ⓘ) first, a divider, then the four looks: **Cover**, **Grid**, **Collection headings** and **Footer**. Clicking a part opens its editor in the docked column beside it; the open one is highlighted. Hovering a part shows its name and current setting (for example "Template: Full bleed" or "Vertical · Medium · Thin") to the left. The parts rail slides in when you enter Design and out when you leave (0.3s). Below 960px there's no parts rail; the parts are chips above the preview.

## Gallery: Photos

### Adding photos
1. **Add Images** (secondary button in the page header; on phones the lower button in the bottom CTA bar) opens the file picker (multiple files). Alternatively, drag files anywhere over the page: a full-screen overlay reads "Drop to add to <collection>".
2. Photos go to the open collection. From All or Removed, they go to the first collection.
3. While it works, the button shows a spinner and "Adding 3/12".
4. A toast reports the result: "Added 12 photos to Golden Hour", plus "· 2 skipped" for files that aren't readable images.
5. New photos appear at the end of the collection with a "New" tag.

### Collections
- The collection tab row sticks to the top of the page as you scroll (under the 56px bar on phones): **All photos**, each collection with its count, **New Set**, and **Removed** (only when something is removed). It scrolls sideways on phones.
- **Create Set** (primary button in the page header; on phones the upper button in the bottom CTA bar, which hides while photos are selected so the selection bar can take its place) and **New Set** in the tab row both turn into an inline name field at the end of the tabs. Enter or clicking away saves, Esc cancels, and an empty name does nothing. A duplicate name gets a number ("Details 2"). The new collection opens.
- Open a collection, then use **⋯** for **Rename** (inline field, same rules), **Add photos here**, **Move earlier** / **Move later**, or **Delete collection**.
- **Delete** asks first if the collection has photos ("Its 89 photos move to Golden Hour"), then shows All. It's disabled when only one collection is left.

### Searching
- The search field ("Search by file name") sits right of the collection title (full width under it on phones). It filters the open view (All photos, a collection or Removed) by file name as you type: case-insensitive and anywhere in the name, so "2047" finds `LT_2047.jpg`. The subtitle reads "3 photos matching “2047”".
- The search stays when you switch collections. **/** jumps to it (not while typing). Esc clears it, and a second Esc leaves the field. ✕ also clears it.
- Selecting, ⌘/Ctrl+A and the selection bar work on the matches only. Dragging matches onto a collection tab still moves them, but reordering is paused while searching (the order would be ambiguous). ⌥/Alt+arrows toast "Clear the search to reorder".
- No matches: "No photos match “2047”" with **Clear search**.

### Selecting
| Input | Result |
|---|---|
| Click or tap a photo | Toggles it. The selection bar rises. |
| Shift-click | Selects the range from the last photo toggled. |
| Space / Enter on a focused photo | Toggles it. |
| Arrow keys on a focused photo | Move focus: ←/→ one photo, ↑/↓ to the photo in the row above or below whose centre is nearest (rows are justified, so they hold different numbers of photos). Home/End go to the first or last photo. |
| ⌘/Ctrl+A | Selects everything in view (not while typing). |
| Esc, or ✕ on the bar | Clears the selection. |
| Switching collection | Clears the selection. |

Hovering a photo shows its check outline and, in All or Removed, its collection name.

### Selection bar actions
- **Move to ▾:** a menu of collections, opening upward (a bottom sheet on phones); the current collection is disabled. Moves the photos to the end of that collection, toasts and clears the selection.
- **Make cover** (exactly one photo): sets it as the gallery cover. The Cover tag moves to it, and a toast confirms.
- **Remove:** takes the photos out of the client gallery and toasts "find them under Removed". Removing the current cover returns the cover to the default.
- In **Removed**: **Restore** puts them back, and **Delete** (only when every selected photo is an upload) asks for confirmation, then deletes them for good.

### Reordering
- **Drag (desktop):** drag a photo (or the whole selection, if the dragged photo is selected) onto another photo. The dragged photos fade to 40%. A 4px bar on the left or right edge of the photo under the pointer shows whether they'll land before or after it; dropping puts them there, and the grid slides into the new order (0.3s, app curve).
- Works in a collection and in **All photos**. In All, dropping on a photo in another collection moves the dragged photos into that collection at that spot and toasts "Moved 2 photos to Details".
- From any view, drop dragged photos onto a collection tab to move them to the end of it.
- **Keyboard:** on a focused photo, ⌥/Alt + ←/→ moves it one place, ⌥/Alt + ↑/↓ to the matching spot in the row above or below, and ⌥/Alt + Home/End to the start or end of its collection. If the photo is selected, the selected photos in that collection move together. Focus stays on the photo, and screen readers hear "Photo moved to position 4 of 20 in Golden Hour" (or "already first"). Moves stay inside the photo's own collection.
- Not available in Removed or while searching. Phones can't drag; use Move to.

## Gallery: Design

### Docked (960px and wider)
1. The five parts (Gallery info, then Cover, Grid, Collection headings, Footer) are in the parts rail on the right edge (see Step rail). The column on the right of the preview holds only the open editor.
2. One editor is always open, Cover to start. Clicking a part in the parts rail swaps the editor and the preview scrolls to that part:
   - Gallery info and Cover: the top of the page.
   - Grid: the grid.
   - Headings: the collection being edited.
   - Footer: the bottom, after loading the whole grid.
3. Docked editors have no ✕ or **Done**, and Esc does nothing; **Reset all** stays in the footer. Steps are switched in the left rail, parts in the right rail.
4. The open part is in the URL (`?part=grid`), so it can be linked to and survives a reload. Switching parts replaces the history entry, so Back leaves the step instead of walking through parts.
5. The last button in the preview toolbar ("Hide editor panel" / "Show editor panel", a right-hand sidebar icon, filled while the panel shows) collapses the editor column so the preview takes its width, and expands it again (0.3s, app curve). The parts rail stays. Clicking a different part in the rail shows the panel again with that editor. Hidden isn't remembered: it's shown again when you come back to Design.

### Not docked
1. Chips for the five parts (Gallery info first) sit above a full-width preview. On phones the preview renders at the screen's own width with no device switch.
2. Tapping a chip opens its editor as a bottom sheet. **Preview** collapses the sheet to a bar so the whole preview shows, and **Edit** opens it again.
3. Headings open the gallery's own heading editor, which has its own heading-only preview stage.

### Gallery info
1. The pane (title "Gallery info", no subtitle) has three sections: **Details** (Gallery title, Client name, Date — same limits, placeholders and hints as the Gallery settings modal), **Print store** (catalog select) and **Delete gallery**.
2. Changes save as you type, with no Save button or toast, like the other editors. An empty title shows "Required — the last title is kept" and isn't saved; an empty client name uses the title; an empty date keeps the last date.
3. **Delete gallery** asks first, then deletes, toasts "<title> deleted" and goes to the Galleries grid. Disabled when it's the last gallery ("You need at least one gallery.").
4. There's no Reset all. The same fields are also in the Gallery settings modal, opened from the gallery card's menu.

### Editors
- **Cover, Collection headings, Footer** behave exactly as in the client gallery: same tabs, templates, limits and Reset all. See the app-wide [Interaction.md](../../Interaction.md).
- **Grid:** arrangement cards (Vertical masonry or Horizontal rows), Photo size (Small, Medium, Large) and Spacing (Airy, Thin, None). Reset all goes back to Vertical · Medium · Thin. A note explains that clients can still change their own view.
- In Headings, picking a collection in the Text tab scrolls the preview to that collection.

### Preview frame
- **Device switch:** Desktop (1280), Tablet (820) or Phone (390), scaled to fit. The page's own responsive layout applies.
- **Reload** reloads the iframe. **Open** opens the page in a new tab.
- The preview is a real page: it scrolls, and its links and buttons work. Its own edit buttons are hidden.

## Gallery: Settings

### Who can open it
- **Anyone with the link** / **By role** switch the access type; the hint under it explains the choice.
- By role: **Client**, **Guest** and **Vendor** chips. ✕ removes a role (disabled at 2, with the tooltip "Role-based access needs at least 2 roles"); a grey **+ Vendor** chip adds it, switches to it and toasts "Vendor role added".
- **One link for all roles** (checked by default) shows one link; unchecked shows one per role (`…/g/<id>?role=client`). The note under it changes with the choice.
- Each link: the copy button toasts "Link copied" (or "Couldn’t copy — select the link and copy it"). **Expires** is a date (today or later); empty reads "never".

### Settings list
- By role, a switch above the list picks whose settings you're editing (**Clients**, **Guests**, …), with "Showing what clients can do." under it.
- **Search settings** filters by name and opens every group; nothing matching shows "No settings match “…”."
- Group headers (**Access**, **Engagement**, **Privacy**) collapse and expand (0.3s) and show "N of M on".
- A switch turns a setting on and reveals its options. Turning **Downloads** on also ticks Photo and Video downloads (and Web size if no size is picked); turning **Sharing** on ticks Photo and Video sharing.
- Locked settings show on with a disabled switch and the reason under the description: Password protection ("Required with one link for all roles. Switch to Approved clients only to make it optional.") and Filter by face ("Included with Face scan sign-in → Whole gallery.").
- By role, **How clients sign in** replaces Collect email: **Collect email on sign-up** or **Approved clients only**. Approved shows the list (initials, name, email · phone, ✕ to remove) and **Add client**, which opens a dialog (Name, Email, Phone optional; Add needs a name and a valid email; Enter submits) and toasts "<name> added". An empty list says nobody can open the link in that role yet.
- Password: digits only, 4 max ("4 digits"); under 4 shows "Enter 4 digits to save." in amber.
- Download PIN: ticking **Require a download PIN** makes a random 4-digit PIN; copy toasts "Download PIN copied", ↻ makes a new one and toasts "New download PIN made".
- **Personal use only** (under the PIN, unticked by default): ticking it marks the settings unsaved like any other change. Once saved, a visitor's first single-photo download in the client gallery asks them to agree to personal, non-commercial use (with a link to email you for commercial use); unticking it stops asking.
- Photo download sizes are toggle chips; with none picked, "Pick at least one size." Limits take whole numbers up to 99999; empty is "No limit".
- With **Web size** picked: a **Web size** `Select` (1,200px / 2,048px long edge; a bottom sheet on phones) and **Watermark web-size downloads**. With **High res** picked and Digital Download shown in this gallery's store catalog: a **High res** radio pair, **Paid · from $9 a photo** (default; "Sold as Digital Download in your store (3 file sizes), or $199 for the whole gallery. Visitors download it free once bought. Change prices in Store.") and **Free** ("Anyone with downloads can save the original file."). Without Digital Download in the catalog: "High res downloads are free. To charge for them, show Digital Download in this gallery's store catalog (Store)." Both follow the catalog picked in Gallery info. While selling, the Download limit hint reads "Most free photos each visitor can download. Bought photos don't count."
- Set visibility lists the gallery's sets as checkboxes (ticked = shown). With no sets: "No sets yet. Add them in Photos."

### Saving
- Any change brings up the bar at the bottom: "Unsaved changes", **Dismiss** (back to the saved settings) and **Save** (toasts "Settings saved"). When it can't save, the bar shows why instead ("Add at least 2 roles to save", "Enter a 4-digit password for Guests", "Pick at least one image size") and Save is disabled.
- Closing or reloading the tab with unsaved changes asks first. Switching steps doesn't (see Architecture's known gaps).
- On phones it's the bar fixed to the bottom of the screen: the status line, then **Save** over **Dismiss**, both full width.

## Gallery: Share

- **Never published:** the step is an empty state, "Publish your gallery to share it", with **Publish gallery** (in the empty state on tablet and desktop, in the bottom CTA bar on phones). Clicking it publishes, toasts "Gallery published. You can share it now" and swaps in the Share your gallery card on the Links tab.
- **Published, then moved back to draft:** everything below still works with the same links and codes. A note above the card says "This gallery is in draft. …"; **Publish again** publishes and the note goes away (toast "Gallery published").
- The page is one column at every width: the **Share your gallery** card (no page title). (The email history is hidden for now.) The card opens on its **Links** tab: the gallery's cover on the left (on top on phones), every link with its codes beside it.
- The access line at the bottom of the Links tab sums up Settings ("By role · Clients, Guests · one link") and **Settings →** opens that step.
- Each link shows "Expires on 1 Mar 2027" or "Never expires" beside its name. The copy icon inside the link pill copies it (toasts "Link copied"); the round ↗ button next to it opens it in a new tab. Each password and download PIN has a copy button ("Password copied", "Download PIN copied"). A failed copy toasts "Couldn’t copy — select it and copy it yourself".
- The link is `/g/<id>`, or `/g/<id>?role=<role>` when each role has its own.

### Share your gallery card
- The **Links / Email / QR code** switch in the card's header changes what the card shows; it starts on Links. There's one email and one QR card for everyone; no audience switch.
- **To:** with roles, each role on an approved list with people on it gets an **Add approved clients (2)** checkbox under the field, ticked to start. Ticked, the group shows in the field as one chip ("Approved clients · 2", hover lists the addresses); unticking it, or ✕ on the chip, takes those addresses out. Typing an address then Enter, comma or space (or leaving the field) adds it ("Press Enter or comma after each address."); Backspace in an empty field removes the last typed chip; ✕ removes one. An address in both a group and the typed list is sent once. Invalid addresses stay in the field and toast "“…” isn’t an email address".
- **Template:** a picker above Subject (a bottom sheet on phones) lists the built-in templates, Gallery ready, Pick your favourites, Gallery expiring soon and Thank you, then **Your templates** (the photographer's saved ones, shared by every gallery). Picking one replaces Subject and Message with its wording; if the wording had been edited it toasts "“Thank you” applied" with **Undo**.
  - Once Subject or Message differs from the picked template, "Changed from “Gallery ready”" shows under the picker with **Reset** (back to the template's wording) and, for a saved template, **Save changes** (toasts "“Wedding delivery” updated"; other galleries that use it now show it as changed if their wording differs).
  - **Save as new template** (always shown) opens a "Save as template" dialog (a bottom sheet on phones) with a Name field (0/40, placeholder "Wedding delivery"). A name already used shows "You already have a template with this name" and disables **Save template**. Saving adds it to Your templates, selects it and toasts "Saved “Wedding delivery” to your templates". With 20 saved it toasts "You can save up to 20 templates. Delete one first" instead.
  - With an unedited saved template picked, **Delete template** removes it from every gallery's picker, keeps the current wording, switches the picker to Gallery ready and toasts "“Wedding delivery” deleted" with **Undo**. Built-in templates can't be edited or deleted.
- **Subject** (0/120) and **Message** (0/1000) show the default wording as placeholder; empty uses it ("Empty uses the text shown. Type { to add a variable."). The default message ends with the sign-off ("Enjoy!" and the photographer's name); there's no separate Sign-off field. The included details follow the message in the email. Edits save as you type. Subject stays on one line (Enter does nothing); Message grows with its text.
- **Variables:** Gallery name `{gallery_name}`, Client name `{client_name}`, Client email `{client_email}` (the first address in To) and Expiry date `{expiry_date}` (the shared link's date, or the soonest role date when each role has its own link). `${Gallery_name}`, `{Gallery name}` and any case read the same.
  - Typing `{` (or `${`) opens suggestions under the caret, each with its label and what it fills in ("Nothing to fill yet" when empty). Typing narrows them; ↑ ↓ move, Enter or Tab inserts, Esc or clicking away closes. On phones they show as a chip row under the field instead; tap one to insert.
  - **+ Variable** beside the count opens a menu of all four (a bottom sheet titled "Insert a variable" on phones) and inserts at the caret.
  - Known variables get a green tint in the field; anything else in braces gets a wavy red underline and "{foo} isn’t a variable. Try {gallery_name}, …". A variable with nothing to fill it (no recipient, no expiry) shows in amber: "Client email is empty for this email, so it’ll be left blank."
  - The preview and the sent email use the filled-in text; unknown variables are left as typed.
- **Include** lists only what exists: Gallery link, Password (1357), Download PIN (2468), Expiry date (1 March 2027). With roles they read Passwords, Download PINs and Expiry dates (or Expiry date with one link) and cover every role. Unticking a needed password shows "They’ll need the password to open the gallery. Send it another way." in amber. No codes at all: "No password or download PIN. Add them in Settings."
- The preview updates as you type. **Send** (at the end of the form, under Include; on phones the bar fixed to the bottom of the screen while the Email tab is open) toasts "Email sent to 3 people". With nobody in To it toasts "Add someone to send it to"; with an address still being typed, "Add or clear the address you’re typing first". Nothing is actually sent in the prototype.
- **QR code:** the tip comes first; ✕ closes it until the page reloads. Then one tile per QR card, side by side: one for the gallery link, or with a link per role one per role. Each row shows the code, its label, "Scan to open the gallery" and what's printed under it, plus a download button that saves the PNG and toasts "QR card downloaded" (with a link per role, "Clients QR card downloaded"). Copy links from the links card on the left. Passwords are always printed under the code. **Print the download PIN (2468) under the code** (with roles, **Print download PINs under the code**) only shows when there's a download PIN. It's off by default and applies to every card. A role's own card prints only its codes ("Password 1357"); the one card for a shared role link prints a line per role ("Guests · Password 1357"), then "Choose Client or Guest when it opens".

### Email history (hidden for now)
- It's an accordion, **closed** when the page opens (and after a reload). Clicking the "Email History" header (or Enter / Space on it) opens or closes it; the caret turns from right to down and the body grows or shrinks in height (0.3s, app curve).
- Every **Send** adds a row at the top: the first recipient ("lexie@example.com + 2 more") over the date and time ("19 / 11 / 2026 • 5:20 PM"). It's saved per gallery, so it's there after a reload. Rows don't open or do anything when clicked.
- Four rows show; with more, the list scrolls inside the card. Only the latest 50 are kept.
- **+ n more**: hovering or focusing it shows a dark tooltip with "Sent to 3 people" and every address, one per line; it hides on mouse leave or blur. On touch, tapping toggles it. Scrolling, resizing, Escape or a tap elsewhere closes it. It opens above the link, or below when there's under 200px of room above.
- Empty state (open, nothing sent): an envelope icon, "No emails sent yet" and "When you send the gallery by email, who it went to and when shows here." QR downloads aren't recorded.

## Gallery: Analytics

- **Export CSV** downloads `<gallery id>-analytics.csv` with the people currently listed (search and sort apply) and toasts "Exported N people".
- The search field ("Search people") filters by email or name as you type; ✕ clears it. No match shows "No one matches “<text>”" with **Clear search**.
- **Sort** (Most recent, Most downloads, Most favourites, Most shares, Highest spend) is a native select on tablet and desktop and a bottom sheet on phones.
- From 1024px people are a table; below that each person is a card with the counts under the name. A dash means none. Clicking a row or card opens the person.
- **Person dialog** (centred card; bottom sheet on phones): the email as title, then name, visits, first visit, last active and amount spent. Chips switch between Downloads, Favourites, Shares, Comments and Orders, each with its count; it opens on the first kind that has activity. Chips wrap on tablet and desktop and scroll sideways on phones. An empty kind shows "No downloads" / "No favourites" / "No shares" / "No comments" / "No orders". **Copy email** toasts "Email copied" (or "Couldn’t copy the email"); **Email** opens a mail draft. ✕, Esc or the overlay closes it.
- A gallery with no photos shows "No activity yet" with **Add photos**, which opens the Photos step.

## Portfolio

The editor has four parts (Profile, Intro, Work, Contact), picked like the gallery's Design parts rather than with tabs. The open part is `?part=` in the URL (Profile when docked and none is given). Picking a part moves the preview: Profile and Intro → the top of the page, Work → Selected work, Contact → the closing section. The editor is titled "Customize profile" / "Customize intro" / "Customize work" / "Customize contact".

### Docked
- A parts rail on the far right: one 44px icon per part (Profile, Intro, Work, Contact). Hovering or focusing an icon shows its name and hint in a tooltip to the left; the active one gets a sliding `surface-2` highlight and a filled icon.
- The editor for the picked part is always open between the preview and the rail; it has no ✕ or Done.
- The preview toolbar's last button hides or shows the editor column; picking a part shows it again.

### Not docked
- Part chips above a full-width preview. Picking one opens its editor as a bottom sheet (with Preview / Edit and ✕); ✕ or Done closes it and clears the active chip.

### Parts
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

## Website

The photographer's one-page website (`/site`), edited like a gallery's Design step.

### Docked (960px and wider)
1. The sidebar stays. The preview fills the middle, the open editor sits on its right, and the parts rail is on the far right: Site settings, a divider, then Hero, About and the movable sections in their current page order, then Contact.
2. One editor is always open, Hero to start. Clicking a part swaps the editor and the preview scrolls to it (Site settings and Hero: the top; the others: their section). A hidden section's icon is dimmed with an amber dot; its tooltip says "Hidden from your website".
3. The part is in the URL (`?part=pricing`), replacing the history entry. Docked editors have no ✕ or **Done**; the footer has **Reset section** (Site settings: **Reset website**).
4. The toolbar's last button hides or shows the editor column; picking a part shows it again.

### Not docked
- Chips for the seven parts above a full-width preview (hidden sections dimmed). Tapping one opens its editor as a bottom sheet with Preview / Edit, ✕ and **Done**; on phones Done stacks over Reset, both full width.

### Editors
- Every section starts with **Show on website**. Off: the section leaves the page and the header links, the box turns amber ("Hidden — your edits are kept"), and the edits stay.
- Text fields show their default as the placeholder with "Leave empty to use the default"; clearing one returns to the default. Limits are enforced as you type.
- **Site settings:** Site title, Footer, Enquire button switch. In **Sections**, tapping a name opens that part; ↑ / ↓ move About, Portfolio, Pricing and FAQ (disabled at the ends); Hero shows "First" and Contact "Last". The switch shows or hides the section. A note links to Portfolio for name, email, location and Instagram.
- **Hero:** Full-bleed or Split card; Headline, Subline; Button with its own switch (off dims the field). **Change photo** opens a grid of landscape portfolio photos (Show more adds 24); picking one closes it. **Use newest gallery** appears once a photo is picked.
- **About:** Heading, Your story (empty uses the portfolio bio), portrait photo picker (**Use my portrait** to go back), Quick facts switch.
- **Portfolio:** Heading, Intro, Button; **3 galleries / 6 galleries** (going down trims the picks). Featured: tick galleries in the order you want them (the order number shows as a dark tag); when the limit is reached the rest dim, and ticking one toasts "Up to N galleries — untick one first". **Clear picks** goes back to the newest. 12 at a time with Show more.
- **Pricing:** Heading, Intro, Currency. Packages are collapsed cards (name, ★ if most popular, "$3,800 per wedding · 5 inclusions"); tap to open. Inside: Name, Price (a `$` field; empty on blur means 0), Per, Description, What’s included (edit in place, ✕ to remove, an emptied line is removed on blur, Add field + Enter or **Add**, 8 max), Most popular switch (turning it on turns it off on the others). **Add package** (up to 4) adds "Package N" and opens it. Trash removes at once and toasts "“Name” removed" with **Undo**.
- **FAQ:** Heading; questions as collapsed cards. An incomplete one says "Not shown — add an answer" in amber. **Add question** (up to 12) adds a blank one and opens it; trash toasts "Question removed" with **Undo**.
- **Contact:** Heading, Intro, Button (hint changes with the form); **Show the form** (off: an email button instead); **Ask for the event date** (dimmed while the form is off); Email, Location and Instagram switches with the profile values as hints.
- **Reset section** / **Reset website** ask first, then toast "<Section> reset" / "Website reset".

### The website (`/site`)
- Header links scroll to their section; the site title scrolls to the top; **Enquire** goes to Contact (or emails the photographer when Contact is hidden). Links hide below 768px.
- The Hero button and every package's **Enquire about <name>** go to Contact.
- Portfolio cards open the gallery's portfolio page (hover scrubs through photos, as on the portfolio). The button opens `/portfolio`; below 768px it's full width under the cards.
- FAQ is the shared `Accordion`, first answer open.
- The contact form checks name, email format and message on **Send**, showing the error under each field; once valid it shows "Thanks, <first name>!" with **Send another**. Nothing is sent.
- With every section off, the page says "This site has no sections switched on yet."

## Store: catalogs

| Action | Result |
|---|---|
| Click a catalog card | Opens it. |
| Card ⋯ | Edit catalog, Rename (dialog), Duplicate (opens New catalog as "A copy" of it, named "<name> copy"), Preview store (new tab, `/store?catalog=<id>`), Delete. |
| Delete | Asks first, saying how many galleries move to the Main catalog. Disabled for the Main catalog. |
| **New catalog** | On phones it's the bar fixed to the bottom of the screen and the dashed New catalog card is hidden. Dialog: Name (required) and Start with **Everything**, **Nothing** or **A copy** (then a catalog select). Create toasts and opens it. |

## Store: one catalog

### Header
- **‹ Catalogs** goes back. The eyebrow says Main catalog or Catalog.
- Click the name to rename it inline: Enter or clicking away saves (and toasts), Esc cancels, empty keeps the old name.
- The description says which gallery sells from it (linked), or how many, with chips linking to each when there are several. With none: "No gallery uses this catalog yet".
- **Preview store** opens the print store using this catalog in a new tab. **Reset** (once edited) asks first and resets catalog products and delivered packages; products and packages you built are kept.

### Lists
- The **Products / Packages** switch changes the list and closes the editor. A **New product** or **New package** button sits beside it. On phones it's the bar fixed to the bottom of the screen instead, and hides while an editor sheet is open.
- **New product** adds a hidden product to the category being shown (Wall Art under All), opens its editor and toasts "Product added — it stays hidden until you switch it on". An empty category shows the same action.
- Products you made are tagged **Yours**; their thumbnail is their cover image when they have one.
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
- **Digital Download → Files:** one bordered row per file version: a resolution `Select` (Original resolution or a px long edge; a bottom sheet on phones), a price field, ✕ (disabled on the last file) and a **Watermark** checkbox. Changes apply to the store and galleries as you type. **Add a file** (outline, full width on phones; disabled at 8) adds the next resolution not yet used without a watermark, at the lowest current price (if every one is used, a watermarked 1,200px). Two rows with the same resolution and watermark show "Same as another file" in amber. **Reset product** restores the three default files.
  - **Sell the whole gallery in this file** (checkbox under Watermark): ticking it shows **Whole-gallery price** (suggests 10× the per-photo price if empty) and the **Discount** slider (0–40%, arrow keys step 1%, "None" at 0). The line below updates as you drag: "Clients pay $119 ~~$149~~ · save $30 for every photo, including ones added later". Unticking keeps the price for next time. As the price, discount or per-photo price changes, an amber warning appears under that line when the sale price would take over an order of 3 photos or fewer (`RISKY_PHOTOS`): "Cheaper than one photo ($9): buying any single photo will get the whole gallery for $5 instead." / "Clients buying just 3 photos would get the whole gallery for $25 instead of paying $27." It disappears once the price is above 3 photos' worth; it never blocks.
- **Whole Gallery Download → Files:** read-only rows of the versions it sells (label, note, "20% off", sale price with the full price struck through). Edit them in Digital Download → Files. Switching Digital Download off in the store stops every gallery on this catalog selling High res.
- **Reset product** restores the catalog values and toasts.

### Your own product editor
- **Details:** the Show in the store switch toasts ("Wooden Photo Block is in the store"). Name, Tagline, Badge, a Category select (a bottom sheet on phones), Description and Highlights save as you type. An empty name shows a red note and the store calls it "Untitled product". **Add a highlight** adds a line, up to 6; ✕ removes one.
- **Delete product** asks first (mentioning packages when it's in any; an amber note above names them), closes the editor and toasts.
- **Images:** **Add images** opens the file picker (several at once). Each is resized and added, with a toast ("2 images added"). Picking more than fit adds what fits and says so; going past the storage budget stops with "No room for more images — remove some from your products first". On a tile: ★ makes it the cover (toast), ← → move it, ✕ removes it. **Look** changes the mockup beside it straight away.
- **Sizes:** changing How photos work shows its own fields (photos per set; or photos included, most photos and price per extra). Count and inch fields take whole numbers and snap into range when you leave them (Enter leaves too). **Add a size** adds one 4" bigger each way at 1.4× the last price, up to 10. The last size's ✕ is disabled.
- **Options:** **Add an option** adds one with two empty choices, up to 4. Changing **Shown as** keeps the choices and adds a colour or note field. Clicking a colour disc opens the system colour picker. **Add a choice** adds one, up to 8 (full width on phones); an option's last choice can't be removed. Until a choice has a name, the card says "Name a choice to show it".
- There's no Reset: the footer only has **Done**.

### Package editor
- **Details:** the Show in the store and Most popular switches, then Name and Tagline. **In this package** lists the contents with ⚠ on any product hidden from the store.
- **Packages you built** (tagged "Yours" in the list):
  - **New package** adds one with a single item (the first product on, at its smallest size), opens it and toasts.
  - Name and Tagline are its own (no original to fall back to).
  - **In this package** is editable. Each line has a Product select (catalog products and your own, in shop order; hidden ones are marked), a ✕, a Size select, a −/+ quantity (1–50; books show "1 book") and the line's price. Changing the product resets the size to its first. **Add a product** adds a line, up to 6.
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
