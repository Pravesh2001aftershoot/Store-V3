# Store V3: Design System

This doc describes the tokens, primitives and conventions the UI is built with. The code is the source of truth:

| What | Where |
|---|---|
| Colour, radius and animation tokens | `src/index.css` (CSS variables plus `@theme inline`) |
| Type tokens | `src/tokens/typography.js` |
| Tailwind wiring | `tailwind.config.js` (loaded with `@config` in `src/index.css`) |
| Class merging | `src/lib/utils.js` (`cn()`) |
| Primitives | `src/components/ui/index.jsx` |

## Principles

- **The photos carry the colour.** The UI is monochrome: neutral surfaces, near-black text and near-black primary actions. Colour appears only for meaning, such as success, destructive actions, a favourited heart or a frame swatch.
- **Use a token, not a value.** Pick type, colour and radius from the tokens. Don't use one-off pixel values or hex colours.
- **Motion should be quiet.** Use one shared easing curve, reveal content once, and animate prices instead of swapping them abruptly.
- **Design for touch first.** Tap targets should be at least 32px and usually 40px. Every gallery layout works on mobile.
- **Light theme only, for now.** There is no dark mode yet.

## Colour

Colours are defined as CSS variables on `:root` and exposed as Tailwind colours, for example `bg-surface-1`, `text-type-2` and `border-border`.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `surface-0` | `#fafafa` | Page background (`background`) |
| `surface-1` | `#ffffff` | Cards, inputs, popovers, sheets (`card`) |
| `surface-2` | `#f6f6f6` | Hover fills, secondary buttons, chips, muted areas (`muted`) |

### Type colours

| Token | Value | Use |
|---|---|---|
| `type-0` | `#181818` | Headings, primary text, active states (`foreground`) |
| `type-1` | `#474747` | Secondary text, labels, ghost buttons |
| `type-2` | `#71717a` | Supporting text and descriptions (`muted-foreground`) |
| `type-3` | `#919191` | Hints, placeholders, meta text, footnotes |

### Semantic colours

| Token | Value | Use |
|---|---|---|
| `primary` / `primary-foreground` | `#181818` / `#fafafa` | Primary buttons, dark badges, selected pills |
| `border` | `#ebebeb` | Dividers and card borders. This is the default border colour for every element. |
| `input` | `#e4e4e7` | Input and outline-button borders |
| `ring` | `#181818` | Focus rings |
| `success` / `success-bg` | `#15803d` / `#ecfdf3` | Savings, "Great quality", confirmations |
| `destructive` | `#dc2626` | Remove actions, errors, the favourite heart |

**Known exception.** A few hover shades are hard-coded: `#2c2c2c` is the primary hover colour, and `#ececec` and `#ededed` are surface hovers. These are candidates for new `primary-hover` and `surface-3` tokens.

## Typography

The font is **Geist Variable**, with stylistic sets `ss01` and `cv11` on and antialiasing turned on.

### Naming

Tokens are named `<size>-<weight>`. The weight letters are **R** (Regular, 400), **M** (Medium, 500) and **SB** (Semi Bold, 600). A trailing **-P** marks a paragraph variant with a looser line height for multi-line text.

Each token becomes a single Tailwind class that sets the font size, line height, weight and letter spacing together. For example, `48-SB` becomes `text-48-sb`.

```jsx
<h1 className="text-48-sb">            ✅
<p className="text-12-sb uppercase">   ✅  subheadings need `uppercase`
<h1 className="text-48-sb font-medium leading-tight">   ❌  overrides the token
<p className="text-[15px]">            ❌  raw sizes aren't allowed
```

### Scale

Sizes and line heights are in pixels. "Proposed" tokens were added in code to fill gaps and are not yet in the Figma design system.

