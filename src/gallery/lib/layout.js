// Pure layout math for the two grid orientations.

/**
 * Vertical (masonry): place each photo in the currently shortest column.
 * Appending photos never moves the ones already placed, so infinite scroll stays stable.
 */
export function masonry(items, columns) {
  const cols = Array.from({ length: columns }, () => ({ items: [], height: 0 }))
  items.forEach((item, index) => {
    let target = cols[0]
    for (const c of cols) if (c.height < target.height - 0.001) target = c
    target.items.push({ item, index })
    target.height += item.h / item.w
  })
  return cols.map((c) => c.items)
}

/**
 * Horizontal (justified rows): exactly `perRow` photos per row, all the same height,
 * filling the row width. An unfilled last row is padded with spacers so it keeps that height.
 */
export function justifiedRows(items, perRow) {
  const rows = []
  for (let i = 0; i < items.length; i += perRow) {
    const slice = items.slice(i, i + perRow).map((item, k) => ({ item, index: i + k }))
    const avg = slice.reduce((s, { item }) => s + item.w / item.h, 0) / slice.length
    rows.push({ cells: slice, spacers: Array(perRow - slice.length).fill(avg) })
  }
  return rows
}
