# Store V3: Interactions and Motion

This doc lists every animated or interactive UI element, screen by screen. For each one it gives the trigger, what moves, the exact values, the library that runs it, and the source file. [DesignSystem.md](DesignSystem.md) has the motion principles. This doc records what the code actually does.

## Libraries

| Library | Version | What it does here |
|---|---|---|
| **framer-motion** | 14.12.0 | Most motion: `motion.*` enter/exit, `AnimatePresence`, shared-element pills (`layoutId`), list reflow (`layout`), scroll-linked values (`useScroll` + `useTransform`), drag (sheets, carousel, lightbox swipe), and in-view reveals (`whileInView`) |
| **Tailwind CSS** | 4.3.5 | CSS transitions through utility classes (`transition`, `duration-*`, `ease-*`, `hover:scale-*`, `group-hover:*`, `active:scale-*`), plus the `animate-spin` keyframe |
| **CSS `@keyframes`** | n/a | `marquee` in `src/index.css`. It is used only by the Home marquee, which is not currently rendered. |
| **@radix-ui/react-dialog** | 1.3.1 | Handles focus trap, Esc and aria for the cart drawer, Quick buy and the Builder lightbox. It does no animation itself: framer-motion animates its parts through `forceMount` + `asChild`. |
| **Browser native** | n/a | Smooth scrolling: `scrollTo` / `scrollIntoView` with `behavior: 'smooth'`, `html { scroll-behavior: smooth }`, and CSS scroll-snap |

### Shared values

| Name | Value | Where it's defined |
|---|---|---|
| `ease` | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint style) | Redeclared as `const ease = [0.22, 1, 0.36, 1]` at the top of almost every file. Tailwind classes use it as `ease-[cubic-bezier(.22,1,.36,1)]`. |
| Tailwind `transition` | 150ms, `cubic-bezier(0.4, 0, 0.2, 1)`, on colour, background, border, opacity, shadow, transform and filter | Tailwind default. It applies wherever a row below says "Tailwind default". |
| Tailwind `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Tailwind default |
| framer-motion default | A spring for transform values (`x`, `y`, `scale`, `rotate`). A tween for `opacity`. | It applies wherever a row says "framer default". In those places the code sets no `transition`. |

### How to read the tables

- **`a → b`** is the start value and the end value. **Exit** is the leave animation under `AnimatePresence`.
- **`layoutId="x"`** means a single element slides and resizes between the positions of the selected item (the "moving pill" pattern).
- **`layout`** means framer-motion animates the element's position or size when the layout around it changes.
- Durations are in seconds (s) for framer-motion and in milliseconds (ms) for Tailwind, matching how each is written in the code.

---

## Shared components

These appear on several screens. The screen sections below refer back here instead of repeating the values.

### `Button`: [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Button body | Hover | Background colour change | `transition-all duration-300`, Tailwind default easing | Tailwind |
| Button body | Press | Shrinks slightly | `active:scale-[0.98]` | Tailwind |
| Arrow (`arrow` prop) | Hover on button | The arrow slides out right while a copy slides in from the left | Arrow 1: `translateX 0 → 100%`. Arrow 2: `translateX -100% → 0`. `duration-300`. | Tailwind (`group-hover`) |
| Disabled state | `disabled` | Faded | `opacity-40`, no pointer events | Tailwind |

### `Reveal`: [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Wrapped block | Scrolls into view (once) | Fades and slides up | `opacity 0 → 1`, `y 28px → 0` (the `y` prop overrides it), `0.9s`, `ease`. `delay` comes from props. `viewport: { once: true, margin: '0px 0px -10% 0px' }` | framer-motion `whileInView` |

### `SplitText`: [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Each word of a heading | Scrolls into view (once) | Word rises out of a mask (`overflow-hidden` wrapper) | `y 110% → 0`, `0.9s`, `ease`. Stagger `0.06s` per word. `delayChildren` = `delay` prop | framer-motion variants (`hidden` / `show`) |

### `AnimatedNumber` (prices): [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Number | `value` changes | The old value rolls up and out while the new value rolls up in | Enter: `y 100% → 0`, `opacity 0 → 1`. Exit: `y → -100%`, `opacity → 0`. `0.35s`, `ease`. `mode="popLayout"`, `initial={false}` (no animation on first render) | framer-motion `AnimatePresence` |

### `Accordion`: [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Plus icon | Open / close | Rotates and fades out | `rotate 0 → 90°`, `opacity 1 → 0`. framer default transition | framer-motion |
| Minus icon | Open / close | Fades in | `opacity 0 ↔ 1`, Tailwind default | Tailwind |
| Answer panel | Open / close | Expands and fades in | `height 0 → auto`, `opacity 0 → 1`, `0.4s`, `ease`. Exit reverses it. `initial={false}` | framer-motion `AnimatePresence` |

### `Field` (text input): [src/components/ui/index.jsx](src/components/ui/index.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Input | Focus | Border darkens and a soft ring appears | `border → type-0`, `ring-4 ring-black/5`, Tailwind default | Tailwind |

### `BottomSheet` and `Select`: [src/components/ui/Select.jsx](src/components/ui/Select.jsx)

`Select` is a native `<select>` on screens 768px and wider (no animation). On phones it opens a `BottomSheet`.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Backdrop | Open / close | Fade | `opacity 0 → 1`, `0.25s`, framer default easing | framer-motion |
| Sheet | Open / close | Slides up from the bottom | `y 100% → 0`, `0.35s`, `ease`. Exit `y → 100%` | framer-motion |
| Sheet | Drag down | Follows the finger, closes past a threshold | `drag="y"`, `dragConstraints {top:0,bottom:0}`, `dragElastic {top:0,bottom:0.6}`. Closes if offset > `80px` or velocity > `500px/s`, otherwise springs back | framer-motion drag |
| Option row | Hover | Background | Tailwind default | Tailwind |

Esc and backdrop tap also close the sheet. Body scroll is locked while it's open.

### `ProductCard`: [src/components/ProductCard.jsx](src/components/ProductCard.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Product mockup | Card hover | Zooms in | `scale 1 → 1.05`, `900ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Arrow badge (bottom right) | Card hover | Rises and fades in | `translateY 12px → 0`, `opacity 0 → 1`, `transition-all duration-500` | Tailwind |