| Category | Token | Size / line height | Notes |
|---|---|---|---|
| Display | `96-SB` | 96 / 92, -4% tracking | Proposed. Portfolio hero only. |
| | `72-SB` | 72 / 72, -3% tracking | Proposed. Marketing heroes; portfolio hero (md) and gallery page title (md). |
| | `60-SB` | 60 / 64, -3% tracking | Proposed. Portfolio contact heading (md). |
| Header | `48-SB` | 48 / 52 | Page titles (desktop) |
| | `36-SB` | 36 / 40 | Page titles (mobile), section heads |
| | `30-M` | 30 / 32 | Section heads |
| | `24-M` | 24 / 28 | Proposed. Card titles, large prices, gallery section headings. |
| | `20-M` | 20 / 24 | |
| | `16-SB` | 16 / 20 | Panel titles, summary heads |
| | `14-SB` | 14 / 20 | |
| | `13-SB` | 13 / 16 | |
| Body | `18-R` | 18 / 28 | Proposed. Lead paragraph under a hero. |
| | `16-R` | 16 / 20 | |
| | `14-R` | 14 / 20 | Default body text |
| | `13-R` | 13 / 16 | |
| | `12-R` | 12 / 16 | Meta text and captions (the most used token) |
| | `11-R` | 11 / 16 | |
| Paragraph | `16-R-P` | 16 / 24 | Proposed. Multi-line copy. |
| | `14-R-P` | 14 / 22 | Proposed. FAQ answers, descriptions. |
| | `13-R-P` | 13 / 20 | Proposed |
| | `12-R-P` | 12 / 18 | Proposed |
| Label | `16-M` | 16 / 20 | Proposed. Large buttons, product card names. |
| | `14-M` | 14 / 20 | Buttons (md), links |
| | `13-M` | 13 / 20 | Buttons (sm), field labels, option labels |
| | `12-M` | 12 / 16 | |
| | `11-M` | 11 / 12 | Badges |
| | `10-M` | 10 / 12 | |
| Subheading | `12-SB` | 12 / 16, +0.5% tracking | Uppercase. Eyebrows. |
| | `11-SB` | 11 / 12, +0.5% tracking | Uppercase |
| | `10-SB` | 10 / 12, +0.5% tracking | Uppercase |

### Rules

- Use a **paragraph (-P) token** for any text that wraps onto more than one line. The body tokens have line heights tuned for a single line, so wrapped text looks cramped.
- **Subheading tokens must be uppercase.** Tailwind can't set text-transform in a font-size token, so always add `uppercase` or use `<Eyebrow>`.
- **Responsive type** steps between tokens, for example `text-36-sb md:text-48-sb`.
- **Numbers** that change, such as prices and counts, use `tabular-nums`.

### Adding a token

1. Add it to `typography` in `src/tokens/typography.js` using `t(category, size, weight, lineHeight, tracking%, extra)`. Mark it `proposed` unless it already exists in Figma.
2. Nothing else needs changing. Tailwind and `cn()` both read the generated `fontSize` and `fontSizeKeys`.

**Why `cn()` matters.** The tokens are registered with tailwind-merge in `src/lib/utils.js`. Without that registration, tailwind-merge reads `text-14-r` as a text colour and drops it when it's combined with a class like `text-type-2`. Always combine classes with `cn()`.

## Radius

The base radius is `--radius: 0.75rem` (12px).

| Class | Value | Use |
|---|---|---|
| `rounded-full` | pill | Buttons, badges, chips, icon buttons, swatches, tabs |
| `rounded-2xl` | 16px | Large cards, sheets, image containers |
| `rounded-xl` | 12px | Cards, notices, option cards |
| `rounded-lg` | 12px (`--radius`) | Inputs, list rows |
| `rounded-md` / `rounded-sm` | 10px / 8px | Small inner elements |

Product mockups use tiny literal radii such as `rounded-[2px]` to imitate physical objects. This is intentional.

## Spacing and layout

- Spacing uses the standard Tailwind 4px scale.
- **Page widths.** Store pages use `max-w-[1600px]`; the gallery and the portfolio use `max-w-[1800px]`. All are centred with `mx-auto`.
- **Gutters.** Page gutters are `px-4` on mobile and `md:px-8` (gallery, portfolio) or `md:px-6` (Builder) on larger screens.
- **Sticky bars** are `h-16`, use `bg-surface-0/90 backdrop-blur-xl`, and have a bottom border. The portfolio header is the exception: it is solid `bg-surface-0`, and the portfolio's work toolbar sticks directly beneath it at `top-16`.
- **Anchor offsets.** Sections that are anchor targets under a sticky header use `scroll-mt-16` (portfolio `#about`, `#work`, `#contact`).
- **Breakpoints.** Tailwind defaults are used: `sm` 640, `md` 768, `lg` 1024. The gallery's JavaScript layout uses three tiers through `useBreakpoint()`:
  - mobile: below 640
  - tablet: 640 to 1023
  - desktop: 1024 and up

