import {
  backspaceKey,
  bottomRow,
  cased,
  shiftKey,
  symbolsLayer,
} from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */

/**
 * How the letters are arranged: `qwerty` like a physical keyboard, or `alphabetical` from a to z.
 *
 * @typedef {'qwerty' | 'alphabetical'} Arrangement
 */

/** The rows of letters of each arrangement, without the shift and backspace keys. */
const ARRANGEMENTS = new Map([
  ['qwerty', ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']],
  ['alphabetical', ['abcdefghij', 'klmnopqrs', 'tuvwxyz']],
]);

/** The English layout in the given arrangement.
 *
 * @param {Arrangement} [type] The arrangement of the letters.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'qwerty') {
  const arrangement = ARRANGEMENTS.get(type);
  if (!arrangement) {
    throw new Error(
      `Unknown arrangement "${type}". Use ${[...ARRANGEMENTS.keys()]
        .map((name) => `"${name}"`)
        .join(' or ')}.`,
    );
  }
  const [top, middle, bottom] = arrangement;
  return {
    id: 'en',
    name: 'English',
    dir: 'ltr',
    layers: {
      letters: [
        cased(top),
        cased(middle),
        [shiftKey, ...cased(bottom), backspaceKey],
        bottomRow({ type: 'layer', to: 'symbols', label: '123', name: 'numbers and symbols' }),
      ],
      symbols: symbolsLayer('1234567890', {
        type: 'layer',
        to: 'letters',
        label: 'ABC',
        name: 'letters',
      }),
    },
  };
}

/**
 * The English layout in QWERTY order, which is what `language="en"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
