/**
 * @typedef {object} Selection
 * @property {number} start Where the selection (or caret) starts.
 * @property {number} end Where it ends. Equal to `start` for a caret.
 */

/**
 * @typedef {object} KeyPress
 * @property {'text' | 'backspace' | 'enter'} type
 * @property {string} [value] What a text key types.
 */

/**
 * Applies a key press to the text of a field: a text key replaces the selection, backspace removes
 * the selection or the character before the caret, and enter adds a line break.
 *
 * @param {string} text The current text.
 * @param {Selection} selection The selection or caret in `text`.
 * @param {KeyPress} key The key that was pressed.
 * @returns {{ text: string, selection: Selection }} The new text, with the caret after the change.
 */
export function applyKey(text, selection, key) {
  const start = Math.min(selection.start, selection.end);
  const end = Math.max(selection.start, selection.end);
  let from = start;
  let insert = '';
  if (key.type === 'text') insert = key.value ?? '';
  else if (key.type === 'enter') insert = '\n';
  else if (key.type === 'backspace' && start === end && start > 0) {
    // Remove a whole code point, so a surrogate pair is never cut in half.
    const before = text.slice(0, start);
    from = start - ([...before].at(-1)?.length ?? 1);
  }
  const caret = from + insert.length;
  return {
    text: text.slice(0, from) + insert + text.slice(end),
    selection: { start: caret, end: caret },
  };
}