### Gallery grid tokens (`src/gallery/lib/settings.js`)

| Spacing | Gap (mobile / tablet / desktop) | Page margin (mobile / tablet / desktop) |
|---|---|---|
| `airy` | 16 / 32 / 48 | 16 / 32 / 48 |
| `thin` (default) | 4 / 4 / 4 | 4 / 16 / 16 |
| `none` | 0 | 0 |

| Size | Photos per row (mobile / tablet / desktop) |
|---|---|
| `small` | 2 / 3 / 4 |
| `medium` (default) | 2 / 3 / 3 |
| `large` | 1 / 2 / 2 |

### Portfolio grids (`src/portfolio/`)

| Grid | Columns (mobile / tablet / desktop) | Gap |
|---|---|---|
| Work cards (`WorkGrid`) | 1 below 480px, 2 from 480px, 3 from `lg`, 4 from `2xl` | `gap-x-4 gap-y-8`, `lg:gap-x-6 lg:gap-y-10` |
| Gallery photos (`ProjectPage`, masonry) | 2 / 3 / 3 | 4px, 8px from `md` |
| "More <genre>" cards | 2, 4 from `lg` | `gap-x-4 gap-y-8`, `lg:gap-x-6` |

Portfolio cards and photos are square-cornered: work is shown edge to edge, like the gallery grid. The portrait (`rounded-lg`) and list-row thumbnails (`rounded-md`) are the only rounded images.

## Iconography

- Icons come from **Phosphor** (`@phosphor-icons/react`).
- Sizes: 14–16 in dense controls, 18 in nav and toolbar buttons.
- Weight is `regular` by default. Use `fill` for an active state, such as a favourited heart, and `bold` for small arrows and plus/minus.
- Icon-only buttons must have an `aria-label`. Add a `title` where a tooltip helps.

## Elevation and effects

- Shadows are kept to a minimum. Separation comes from borders and surface changes.
- The primary button has a subtle built-in shadow plus an inset highlight.
- Overlays such as sticky bars and photo-tile actions use translucent surfaces with backdrop blur, for example `bg-surface-1/90 backdrop-blur`.
- `.wall` is a soft radial gradient used as the backdrop for product mockups.
- `.no-scrollbar` hides scrollbars on rows that scroll sideways, such as tabs and carousels.
- `.range` is the styled slider (crop zoom). Its filled portion is driven by `--p`.

## Motion

- **Easing.** One curve is shared everywhere: `[0.22, 1, 0.36, 1]` (ease-out-quint style).
- **Durations.**
  - 0.3s for buttons and hover changes
  - 0.35s for number changes
  - 0.4–0.45s for accordions and step pills
  - 0.9s for reveals
- **Patterns.**
  - Content fades and slides up once as it enters the viewport (`Reveal`).
  - Big headings reveal word by word (`SplitText`).
  - Prices roll to their new value (`AnimatedNumber`).
  - Shared elements, such as the active step pill, move between positions with `layoutId`.
- **Press feedback.** Buttons scale down slightly when pressed (`active:scale-[0.98]`).

## Components

### Primitives (`src/components/ui/index.jsx`)

| Component | API | Notes |
|---|---|---|
| `Button` | `variant`: `default` · `outline` · `secondary` · `ghost` · `light` · `link`<br>`size`: `sm` (32) · `md` (40) · `lg` (48) · `icon` · `icon-sm`<br>`arrow`, `as` | Pill shaped, built with `cva`. `arrow` adds an arrow that slides on hover. `as={Link}` makes it a router link. |
| `Badge` | `tone`: `default` · `dark` · `success` · `muted` | Pill, `text-11-m` |
| `Eyebrow` | `children` | Uppercase `12-SB` label with a leading dot, placed above section titles |
| `Reveal` | `delay`, `y`, `as` | Fades and slides up once when it enters the viewport |
| `SplitText` | `text`, `as`, `delay` | Masked word-by-word heading reveal |
| `AnimatedNumber` | `value`, `format` | Rolling number, used with `money()` for prices |
| `Accordion` | `items: [{q, a}]`, `defaultOpen` | FAQ list with a plus/minus toggle |
| `Field` | `label`, `error`, plus any input props | Labelled input, 44px high, with a focus ring and error state |

