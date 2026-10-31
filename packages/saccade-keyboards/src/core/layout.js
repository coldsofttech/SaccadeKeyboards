// A keyboard layout is data. Its `layers` map a layer name to rows, the first layer being the one
// shown first. A row is a list of keys; a key is one of
//   { type: 'text', value, shift?, altgr? }  types `value` (or `shift` while shift is on, or
//   `altgr` after the AltGr key)
//   { type: 'shift' | 'caps' | 'altgr' | 'backspace' | 'enter' | 'space' | 'close' }
//   { type: 'layer', to, label, name? } switches layer
// `width` is the share of a row the key takes (1 is one ordinary key).

/**
 * @typedef {object} TextKey
 * @property {'text'} type
 * @property {string} value What the key types.
 * @property {string} [shift] What it types while shift is on.
 * @property {string} [capital] What it types while caps lock is on, when that is not the shifted
 *   character, such as É on the key that types é and 2 with shift (a French keyboard).
 * @property {boolean} [numpad] A key of the number pad, which is off while Num Lock is off.
 * @property {string} [altgr] What it types after the AltGr key, as the third character of a key.
 *   Shift capitalises it when it is a letter.
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 * @property {number} [rowSpan] How many rows tall the key is, such as 2 for an Enter key. It sits at
 *   the start or the end of its row, and the rows below leave room for it.
 */

/**
 * @typedef {object} ActionKey
 * @property {'shift' | 'caps' | 'altgr' | 'numlock' | 'currency' | 'backspace' | 'enter' | 'space' | 'close'} type
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 * @property {number} [rowSpan] How many rows tall the key is, such as 2 for an Enter key. It sits at
 *   the start or the end of its row, and the rows below leave room for it.
 */

/**
 * @typedef {object} LayerKey
 * @property {'layer'} type
 * @property {string} to The layer to show.
 * @property {string} label Text on the key.
 * @property {string} [name] What a screen reader says (the label).
 * @property {number} [width] Share of the row, 1 being an ordinary key.
 * @property {number} [rowSpan] How many rows tall the key is, such as 2 for an Enter key. It sits at
 *   the start or the end of its row, and the rows below leave room for it.
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
 * @property {string} [decimal] The sign of the decimal key of the number pad ('.').
 */

const ACTIONS = ['shift', 'caps', 'altgr', 'numlock', 'backspace', 'enter', 'space', 'close'];

/**
 * Keys that type `normal`, and `shifted` (one character each) while shift is on.
 *
 * @param {string} normal Characters, one per key.
 * @param {string} [shifted] Their shifted characters, in the same order; a space leaves that key
 *   without one.
 * @returns {TextKey[]} The keys.
 */
