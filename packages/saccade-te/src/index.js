import {
  altGrKey,
  backspaceKey,
  bottomRow,
  capsKey,
  keys,
  shiftKey,
} from '@coldsofttech/saccade-keyboards/core';

/** @typedef {import('@coldsofttech/saccade-keyboards/core').Layout} Layout */
/** @typedef {Layout['layers'][string][number][number]} Key */
/** @typedef {Extract<Key, { type: 'text' }>} TextKey */
/** @typedef {Extract<Key, { type: 'layer' }>} LayerKey */

/**
 * Which Telugu keyboard: `inscript`, the standard layout of India (consonants on the right hand,
 * vowels on the left, shift for the aspirated ones), or `phonetic`, where each key types the Telugu
 * letter that sounds like the Latin one on a QWERTY keyboard, with the vowel signs on their own
 * layer.
 *
 * @typedef {'inscript' | 'phonetic'} Arrangement
 */

/**
 * Which digits the number row types: `latin` (0-9) with the Telugu digits (౦-౯) on AltGr, or
 * `telugu` with the Latin digits on AltGr.
 *
 * @typedef {'latin' | 'telugu'} Digits
 */

const LATIN = '0123456789';
const TELUGU = '౦౧౨౩౪౫౬౭౮౯';

/**
 * A text key, with what it types with shift and after AltGr when it has them.
 *
 * @param {string} value
 * @param {string} [shift]
 * @param {string} [altgr]
 * @returns {TextKey}
 */
const pair = (value, shift, altgr) => ({
  type: 'text',
  value,
  ...(shift && { shift }),
  ...(altgr && { altgr }),
});

/**
 * Keys from space separated characters (a letter may be several characters, such as జ్ఞ) and the
 * ones they type with shift, in the same order.
 *
 * @param {string} normal
 * @param {string} [shifted]
 * @returns {TextKey[]}
 */
const row = (normal, shifted = '') => {
  const upper = shifted.split(' ');
  return normal.split(' ').map((value, i) => pair(value, upper.at(i)));
};

/**
 * The key of a digit: the digit in the chosen script, the other script on AltGr.
 *
 * @param {Digits} digits
 * @param {number} n
 * @param {string} shift
 * @returns {TextKey}
 */
const digitKey = (digits, n, shift) =>
  digits === 'telugu'
    ? pair(TELUGU.at(n) ?? '', shift, LATIN.at(n))
    : pair(LATIN.at(n) ?? '', shift, TELUGU.at(n));

/**
 * The four rows of an ANSI keyboard from the keys of each row.
 *
 * @param {TextKey[][]} rows
 * @returns {Key[][]}
 */
const assemble = ([top, second, third, bottom]) => [
  [...top, { ...backspaceKey, width: 2 }],
  [...second.slice(0, -1), { .../** @type {TextKey} */ (second.at(-1)), width: 1.5 }],
  [{ ...capsKey, width: 1.75 }, ...third, { type: 'enter', width: 2.25 }],
  [{ ...shiftKey, width: 2.25 }, ...bottom, { ...shiftKey, width: 2.75 }],
];

/**
 * The InScript keyboard: the signs sit on the number row, with Shift for the less common ones.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const inscript = (digits) =>
  assemble([
    [
      pair('ొ', 'ఒ'),
      digitKey(digits, 1, 'ఀ'),
      digitKey(digits, 2, 'ౠ'),
      digitKey(digits, 3, '్ర'),
      digitKey(digits, 4, 'ర్'),
      digitKey(digits, 5, 'జ్ఞ'),
      digitKey(digits, 6, 'త్ర'),
      digitKey(digits, 7, 'క్ష'),
      digitKey(digits, 8, 'శ్ర'),
      digitKey(digits, 9, '('),
      digitKey(digits, 0, ')'),
      pair('-', 'ః'),
      pair('ృ', 'ఋ'),
    ],
    row('ౌ ై ా ీ ూ బ హ గ ద జ డ ౙ ౕ', 'ఔ ఐ ఆ ఈ ఊ భ ఙ ఘ ధ ఝ ఢ ఞ ౖ'),
    row('ో ే ్ ి ు ప ర క త చ ట', 'ఓ ఏ అ ఇ ఉ ఫ ఱ ఖ థ ఛ ఠ'),
    row('ె ం మ న వ ల స , . య', 'ఎ ఁ ణ ఽ ఴ ళ శ ష ఀ'),
  ]);

/**
 * The phonetic keyboard: the Telugu letter that sounds like the Latin one, shift for its pair.
 *
 * @param {Digits} digits
 * @returns {Key[][]}
 */