### Composite components

| Component | Purpose |
|---|---|
| `OptionGroup` | Renders one product option by type: `size`, `swatch` (colour circles), `segmented`, `card` (label plus note). Has a `compact` mode for side panels. |
| `ProductMockup` | Product preview drawn in CSS, using the client's photos, crops and chosen variant |
| `CroppedImage` | Renders a photo inside a frame using a stored crop. The output looks the same at any size. |
| `CropEditor` | Crop area with drag to pan and wheel or pinch to zoom. The area that will be trimmed is dimmed. |
| `ProductCard` / `PackageCard` | Catalogue tiles |
| `OrderSummary`, `Totals`, `PromoField` | Checkout summary blocks |
| `CartDrawer` | Radix dialog sheet that holds the cart |
| `CheckoutShell` | Minimal header and step indicator for checkout and payment |
| Gallery: `Cover`, `NavBar`, `GalleryGrid`, `Photo`, `Lightbox`, `Toaster` | See `src/gallery/` |
| `CoverEditor` | 400px left pane on tablet/desktop (`inset-y-2 left-2 rounded-2xl`), bottom sheet on phones (`58svh`, collapses to a `64px` bar). Header: `16-SB` title, `12-R type-2` template name, close and Preview/Edit pills in `surface-2`. A 4-tab pill bar, a scrolling body, and a footer with "Reset all" (ghost) and "Done" (primary). |
| Cover editor controls (`src/gallery/cover/controls.jsx`) | `Section` (an `11-SB` uppercase `type-2` title with an optional `12-R type-3` hint, separated by hairlines), `Segmented`, `PositionGrid` (3×3 grid over a 16:9 mini cover), `Slider` (the shared `.range` input with a `tabular-nums` value), `Switch` (40×24, `type-0` when on) and `TextField` (40px input with a hint and an `n/limit` counter that turns amber, then `destructive`) |
| Cover photo picker (Photo tab) | A dashed upload box (`rounded-xl`, `border-dashed`), an uploaded-photo row (80×56 thumbnail, name, trash icon button), collection chips and a 3-column grid of square thumbnails (`rounded-lg`, 6px gap) with "Show more" (secondary) every 36 |
| `PortfolioHeader` | Sticky portfolio bar: back link (label hidden below `sm`), photographer name, section anchor links (`md` and up) and a small "Enquire" `mailto:` button |
| `Hero` (portfolio) | Greeting (`text-48-sb md:text-72-sb xl:text-96-sb`), disciplines in `20-M type-2`, bio in `16-R-P` (`18-R` from `md`), CTAs, a 4:5 portrait (4:3 on `sm`–`md`), and a facts strip of `11-SB` labels over `14-M` values. "Availability" has a `success` dot. |
| `ProjectCard` | Portfolio gallery card: 4:5 cover, title `16-M`, "Genre · Location" `13-R type-2`, photo count `13-R type-3 tabular-nums`. On hover: bottom gradient, scrub progress bars and a white arrow disc. |
| `ProjectRow` | List-view row: 56px (72px from `md`) square thumbnail, title, genre, location, photo count and an arrow. Collapses to thumbnail, title and year on mobile. |
| `WorkGrid` | "Selected work" section: genre tabs, search, sort select, grid/list toggle, year group headings (`24-M` + count + hairline rule) |
| `Contact` | Footer CTA on `surface-1` with a top border: `36-SB` / `60-SB` heading, email and "Browse galleries" buttons (full width below `sm`), and key–value rows |

### Common patterns

- **Segmented control.** A row of pills on `surface-2`. The selected pill is `surface-1` with a shadow. Used in the gallery layout menu, option groups, and the cover editor's tab bar and settings.
- **Filter chips.** 32px pills that scroll sideways: `surface-2` with `type-1` text, and `type-0` with white text when chosen. Used for collections in the cover photo picker.
- **Photo picker.** Square thumbnails in a 3-column grid. The chosen one gets `ring-2 ring-type-0 ring-offset-2` and a white check badge in the top-right corner, the same treatment as selected template cards.
- **Upload drop zone.** A full-width dashed box with an icon, a `13-M` action and a `12-R type-3` "or drop an image here". The border turns `type-0` while a file is dragged over it, and the icon becomes a spinner while the file is read. Errors appear below in `12-R destructive`.
- **Selected state.**
  - Pills: `ring-2 ring-type-0 ring-offset-2`.
  - Tabs and toggles: `bg-surface-2 text-type-0`, with `aria-pressed` or `aria-selected` set.