### `PackageCard`: [src/components/PackageCard.jsx](src/components/PackageCard.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Card | Hover | Light card: a shadow appears. Dark card: the background brightens. | Shadow `0 20px 50px -20px rgba(0,0,0,.18)`, or bg `white/6% → white/10%`. `transition-all duration-500` | Tailwind |
| Collage | Card hover | Zooms in | `scale 1 → 1.04`, `900ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Arrow circle | Card hover | Rotates | `rotate 0 → 45°`, `500ms` | Tailwind |

### `OptionGroup` (swatches, sizes, cards): [src/components/OptionGroup.jsx](src/components/OptionGroup.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Swatch | Hover / select | Ring changes | Hover `ring-1 → type-3`. Selected `ring-2 ring-type-0 ring-offset-2`. Tailwind default | Tailwind |
| Size / segmented / card option | Hover / select | Border and outline | Hover `border → type-3`. Selected `border-type-0` + `0 0 0 1px` shadow. Tailwind default | Tailwind |

### `ProductMockup`: [src/components/ProductMockup.jsx](src/components/ProductMockup.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Scene | `zoom` prop changes (Product page "Detail" view) | Zooms into the piece | `scale → zoom` (1 or 2.1), `0.8s`, `ease`, `transformOrigin: 30% 30%` | framer-motion |
| Piece | Size, frame or photo changes | Resizes smoothly to its new width and aspect | `layout`, `0.6s`, `ease` | framer-motion `layout` |

### `CroppedImage`: [src/components/CroppedImage.jsx](src/components/CroppedImage.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Image | Finishes loading | Fades in over a grey placeholder | `opacity 0 → 1`, `duration-500` | Tailwind |

### `CropEditor`: [src/components/CropEditor.jsx](src/components/CropEditor.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Print frame | Photo or aspect changes (keyed on `photo.id + aspect`) | Fades and scales in | `opacity 0 → 1`, `scale 0.97 → 1`, `0.45s`, `ease` | framer-motion |
| Photo pan / zoom | Pointer drag, two-finger pinch, mouse wheel | Moves directly with input. There is no tween: each move commits a new crop, clamped by `clampCrop` | Wheel: `zoom × (1 − deltaY × 0.0015)`. Pinch: zoom × distance ratio. Pan: pointer delta ÷ frame size | Pointer events (custom) |
| Rule-of-thirds grid | While dragging | Fades in | `opacity 0 → 1`, `duration-300` | Tailwind |
| Cursor | Drag start / end | `grab` ↔ `grabbing` | Instant | CSS |

The zoom slider beside the editor (`.range` in `src/index.css`) has no animation. Its filled track follows the `--p` CSS variable.

### `CartDrawer`: [src/components/CartDrawer.jsx](src/components/CartDrawer.jsx)

The drawer opens from the header cart button on every store screen. It also opens on its own 350ms after Builder's "Add to cart".

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Overlay | Open / close | Fade (with a static `backdrop-blur-[2px]`) | `opacity 0 → 1`, framer default | framer-motion + Radix `forceMount` |
| Panel | Open / close | Slides in from the right | `x 100% → 0`, `0.55s`, `ease`. Exit `x → 100%` | framer-motion + Radix |
| Cart line | Added | Fades and rises | `opacity 0 → 1`, `y 12 → 0`, `0.4s`, `ease`. `initial={false}` on the list, so lines already there don't animate when the drawer opens | framer-motion |
| Cart line | Removed | Slides right and fades | `opacity → 0`, `x → 40`, `0.4s`, `ease` | framer-motion |
| Cart line | Another line is removed or duplicated | Moves to its new position | `layout` | framer-motion |
| Cart line | Hover | Background | `→ surface-2`, Tailwind default | Tailwind |
| Edit / Duplicate / Remove links | Hover | Text colour. Remove turns red. | Tailwind default | Tailwind |
| Close button | Hover | Background | Tailwind default | Tailwind |

---

## Gallery (`/`)

### Cover: [src/gallery/templates/cover/Cover.jsx](src/gallery/templates/cover/Cover.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Cover photo | Page load, or a new cover photo chosen | Settles in from a slight zoom. The image is keyed on `src`, so a new photo replays this | `scale 1.08 → 1`, `opacity 0 → 1`, `1.6s`, `ease` | framer-motion |
| Cover photo | Page scroll | Parallax: moves down more slowly than the page | `y 0% → 18%` across `scrollYProgress 0 → 1`. Offset `['start start', 'end start']` | framer-motion `useScroll` + `useTransform` |
| Text block (date, name, CTAs) | Page scroll | Fades out as the cover leaves | `opacity 1 → 0` across `scrollYProgress 0 → 0.6` | framer-motion `useTransform` |
| Text block | Position, alignment or width changes in the editor | Glides to its new place | `layout="position"`, `0.5s`, `ease` | framer-motion |
| Cover frame | Editor opens / closes, or the phone sheet collapses | Shrinks to the space beside (desktop) or above (phone) the editor, and grows back | `left` / `bottom`, `550ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Logo ("In text" position) | Page load | Fade up | `y 12 → 0`, `0.9s`, `ease`, delay `0.2s` | framer-motion |
| "Edit cover" button (top bar) | Hover | Background `white/15 → white/25`. Hidden while editing | Tailwind default | Tailwind |
| Date · photo count | Page load | Fade up | `opacity 0 → 1`, `y 12 → 0`, `0.9s`, `ease`, delay `0.3s` | framer-motion |
| Client name (H1) | Page load | Fade up | `y 24 → 0`, `1s`, `ease`, delay `0.4s` | framer-motion |
| "Photographed by" | Page load | Fade up | `y 16 → 0`, `0.9s`, `ease`, delay `0.55s` | framer-motion |
| CTA row | Page load | Fade up | `y 16 → 0`, `0.9s`, `ease`, delay `0.7s` | framer-motion |
| "View gallery" button | Click | Smooth-scrolls to the grid. Also has the [Button](#button-srccomponentsuiindexjsx) press and hover effects | `scrollIntoView({ behavior: 'smooth' })` | Browser native |
| "Shop prints" button | Hover | [Button](#button-srccomponentsuiindexjsx) arrow slide | n/a | Tailwind |
| "Print store" link (top right) | Hover | Background `→ white/10` | Tailwind default | Tailwind |

### Cover editor: [src/gallery/templates/cover/CoverEditor.jsx](src/gallery/templates/cover/CoverEditor.jsx), [controls.jsx](src/gallery/templates/cover/controls.jsx)

Opens from "Edit cover". The pane, sheet, tab pill, tab body and footer come from the shared [EditorPane.jsx](src/gallery/templates/editor/EditorPane.jsx). It uses Radix Dialog with a transparent overlay, so the cover stays visible as the live preview. Clicks outside don't close it; Done, Esc and ✕ do.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Pane (tablet / desktop) | Open / close | Slides in from the left | `x -100% → 0`, exit `→ -110%`, `0.55s`, `ease` | framer-motion + Radix |
| Sheet (phone) | Open / close | Slides up from the bottom | `y 100% → 0`, `0.55s`, `ease` | framer-motion + Radix |
| Sheet (phone) | Grab handle or Preview / Edit button | Collapses to a `64px` bar to show the whole cover, and expands back to `58svh` | `height`, `500ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Tab pill (Templates / Layout / Text / Photo) | Tab changes | The white pill slides | `layoutId="editor-tab-{title}"` (one per editor), `0.35s`, `ease` | framer-motion |
| Tab body | Tab changes | Crossfade with a small rise | Enter `opacity 0 → 1`, `y 8 → 0`. Exit `y → -8`. `0.2s`, `ease`. `mode="wait"` | framer-motion |
| Template card | Hover / selected | Ring `border → type-3` on hover, `ring-2 type-0` and a check badge when selected | Tailwind default | Tailwind |
| Segmented controls (alignment, title size, width, logo, buttons) | Option chosen | The white pill slides | `layoutId="seg-{id}"`, `0.35s`, `ease` | framer-motion |
| Position grid cell | Hover / selected | Fill `→ white/10` on hover; selected gets `white/20`, a white ring and longer bars | Tailwind default | Tailwind |
| Switch | Toggle | Knob slides, track `#dcdcdf → type-0` | `x 0 → 16`, `0.25s`, `ease` | framer-motion + Tailwind |
| Text field | Focus | Border `→ type-0`, `ring-4 black/5`. Counter turns amber in the last 10% and red at the limit | Tailwind default | Tailwind |
| Upload box (Photo tab) | Hover / drag over | Border `→ type-3` and `surface-2` fill on hover; `type-0` border while a file is dragged over | Tailwind default | Tailwind |
| Upload box | File being read | The upload icon becomes a spinner | `animate-spin` | Tailwind keyframes |
| Collection chips (Photo tab) | Chosen | Fill `surface-2 → type-0`, text `→ white`. No sliding pill | Tailwind default | Tailwind |
| Photo thumbnail (Photo tab) | Hover / chosen | Hover `opacity 85%`; chosen gets `ring-2 ring-type-0 ring-offset-2` and a check badge. Thumbnails load lazily | Tailwind default | Tailwind |
| Cover photo | Thumbnail or upload chosen | The cover replays its entrance zoom (see Cover above) | n/a | framer-motion |

### Footer and footer editor: [src/gallery/templates/footer/Footer.jsx](src/gallery/templates/footer/Footer.jsx), [FooterEditor.jsx](src/gallery/templates/footer/FooterEditor.jsx), [FooterSection.jsx](src/gallery/templates/footer/FooterSection.jsx)

Opens from "Edit footer". The editor uses the cover editor's shell ([EditorPane.jsx](src/gallery/templates/editor/EditorPane.jsx)): same pane and sheet motion, phone collapse, tab pill (Templates / Content / Socials / Style), tab body crossfade, Reset all and Done. It's non-modal (`modal={false}`): there's no overlay, so the preview stage can scroll, and `FooterSection` locks page scroll itself. Done, Esc and ✕ close it; clicks outside don't.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| "Edit footer" button (top right of the footer) | Hover / press | Outline [Button](#button-srccomponentsuiindexjsx): `surface-1 → surface-2`. Icon only below a `28rem` footer width. Hidden while editing | Tailwind default | Tailwind |
| Preview stage | Editor opens / closes | Fades in beside the pane (or above the phone sheet); follows the sheet as it collapses | `opacity 0 → 1`, `0.35s`, `ease`; `left` / `bottom`, `550ms`, `cubic-bezier(.22,1,.36,1)` | framer-motion + Tailwind |
| Links and buttons in the stage | Click | Nothing: the preview is display only | n/a | n/a |
| "Live preview" label | Stage scrolls | Stays pinned to the top-left of the stage | `sticky top-0` | CSS |
| Template card | Hover / selected | Ring `border → type-3` on hover, `ring-2 type-0` and a check badge when selected. Thumbnails are real footers at 1280px, scaled to the card | Tailwind default | Tailwind |
| Template thumbnails | Template chosen / content edited | Re-render live with the current text and socials; height follows the template | `ResizeObserver` scale of a 1280px render | React |
| Footer (page and stage) | Template, text, social or background change | Updates instantly; no transition between templates. Dark swaps colour tokens, no motion | n/a | n/a |
| Switch / Segmented (Content, Socials) | Toggle / option chosen | Same as the cover editor controls | See Cover editor | framer-motion |
| Email field | Invalid address | Border and hint turn `destructive`; the email disappears from the footer until it's valid | Tailwind default | Tailwind |
| Social profile row | Focus | Border `→ type-0`, `ring-4 black/5`. The resolved link shows under the input | Tailwind default | Tailwind |
| "Add a profile" chip | Hover | Fill `surface-2 → #ececec` | Tailwind default | Tailwind |
| "Add a profile" chip / trash button | Click | The row appears or disappears instantly; the chip moves between the list and the chips | n/a | n/a |
| Background swatches (Style) | Chosen | Same as the cover editor swatches | Tailwind default | Tailwind |
| Card photo thumbnails (Style, Photo card only) | Hover / chosen | Same as the cover photo picker | Tailwind default | Tailwind |
| Footer links and back to top | Hover | Text `type-1` / `type-3` → `type-0` | Tailwind default | Tailwind |
| Social icon buttons, "Book a session" | Hover / press | Outline [Button](#button-srccomponentsuiindexjsx); the Let's talk button has the sliding arrow | Tailwind default | Tailwind |
| Wordmark template email | Hover | Underline `border → type-0`, arrow nudges up-right | `translate 0.5`, Tailwind default | Tailwind |
| "Back to top" | Click | Smooth-scrolls to the top of the page | `scrollTo({ behavior: 'smooth' })` | Browser native |

### Collection headings and heading editor: [src/gallery/templates/set-header/SectionHeader.jsx](src/gallery/templates/set-header/SectionHeader.jsx), [SectionEditor.jsx](src/gallery/templates/set-header/SectionEditor.jsx)

Opens from the pencil on any collection heading. The editor uses the shared shell ([EditorPane.jsx](src/gallery/templates/editor/EditorPane.jsx)): same pane and sheet motion, phone collapse, tab pill (Templates / Text / Style), tab body crossfade, Reset all and Done. Like the footer editor it's non-modal (`modal={false}`), and `SectionEditor` locks page scroll itself. Done, Esc and ✕ close it; clicks outside don't.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Edit pencil (top corner of each heading) | Heading hover or keyboard focus | Fades in. Always visible on touch screens. Sits on the side away from the text. Not shown while multi-selecting | `opacity 0 → 1`, Tailwind default | Tailwind |
| Edit pencil | Hover | Background `surface-1 → surface-2`, icon `type-1 → type-0` | Tailwind default | Tailwind |
| Preview stage | Editor opens / closes | Fades in beside the pane (or above the phone sheet); follows the sheet as it collapses | `opacity 0 → 1`, `0.35s`, `ease`; `left` / `bottom`, `550ms`, `cubic-bezier(.22,1,.36,1)` | framer-motion + Tailwind |
| "Live preview · <collection>" label | Stage scrolls | Stays pinned to the top-left of the stage | `sticky top-0` | CSS |
| Template card | Hover / selected | Ring `border → type-3` on hover, `ring-2 type-0` and a check badge when selected. Thumbnails are real headings at 1280px, scaled to the card ([FitThumb.jsx](src/gallery/templates/editor/FitThumb.jsx)) | Tailwind default; `ResizeObserver` scale | Tailwind + React |
| Template thumbnails | Words or type change | Re-render live with the current words, font and cover match | n/a | React |
| Collection picker (Text) | Collection chosen | The fields and the stage switch to that collection's words instantly | n/a | n/a |
| Label / title / note fields | Typing | Same as the cover editor's text fields. The heading on the page and in the stage update as you type | Tailwind default | Tailwind |
| "Restore <collection>'s original words" | Click | The words snap back to the defaults; the button disappears | n/a | n/a |
| Match cover switch (Style) | Toggle | Knob slides as in the cover editor. While on, the typeface, alignment and size controls fade to `45%` opacity and ignore clicks | `transition-opacity`, Tailwind default | framer-motion + Tailwind |
| Font card | Hover / chosen | Border `input → type-3` on hover; chosen gets `border-type-0 ring-1` | Tailwind default | Tailwind |
| Segmented controls (weight, case, alignment, title side, size, space around) | Option chosen | Same as the cover editor | `layoutId="seg-{id}"`, `0.35s`, `ease` | framer-motion |
| Headings (page and stage) | Template, type or spacing change | Update instantly; no transition between templates | n/a | n/a |
| Headings | Cover changes while Match cover is on | Font, weight, case, alignment and size follow the cover instantly | n/a | n/a |

### Nav bar: [src/gallery/components/NavBar.jsx](src/gallery/components/NavBar.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Collection tab underline | Active collection changes (tap or scroll-spy) | The underline slides to the new tab | `layoutId="collection-underline"`, `0.4s`, `ease` | framer-motion |
| Collection tab text | Hover / active | Colour `type-2 → type-0` | Tailwind default | Tailwind |
| Collection tab row | Active tab changes | The row scrolls sideways to centre the active tab | `row.scrollTo({ behavior: 'smooth' })` | Browser native |
| Collection tab | Tap | The page scrolls so the section heading sits under the nav. Scroll-spy is locked until `scrollend`, wheel or touch (1.5s fallback) | `window.scrollTo({ behavior: 'smooth' })` | Browser native |
| People button | Click | Opens the Find people pane. `surface-2` while the pane or the People view is open; the icon turns bold in the People view | Tailwind default | Tailwind |
| Layout / Hidden / Favourites buttons | Hover / pressed | Background `→ surface-2`. Text labels show from `lg` up; on tablet they're icon plus count. On phones they move to the [dock](#phone-dock) instead. "Shop prints" is an icon-only circle on tablet and a labelled "Shop" pill on phones | Tailwind default | Tailwind |
| Hidden button | Hover / pressed | Background `→ surface-2`; the eye-slash icon turns bold while the Hidden view is open | Tailwind default | Tailwind |
| Favourites / Hidden toggle, set tab | Click | Opens that view (or goes back to all photos if it's already open) and jumps back to the top of the grid if scrolled past it. Any selection is cleared | `scrollTo({ behavior: 'instant' })` | Browser native |
| Set tab | Hover | Text `type-2 → type-0`. No underline: sets aren't part of scroll-spy | Tailwind default | Tailwind |
| Bucket header (Favourites, Hidden or a set) | View opens | Replaces the tab row instantly: "‹ All photos", name and count, and Clear all / Unhide all / Delete set | n/a | n/a |
| Delete set / Clear all / Unhide all | Click | A browser `confirm()` dialog; on OK the action runs and the gallery returns to all photos | n/a | Browser native |
| Layout popover (tablet and desktop) | Open / close | Drops down from the top right | `opacity 0 → 1`, `y -6 → 0`, `scale 0.98 → 1`, `0.2s`, `ease`. Exit reverses it. `origin-top-right` | framer-motion |
| Layout sheet (phone) | Open / close / drag | Same as [BottomSheet](#bottomsheet-and-select-srccomponentsuiselectjsx): backdrop `0.25s`, sheet `y 100% → 0` `0.35s`, drag-to-close at `80px` or `500px/s` | n/a | framer-motion |
| Segmented control pill (Orientation / Size / Spacing) | Option chosen | The white pill slides to the selected option | `layoutId="seg-{label}"`, `0.35s`, `ease` | framer-motion |
| Photographer name | Hover / click | Text `type-2 → type-0` and an underline appears. Click opens [`/portfolio`](#portfolio-portfolio-srcportfolioportfoliopagejsx) | Tailwind default | Tailwind |

#### Phone dock

On phones (below 640px) the top bar keeps only the names and "Shop"; People, Favourites, Hidden, Layout and Select live in a floating dock rendered into `document.body`.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Dock | The nav sticks to the top and the grid still covers 60% of the screen / scrolling back to the cover or into the footer | Rises in, drops out | `opacity 0 → 1`, `y 24 → 0`, `0.3s`, `ease`. Exit reverses it | framer-motion |
| Dock | Selection starts / ends | Leaves so the [selection bar](#selection-bar-srcgallerycomponentsselectionbarjsx) can take its place, and comes back | Same as above | framer-motion |
| Dock button | Tap | Scales down while pressed. Opens the same view, pane or sheet as the desktop button; Select turns selection mode on | `active:scale-[.96]`, Tailwind default | Tailwind |
| Dock button | View or sheet open | `surface-2` pill, text `type-2 → type-0` | Tailwind default | Tailwind |
| Count badge | Favourites / Hidden count changes | Shown when above 0, `99+` past 99. No motion | n/a | n/a |

### Find people: [src/gallery/components/FacePane.jsx](src/gallery/components/FacePane.jsx), [faces.js](src/gallery/data/faces.js)

Opens from the People button in the nav, or "Change" in the People view. A modal Radix Dialog like quick buy: Esc, ✕ and taps on the overlay close it, and the gallery doesn't change until "Show N photos" or "Yes, show my photos". It reopens with the last applied choice and on the first step.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Overlay | Open / close | Fades in and out | `black/30`, `backdrop-blur-[2px]`, framer default (~0.3s) | framer-motion |
| Pane | Open / close | Slides in from the right, and back out | `x 100% → 0`, `0.55s`, `ease` | framer-motion |
| Steps (faces → scan → match) | Scan, back, scan result | The old step slides out and fades as the new one comes in from the side it's heading; back reverses it. The body scrolls to the top in between | `x ±24`, `opacity`, `0.3s`, `ease`, `AnimatePresence mode="wait"` | framer-motion |
| Face avatar | Hover | Ring `border → type-3` | Tailwind default | Tailwind |
| Face avatar | Tap | Toggles the person. Ring becomes `ring-2 type-0`, the count turns `type-0`, and the check badge pops in (and out when unchosen) | Badge `scale 0.4 → 1`, `opacity`, `0.2s`, `ease` | framer-motion + Tailwind |
| "Show photos with" | Second person chosen / back to one | The control opens below the faces (and folds away) | `height 0 → auto`, `opacity`, `0.3s`, `ease` | framer-motion |
| Any of them / All together | Tap | The white pill slides to the chosen option; the hint below and the count on the button update at once | `layoutId="face-match"`, `0.35s`, `ease` | framer-motion |
| Show N photos | Tap | Applies the choice, closes the pane, opens the People view and jumps to the top of the grid. Disabled (40% opacity) with no one chosen or no photos together | `scrollTo({ behavior: 'instant' })` | Browser native |
| Camera | Scan step opens | Asks for the front camera; the live picture fades in once it starts. Leaving the step, or taking the selfie, turns the camera off | `opacity`, `0.3s` | Tailwind + `getUserMedia` |
| Take selfie | Tap | The frame freezes as a still, then the scan runs for 2.2s: a white band sweeps down and back up over the face and the guide ring becomes one arc spinning round. Then the match step | Band `top -20% → 100% → -20%`, `easeInOut`; arc `rotate 360`, `1.1s`, linear, repeating | framer-motion |
| Upload a selfie / Upload a photo instead | Tap | Opens the file picker; an image starts the same scan | n/a | Browser native |
| Match faces | Match step opens | The selfie slides in from the right and the matched face from the left until they overlap, then the green check pops in | `x ±24`, `opacity`, `0.45s`; badge `scale 0.4 → 1`, `0.3s` delay, `0.35s` | framer-motion |
| Yes, show my photos / Add other people / That's not me | Tap | Applies just that person; or goes back to the faces with them chosen; or goes back with them unchosen and a "Tap your face below" note | Step slide as above | framer-motion |
| People view header | View opens | Replaces the tab row instantly, like Favourites: "‹ All photos", the face stack, the label and count, "Change" (reopens the pane) and "Clear" (no confirmation; back to all photos) | n/a | n/a |

### Photo grid and tile: [GalleryGrid.jsx](src/gallery/components/GalleryGrid.jsx), [Photo.jsx](src/gallery/components/Photo.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Tile image | Finishes loading | Fade in | `opacity 0 → 1`, `700ms`, `ease-out` | Tailwind |
| Tile image | Hover | Slight zoom | `scale 1 → 1.02`, `700ms`, `ease-out` | Tailwind |
| Bottom gradient | Hover (hidden on touch screens) | Fades in | `opacity 0 → 1`, `duration-300` | Tailwind |
| Action buttons (heart, download, share, buy) | Hover or keyboard focus (hidden on touch) | Fade in | `opacity 0 → 1`, `duration-300` | Tailwind |
| Each action button | Hover | Background `surface-1/90 → surface-1` | Tailwind default | Tailwind |
| Favourite heart badge (top left) | Tile hover | Hides so it doesn't double up with the action row | Instant `opacity 0` | Tailwind |
| Infinite-scroll spinner | Next batch loading (350ms simulated delay) | Spins | `animate-spin` (1s linear infinite) | Tailwind keyframes |
| Hide button (top right) | Tile hover or keyboard focus (hidden on touch) | Fades in with the tile actions; background `surface-1/90 → surface-1` on hover | Tailwind default | Tailwind |
| Hide button | Click | The photo leaves the grid at once (the rest reflow with no animation) and a toast says where to find it. In the Hidden view the button unhides instead and the photo leaves that list | n/a | n/a |
| Select check (top left) | Tile hover or keyboard focus (pointer devices; never on touch) | Fades in. Fill `black/15 → black/30` on hover. Click enters selection mode with that photo selected. Not shown inside a set | `opacity 0 → 1`, `duration-200` | Tailwind |
| Tile | Long press (touch) | Enters selection mode with that photo selected; a short vibration. The tap that follows is ignored, and the system image menu is suppressed | Hold `450ms`; cancelled by more than `10px` of movement, scrolling or lifting the finger. `navigator.vibrate(10)` | Pointer events (custom) |
| Tile | Tap / click while selecting | Toggles the photo instead of opening the lightbox. Shift-click selects the range from the last photo toggled. Hover zoom and hover actions are off; the heart badge moves to the bottom left | n/a | n/a |
| Selected tile image | Selected / deselected | Shrinks into the tile with rounded corners; the check fills `primary` with a white tick | `scale 1 → 0.9`, `border-radius 0 → 4px`, `500ms`, `ease-out` | Tailwind |
| Collection heading pencils | Selection mode on | Hidden until selection ends | n/a | n/a |

### Lightbox / loupe: [src/gallery/components/Lightbox.jsx](src/gallery/components/Lightbox.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Viewer | Open / close | Fade | `opacity 0 → 1`, `0.25s`. Exit reverses it | framer-motion |
| Photo | Next / previous (arrows, keys, film strip, swipe) | Slides in the direction of travel | Enter `x dir×80 → 0`, `opacity 0 → 1`. Exit `x → dir×−80`, `opacity → 0`. `0.25s`, `easeOut`. `mode="popLayout"`, `initial={false}`, `custom={dir}` | framer-motion variants |
| Photo | Swipe (coarse pointer only) | Rubber-bands under the finger and snaps back. A swipe moves to the next photo | `drag="x"`, `dragElastic 0.7`, `dragSnapToOrigin`. Counts as a swipe at > `60px` offset or > `400px/s` | framer-motion drag |
| Header icons, prev / next | Hover | Background `→ white/10`, text `white/80 → white` | Tailwind default | Tailwind |
| Heart | Toggle | Icon switches between outline and red fill | Instant | n/a |
| Hide / unhide (header) | Click | The photo leaves the current view; the viewer steps to the next photo (or the previous one at the end) with the usual slide, and closes if none are left. Toast confirms | See Photo above | framer-motion |
| Film-strip thumb | Current / hover | Current: `opacity 100%` + white ring. Others `50%`, hover `80%` | Tailwind default | Tailwind |
| Film strip | Index changes | Scrolls to centre the current thumb | `scrollIntoView({ behavior: 'smooth', inline: 'center' })` | Browser native |

### Selection bar: [src/gallery/components/SelectionBar.jsx](src/gallery/components/SelectionBar.jsx)

Shown while multi-selecting. Esc closes the name field if it's open, otherwise leaves selection; ⌘/Ctrl+A selects everything in view (not while typing).

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Bar | Selection starts / ends | Rises in from the bottom, drops out | `opacity 0 → 1`, `y 24 → 0`, `0.3s`, `ease`. Exit reverses it | framer-motion |
| "N selected" | Count changes | Number changes instantly; announced politely to screen readers | `aria-live="polite"` | n/a |
| "Select all N" / "Select none" | Hover / click | Text `white/60 → white`, underline. Click swaps the label | Tailwind default | Tailwind |
| Action buttons (Share, Favourite, Download, New set) | Hover / disabled | Background `→ white/10`, text `white/85 → white`. Disabled at `35%` opacity when nothing is selected | Tailwind default | Tailwind |
| Favourite action | Every selected photo is a favourite | Becomes "Unfavourite" with a filled red heart | Instant | n/a |
| Favourite / Download | Click | Runs, toasts, and the bar leaves (selection ends) | See Bar | framer-motion |
| Share | Click | Opens the share sheet, or copies links with a toast. Selection stays | n/a | Browser native |
| New set (tablet / desktop) | Click | A name panel floats up above the bar; the name is pre-selected. Enter or "Create set" makes the set, toasts, and selection ends | Panel `opacity 0 → 1`, `y 8 → 0`, `scale 0.98 → 1`, `0.2s`, `ease`. Exit reverses it | framer-motion |
| New set (phone) | Tap | The name form opens in a [BottomSheet](#bottomsheet-and-select-srccomponentsuiselectjsx) | Same as BottomSheet | framer-motion |
| New set | At the two-set limit | No form: a toast asks to delete a set first | n/a | n/a |

### Toast: [src/gallery/components/Toaster.jsx](src/gallery/components/Toaster.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Toast pill | Download / share / favourite / hide / set feedback | Rises in, drops out | Enter `opacity 0 → 1`, `y 12 → 0`. Exit `opacity → 0`, `y → 8`. `0.2s` | framer-motion |
| Toast stack | Selection bar shows / hides | Moves up above the bar, and back down. On phones it always sits at `96px`, above the dock | `bottom 24px → 96px`, `duration-300` | Tailwind |

### Quick buy panel: [src/gallery/components/QuickBuy.jsx](src/gallery/components/QuickBuy.jsx)

The panel opens from "Buy print" on a tile or in the lightbox.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Overlay | Open / close | Fade (with a static `backdrop-blur-[2px]`) | `opacity 0 → 1`, framer default | framer-motion + Radix |
| Panel | Open / close | Slides in from the right | `x 100% → 0`, `0.55s`, `ease` | framer-motion + Radix |
| Step progress bars (3) | Step changes | Each bar fills when reached | `width 0% → 100%`, `0.45s`, `ease`, `initial={false}` | framer-motion |
| Step body | Step changes | Slides in the direction of travel. The body scrolls to the top once the old step has left | Enter `x dir×24 → 0`, `opacity 0 → 1`. Exit `x → dir×−24`. `0.3s`, `ease`. `mode="wait"` | framer-motion variants |
| Product row (step 1) | Hover | Border `→ type-3`. The caret nudges right and darkens | Caret `translateX 0 → 2px`, Tailwind default | Tailwind |
| Mockup preview (step 2) | Option change | See [ProductMockup](#productmockup-srccomponentsproductmockupjsx) and [OptionGroup](#optiongroup-swatches-sizes-cards-srccomponentsoptiongroupjsx) | n/a | framer-motion + Tailwind |
| Unit price and total | Option or quantity change | [AnimatedNumber](#animatednumber-prices-srccomponentsuiindexjsx) roll | n/a | framer-motion |
| Quantity − / + | Hover | Background | Tailwind default | Tailwind |
| Crop editor (step 3) | Drag, pinch, wheel | See [CropEditor](#cropeditor-srccomponentscropeditorjsx) | n/a | n/a |
| Orientation pill (step 3) | Toggle | The pill slides | `layoutId="qb-orient"`, `0.35s`, `ease` | framer-motion |
| "In your cart" badge (done step) | Step appears | Pops in | `scale 0.6 → 1`, `opacity 0 → 1`, `0.4s`, `ease`, delay `0.15s` | framer-motion |

---

## Portfolio (`/portfolio`): [src/portfolio/PortfolioPage.jsx](src/portfolio/PortfolioPage.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Page | Arrival | Jumps to the URL hash target (for example `#work` from "View all"), or to the top. Runs once on arrival, so later in-page links keep their smooth scroll | `scrollIntoView({ behavior: 'instant' })` in a rAF, or `scrollTo({ top: 0, behavior: 'instant' })` | Browser native |
| Section links (Work / About / Contact), "View work", "Get in touch" | Click | Smooth-scrolls to the section, which stops `64px` below the top so the sticky header doesn't cover it | `html { scroll-behavior: smooth }` + `scroll-mt-16` | Browser native |

### Header: [src/portfolio/components/PortfolioHeader.jsx](src/portfolio/components/PortfolioHeader.jsx)

Shared by both portfolio pages. It is sticky at `top-0` and does not hide on scroll.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Back link (Gallery / Portfolio) | Hover | Background `→ surface-2`, text `type-2 → type-0` | Tailwind default | Tailwind |
| Section links (`md` and up) | Hover | Background `→ surface-2`, text `type-1 → type-0` | Tailwind default | Tailwind |
| "Enquire" | Hover / press | [Button](#button-srccomponentsuiindexjsx) (`sm`). Opens `mailto:` | n/a | Tailwind |

### Hero: [src/portfolio/components/Hero.jsx](src/portfolio/components/Hero.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| "Hello! I'm …" | In view | [SplitText](#splittext-srccomponentsuiindexjsx), no delay | n/a | framer-motion |
| Disciplines line | In view | [Reveal](#reveal-srccomponentsuiindexjsx) | `y 16`, delay `0.25s` | framer-motion |
| Bio | In view | [Reveal](#reveal-srccomponentsuiindexjsx) | `y 16`, delay `0.35s` | framer-motion |
| CTA row | In view / hover | [Reveal](#reveal-srccomponentsuiindexjsx) `y 16`, delay `0.45s`, plus [Button](#button-srccomponentsuiindexjsx) hover. "View work" has the arrow slide | n/a | framer-motion + Tailwind |
| Portrait | Page load | Settles in from slightly small | `scale 0.96 → 1`, `opacity 0 → 1`, `1.1s`, `ease` | framer-motion |
| Facts strip | In view | [Reveal](#reveal-srccomponentsuiindexjsx) | `y 12`, no delay | framer-motion |

### Selected work: [src/portfolio/components/WorkGrid.jsx](src/portfolio/components/WorkGrid.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Toolbar (tabs, search, sort, view) | Scroll | Sticks under the header | `sticky top-16` | CSS |
| Genre tab underline | Genre changes | The underline slides to the new tab | `layoutId="genre-underline"`, `0.4s`, `ease` | framer-motion |
| Genre tab text | Hover / active | Colour `type-2 → type-0` | Tailwind default | Tailwind |
| Genre tab, sort, view toggle | Change while the toolbar is stuck | Scrolls back up so the first results sit just below the toolbar | `window.scrollTo({ top: sectionTop − 8, behavior: 'smooth' })`, only when the section's top is above the viewport | Browser native |
| Search field | Typing | Results filter on every keystroke. No scroll jump | n/a | n/a |
| Search field | Focus | Border `input → type-0` | Tailwind default | Tailwind |
| Clear search (✕) | Hover | Background `→ surface-2` | Instant (no transition) | Tailwind |
| Sort select | Hover | Background `→ surface-2`. Native `<select>` at every breakpoint | Tailwind default | Tailwind |
| Grid / list toggle | Click | The white chip and shadow jump to the chosen icon (no sliding pill) | Tailwind default | Tailwind |
| Gallery card (grid view) | Mounts (first batch, each new batch, filter change) | Fade up | `opacity 0 → 1`, `y 16 → 0`, `0.6s`, `ease`. No stagger. Cards that stay mounted across a filter change don't replay | framer-motion |
| Gallery card / row | Hover | See [ProjectCard and ProjectRow](#projectcard-and-projectrow-srcportfoliocomponentsprojectcardjsx) | n/a | Tailwind |
| Infinite scroll | Sentinel within `1200px` of the viewport | Reveals the next batch (12 in grid view, 30 in list view) after a `350ms` simulated delay. Footer text reads "Loading more galleries…", then "Showing all N galleries" | `useInfinite` from `gallery/lib/hooks.js`. Resets to one batch when genre, sort, search or view changes | IntersectionObserver |
| "Clear filters" (no results) | Hover | Background `surface-2 → #ededed` | Tailwind default | Tailwind |

### `ProjectCard` and `ProjectRow`: [src/portfolio/components/ProjectCard.jsx](src/portfolio/components/ProjectCard.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Cover image | Card hover | Slight zoom | `scale 1 → 1.03`, `700ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Cover image | Mouse moves across the cover | Scrubs through up to 5 preview photos: the cover's width is split into equal bands, one per photo | Frame `= floor(x / width × frames)`. Frames swap instantly (`opacity 0 / 100`, no transition), pre-scaled to `1.03` to match the zoomed cover. Resets to the cover on leave. Mouse only (`pointerType === 'mouse'`); the extra frames mount on first hover | Pointer events (custom) |
| Bottom gradient, progress bars, arrow disc | Card hover | Fade in | `opacity 0 → 1`, `duration-300` | Tailwind |
| Progress bar | Frame changes | Active bar `white/40 → white` | `transition-colors`, Tailwind default | Tailwind |
| Card | Keyboard focus | Focus ring around the cover | `ring-2 ring-ring ring-offset-2` | Tailwind |
| List row | Hover | Background `→ surface-2` | Tailwind default | Tailwind |
| List row arrow (`md` and up) | Row hover | Nudges up and right, colour `type-3 → type-0` | `translate 2px, -2px`, Tailwind default | Tailwind |

### Contact footer: [src/portfolio/components/Contact.jsx](src/portfolio/components/Contact.jsx)

Shared by both portfolio pages.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Heading and buttons | In view | [Reveal](#reveal-srccomponentsuiindexjsx), no delay | n/a | framer-motion |
| Details (availability, location, social) | In view | [Reveal](#reveal-srccomponentsuiindexjsx), delay `0.1s` | n/a | framer-motion |
| Email button | Hover / press | [Button](#button-srccomponentsuiindexjsx) with arrow. Opens `mailto:` | n/a | Tailwind |
| "Browse galleries" | Click | On `/portfolio`: smooth-scrolls to `#work`. On a gallery page: navigates to `/portfolio#work` and lands there instantly | n/a | Browser native / router |
| "Back to top" | Click / hover | Smooth-scrolls to the top. Text `type-3 → type-0` on hover | `scrollTo({ top: 0, behavior: 'smooth' })` | Browser native + Tailwind |

## Portfolio gallery (`/portfolio/:slug`): [src/portfolio/ProjectPage.jsx](src/portfolio/ProjectPage.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Page | Slug changes (including "More …" cards) | Jumps to the top | `scrollTo({ top: 0, behavior: 'instant' })` | Browser native |
| Genre eyebrow | Hover / click | Colour `type-3 → type-0`. Opens the portfolio filtered to that genre, at `#work` | Tailwind default | Tailwind |
| Title (H1) | Page load | Fade up | `opacity 0 → 1`, `y 16 → 0`, `0.8s`, `ease`. Not keyed on the slug, so it doesn't replay when moving between galleries | framer-motion |
| Photo grid | Load | No animation. Each image reserves its space from `dims.json` (`aspect-ratio`) on a `surface-2` placeholder, so nothing shifts as photos load. The first 6 load eagerly | n/a | n/a |
| Photo grid | Breakpoint changes | Re-runs `masonry()` with 2 / 3 / 3 columns. No transition | n/a | n/a |
| "More …" cards | In view | One [Reveal](#reveal-srccomponentsuiindexjsx) for the whole row (no stagger), plus [ProjectCard](#projectcard-and-projectrow-srcportfoliocomponentsprojectcardjsx) hover | n/a | framer-motion + Tailwind |
| "View all" | Hover | Text `type-1 → type-0`, underline appears | Tailwind default | Tailwind |
| Contact footer | n/a | See [Contact footer](#contact-footer-srcportfoliocomponentscontactjsx) | n/a | n/a |

---

## Store shell: [src/components/Layout.jsx](src/components/Layout.jsx)

Applies to `/store`, `/shop`, `/product/:id`, `/packages`, `/packages/:id` and `/cart`.

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Header | Scroll down past 240px / scroll up | Hides upward, shows again on scroll up. Stays visible while the mobile menu is open | `y 0 ↔ -100%`, `0.45s`, `ease` | framer-motion `useScroll` + `useMotionValueEvent` |
| Header bar | Scroll past 12px | The bottom border appears. The background is always solid `surface-0` | Border `transparent → border`, `transition-colors duration-500` | Tailwind |
| Nav underline (desktop) | Route changes | Slides to the active link | `layoutId="nav-underline"`, `0.4s`, `ease` | framer-motion |
| Nav links, "Back to gallery", footer links | Hover | Colour / background | Tailwind default | Tailwind |
| Cart button count | Item count changes | The old number slides up and out, the new one slides up in | Enter `y 12 → 0`. Exit `y → -12`. `0.3s`, `ease`. `mode="popLayout"`, `initial={false}` | framer-motion |
| Cart button | Hover | Background `→ #2c2c2c` | Tailwind default | Tailwind |
| Mobile menu | Open / close | Wipes down from the top | `clipPath inset(0 0 100% 0) → inset(0 0 0% 0)`, `0.6s`, `ease`. Exit reverses it | framer-motion |
| Mobile menu links | Menu opens | Staggered fade up | `opacity 0 → 1`, `y 24 → 0`, `0.6s`, `ease`, delay `0.15 + i × 0.05s` | framer-motion |
| Page content (`<main>`) | Route changes | The old page fades out, then the new one fades up | Enter `opacity 0 → 1`, `y 12 → 0`. Exit `opacity → 0`. `0.5s`, `ease`. `mode="wait"`. The window jumps to the top instantly on each path change | framer-motion |
| Cart drawer | Cart button | See [CartDrawer](#cartdrawer-srccomponentscartdrawerjsx) | n/a | n/a |

---

## Store home (`/store`): [src/pages/Home.jsx](src/pages/Home.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| "N photos from…" pill | Page load | Fade up | `opacity 0 → 1`, `y 10 → 0`, `0.8s`, `ease` | framer-motion |
| Hero headline | In view | [SplitText](#splittext-srccomponentsuiindexjsx), delay `0.1s` | n/a | framer-motion |
| Hero paragraph | Page load | Fade up | `y 16 → 0`, `0.9s`, `ease`, delay `0.5s` | framer-motion |
| Hero CTAs | Page load | Fade up | `y 16 → 0`, `0.9s`, `ease`, delay `0.62s` | framer-motion |
| Hero image 1 (portrait photo) | Page load | Scale in | `scale 0.94 → 1`, `opacity 0 → 1`, `1.2s`, `ease`, delay `0.2s` | framer-motion |
| Hero image 1 | Scroll | Parallax up | `y 0 → -120px` across hero `scrollYProgress 0 → 1` | framer-motion `useScroll` + `useTransform` |
| Hero image 2 (framed-print mockup) | Page load / scroll | Scale in, then parallax | `scale 0.94 → 1`, `1.2s`, delay `0.35s`. Scroll `y 0 → -40px` | framer-motion |
| Hero image 3 (album mockup) | Page load / scroll | Rise in, then parallax | `y 40 → 0`, `opacity 0 → 1`, `1.2s`, delay `0.5s`. Scroll `y 0 → -200px`. Both drive `y` on the same element | framer-motion |
| "Packages from" price card | Page load | Pop in | `scale 0.8 → 1`, `opacity 0 → 1`, `0.8s`, `ease`, delay `0.9s` | framer-motion |
| Section headings | In view | [SplitText](#splittext-srccomponentsuiindexjsx) | n/a | framer-motion |
| Category cards | In view | [Reveal](#reveal-srccomponentsuiindexjsx), delay `(i % 2) × 0.1s` | n/a | framer-motion |
| Category card mockup | Hover | Zoom | `scale 1 → 1.04`, `1100ms`, `cubic-bezier(.22,1,.36,1)` | Tailwind |
| Category arrow circle | Hover | Rotate | `rotate 0 → 45°`, `500ms` | Tailwind |
| Bestsellers row (desktop, fine pointer, ≥768px) | Drag | Drag carousel with a little overscroll | `drag="x"`, `dragConstraints` = wrapper, `dragElastic 0.08`. Cursor `grab` / `grabbing` | framer-motion drag |
| Bestsellers row (touch / below 768px) | Swipe | Native horizontal scroll that snaps to each card | `snap-x snap-mandatory`, `snap-start` | CSS scroll-snap |
| Product cards | Hover | See [ProductCard](#productcard-srccomponentsproductcardjsx) | n/a | Tailwind |
| Package cards (dark section) | In view / hover | [Reveal](#reveal-srccomponentsuiindexjsx) delay `i × 0.08s`, plus [PackageCard](#packagecard-srccomponentspackagecardjsx) hover | n/a | framer-motion + Tailwind |
| Quality items | In view | [Reveal](#reveal-srccomponentsuiindexjsx), delay `i × 0.08s` | n/a | framer-motion |
| FAQ | Click | [Accordion](#accordion-srccomponentsuiindexjsx). The first item is open by default | n/a | framer-motion |

**Built but not rendered** (commented out in `Home()`):

| Element | Animation | Values | Library |
|---|---|---|---|
| `Marquee` strip | Infinite horizontal scroll, pauses on hover | `translateX 0 → -50%`, `40s linear infinite`. Images `grayscale 30% → 0` on hover, `500ms` | CSS `@keyframes marquee` + Tailwind |
| `HowItWorks` steps | Reveal; card bg on hover; icon tilt | Bg `→ surface-2` `500ms`. Icon `rotate 0 → -12°` `500ms` | framer-motion + Tailwind |

---

## Shop (`/shop`, `/shop/:categoryId`): [src/pages/Shop.jsx](src/pages/Shop.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Page title | Load / category change | [SplitText](#splittext-srccomponentsuiindexjsx). It is keyed on the category, so it replays on every switch | n/a | framer-motion |
| Sort dropdown | Open | Native `<select>` on ≥768px. [BottomSheet](#bottomsheet-and-select-srccomponentsuiselectjsx) on phones | n/a | framer-motion (phone) |
| Category tab underline | Category changes | The underline slides | `layoutId="shop-tab"`, `0.4s`, `ease` | framer-motion |
| Product grid item | Enters | Staggered fade up | `opacity 0 → 1`, `y 30 → 0`, `0.7s`, `ease`, delay `i × 0.05s` | framer-motion |
| Product grid item | Leaves (category filter) | Fade and shrink | `opacity → 0`, `scale → 0.96`. `mode="popLayout"` | framer-motion |
| Product grid item | Sort changes | Cards glide to their new positions | `layout` on both the grid and the items | framer-motion |
| Product card | Hover | See [ProductCard](#productcard-srccomponentsproductcardjsx) | n/a | Tailwind |
| "Buying more than one piece?" banner | Hover | Background `→ #efefef`. The arrow nudges right | Arrow `translateX 0 → 4px`, Tailwind default | Tailwind |

---

## Product detail (`/product/:id`): [src/pages/Product.jsx](src/pages/Product.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Preview | View switch (In room / Detail / Photo) | Crossfade | `opacity 0 → 1`, exit `→ 0`, `0.4s`. `mode="wait"`, `initial={false}` | framer-motion |
| Preview, "Detail" view | Switch to Detail | Zooms into the piece | `scale 1 → 2.1`, `0.8s`, `ease`, origin `30% 30%` ([ProductMockup](#productmockup-srccomponentsproductmockupjsx)) | framer-motion |
| View switcher pill | View changes | The dark pill slides | `layoutId="view-pill"`, `0.4s`, `ease`. Text colour uses the Tailwind default | framer-motion |
| Price | Option change | [AnimatedNumber](#animatednumber-prices-srccomponentsuiindexjsx) | n/a | framer-motion |
| Options | Hover / select | [OptionGroup](#optiongroup-swatches-sizes-cards-srccomponentsoptiongroupjsx). The mockup resizes with `layout` `0.6s` | n/a | Tailwind + framer-motion |
| "Choose photos" CTA | Hover / press | [Button](#button-srccomponentsuiindexjsx) with arrow | n/a | Tailwind |
| "Save more in a package" rows | Hover | Background `→ surface-2`. The arrow nudges right `4px` | Tailwind default | Tailwind |
| Details / Shipping / Care | Click | [Accordion](#accordion-srccomponentsuiindexjsx). The first item is open by default | n/a | framer-motion |
| Related products | Hover | [ProductCard](#productcard-srccomponentsproductcardjsx) | n/a | Tailwind |

---

## Packages (`/packages`): [src/pages/Packages.jsx](src/pages/Packages.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Title | In view | [SplitText](#splittext-srccomponentsuiindexjsx) | n/a | framer-motion |
| Package cards | In view / hover | [Reveal](#reveal-srccomponentsuiindexjsx) delay `(i % 2) × 0.1s`, plus [PackageCard](#packagecard-srccomponentspackagecardjsx) hover | n/a | framer-motion + Tailwind |

## Package detail (`/packages/:id`): [src/pages/PackageDetail.jsx](src/pages/PackageDetail.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Product mockup tiles (left) | Page load | Staggered fade up | `opacity 0 → 1`, `y 24 → 0`, `0.8s`, `ease`, delay `i × 0.1s` | framer-motion |
| "What's included" rows | In view | [Reveal](#reveal-srccomponentsuiindexjsx), delay `i × 0.06s` | n/a | framer-motion |
| CTA | Hover / press | [Button](#button-srccomponentsuiindexjsx) with arrow | n/a | Tailwind |
| Other packages | Hover | [PackageCard](#packagecard-srccomponentspackagecardjsx) | n/a | Tailwind |

---

## Builder (`/build/:kind/:id`): [src/pages/Builder.jsx](src/pages/Builder.jsx)

### Frame (all steps)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Step pill (top bar) | Step changes | The dark pill slides to the active step | `layoutId="step-pill"`, `0.45s`, `ease` | framer-motion |
| Step connector lines | Step reached | Colour `border → type-0` | `transition-colors`, Tailwind default | Tailwind |
| Total (top bar) | Selection or variant change | [AnimatedNumber](#animatednumber-prices-srccomponentsuiindexjsx) | n/a | framer-motion |
| Step content | Step changes | Old step slides out left, new step slides in from the right | Enter `opacity 0 → 1`, `x 24 → 0`. Exit `x → -24`. `0.45s`, `ease`. `mode="wait"`. The window jumps to the top on each step change | framer-motion |
| Flash message (top centre) | Validation or variant-switch message | Drops in, fades out after 2.2s | Enter `opacity 0 → 1`, `y -8 → 0`. Exit `opacity → 0`. framer default | framer-motion |
| Close button | Hover | Background | Tailwind default | Tailwind |
| Back / Continue buttons | Hover / press | [Button](#button-srccomponentsuiindexjsx) | n/a | Tailwind |
| Add to cart | Click | Goes to the product or package page, then opens the [CartDrawer](#cartdrawer-srccomponentscartdrawerjsx) after `350ms` | `setTimeout` | n/a |

### Step 1: Photos

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Collection tab underline | Collection changes | The underline slides | `layoutId="col-underline"`, `0.4s`, `ease` | framer-motion |
| Photo tile | Enters (first load / collection change) | Staggered fade up | `opacity 0 → 1`, `y 20 → 0`, `0.6s`, `ease`, delay `min(i, 12) × 0.03s` (capped at 0.36s) | framer-motion |
| Photo grid | Collection changes | Reflows | `layout` on the masonry container | framer-motion |
| Photo tile frame | Select / deselect | A dark frame grows around the photo | Padding `0 → 6px` (`p-1.5`), bg `transparent → type-0`, `transition-all duration-300` | Tailwind |
| Photo image | Hover (unselected only) | Zoom | `scale 1 → 1.03`, `duration-700` | Tailwind |
| Selection badge (top right) | Hover / select | Unselected: a hollow ring scales up on hover. Selected: a white disc with the order number | `scale 0.9 → 1`, bg `black/25 → white`. `transition-all duration-300` | Tailwind |
| Preview button (top left) | Tile hover | Fades in | `opacity 0 → 1`, Tailwind default | Tailwind |
| Slot pill (package or multi-item) | Hover / active | Border and outline | Tailwind default | Tailwind |
| Builder lightbox photo | Next / previous / arrow keys | Crossfade with a slight scale | Enter `opacity 0 → 1`, `scale 0.98 → 1`. Exit `opacity → 0`. `0.3s`. `mode="wait"`. The Radix overlay itself does not animate | framer-motion + Radix |
| Selected-photo chips (bottom bar, ≥768px) | Select / deselect | Pop in / out, and the others shift over | `opacity 0 → 1`, `scale 0.6 → 1`. Exit reverses it. `layout`, framer default | framer-motion |
| Selected-photo chip | Hover | A dark overlay with ✕ fades in | `opacity 0 → 1`, Tailwind default | Tailwind |

### Step 2: Crop

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Crop stage | Drag, pinch, wheel; photo change | See [CropEditor](#cropeditor-srccomponentscropeditorjsx) | n/a | framer-motion + pointer events |
| Film-strip thumbs | Current / hover | Current: `ring-2 ring-offset-2`. Others `opacity 70%`, hover `100%` | Tailwind default | Tailwind |
| Print options panel ("Switch") | Open / close | Expands | `height 0 → auto`, `opacity 0 → 1`, `0.4s`, `ease`. `initial={false}` | framer-motion |
| Apply buttons | A draft option changes | The side panel scrolls to keep them visible | `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` | Browser native |
| Orientation pill | Toggle | The pill slides | `layoutId="orient"`, `0.35s`, `ease` | framer-motion |

### Step 3: Review

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Item cards | Step appears | Staggered fade up | `opacity 0 → 1`, `y 16 → 0`, `0.6s`, `ease`, delay `si × 0.08s` | framer-motion |
| "Edit crops" | Click | Jumps back to step 2 at that item, using the step slide above | n/a | framer-motion |

---

## Cart (`/cart`): [src/pages/Cart.jsx](src/pages/Cart.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Title | In view | [SplitText](#splittext-srccomponentsuiindexjsx) | n/a | framer-motion |
| Cart line | Added (for example by Duplicate) | Fade up | `opacity 0 → 1`, `y 16 → 0`, `0.5s`, `ease`. `initial={false}` on the list | framer-motion |
| Cart line | Removed | Slides left and fades | `opacity → 0`, `x → -40`, `0.3s` (the exit sets its own duration) | framer-motion |
| Cart line | Neighbour added or removed | Moves to its new position | `layout` | framer-motion |
| Edit / Duplicate / Remove | Hover | Ghost [Button](#button-srccomponentsuiindexjsx). Remove text turns red | Tailwind `duration-300` | Tailwind |
| Promo code, totals, empty state | n/a | No animation | n/a | n/a |

---

## Checkout (`/checkout`): [src/pages/Checkout.jsx](src/pages/Checkout.jsx), [CheckoutShell.jsx](src/components/CheckoutShell.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Form column (shared with Payment) | Page load | Fade up | `opacity 0 → 1`, `y 14 → 0`, `0.6s`, `ease` | framer-motion |
| Text fields | Focus | See [Field](#field-text-input-srccomponentsuiindexjsx) | n/a | Tailwind |
| Delivery method card | Hover / select | Border and outline | Tailwind default | Tailwind |
| Radio dot | Select | Fills dark | `transition`, Tailwind default | Tailwind |
| Radio check icon | Select | Pops in | `scale 0 → 1`, framer default (spring) | framer-motion |
| "Continue to payment" | Hover / press | [Button](#button-srccomponentsuiindexjsx) with arrow | n/a | Tailwind |

## Payment (`/payment`): [src/pages/Payment.jsx](src/pages/Payment.jsx)

| Element | Trigger | Animation | Values | Library |
|---|---|---|---|---|
| Form column | Page load | Same fade up as Checkout (`CheckoutShell`) | n/a | framer-motion |
| Payment method tab pill | Method changes | The white pill slides. The icon switches to its filled weight | `layoutId="pay-tab"`, `0.35s`, `ease` | framer-motion |
| Method panel (card form / redirect note) | Method changes | Crossfade with a small rise | Enter `opacity 0 → 1`, `y 8 → 0`. Exit `opacity → 0`. `0.3s`. `mode="wait"` | framer-motion |
| Card preview | Typing | Text updates live. No motion | n/a | n/a |
| "Prototype ends here" note | "Make payment" click | Drops in | `opacity 0 → 1`, `y -6 → 0`, framer default | framer-motion |

---

## Gaps and inconsistencies

These are observations, not changes. They are useful when tidying up motion.

1. **No reduced-motion support.** Nothing checks `prefers-reduced-motion`: there is no `MotionConfig reducedMotion="user"`, no `useReducedMotion`, and no `motion-safe:` classes. The parallax, the 1.6s cover zoom and the 40s marquee would be the first to tone down.
2. **Hover timing differs from DesignSystem.md.** That doc says 0.3s for hover changes. Most hovers use bare `transition`, which is Tailwind's 150ms. Only `Button` and a few tiles use `duration-300`.
3. **`ease` is redeclared in about 15 files.** A single export (for example from `src/lib/utils.js`) would keep it in one place.
4. **Two different lightboxes.** The gallery loupe slides horizontally (`0.25s`, `easeOut`, swipe support). The Builder lightbox crossfades with a scale (`0.3s`, no swipe) and has no overlay animation.
5. **Some animations use framer defaults.** The cart and Quick buy overlays, the Builder flash, the bottom-bar photo chips, the checkout radio check, the Accordion plus icon and the Payment "prototype ends" note set no `transition`. They use framer's spring/tween defaults instead of the shared `ease`.
6. **The Home hero image 3** has both an entrance `y` (`40 → 0`) and a scroll-linked `y` (`0 → -200px`) on the same element.
7. **Portfolio hover scrub is mouse-only.** Touch visitors see only the cover, and there is no keyboard equivalent.
8. **Portfolio photos don't fade in.** Gallery tiles fade in over `700ms` when loaded; portfolio covers and gallery-page photos appear abruptly over the grey placeholder.
9. **Two toggle styles.** The portfolio grid/list toggle jumps between options, while the gallery layout menu's segmented control slides a pill with `layoutId`.
10. **Portfolio header is always visible.** The store header hides on scroll down; the portfolio header stays put, and the work toolbar stacks under it, so about 170px of the viewport is chrome while browsing work on mobile (120px on desktop).
11. **Cover editor collection chips don't slide.** They switch instantly, while the editor's tab bar and segmented controls slide a pill with `layoutId`.
12. **Footer changes don't animate.** Switching footer templates or backgrounds swaps the layout instantly, while the cover's text block glides between positions. Adding or removing a social profile has no motion either.
13. **The footer has no entrance motion.** The gallery grid and cover reveal on scroll; the footer simply appears.
14. **Collection headings don't animate.** Switching heading templates, fonts or spacing swaps instantly, and the headings have no scroll reveal, while the portfolio's section headings use `SplitText`.
15. **Delete and clear confirmations use `window.confirm`.** Deleting a set, clearing favourites and unhiding all use the browser's dialog, unlike every other dialog in the app (Radix, animated).
16. **Selection mode has no drag-select and no entry on tablets without a long press.** The Select button is only in the phone dock (below 640px), and touch tablets don't show the hover check.
17. **Hiding has no motion.** A hidden photo vanishes and the grid reflows instantly, where the selected-tile shrink and the lightbox slide are animated. A short fade or collapse would make the change easier to follow.
