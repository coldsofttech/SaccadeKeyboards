import {
  backspaceKey,
  bottomRow,
  cased,
  keys,
  shiftKey,
  symbolsLayer,
} from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */

/**
 * How the letters are arranged: `qwerty` like a Spanish physical keyboard, or `alphabetical` from a
 * to z with the ñ after the n.
 *
 * @typedef {'qwerty' | 'alphabetical'} Arrangement
 */

/** The rows of letters of each arrangement, without the shift and backspace keys. */
const ARRANGEMENTS = new Map([
  ['qwerty', ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm']],
  ['alphabetical', ['abcdefghij', 'klmnñopqrs', 'tuvwxyz']],
]);

/** What a screen reader says for the characters Spanish adds. */
const NAMES = {
  '¿': 'signo de interrogación de apertura',
  '¡': 'signo de exclamación de apertura',
  '€': 'euro',
  '«': 'comillas angulares de apertura',
  '»': 'comillas angulares de cierre',
};

/**
 * The Spanish layout in the given arrangement.
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
  const toNumbers = /** @type {const} */ ({
    type: 'layer',
    to: 'symbols',
    label: '123',
    name: 'números y símbolos',
  });
  const toLetters = /** @type {const} */ ({
    type: 'layer',
    to: 'letters',
    label: 'ABC',
    name: 'letras',
  });
  const toAccents = /** @type {const} */ ({
    type: 'layer',
    to: 'accents',
    label: 'áé',
    name: 'vocales con acento',
  });
  const symbols = symbolsLayer('1234567890', toLetters);
  return {
    id: 'es',
    name: 'Spanish',
    dir: 'ltr',
    layers: {
      letters: [
        cased(top),
        cased(middle),
        [shiftKey, ...cased(bottom), backspaceKey],
        bottomRow([toNumbers, toAccents]),
      ],
      accents: [[shiftKey, ...cased('áéíóúü'), backspaceKey], bottomRow([toLetters, toNumbers])],
      // The inverted marks and the euro sit above the last row of the shared symbols layer.
      symbols: [...symbols.slice(0, -1), keys('¿¡€«»'), ...symbols.slice(-1)],
    },
    names: NAMES,
  };
}

/**
 * The Spanish layout in QWERTY order, which is what `language="es"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