const phonetic = (digits) =>
  assemble([
    [
      pair('`', '~'),
      digitKey(digits, 1, '!'),
      digitKey(digits, 2, '@'),
      digitKey(digits, 3, '#'),
      digitKey(digits, 4, '$'),
      digitKey(digits, 5, '%'),
      digitKey(digits, 6, '^'),
      digitKey(digits, 7, '&'),
      digitKey(digits, 8, '*'),
      digitKey(digits, 9, '('),
      digitKey(digits, 0, ')'),
      pair('-', '_'),
      pair('=', '+'),
    ],
    [...row('ట డ ఏ ర త య ఉ ఇ ఓ ప', 'ఠ ఢ ఐ ఋ థ ఞ ఊ ఈ ఔ ఫ'), ...keys('[]\\', '{}|')],
    [...row('అ స ద ఫ గ హ జ క ల', 'ఆ శ ధ ఼ ఘ ః ఝ ఖ ళ'), ...keys(";'", ':"')],
    [...row('ౙ క్ష చ వ బ న మ', 'ష జ్ఞ ఛ ఁ భ ణ ం'), pair(',', 'ఱ'), pair('.', 'ఴ'), pair('/', '?')],
  ]);

/**
 * The vowel signs, the other signs and the conjuncts, which the phonetic letters do not have.
 *
 * @param {LayerKey} back
 * @returns {Key[][]}
 */
const signs = (back) => [
  row('ా ి ీ ు ూ ృ'),
  row('ె ే ై ొ ో ౌ'),
  row('ం ఁ ః ్ ఽ ఀ'),
  [...row('ౕ ౖ ౄ ౘ త్ర శ్ర'), backspaceKey],
  bottomRow(back),
];

/** @type {LayerKey} */
const LETTERS_KEY = { type: 'layer', to: 'signs', label: 'గుణింతాలు', name: 'Vowel signs' };
/** @type {LayerKey} */
const BACK_KEY = { type: 'layer', to: 'letters', label: 'అక్షరాలు', name: 'Letters' };

/** What a screen reader says for the signs, which have no sound of their own. */
const NAMES = {
  'ా': 'ఆ గుణింతం',
  'ి': 'ఇ గుణింతం',
  'ీ': 'ఈ గుణింతం',
  'ు': 'ఉ గుణింతం',
  'ూ': 'ఊ గుణింతం',
  'ృ': 'ఋ గుణింతం',
  'ె': 'ఎ గుణింతం',
  'ే': 'ఏ గుణింతం',
  'ై': 'ఐ గుణింతం',
  'ొ': 'ఒ గుణింతం',
  'ో': 'ఓ గుణింతం',
  'ౌ': 'ఔ గుణింతం',
  'ౕ': 'ఏ పొడవు గుర్తు',
  'ౖ': 'ఐ పొడవు గుర్తు',
  'ం': 'సున్నా',
  'ఁ': 'అర్ధసున్నా',
  'ః': 'విసర్గ',
  '్': 'విరామం',
  '఼': 'నుక్తా',
  ఽ: 'అవగ్రహం',
  '₹': 'రూపాయి',
};

/**
 * The Telugu layout in the given arrangement.
 *
 * @param {Arrangement} [type] The keyboard.
 * @param {Digits} [digits] The digits of the number row.
 * @returns {Layout} The layout.
 */
export function createLayout(type = 'inscript', digits = 'latin') {
  if (type !== 'inscript' && type !== 'phonetic') {
    throw new Error(`Unknown arrangement "${type}". Use "inscript" or "phonetic".`);
  }
  if (digits !== 'latin' && digits !== 'telugu') {
    throw new Error(`Unknown digits "${digits}". Use "latin" or "telugu".`);
  }
  const isInscript = type === 'inscript';
  /** @type {Key[]} */
  const bottom = [
    { ...altGrKey, width: 1.5 },
    ...(isInscript ? [] : [{ ...LETTERS_KEY, width: 1.5 }]),
    ...keys('?!'),
    { type: 'space', width: isInscript ? 5 : 3.5 },
    ...keys(isInscript ? ':;' : ':…'),
    { type: 'close', width: 1.5 },
  ];
  return {
    id: 'te-IN',
    name: isInscript ? 'Telugu (InScript)' : 'Telugu (phonetic)',
    dir: 'ltr',
    decimal: '.',
    names: NAMES,
    layers: {
      letters: [...(isInscript ? inscript(digits) : phonetic(digits)), bottom],
      ...(isInscript ? {} : { signs: signs(BACK_KEY) }),
    },
  };
}

/**
 * The Telugu InScript layout with Latin digits, which is what `language="te"` uses.
 *
 * @type {Layout}
 */
export const layout = createLayout();
