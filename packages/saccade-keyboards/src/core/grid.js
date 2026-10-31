/** @typedef {import('./layout.js').Key} Key */

/**
 * A key and where it sits on the grid of the keyboard.
 *
 * @typedef {object} PlacedKey
 * @property {Key} key The key.
 * @property {number} column The first grid column, counted from 1.
 * @property {number} columnSpan How many columns it covers.
 * @property {number} row The grid row, counted from 1.
 * @property {number} rowSpan How many rows it covers.
 */

/** How many columns the grid has. A row is split over them by the widths of its keys. */
export const COLUMNS = 120;

/**
 * Splits `total` columns over keys in proportion to their widths, so that they add up to `total`
 * exactly (the largest remainders get the spare columns) and no key is narrower than one column.
 *
 * @param {number[]} widths The width of each key.
 * @param {number} total The columns to share.
 * @returns {number[]} The columns of each key.
 */
function share(widths, total) {
  const sum = widths.reduce((a, b) => a + b, 0);
  const exact = widths.map((w) => (w / sum) * total);
  const spans = exact.map((x) => Math.max(1, Math.floor(x)));
  let spare = total - spans.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .sort((a, b) => b.rest - a.rest);
  for (let n = 0; spare !== 0 && byRemainder.length > 0; n = (n + 1) % byRemainder.length) {
    const { i } = /** @type {{ i: number }} */ (byRemainder.at(n));
    const next = (spans.at(i) ?? 1) + Math.sign(spare);
    if (next >= 1) {
      spans.splice(i, 1, next);
      spare -= Math.sign(spare);
    }
  }
  return spans;
}

/**
 * Puts the keys of every row on the grid. A row fills the width, like a row of a physical keyboard.
 * A key with `rowSpan` keeps its columns in the rows below, so the keys there share what is left;
 * that works when the tall key sits at the start or the end of its row, like Enter.
 *
 * @param {Key[][]} rows The rows of a layer.
 * @returns {PlacedKey[][]} The same rows with the place of each key.
 */
export function placeKeys(rows) {
  /** @type {Map<number, Set<number>>} Columns taken by a tall key above, by row. */
  const taken = new Map();
  return rows.map((row, r) => {
    const used = taken.get(r) ?? new Set();
    const free = Array.from({ length: COLUMNS }, (_, c) => c).filter((c) => !used.has(c));
    const spans = share(
      row.map((key) => key.width ?? 1),
      free.length,
    );
    let at = 0;
    return row.map((key, k) => {
      const columnSpan = spans.at(k) ?? 1;
      const start = free.at(at) ?? 0;
      at += columnSpan;
      const rowSpan = key.rowSpan ?? 1;
      for (let below = r + 1; below < r + rowSpan; below += 1) {
        const cells = taken.get(below) ?? new Set();
        for (let c = start; c < start + columnSpan; c += 1) cells.add(c);
        taken.set(below, cells);
      }
      return { key, column: start + 1, columnSpan, row: r + 1, rowSpan };
    });
  });
}
