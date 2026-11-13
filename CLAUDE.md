# CLAUDE.md

Working rules for this repo (Store V3 prototype: client gallery, portfolio, print store and the photographer dashboard).

## Keep the docs in step with the code

Whenever a change adds a new flow or feature, changes an interaction, or records a product or technical decision, update the docs **in the same change**. A task isn't done until its docs are.

| Doc | Update it when… |
|---|---|
| `PRD.md` | A feature, requirement, non-goal, success criterion or open question is added, changed or answered. |
| `Architecture.md` | Files, routes, state, storage keys, data shapes or how modules connect change. Also add to "Production shape" and "Known gaps" when relevant. |
| `DesignSystem.md` | A component, pattern, token use, layout spec, breakpoint or motion value is added or changed. |
| `Interactions.md` / `Interaction.md` | What a click, tap, key, drag, toast, confirmation or empty state does changes, or a new one is added. |

Which set to update:
- **Client side** (gallery, portfolio, print store): the root docs: `PRD.md`, `Architecture.md`, `DesignSystem.md`, `Interaction.md`.
- **Photographer dashboard** (`src/photographer-dashboard/`): the docs in that folder: `PRD.md`, `Architecture.md`, `DesignSystem.md`, `Interactions.md`. Also update the root `Architecture.md` when shared code changes (routes in `App.jsx`, `src/data/`, `src/lib/`, settings hooks).
- A change that spans both updates both.

How to write them:
- Edit the existing sections; don't append a changelog. Docs describe how things work now.
- Remove or correct anything the change makes untrue, including requirements, gaps and open questions it resolves.
- Be specific: real component names, file paths, storage keys, sizes in px, limits and the exact UI copy.
- At the end of the task, list which docs you updated.

## Phone UI rules (under 640px)

1. **Buttons are full width on phones.** Primary and secondary actions (page header actions, dialog and sheet footers, form submits, empty-state actions) span the full width of their container. Two actions side by side share the row equally (`flex-1`). Exceptions: icon-only buttons (`IconButton`, ✕, ⋯, steppers), chips and filters, toggles, and inline text links.
2. **Dropdowns open as a bottom sheet on phones.** Any list of options (selects, menus such as ⋯ and "Move to", pickers) opens as a bottom sheet. Don't use a floating popover or the native `<select>` picker on phones. Reuse `BottomSheet` / `Select` from `src/components/ui/` (the `Select` there already switches to a sheet on phones) rather than building a new sheet. Desktop and tablet keep the popover.

## Conventions

- Use the existing tokens and type classes (`surface-*`, `type-*`, `text-14-m`, …) and components. Don't add colours, fonts or one-off sizes.
- Motion uses the app curve `[0.22, 1, 0.36, 1]`.
- Every screen must work at 390px wide.
- Settings are saved with `src/lib/persisted.js`. Per-gallery settings are keyed with `galleryKey(id, name)` from `src/data/galleries.js`.
- Check UI changes in the browser at desktop (1440), tablet (820) and phone (390) widths, and run `npx vite build` before calling a task done.
- Don't commit unless asked.
