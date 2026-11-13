/**
 * Typography tokens — single source of truth.
 *
 * Naming follows the design system: `<size>-<weight>`
 *   R = Regular (400) · M = Medium (500) · SB = Semi Bold (600)
 *   A trailing `-P` (Paragraph) marks a long-form variant with looser line height.
 *
 * Each token becomes ONE Tailwind utility that sets font-size, line-height,
 * font-weight and letter-spacing together:  `48-SB` → `text-48-sb`.
 *
 *   ✅ <h1 className="text-48-sb">
 *   ✅ <p  className="text-12-sb uppercase">
 *   ❌ <h1 className="text-48-sb font-medium leading-tight">  — font/leading/tracking
 *      utilities override the token's values; only add them for a deliberate exception.
 *
 * Subheading tokens are uppercase by spec. Tailwind can't encode text-transform
 * in a font-size token, so always pair them with `uppercase` (or use <Eyebrow>).
 *
 * `status`:
 *   'ds'       — defined in the Figma design system
 *   'proposed' — added in code to cover gaps; candidates to add to the DS
 *
 * Consumed by: tailwind.config.js (utilities) and src/lib/utils.js (tailwind-merge).
 */

const WEIGHT = { R: 400, M: 500, SB: 600 }

// Figma "character spacing %" is a percentage of font size → em.
const pct = (p) => `${p / 100}em`

const t = (category, size, weight, lineHeight, spacing = 0, extra = {}) => ({
  category,
  fontSize: size,
  fontWeight: WEIGHT[weight],
  lineHeight,
  letterSpacing: pct(spacing),
  textTransform: 'none',
  status: 'ds',
  ...extra,
})

const proposed = { status: 'proposed' }
const upper = { textTransform: 'uppercase' }

export const typography = {
  // ── Display (proposed) — marketing heroes only. Tight tracking keeps Geist
  //    from looking loose at very large sizes.
  '96-SB': t('display', 96, 'SB', 92, -4, proposed), // portfolio hero
  '72-SB': t('display', 72, 'SB', 72, -3, proposed),
  '60-SB': t('display', 60, 'SB', 64, -3, proposed),

  // ── Headers
  '48-SB': t('header', 48, 'SB', 52),
  '36-SB': t('header', 36, 'SB', 40),
  '30-M': t('header', 30, 'M', 32),
  '24-M': t('header', 24, 'M', 28, 0, proposed), // card titles, large prices (gap between 30 and 20)
  '20-M': t('header', 20, 'M', 24),
  '16-SB': t('header', 16, 'SB', 20),
  '14-SB': t('header', 14, 'SB', 20),
  '13-SB': t('header', 13, 'SB', 16),

  // ── Body
  '18-R': t('body', 18, 'R', 28, 0, proposed), // lead / intro paragraph under a hero
  '16-R': t('body', 16, 'R', 20),
  '14-R': t('body', 14, 'R', 20),
  '13-R': t('body', 13, 'R', 16),
  '12-R': t('body', 12, 'R', 16),
  '11-R': t('body', 11, 'R', 16),

  // ── Paragraph (proposed) — multi-line copy: FAQs, descriptions, notices.
  //    Body tokens' tight line heights are tuned for single lines and get cramped when wrapped.
  '16-R-P': t('paragraph', 16, 'R', 24, 0, proposed),
  '14-R-P': t('paragraph', 14, 'R', 22, 0, proposed),
  '13-R-P': t('paragraph', 13, 'R', 20, 0, proposed),
  '12-R-P': t('paragraph', 12, 'R', 18, 0, proposed),

  // ── Label
  '16-M': t('label', 16, 'M', 20, 0, proposed), // large buttons, product-card names
  '14-M': t('label', 14, 'M', 20),
  '13-M': t('label', 13, 'M', 20),
  '12-M': t('label', 12, 'M', 16),
  '11-M': t('label', 11, 'M', 12),
  '10-M': t('label', 10, 'M', 12),

  // ── Subheading — uppercase (pair with `uppercase`)
  '12-SB': t('subheading', 12, 'SB', 16, 0.5, upper),
  '11-SB': t('subheading', 11, 'SB', 12, 0.5, upper),
  '10-SB': t('subheading', 10, 'SB', 12, 0.5, upper),
}

/** `48-SB` → `48-sb` (the Tailwind key; utility is `text-48-sb`). */
export const tokenKey = (name) => name.toLowerCase()

/** Tailwind `theme.fontSize` entries. */
export const fontSize = Object.fromEntries(
  Object.entries(typography).map(([name, s]) => [
    tokenKey(name),
    [
      `${s.fontSize / 16}rem`,
      { lineHeight: `${s.lineHeight}px`, fontWeight: String(s.fontWeight), letterSpacing: s.letterSpacing },
    ],
  ])
)

/** Token keys, for registering with tailwind-merge. */
export const fontSizeKeys = Object.keys(fontSize)