- **Lightbox film strip.** A horizontal row of thumbnails below the photo at every breakpoint (56px tall on mobile, 80px from `md`), with an 8px gap, centred when it fits and scrolling sideways otherwise. Inactive thumbnails sit at 50% opacity (80% on hover). The current one is fully opaque with `ring-2 ring-white ring-offset-2 ring-offset-type-0`. Keep padding inside the scroll container so the ring isn't clipped.
- **Underline tabs.** Text tabs with a 2px `type-0` underline that slides between tabs (`layoutId`). Inactive `type-2`, active `type-0`, counts in `type-3 tabular-nums`. Used for gallery collections and portfolio genres.
- **Toolbar inputs (portfolio).** Search and sort are 36px (`h-9`) pills with an `input` border on `surface-1`; the border turns `type-0` on focus. The grid/list toggle is a segmented control with icon buttons.
- **Key–value details.** An `11-SB` uppercase `type-3` label over a `14-M` `type-0` value, laid out in a 2- or 4-column grid. Used in the portfolio hero facts and on the gallery page.
- **Tile hover actions.** Shown on hover or focus only. Hidden on touch devices (`[@media(hover:none)]:hidden`); the lightbox is the touch path to the same actions.
- **Quality tones.** `good` uses success colours, `ok` is neutral, and `low` uses amber. Low resolution is a warning and never blocks the order.
- **Prices.** Format with `money()`, which drops the decimals for whole dollars. Strike-through compare-at prices use `type-3`, and savings use `success`.
- **Empty states.** Title in `20-M` or `30-M`, a one-line `type-2` explanation, and one or two calls to action. The portfolio's no-results state is smaller (`16-M` title, `14-R` hint, one "Clear filters" pill).
- **Toasts.**
  - Gallery: `notify(message)` from `gallery/lib/actions.js`.
  - Builder: its own flash bar.

## Accessibility checklist

- [ ] Icon-only controls have an `aria-label`.
- [ ] Toggles expose state with `aria-pressed`, `aria-expanded` or `aria-selected`.
- [ ] Focus is visible: buttons use `focus-visible:ring-2 ring-ring` and fields use `focus:ring-4 ring-black/5`.
- [ ] Dialogs and sheets use Radix Dialog for focus trapping and Esc handling.
- [ ] The lightbox supports the arrow keys and Esc.
- [ ] Portfolio genre tabs are in `<nav aria-label="Genres">` with `aria-current` on the active tab; the view toggle is `role="group" aria-label="View"` with `aria-pressed`; search and sort have accessible labels.
- [ ] Portfolio photos use `alt=""` because they are decorative alongside the gallery title. Give them real alt text once captions exist.
- [ ] Film strip thumbnails are buttons with `aria-label="View <name>"`; the current one has `aria-current`, and the strip is a `<nav aria-label="Film strip">`.
- [ ] Cover editor tabs use `role="tablist"` / `role="tab"` with `aria-selected`; segmented controls and the position grid are `radiogroup`s; photo thumbnails and template cards use `aria-pressed`, and thumbnails are labelled "Use <name> as cover". The upload box is a real button, so the file picker works from the keyboard as well as by drag and drop.
- [ ] Text contrast: `type-2` and `type-3` are for secondary text only. Don't use `type-3` for anything essential.

## Backlog

- Add `primary-hover` and `surface-3` tokens to replace the hard-coded hover hex values.
- Get the proposed type tokens (display, `24-M`, `18-R`, paragraph, `16-M`) reviewed and added to Figma.
- Add a dark theme. Tokens are already CSS variables, so this means adding a second set of values.
- Turn the segmented control and the tab pill into shared primitives. Today they are written separately in the gallery NavBar, OptionGroup, the Builder and the portfolio WorkGrid.
- The portfolio "Clear filters" button uses a hard-coded `hover:bg-[#ededed]`, another case for a `surface-3` token. So do the cover editor's icon pills and collection chips (`hover:bg-[#ececec]`).