export function keys(normal, shifted = '') {
  const upper = [...shifted];
  return [...normal].map((value, i) => {
    const capital = upper.at(i);
    return capital && capital !== ' '
      ? { type: 'text', value, shift: capital }
      : { type: 'text', value };
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
/** @type {ActionKey} */
export const capsKey = { type: 'caps', width: 1.5 };
/** @type {ActionKey} */
export const altGrKey = { type: 'altgr', width: 1.5 };

/**
 * Keys from a pair of strings: what the keys type, and what they type with shift, one character
 * each in the same order.
 *
 * @param {string[]} pair The normal and the shifted characters.
 * @returns {TextKey[]} The keys.
 */
const keysOf = ([normal, shifted]) => keys(normal, shifted);

/**
 * The four rows of a physical keyboard, for the main view of a layout.
 *
 * Row 1 is the number row ending in backspace. Row 2 and row 3 hold the letters and, with `iso`,
 * the tall Enter key that spans both; otherwise Enter ends row 3. Row 4 is the bottom row of
 * letters between two shift keys. Add a last row with `bottomRow` or your own.
 *
 * @param {object} options What the rows hold.
 * @param {string[]} options.letters The letters of the three rows, one per key.
 * @param {string[]} options.digits The number row without backspace, such as the grave accent,
 *   1 to 0, hyphen and equals.
 * @param {string[]} options.end2 The signs after the letters of row 2, such as brackets.
 * @param {string[]} options.end3 The signs after the letters of row 3, such as a semicolon.
 * @param {string[]} options.end4 The signs after the letters of row 4, such as a comma and a stop.
 * @param {string[]} [options.extra4] The extra key at the start of row 4 on an ISO keyboard.
 * @param {boolean} [options.iso] An ISO keyboard (tall Enter, extra key in row 4) rather than ANSI.
 * @param {Record<string, string>} [options.altgr] The third character of keys, by what they type:
 *   `{ 4: '€' }` types a euro after AltGr on the 4 key.
 * @param {Record<string, string>} [options.capitals] What keys type with caps lock when that is
 *   not their shifted character, by what they type: `{ é: 'É' }`.
 * @returns {Key[][]} The four rows.
 */
export function physicalRows({
  letters,
  digits,
  end2,
  end3,
  end4,
  extra4,
  iso = false,
  altgr = {},
  capitals = {},
}) {
  const third = new Map(Object.entries(altgr));
  const capital = new Map(Object.entries(capitals));
  const [top, middle, bottom] = letters;
  const end = keysOf(end2);
  // ANSI has the backslash as a wider last key of row 2 and Enter at the end of row 3.
  const row2 = iso
    ? [...cased(top), ...end, /** @type {Key} */ ({ type: 'enter', width: 1.5, rowSpan: 2 })]
    : [...cased(top), ...end.slice(0, -1), { .../** @type {TextKey} */ (end.at(-1)), width: 1.5 }];
  const rows = [
    [...keysOf(digits), { ...backspaceKey, width: 2 }],
    row2,
    [
      { ...capsKey, width: 1.75 },
      ...cased(middle),
      ...keysOf(end3),
      ...(iso ? [] : [/** @type {Key} */ ({ type: 'enter', width: 2.25 })]),
    ],
    [
      { ...shiftKey, width: iso ? 1.25 : 2.25 },
      ...(extra4 ? keysOf(extra4) : []),
      ...cased(bottom),
      ...keysOf(end4),
      { ...shiftKey, width: 2.75 },
    ],
  ];
  return rows.map((row) =>
    row.map((key) => {
      if (key.type !== 'text') return key;
      const extra = third.get(key.value);
      const upper = capital.get(key.value);
      return extra || upper
        ? { ...key, ...(extra && { altgr: extra }), ...(upper && { capital: upper }) }
        : key;
    }),
  );
}

/**
 * The rows of a number pad: Num Lock and the operators, the digits with a tall plus and a tall
 * Enter, and a wide zero beside the decimal key. Its keys are marked `numpad`, so they are off
 * while Num Lock is off. The keyboard shows it beside the main keys with its `numpad` prop.
 *
 * @param {string} [decimal] The sign of the decimal key.
 * @returns {Key[][]} The five rows.
 */
export function numpadRows(decimal = '.') {
  /** @param {string} value @param {Partial<TextKey>} [extra] @returns {TextKey} */
  const text = (value, extra = {}) => ({ type: 'text', value, numpad: true, ...extra });
  return [
    [{ type: 'numlock' }, ...keys('/*-')],
    [...[...'789'].map((digit) => text(digit)), { type: 'text', value: '+', rowSpan: 2 }],
    [...'456'].map((digit) => text(digit)),
    [...[...'123'].map((digit) => text(digit)), { type: 'enter', rowSpan: 2 }],
    [text('0', { width: 2 }), text(decimal)],
  ];
}

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
 * @param {string} digits The row of digits, one per key; empty when the letters layer has them.
 * @param {LayerKey} backKey The key back to the letters.
 * @returns {Key[][]} The rows.
 */
export function symbolsLayer(digits, backKey) {
  return [
    ...(digits ? [keys(digits)] : []),
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
  '`': 'grave accent',
  '¬': 'not sign',
  '¦': 'broken bar',
  '£': 'pound',
  '€': 'euro',
  '¥': 'yen',
  '¢': 'cent',
  '°': 'degree',
  '¿': 'inverted question mark',
  '¡': 'inverted exclamation mark',
  '«': 'opening guillemet',
  '»': 'closing guillemet',
  '‘': 'opening single quote',
  '’': 'closing single quote',
  '“': 'opening double quote',
  '”': 'closing double quote',
  '…': 'ellipsis',
  '–': 'en dash',
  '—': 'em dash',
  '•': 'bullet',
  '©': 'copyright',
  '®': 'registered',
  '™': 'trademark',
  '§': 'section sign',
  '₹': 'rupee',
  '¤': 'currency sign',
  '²': 'superscript two',
  '³': 'superscript three',
  '¼': 'one quarter',
  '½': 'one half',
  '¾': 'three quarters',
  '×': 'multiplication sign',
  '¶': 'pilcrow',
  µ: 'micro',
  '´': 'acute accent',
  '¨': 'diaeresis',
  º: 'masculine ordinal',
  ª: 'feminine ordinal',
  '·': 'middle dot',
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
  if (key.rowSpan !== undefined && !(Number.isInteger(key.rowSpan) && key.rowSpan >= 1)) {
    problems.push(`${where}: rowSpan must be a whole number of rows`);
  }
  if (key.type === 'text') {
    if (!isText(key.value)) problems.push(`${where}: a text key needs a value`);
    if (key.shift !== undefined && !isText(key.shift)) {
      problems.push(`${where}: shift must be a non-empty string`);
    }
    if (key.capital !== undefined && !isText(key.capital)) {
      problems.push(`${where}: capital must be a non-empty string`);
    }
    if (key.numpad !== undefined && typeof key.numpad !== 'boolean') {
      problems.push(`${where}: numpad must be true or false`);
    }
    if (key.altgr !== undefined && !isText(key.altgr)) {
      problems.push(`${where}: altgr must be a non-empty string`);
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
  const { id, name, dir, fonts, layers, names, decimal } = /** @type {Record<string, any>} */ (
    layout
  );
  const problems = [];
  if (!isText(id)) problems.push('id must be a non-empty string');
  if (!isText(name)) problems.push('name must be a non-empty string');
  if (dir !== 'ltr' && dir !== 'rtl') problems.push('dir must be "ltr" or "rtl"');
  if (fonts !== undefined && !(Array.isArray(fonts) && fonts.every(isText))) {
    problems.push('fonts must be a list of font family names');
  }
  if (decimal !== undefined && !isText(decimal)) {
    problems.push('decimal must be a non-empty string');
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
