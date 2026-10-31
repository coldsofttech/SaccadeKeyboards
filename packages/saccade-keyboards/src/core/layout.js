// A keyboard layout is data. Its `layers` map a layer name to rows, the first layer being the one
// shown first. A row is a list of keys; a key is one of
//   { type: 'text', value, shift? }  types `value` (or `shift` while shift is on)
//   { type: 'shift' | 'backspace' | 'enter' | 'space' | 'close' }
//   { type: 'layer', to, label, name? } switches layer
// `width` is the share of a row the key takes (1 is one ordinary key).

/**
 * @typedef {object} TextKey
 * @property {'text'} type
 * @property {string} value What the key types.
 * @property {string} [shift] What it types while shift is on.
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 */

/**
 * @typedef {object} ActionKey
 * @property {'shift' | 'backspace' | 'enter' | 'space' | 'close'} type
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 */

/**
 * @typedef {object} LayerKey
 * @property {'layer'} type
 * @property {string} to The layer to show.
 * @property {string} label Text on the key.
 * @property {string} [name] What a screen reader says (the label).
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 */

/** @typedef {TextKey | ActionKey | LayerKey} Key */

/**
 * @typedef {object} Layout
 * @property {string} id Language code, such as `en`.
 * @property {string} name Name of the language, such as `English`.
 * @property {'ltr' | 'rtl'} dir Reading direction of the language. Keys always sit left to right.
 * @property {string[]} [fonts] Font families the keys need, for the host to load.
 * @property {Record<string, Key[][]>} layers Layer name to rows of keys.
 * @property {Record<string, string>} [names] What a screen reader says for a character.
 */

const ACTIONS = ['shift', 'backspace', 'enter', 'space', 'close'];

/**
 * Keys that type `normal`, and `shifted` (one character each) while shift is on.
 *
 * @param {string} normal Characters, one per key.
 * @param {string} [shifted] Their shifted characters, in the same order.
 * @returns {TextKey[]} The keys.
 */
export function keys(normal, shifted = '') {
  const upper = [...shifted];
  return [...normal].map((value, i) => {
    const capital = upper.at(i);
    return capital ? { type: 'text', value, shift: capital } : { type: 'text', value };
  });
}

/**
 * Keys for letters of a script with case: each types the letter, and its capital with shift.
 *
 * @param {string} letters Lower case letters, one per key.
 * @returns {TextKey[]} The keys.
 */
export const cased = (letters) => keys(letters, letters.toUpperCase());

/** @type {ActionKey} */
export const backspaceKey = { type: 'backspace', width: 1.5 };
/** @type {ActionKey} */
export const shiftKey = { type: 'shift', width: 1.5 };

/**
 * The last row of every layer: a key to another layer (or several), `marks` (a comma and a full
 * stop by default), space, enter and hide.
 *
 * @param {LayerKey | LayerKey[]} layerKey The key (or keys) to another layer.
 * @param {string} [marks] Punctuation keys beside the space key.
 * @returns {Key[]} The row.
 */
export function bottomRow(layerKey, marks = ',.') {
  return [
    ...[layerKey].flat().map((key) => ({ ...key, width: 1.5 })),
    ...keys(marks),
    { type: 'space', width: 5 },
    { type: 'enter', width: 1.5 },
    { type: 'close', width: 1.5 },
  ];
}

/**
 * The numbers and symbols layer every language can share, but for the row of digits (so a language
 * can show its own) and the key back to its letters.
 *
 * @param {string} digits The row of digits, one per key.
 * @param {LayerKey} backKey The key back to the letters.
 * @returns {Key[][]} The rows.
 */
export function symbolsLayer(digits, backKey) {
  return [
    keys(digits),
    keys('-/:;()$&@"'),
    keys('[]{}#%^*+='),
    [...keys("_\\|~<>?!'"), backspaceKey],
    bottomRow(backKey),
  ];
}

/** What a screen reader says for the punctuation of the shared symbols layer. */
export const PUNCTUATION_NAMES = {
  ',': 'comma',
  '.': 'full stop',
  '-': 'hyphen',
  '/': 'slash',
  ':': 'colon',
  ';': 'semicolon',
  '(': 'open parenthesis',
  ')': 'close parenthesis',
  $: 'dollar',
  '&': 'ampersand',
  '@': 'at sign',
  '"': 'double quote',
  '[': 'open bracket',
  ']': 'close bracket',
  '{': 'open brace',
  '}': 'close brace',
  '#': 'hash',
  '%': 'percent',
  '^': 'caret',
  '*': 'asterisk',
  '+': 'plus',
  '=': 'equals',
  _: 'underscore',
  '\\': 'backslash',
  '|': 'vertical bar',
  '~': 'tilde',
  '<': 'less than',
  '>': 'greater than',
  '?': 'question mark',
  '!': 'exclamation mark',
  "'": 'apostrophe',
};

/** @param {unknown} value */
const isText = (value) => typeof value === 'string' && value !== '';

/**
 * @param {any} key
 * @param {string} where
 * @param {string[]} layerNames
 * @returns {string[]}
 */
function keyProblems(key, where, layerNames) {
  if (key === null || typeof key !== 'object') return [`${where}: a key must be an object`];
  const problems = [];
  if (key.width !== undefined && !(typeof key.width === 'number' && key.width > 0)) {
    problems.push(`${where}: width must be a positive number`);
  }
  if (key.type === 'text') {
    if (!isText(key.value)) problems.push(`${where}: a text key needs a value`);
    if (key.shift !== undefined && !isText(key.shift)) {
      problems.push(`${where}: shift must be a non-empty string`);
    }
  } else if (key.type === 'layer') {
    if (!layerNames.includes(key.to)) problems.push(`${where}: no layer named "${key.to}"`);
    if (!isText(key.label)) problems.push(`${where}: a layer key needs a label`);
  } else if (!ACTIONS.includes(key.type)) {
    problems.push(`${where}: unknown key type "${key.type}"`);
  }
  return problems;
}

/**
 * Checks a layout against the documented format.
 *
 * @param {unknown} layout The layout to check.
 * @returns {string[]} What is wrong with it; empty when it is valid.
 */
export function validateLayout(layout) {
  if (layout === null || typeof layout !== 'object') return ['a layout must be an object'];
  const { id, name, dir, fonts, layers, names } = /** @type {Record<string, any>} */ (layout);
  const problems = [];
  if (!isText(id)) problems.push('id must be a non-empty string');
  if (!isText(name)) problems.push('name must be a non-empty string');
  if (dir !== 'ltr' && dir !== 'rtl') problems.push('dir must be "ltr" or "rtl"');
  if (fonts !== undefined && !(Array.isArray(fonts) && fonts.every(isText))) {
    problems.push('fonts must be a list of font family names');
  }
  if (names !== undefined && (names === null || typeof names !== 'object')) {
    problems.push('names must be an object');
  }
  if (layers === null || typeof layers !== 'object' || Object.keys(layers).length === 0) {
    problems.push('layers must be an object with at least one layer');
    return problems;
  }
  const layerNames = Object.keys(layers);
  Object.entries(layers).forEach(([layer, rows]) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      problems.push(`layer "${layer}": must be a non-empty list of rows`);
      return;
    }
    rows.forEach((row, r) => {
      if (!Array.isArray(row) || row.length === 0) {
        problems.push(`layer "${layer}", row ${r + 1}: must be a non-empty list of keys`);
        return;
      }
      row.forEach((key, k) => {
        problems.push(
          ...keyProblems(key, `layer "${layer}", row ${r + 1}, key ${k + 1}`, layerNames),
        );
      });
    });
  });
  return problems;
}
